"use server";

import { revalidatePath } from "next/cache";

import * as activityStore from "@/lib/activities/store";
import * as service from "@/lib/attendance/service";
import type { AttendanceEntry } from "@/lib/attendance/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope, type TroopScope } from "@/lib/auth/troop-scope";
import type { ActionResult } from "@/lib/form-state";

/**
 * Server Actions for registers.
 *
 * `attendance.record` is re-checked here, and separately, that the activity
 * being marked falls inside the caller's troop scope - a leader posting
 * another troop's activity id must be rejected the same way a patrol mutation
 * outside scope is in `patrols/actions.ts`.
 */

/** True when `activityId` exists and falls inside `scope`. */
async function activityInScope(activityId: string, scope: TroopScope): Promise<boolean> {
  const activity = await activityStore.findActivity(activityId);
  return activity !== null && inScope(scope, activity.troopId);
}

/**
 * A register touches the scout profiles, the patrol pages, the dashboard and
 * the sidebar count, so all of them are refreshed.
 */
function revalidateAttendance(activityId: string): void {
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${activityId}`);
  revalidatePath(`/activities/${activityId}`);
  revalidatePath("/scouts", "layout");
  revalidatePath("/patrols", "layout");
  revalidatePath("/", "layout");
}

export async function saveRegisterAction(
  activityId: string,
  entries: AttendanceEntry[],
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "attendance.record")) {
    return { ok: false, message: "You do not have permission to take the register." };
  }

  const scope = await resolveTroopScope(user);
  if (!(await activityInScope(activityId, scope))) {
    return { ok: false, message: "That activity could not be found." };
  }

  const result = await service.saveRegister(activityId, entries, user.id, new Date());
  if (!result.ok) return { ok: false, message: result.message };

  revalidateAttendance(activityId);
  return { ok: true };
}
