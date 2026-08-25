"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import type { ActionResult, FormState } from "@/lib/form-state";
import * as service from "@/lib/scouts/service";
import {
  toScoutDetails,
  validateScoutInput,
  type ScoutFormInput,
} from "@/lib/scouts/validation";
import { hasErrors, type FieldErrors } from "@/lib/validation";

/**
 * Server Actions for the scout register.
 *
 * Every one re-checks `scouts.manage` before touching a record. The UI hides
 * these controls from roles that lack it, but that is presentation - this is
 * the enforcement.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function readScoutForm(formData: FormData): ScoutFormInput {
  const avatar = formData.get("avatar");

  return {
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    dateOfBirth: field(formData, "dateOfBirth"),
    gender: field(formData, "gender"),
    phone: field(formData, "phone"),
    email: field(formData, "email"),
    address: field(formData, "address"),
    emergencyContactName: field(formData, "emergencyContactName"),
    emergencyContactPhone: field(formData, "emergencyContactPhone"),
    medicalNotes: field(formData, "medicalNotes"),
    joinDate: field(formData, "joinDate"),
    patrol: field(formData, "patrol"),
    status: field(formData, "status"),
    // Absent means "unchanged"; empty string means "no picture".
    avatar: typeof avatar === "string" ? (avatar.length > 0 ? avatar : null) : null,
  };
}

/** Values echoed back to a failed form, so nothing typed is lost. */
function echo(input: ScoutFormInput): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    // The picture is held in the field component, not echoed back as text.
    if (key !== "avatar" && typeof value === "string") values[key] = value;
  }
  return values;
}

function invalid(fieldErrors: FieldErrors, input: ScoutFormInput): FormState {
  return {
    status: "error",
    message: "Please correct the highlighted fields.",
    fieldErrors,
    values: echo(input),
  };
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change scout records.",
};

async function canManage(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && can(user.role, "scouts.manage"));
}

/* ---------------------------------- create --------------------------------- */

export async function createScoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await canManage())) return FORBIDDEN;

  const input = readScoutForm(formData);

  const fieldErrors = validateScoutInput(input);
  if (hasErrors(fieldErrors)) return invalid(fieldErrors, input);

  const result = await service.addScout(toScoutDetails(input));
  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values: echo(input),
    };
  }

  revalidatePath("/scouts");
  revalidatePath("/", "layout");
  redirect(`/scouts/${result.data.id}`);
}

/* ----------------------------------- edit ---------------------------------- */

export async function updateScoutAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await canManage())) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That scout could not be found." };

  const input = readScoutForm(formData);

  // On edit the avatar field is only submitted when it changed, so an absent
  // field must keep whatever is on the record.
  const existing = await service.getScout(id);
  if (!existing) return { status: "error", message: "That scout could not be found." };

  const avatarSubmitted = formData.get("avatar") !== null;
  const merged: ScoutFormInput = {
    ...input,
    avatar: avatarSubmitted ? input.avatar : existing.avatar,
  };

  const fieldErrors = validateScoutInput(merged);
  if (hasErrors(fieldErrors)) return invalid(fieldErrors, merged);

  const result = await service.editScout(id, toScoutDetails(merged));
  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
      values: echo(merged),
    };
  }

  revalidatePath("/scouts");
  revalidatePath(`/scouts/${id}`);
  redirect(`/scouts/${id}?saved=1`);
}

/* --------------------------- archive and restore --------------------------- */

export async function archiveScoutAction(
  id: string,
  reason: string,
): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to archive scouts." };
  }

  const result = await service.archiveScout(id, reason);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/scouts");
  revalidatePath(`/scouts/${id}`);
  revalidatePath("/", "layout");

  return { ok: true };
}

export async function restoreScoutAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to restore scouts." };
  }

  const result = await service.restoreScout(id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/scouts");
  revalidatePath(`/scouts/${id}`);
  revalidatePath("/", "layout");

  return { ok: true };
}
