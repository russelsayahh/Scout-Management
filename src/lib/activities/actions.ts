"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import * as activityStore from "@/lib/activities/store";
import * as service from "@/lib/activities/service";
import type { ActivityDetails, ActivityType } from "@/lib/activities/types";
import {
  validateActivityInput,
  type ActivityFormInput,
} from "@/lib/activities/validation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import type { ActionResult, FormState } from "@/lib/form-state";
import { hasErrors } from "@/lib/validation";

/**
 * Server Actions for the programme.
 *
 * Every one re-checks `activities.manage` and, separately, that the activity
 * being touched is inside the caller's troop scope - a role permission says
 * what a leader may do, the scope says which records they may do it to. The UI
 * hides controls and options accordingly, but that is presentation; these
 * checks are the enforcement.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change the programme.",
};

/** Loads the caller and their scope, or null if they may not manage the programme at all. */
async function manageContext() {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "activities.manage")) return null;
  return { user, scope: await resolveTroopScope(user) };
}

/** True when `activityId` exists and falls inside `scope`. */
async function activityInScope(
  activityId: string,
  scope: Awaited<ReturnType<typeof resolveTroopScope>>,
) {
  const activity = await activityStore.findActivity(activityId);
  return activity !== null && inScope(scope, activity.troopId);
}

function readActivityForm(formData: FormData): ActivityFormInput {
  return {
    name: field(formData, "name"),
    description: field(formData, "description"),
    date: field(formData, "date"),
    startTime: field(formData, "startTime"),
    endTime: field(formData, "endTime"),
    location: field(formData, "location"),
    type: field(formData, "type"),
    leaderId: field(formData, "leaderId"),
    troopId: field(formData, "troopId"),
    // Checkbox groups arrive as one entry per box that is ticked.
    patrolIds: formData
      .getAll("patrolIds")
      .filter((value): value is string => typeof value === "string" && value !== ""),
    capacity: field(formData, "capacity"),
  };
}

/** The values echoed back so a rejected form does not lose what was typed. */
function echo(input: ActivityFormInput): Record<string, string> {
  return {
    name: input.name,
    description: input.description,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    location: input.location,
    type: input.type,
    leaderId: input.leaderId,
    troopId: input.troopId,
    capacity: input.capacity,
    // Rebuilt into a list by the form; FormState values are strings.
    patrolIds: input.patrolIds.join(","),
  };
}

function toDetails(input: ActivityFormInput): ActivityDetails {
  return {
    name: input.name,
    description: input.description,
    date: input.date.trim(),
    startTime: input.startTime.trim(),
    endTime: input.endTime.trim(),
    location: input.location,
    type: input.type as ActivityType,
    leaderId: input.leaderId,
    troopId: input.troopId,
    patrolIds: input.patrolIds,
    capacity: input.capacity.trim() ? Number(input.capacity.trim()) : null,
  };
}

/**
 * An activity shows up on the dashboard, the calendar, the sidebar count and
 * the pages of every patrol taking part, so all of them are refreshed.
 */
function revalidateActivity(id: string): void {
  revalidatePath("/activities");
  revalidatePath(`/activities/${id}`);
  revalidatePath("/patrols", "layout");
  revalidatePath("/", "layout");
}

/* ---------------------------------- create --------------------------------- */

export async function createActivityAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await manageContext();
  if (!context) return FORBIDDEN;

  const input = readActivityForm(formData);
  const values = echo(input);

  const fieldErrors = validateActivityInput(input);
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

  // Which button was pressed decides whether this goes straight on the calendar.
  const status = field(formData, "intent") === "publish" ? "published" : "draft";

  const result = await service.addActivity(toDetails(input), status);
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidateActivity(result.data.id);
  redirect(`/activities/${result.data.id}`);
}

/* ----------------------------------- edit ---------------------------------- */

export async function updateActivityAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const context = await manageContext();
  if (!context) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That activity could not be found." };
  if (!(await activityInScope(id, context.scope))) {
    return { status: "error", message: "That activity could not be found." };
  }

  const input = readActivityForm(formData);
  const values = echo(input);

  const fieldErrors = validateActivityInput(input);
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

  const result = await service.editActivity(id, toDetails(input));
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidateActivity(id);
  redirect(`/activities/${id}?saved=1`);
}

/* ------------------------------- transitions ------------------------------ */

export async function publishActivityAction(id: string): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to publish activities." };
  if (!(await activityInScope(id, context.scope))) {
    return { ok: false, message: "That activity could not be found." };
  }

  const result = await service.publishActivity(id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateActivity(id);
  return { ok: true };
}

export async function completeActivityAction(id: string): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to change the programme." };
  if (!(await activityInScope(id, context.scope))) {
    return { ok: false, message: "That activity could not be found." };
  }

  const result = await service.completeActivity(id, new Date());
  if (!result.ok) return { ok: false, message: result.message };

  revalidateActivity(id);
  return { ok: true };
}

export async function cancelActivityAction(
  id: string,
  reason: string,
): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to cancel activities." };
  if (!(await activityInScope(id, context.scope))) {
    return { ok: false, message: "That activity could not be found." };
  }

  const result = await service.cancelActivity(id, reason);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateActivity(id);
  return { ok: true };
}

export async function reinstateActivityAction(id: string): Promise<ActionResult> {
  const context = await manageContext();
  if (!context) return { ok: false, message: "You do not have permission to change the programme." };
  if (!(await activityInScope(id, context.scope))) {
    return { ok: false, message: "That activity could not be found." };
  }

  const result = await service.reinstateActivity(id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateActivity(id);
  return { ok: true };
}
