"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import type { ActionResult, FormState } from "@/lib/form-state";
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
 * Every one re-checks `patrols.manage`. The UI hides these controls from roles
 * without it, but that is presentation - this is the enforcement.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change patrols.",
};

async function canManage(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && can(user.role, "patrols.manage"));
}

function readPatrolForm(formData: FormData): PatrolFormInput {
  return {
    name: field(formData, "name"),
    description: field(formData, "description"),
    status: field(formData, "status"),
    patrolLeaderId: field(formData, "patrolLeaderId"),
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
  if (!(await canManage())) return FORBIDDEN;

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

  const result = await service.addPatrol({
    name: input.name,
    description: input.description,
    status: input.status as PatrolStatus,
    patrolLeaderId: null,
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
  if (!(await canManage())) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That patrol could not be found." };

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
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to archive patrols." };
  }

  const result = await service.archivePatrol(id, reason);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePatrol(id);
  return { ok: true };
}

export async function restorePatrolAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to restore patrols." };
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
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change patrol membership." };
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
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change patrol membership." };
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
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to appoint a patrol leader." };
  }

  const result = await service.setPatrolLeader(patrolId, scoutId);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePatrol(patrolId);
  return { ok: true };
}
