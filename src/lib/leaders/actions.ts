"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope, type TroopScope } from "@/lib/auth/troop-scope";
import type { FormState } from "@/lib/form-state";
import * as service from "@/lib/leaders/service";
import { validateLeaderInput, type LeaderFormInput } from "@/lib/leaders/validation";
import { hasErrors, type FieldErrors } from "@/lib/validation";

/**
 * Server Actions for the leader directory.
 *
 * Every one re-checks `leaders.manage` before touching a record. The UI hides
 * these controls from roles that lack it, but that is presentation - this is
 * the enforcement.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readLeaderForm(formData: FormData): LeaderFormInput {
  const avatar = formData.get("avatar");

  return {
    name: field(formData, "name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    position: field(formData, "position"),
    // Absent means "unchanged"; empty string means "no picture".
    avatar: typeof avatar === "string" ? (avatar.length > 0 ? avatar : null) : null,
    patrolIds: formData.getAll("patrolIds").filter((value): value is string => typeof value === "string"),
    troopIds: formData.getAll("troopIds").filter((value): value is string => typeof value === "string"),
  };
}

/** Values echoed back to a failed form, so nothing typed is lost. */
function echo(input: LeaderFormInput): Record<string, string> {
  return {
    name: input.name,
    email: input.email,
    phone: input.phone,
    position: input.position,
    patrolIds: input.patrolIds.join(","),
    troopIds: input.troopIds.join(","),
  };
}

function invalid(fieldErrors: FieldErrors, input: LeaderFormInput): FormState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors,
    values: echo(input),
  };
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change leader records.",
};

/** Loads the caller's troop scope, or null if they may not manage leaders at all. */
async function manageScope(): Promise<TroopScope | null> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "leaders.manage")) return null;
  return resolveTroopScope(user);
}

export async function updateLeaderAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const scope = await manageScope();
  if (!scope) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That leader could not be found." };

  // On edit the avatar field is only submitted when it changed, so an absent
  // field must keep whatever is on the record.
  const existing = await service.getLeader(id);
  if (!existing || !service.leaderInScope(existing, scope)) {
    return { status: "error", message: "That leader could not be found." };
  }

  const input = readLeaderForm(formData);

  const avatarSubmitted = formData.get("avatar") !== null;
  const merged: LeaderFormInput = {
    ...input,
    avatar: avatarSubmitted ? input.avatar : existing.avatar,
  };

  const fieldErrors = validateLeaderInput(merged);
  if (hasErrors(fieldErrors)) return invalid(fieldErrors, merged);

  // Whatever troops the form submitted, only ones the caller can actually
  // access are honoured - this is what stops a leader assigning someone
  // (including themselves) to a troop outside their own.
  const outOfScope = merged.troopIds.some((troopId) => !inScope(scope, troopId));
  if (outOfScope) {
    return invalid({ troopIds: "Choose only troops you have access to." }, merged);
  }

  const result = await service.updateLeaderProfile(id, {
    name: merged.name.trim(),
    email: merged.email.trim().toLowerCase(),
    phone: merged.phone.trim(),
    position: merged.position.trim(),
    avatar: merged.avatar,
    patrolIds: merged.patrolIds,
    troopIds: merged.troopIds,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values: echo(merged),
    };
  }

  revalidatePath("/leaders");
  revalidatePath(`/leaders/${id}`);
  revalidatePath("/", "layout");
  redirect(`/leaders/${id}?saved=1`);
}
