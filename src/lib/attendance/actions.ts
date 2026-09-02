"use server";

import { revalidatePath } from "next/cache";

import * as service from "@/lib/attendance/service";
import type { AttendanceEntry } from "@/lib/attendance/types";
import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import type { ActionResult } from "@/lib/form-state";

/**
 * Server Actions for registers.
 *
 * `attendance.record` is re-checked here. The UI hides the controls from roles
 * without it, but that is presentation - this is the enforcement.
 */

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

  const result = await service.saveRegister(activityId, entries, user.id, new Date());
  if (!result.ok) return { ok: false, message: result.message };

  revalidateAttendance(activityId);
  return { ok: true };
}
