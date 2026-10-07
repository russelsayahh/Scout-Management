import type { TroopScope } from "@/lib/auth/troop-scope";
import * as patrolStore from "@/lib/patrols/store";
import {
  applyScoutQuery,
  type PatrolNames,
  type ScoutPage,
  type ScoutQuery,
} from "@/lib/scouts/query";
import * as store from "@/lib/scouts/store";
import {
  SCOUT_STATUSES,
  type Scout,
  type ScoutDetails,
  type ScoutStatus,
} from "@/lib/scouts/types";
import { isTroopId } from "@/lib/troops/store";
import type { FieldErrors } from "@/lib/validation";

/**
 * Scout record rules. Everything above this layer works with `ServiceResult`
 * and never touches storage directly.
 *
 * Node-only.
 */

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

function failure(message: string, fieldErrors?: FieldErrors): ServiceResult<never> {
  return { ok: false, message, fieldErrors };
}

/* --------------------------------- queries -------------------------------- */

export async function listScouts(
  scope: TroopScope,
  query: ScoutQuery,
  patrolNames: PatrolNames = new Map(),
): Promise<ScoutPage> {
  return applyScoutQuery(await store.scoutsInScope(scope), query, patrolNames);
}

export async function getScout(id: string): Promise<Scout | null> {
  return store.findScout(id);
}

export interface ScoutCounts {
  total: number;
  current: number;
  archived: number;
  byStatus: Record<ScoutStatus, number>;
  /** Keyed by patrol id; scouts with no patrol are not counted here. */
  byPatrol: Record<string, number>;
}

/** Roll-up used by the list header and the sidebar badge. */
export async function scoutCounts(scope: TroopScope): Promise<ScoutCounts> {
  const scouts = await store.scoutsInScope(scope);

  const byStatus = Object.fromEntries(
    SCOUT_STATUSES.map((status) => [status, 0]),
  ) as Record<ScoutStatus, number>;
  const byPatrol: Record<string, number> = {};

  let archived = 0;
  for (const scout of scouts) {
    if (scout.archived) {
      archived += 1;
      continue;
    }
    byStatus[scout.status] += 1;
    if (scout.patrolId) byPatrol[scout.patrolId] = (byPatrol[scout.patrolId] ?? 0) + 1;
  }

  return {
    total: scouts.length,
    current: scouts.length - archived,
    archived,
    byStatus,
    byPatrol,
  };
}

/** Just the number shown on the sidebar badge - current, non-archived scouts. */
export async function countCurrentScouts(scope: TroopScope): Promise<number> {
  const scouts = await store.scoutsInScope(scope);
  return scouts.filter((scout) => !scout.archived).length;
}

/* -------------------------------- mutations ------------------------------- */

async function emailConflict(
  email: string,
  exceptId?: string,
): Promise<ServiceResult<never> | null> {
  if (!(await store.scoutEmailTaken(email, exceptId))) return null;
  return failure("That email address is already on another scout's record.", {
    email: "Another scout already uses this email.",
  });
}

/**
 * A scout's troop and patrol have to agree: an unset patrol is always fine,
 * but a chosen one must belong to the scout's own troop.
 */
async function troopPatrolMismatch(details: ScoutDetails): Promise<ServiceResult<never> | null> {
  if (!(await isTroopId(details.troopId))) {
    return failure("Choose a troop for this scout.", { troopId: "That troop could not be found." });
  }

  if (details.patrolId === null) return null;

  const patrol = await patrolStore.findPatrol(details.patrolId);
  if (!patrol || patrol.troopId !== details.troopId) {
    return failure("That patrol does not belong to the chosen troop.", {
      patrolId: "Choose a patrol from the selected troop.",
    });
  }

  return null;
}

export async function addScout(details: ScoutDetails): Promise<ServiceResult<Scout>> {
  const mismatch = await troopPatrolMismatch(details);
  if (mismatch) return mismatch;

  const conflict = await emailConflict(details.email);
  if (conflict) return conflict;

  return { ok: true, data: await store.createScout(details) };
}

export async function editScout(
  id: string,
  details: ScoutDetails,
): Promise<ServiceResult<Scout>> {
  const mismatch = await troopPatrolMismatch(details);
  if (mismatch) return mismatch;

  const conflict = await emailConflict(details.email, id);
  if (conflict) return conflict;

  const updated = await store.updateScout(id, details);
  if (!updated) return failure("That scout could not be found.");

  return { ok: true, data: updated };
}

/**
 * Archiving is reversible and keeps the record: a scout who leaves stays on
 * file for the census and for their badge history.
 */
export async function archiveScout(
  id: string,
  reason: string,
): Promise<ServiceResult<Scout>> {
  const scout = await store.findScout(id);
  if (!scout) return failure("That scout could not be found.");
  if (scout.archived) return failure("That scout is already archived.");

  const updated = await store.updateScout(id, {
    archived: true,
    archivedAt: new Date().toISOString(),
    archiveReason: reason.trim().slice(0, 300),
  });
  if (!updated) return failure("That scout could not be found.");

  return { ok: true, data: updated };
}

export async function restoreScout(id: string): Promise<ServiceResult<Scout>> {
  const scout = await store.findScout(id);
  if (!scout) return failure("That scout could not be found.");
  if (!scout.archived) return failure("That scout is not archived.");

  const updated = await store.updateScout(id, {
    archived: false,
    archivedAt: null,
    archiveReason: "",
  });
  if (!updated) return failure("That scout could not be found.");

  return { ok: true, data: updated };
}
