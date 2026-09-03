"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import * as service from "@/lib/activities/service";
import type { ActivityDetails, ActivityType } from "@/lib/activities/types";
import {
  validateActivityInput,
  type ActivityFormInput,
} from "@/lib/activities/validation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import type { ActionResult, FormState } from "@/lib/form-state";
import { hasErrors } from "@/lib/validation";

/**
 * Server Actions for the programme.
 *
 * Every one re-checks `activities.manage`. The UI hides these controls from
 * roles without it, but that is presentation - this is the enforcement.
 */

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const FORBIDDEN: FormState = {
  status: "error",
  message: "You do not have permission to change the programme.",
};

async function canManage(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && can(user.role, "activities.manage"));
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
  if (!(await canManage())) return FORBIDDEN;

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
  if (!(await canManage())) return FORBIDDEN;

  const id = field(formData, "id");
  if (!id) return { status: "error", message: "That activity could not be found." };

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

  const result = await service.editActivity(id, toDetails(input));
  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
  }

  revalidateActivity(id);
  redirect(`/activities/${id}?saved=1`);
}

/* ------------------------------- transitions ------------------------------ */

export async function publishActivityAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to publish activities." };
  }

  const result = await service.publishActivity(id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateActivity(id);
  return { ok: true };
}

export async function completeActivityAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change the programme." };
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
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to cancel activities." };
  }

  const result = await service.cancelActivity(id, reason);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateActivity(id);
  return { ok: true };
}

export async function reinstateActivityAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change the programme." };
  }

  const result = await service.reinstateActivity(id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidateActivity(id);
  return { ok: true };
}
