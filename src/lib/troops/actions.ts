"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { SELECTED_TROOP_COOKIE } from "@/lib/auth/troop-scope";
import type { ActionResult } from "@/lib/form-state";
import * as service from "@/lib/troops/service";
import { isTroopId } from "@/lib/troops/store";

/**
 * Server Actions for the troop list.
 *
 * The set of troops is fixed - only the description is editable, and only by
 * an administrator.
 */

async function canManage(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user && can(user.role, "troops.manage"));
}

/**
 * Sets which troop an administrator is currently viewing. This is a UI
 * preference, not a security boundary - `resolveTroopScope` treats anything
 * other than a real troop id as "all troops", and a non-administrator's scope
 * never reads this cookie at all, so it cannot widen anyone's access.
 */
export async function setSelectedTroopAction(troopId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "administrator") {
    return { ok: false, message: "Only an administrator can switch troops." };
  }

  const jar = await cookies();
  if (troopId === "all") {
    jar.delete(SELECTED_TROOP_COOKIE);
  } else {
    if (!(await isTroopId(troopId))) {
      return { ok: false, message: "That troop could not be found." };
    }
    jar.set(SELECTED_TROOP_COOKIE, troopId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTroopDescriptionAction(
  id: string,
  description: string,
): Promise<ActionResult> {
  if (!(await canManage())) {
    return { ok: false, message: "You do not have permission to change troop details." };
  }

  const result = await service.updateTroopDescription(id, description);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/troops");
  revalidatePath(`/troops/${id}`);

  return { ok: true };
}

/**
 * Selects `troopId` then jumps to one of the flat routes, already scoped to
 * it - the mechanism a troop's quick-access links use to reach its own
 * members, leaders, patrols or activities.
 */
export async function viewTroopSectionAction(troopId: string, path: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "administrator" || !(await isTroopId(troopId))) {
    redirect("/troops");
  }

  const jar = await cookies();
  jar.set(SELECTED_TROOP_COOKIE, troopId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect(path);
}
