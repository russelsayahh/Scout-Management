"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import type { ActionResult, FormState } from "@/lib/form-state";
import * as patrolStore from "@/lib/patrols/store";
import * as service from "@/lib/patrols/service";
import type { PatrolStatus } from "@/lib/patrols/types";
import {
  validatePatrolInput,
  type PatrolFormInput,
} from "@/lib/patrols/validation";
import { hasErrors } from "@/lib/validation";

/**
 * Server Actions for patrols.
 *
 * Every one re-checks `patrols.manage` and, separately, that the patrol being
 * touched is inside the caller's troop scope - a role permission says what a
 * leader may do, the scope says which records they may do it to. The UI hides
 * controls and options accordingly, but that is presentation; these checks are
 * the enforcement.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change patrols.",
};

/** Loads the caller and their scope, or null if they may not manage patrols at all. */
async function manageContext() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "patrols.manage")) return null;
  return { user, scope: await resolveTroopScope(user) };
}

/** True when `patrolId` exists and falls inside `scope`. */
async function patrolInScope(patrolId: string, scope: Awaited<ReturnType<typeof resolveTroopScope>>) {
  const patrol = await patrolStore.findPatrol(patrolId);
  return patrol !== null && inScope(scope, patrol.troopId);
}

function readPatrolForm(formData: FormData): PatrolFormInput {
  return {
    name: field(formData, "name"),
    description: field(formData, "description"),
    status: field(formData, "status"),
    patrolLeaderId: field(formData, "patrolLeaderId"),
    troopId: field(formData, "troopId"),
  };
}

/** Membership changes touch scouts as well, so both sections are refreshed. */
function revalidatePatrol(id: string): void {
  revalidatePath("/patrols");
  revalidatePath(`/patrols/${id}`);
  revalidatePath("/scouts");
  revalidatePath("/", "layout");
}

/* ---------------------------------- create --------------------------------- */

export async function createPatrolAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await manageContext();
  if (!context) return FORBIDDEN;

  const input = readPatrolForm(formData);
  const values = { name: input.name, description: input.description, status: input.status };

  const fieldErrors = validatePatrolInput(input);
  if (hasErrors(fieldErrors)) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  // The troop is never taken on trust: whatever the form submitted, only a
  // troop the caller can actually access is honoured.
  if (!inScope(context.scope, input.troopId)) {
    return {
      status: "error",
      message: "Choose a troop you have access to.",
      fieldErrors: { troopId: "That troop is not available to you." },
      values,
    };
  }

  const result = await service.addPatrol({
    name: input.name,
    description: input.description,
    status: input.status as PatrolStatus,
    patrolLeaderId: null,
    troopId: input.troopId,
  });

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidatePatrol(result.data.id);
  redirect(`/patrols/${result.data.id}`);
}

/* ----------------------------------- edit ---------------------------------- */

export async function updatePatrolAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await manageContext();
  if (!context) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That patrol could not be found." };
  if (!(await patrolInScope(id, context.scope))) {
    return { status: "error", message: "That patrol could not be found." };
  }

  const input = readPatrolForm(formData);
  const values = { name: input.name, description: input.description, status: input.status };

  const fieldErrors = validatePatrolInput(input);
  if (hasErrors(fieldErrors)) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
      values,
    };
  }

  const result = await service.editPatrol(id, {
    name: input.name,
    description: input.description,
    status: input.status as PatrolStatus,
    patrolLeaderId: null,
  });

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidatePatrol(id);
  redirect(`/patrols/${id}?saved=1`);
}

/* --------------------------- archive and restore --------------------------- */

export async function archivePatrolAction(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to archive patrols." };
  if (!(await patrolInScope(id, context.scope))) {
    return { ok: false, message: "That patrol could not be found." };
  }

  const result = await service.archivePatrol(id, reason);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePatrol(id);
  return { ok: true };
}

export async function restorePatrolAction(id: string): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to restore patrols." };
  if (!(await patrolInScope(id, context.scope))) {
    return { ok: false, message: "That patrol could not be found." };
  }

  const result = await service.restorePatrol(id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePatrol(id);
  return { ok: true };
}

/* ------------------------------- membership ------------------------------- */

export async function assignScoutsAction(
  patrolId: string,
  scoutIds: string[],
): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) {
    return { ok: false, message: "You do not have permission to change patrol membership." };
  }
  if (!(await patrolInScope(patrolId, context.scope))) {
    return { ok: false, message: "That patrol could not be found." };
  }

  const result = await service.assignScoutsToPatrol(patrolId, scoutIds);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePatrol(patrolId);
  return { ok: true };
}

export async function removeScoutAction(
  patrolId: string,
  scoutId: string,
): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) {
    return { ok: false, message: "You do not have permission to change patrol membership." };
  }
  if (!(await patrolInScope(patrolId, context.scope))) {
    return { ok: false, message: "That patrol could not be found." };
  }

  const result = await service.removeScoutFromPatrol(patrolId, scoutId);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePatrol(patrolId);
  return { ok: true };
}

export async function setPatrolLeaderAction(
  patrolId: string,
  scoutId: string | null,
): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) {
    return { ok: false, message: "You do not have permission to appoint a patrol leader." };
  }
  if (!(await patrolInScope(patrolId, context.scope))) {
    return { ok: false, message: "That patrol could not be found." };
  }

  const result = await service.setPatrolLeader(patrolId, scoutId);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePatrol(patrolId);
  return { ok: true };
}
