"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import * as service from "@/lib/camps/service";
import type { CampDetails } from "@/lib/camps/types";
import { validateCampInput, type CampFormInput } from "@/lib/camps/validation";
import type { ActionResult, FormState } from "@/lib/form-state";
import { hasErrors } from "@/lib/validation";

/**
 * Server Actions for camps.
 *
 * Every one re-checks `camps.manage`. The UI hides these controls from roles
 * without it, but that is presentation - this is the enforcement.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function list(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === "string" && value !== "");
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change camps.",
};

async function canManage(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && can(user.role, "camps.manage"));
}

function readCampForm(formData: FormData): CampFormInput {
  return {
    name: field(formData, "name"),
    description: field(formData, "description"),
    location: field(formData, "location"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
    registrationDeadline: field(formData, "registrationDeadline"),
    leaderIds: list(formData, "leaderIds"),
    patrolIds: list(formData, "patrolIds"),
    maxParticipants: field(formData, "maxParticipants"),
  };
}

/** Echoed back so a rejected form does not lose what was typed. */
function echo(input: CampFormInput): Record<string, string> {
  return {
    name: input.name,
    description: input.description,
    location: input.location,
    startDate: input.startDate,
    endDate: input.endDate,
    registrationDeadline: input.registrationDeadline,
    maxParticipants: input.maxParticipants,
    // Rebuilt into lists by the form; FormState values are strings.
    leaderIds: input.leaderIds.join(","),
    patrolIds: input.patrolIds.join(","),
  };
}

function toDetails(input: CampFormInput): CampDetails {
  return {
    name: input.name,
    description: input.description,
    location: input.location,
    startDate: input.startDate.trim(),
    endDate: input.endDate.trim(),
    registrationDeadline: input.registrationDeadline.trim(),
    leaderIds: input.leaderIds,
    patrolIds: input.patrolIds,
    maxParticipants: Number(input.maxParticipants.trim()),
  };
}

/**
 * A camp shows on its own page, the camps list, the dashboard, the scout
 * profiles of everyone registered and the sidebar count, so all are refreshed.
 */
function revalidateCamp(id: string): void {
  revalidatePath("/camps");
  revalidatePath(`/camps/${id}`);
  revalidatePath("/scouts", "layout");
  revalidatePath("/", "layout");
}

/* ---------------------------------- create --------------------------------- */

export async function createCampAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await canManage())) return FORBIDDEN;

  const input = readCampForm(formData);
  const values = echo(input);

  const fieldErrors = validateCampInput(input);
  if (hasErrors(fieldErrors)) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  const result = await service.addCamp(toDetails(input));
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidateCamp(result.data.id);
  redirect(`/camps/${result.data.id}`);
}

/* ----------------------------------- edit ---------------------------------- */

export async function updateCampAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await canManage())) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That camp could not be found." };

  const input = readCampForm(formData);
  const values = echo(input);

  const fieldErrors = validateCampInput(input);
  if (hasErrors(fieldErrors)) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  const result = await service.editCamp(id, toDetails(input));
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidateCamp(id);
  redirect(`/camps/${id}?saved=1`);
}

/* ------------------------------- registration ------------------------------ */

export async function registerScoutsAction(
  campId: string,
  scoutIds: string[],
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "camps.manage")) {
    return { ok: false, message: "You do not have permission to register scouts." };
  }

  const result = await service.registerScouts(campId, scoutIds, user.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateCamp(campId);
  return { ok: true };
}

export async function removeScoutAction(
  campId: string,
  scoutId: string,
): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change the roster." };
  }

  const result = await service.removeScout(campId, scoutId);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateCamp(campId);
  return { ok: true };
}

export async function setLeadersAction(
  campId: string,
  leaderIds: string[],
): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change the leaders." };
  }

  const result = await service.setLeaders(campId, leaderIds);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateCamp(campId);
  return { ok: true };
}

/* ------------------------------- transitions ------------------------------ */

async function runTransition(
  campId: string,
  operation: () => Promise<service.ServiceResult<unknown>>,
  refusal: string,
): Promise<ActionResult> {
  if (!(await canManage())) return { ok: false, message: refusal };

  const result = await operation();
  if (!result.ok) return { ok: false, message: result.message };

  revalidateCamp(campId);
  return { ok: true };
}

export async function openRegistrationAction(campId: string): Promise<ActionResult> {
  return runTransition(
    campId,
    () => service.openRegistration(campId),
    "You do not have permission to open registration.",
  );
}

export async function closeRegistrationAction(campId: string): Promise<ActionResult> {
  return runTransition(
    campId,
    () => service.closeRegistration(campId),
    "You do not have permission to close registration.",
  );
}

export async function startCampAction(campId: string): Promise<ActionResult> {
  return runTransition(
    campId,
    () => service.startCamp(campId),
    "You do not have permission to change a camp.",
  );
}

export async function completeCampAction(campId: string): Promise<ActionResult> {
  return runTransition(
    campId,
    () => service.completeCamp(campId),
    "You do not have permission to change a camp.",
  );
}

export async function cancelCampAction(
  campId: string,
  reason: string,
): Promise<ActionResult> {
  return runTransition(
    campId,
    () => service.cancelCamp(campId, reason),
    "You do not have permission to cancel a camp.",
  );
}

export async function reinstateCampAction(campId: string): Promise<ActionResult> {
  return runTransition(
    campId,
    () => service.reinstateCamp(campId),
    "You do not have permission to change a camp.",
  );
}
