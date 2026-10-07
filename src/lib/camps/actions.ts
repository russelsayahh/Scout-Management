"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import * as campStore from "@/lib/camps/store";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import * as service from "@/lib/camps/service";
import type { CampDetails } from "@/lib/camps/types";
import { validateCampInput, type CampFormInput } from "@/lib/camps/validation";
import type { ActionResult, FormState } from "@/lib/form-state";
import { hasErrors } from "@/lib/validation";

/**
 * Server Actions for camps.
 *
 * Every one re-checks `camps.manage` and, separately, that the camp being
 * touched is inside the caller's troop scope - a role permission says what a
 * leader may do, the scope says which records they may do it to. The UI hides
 * controls and options accordingly, but that is presentation; these checks are
 * the enforcement.
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

/** Loads the caller and their scope, or null if they may not manage camps at all. */
async function manageContext() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "camps.manage")) return null;
  return { user, scope: await resolveTroopScope(user) };
}

/** True when `campId` exists and falls inside `scope`. */
async function campInScope(campId: string, scope: Awaited<ReturnType<typeof resolveTroopScope>>) {
  const camp = await campStore.findCamp(campId);
  return camp !== null && inScope(scope, camp.troopId);
}

function readCampForm(formData: FormData): CampFormInput {
  return {
    name: field(formData, "name"),
    description: field(formData, "description"),
    location: field(formData, "location"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
    registrationDeadline: field(formData, "registrationDeadline"),
    troopId: field(formData, "troopId"),
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
    troopId: input.troopId,
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
    troopId: input.troopId,
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
  const context = await manageContext();
  if (!context) return FORBIDDEN;

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

  // Whatever troop the form submitted, only one the caller can actually
  // access is honoured - this is what stops a leader posting another troop's
  // id straight into the request.
  if (!inScope(context.scope, input.troopId)) {
    return {
      status: "error",
      message: "Choose a troop you have access to.",
      fieldErrors: { troopId: "That troop is not available to you." },
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
  const context = await manageContext();
  if (!context) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That camp could not be found." };
  if (!(await campInScope(id, context.scope))) {
    return { status: "error", message: "That camp could not be found." };
  }

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

  if (!inScope(context.scope, input.troopId)) {
    return {
      status: "error",
      message: "Choose a troop you have access to.",
      fieldErrors: { troopId: "That troop is not available to you." },
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
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to register scouts." };
  if (!(await campInScope(campId, context.scope))) {
    return { ok: false, message: "That camp could not be found." };
  }

  const result = await service.registerScouts(campId, scoutIds, context.user.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateCamp(campId);
  return { ok: true };
}

export async function removeScoutAction(
  campId: string,
  scoutId: string,
): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to change the roster." };
  if (!(await campInScope(campId, context.scope))) {
    return { ok: false, message: "That camp could not be found." };
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
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to change the leaders." };
  if (!(await campInScope(campId, context.scope))) {
    return { ok: false, message: "That camp could not be found." };
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
  const context = await manageContext();
  if (!context) return { ok: false, message: refusal };
  if (!(await campInScope(campId, context.scope))) {
    return { ok: false, message: "That camp could not be found." };
  }

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
