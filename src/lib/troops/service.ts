import * as activityStore from "@/lib/activities/store";
import * as userStore from "@/lib/auth/store";
import { inScope, type TroopScope } from "@/lib/auth/troop-scope";
import * as patrolStore from "@/lib/patrols/store";
import * as scoutStore from "@/lib/scouts/store";
import * as troopStore from "@/lib/troops/store";
import type { Troop } from "@/lib/troops/types";
import type { FieldErrors } from "@/lib/validation";

/**
 * Troop rules, including the roll-up counts the Troops admin section shows.
 *
 * Node-only.
 */

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

function failure(message: string, fieldErrors?: FieldErrors): ServiceResult<never> {
  return { ok: false, message, fieldErrors };
}

export interface TroopSummary {
  troop: Troop;
  memberCount: number;
  leaderCount: number;
  patrolCount: number;
  upcomingActivityCount: number;
}

export async function listTroops(): Promise<Troop[]> {
  return troopStore.allTroops();
}

/** Troops visible under `scope` - every troop for an admin, or just the caller's own otherwise. */
export async function troopsInScope(scope: TroopScope): Promise<Troop[]> {
  const troops = await troopStore.allTroops();
  return troops.filter((troop) => inScope(scope, troop.id));
}

export async function getTroop(id: string): Promise<Troop | null> {
  return troopStore.findTroop(id);
}

/** One roll-up card per troop, for the admin Troops section. */
export async function troopSummaries(now: Date): Promise<TroopSummary[]> {
  const [troops, scouts, patrols, users, activities] = await Promise.all([
    troopStore.allTroops(),
    scoutStore.allScouts(),
    patrolStore.allPatrols(),
    userStore.listUsers(),
    activityStore.allActivities(),
  ]);

  return troops.map((troop) => {
    const memberCount = scouts.filter((s) => !s.archived && s.troopId === troop.id).length;
    const leaderCount = users.filter((u) => u.assignedTroopIds.includes(troop.id)).length;
    const patrolCount = patrols.filter((p) => !p.archived && p.troopId === troop.id).length;
    const upcomingActivityCount = activities.filter(
      (a) =>
        a.troopId === troop.id &&
        (a.status === "published" || a.status === "draft") &&
        new Date(`${a.date}T${a.startTime}:00.000Z`).getTime() >= now.getTime(),
    ).length;

    return { troop, memberCount, leaderCount, patrolCount, upcomingActivityCount };
  });
}

export async function updateTroopDescription(
  id: string,
  description: string,
): Promise<ServiceResult<Troop>> {
  const updated = await troopStore.updateTroopDescription(id, description.trim().slice(0, 400));
  if (!updated) return failure("That troop could not be found.");
  return { ok: true, data: updated };
}
