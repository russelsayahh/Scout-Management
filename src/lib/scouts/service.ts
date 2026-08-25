import { applyScoutQuery, type ScoutPage, type ScoutQuery } from "@/lib/scouts/query";
import * as store from "@/lib/scouts/store";
import {
  PATROLS,
  SCOUT_STATUSES,
  type Patrol,
  type Scout,
  type ScoutDetails,
  type ScoutStatus,
} from "@/lib/scouts/types";
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

export async function listScouts(query: ScoutQuery): Promise<ScoutPage> {
  return applyScoutQuery(await store.allScouts(), query);
}

export async function getScout(id: string): Promise<Scout | null> {
  return store.findScout(id);
}

export interface ScoutCounts {
  total: number;
  current: number;
  archived: number;
  byStatus: Record<ScoutStatus, number>;
  byPatrol: Record<Patrol, number>;
}

/** Roll-up used by the list header and the sidebar badge. */
export async function scoutCounts(): Promise<ScoutCounts> {
  const scouts = await store.allScouts();

  const byStatus = Object.fromEntries(
    SCOUT_STATUSES.map((status) => [status, 0]),
  ) as Record<ScoutStatus, number>;
  const byPatrol = Object.fromEntries(PATROLS.map((patrol) => [patrol, 0])) as Record<
    Patrol,
    number
  >;

  let archived = 0;
  for (const scout of scouts) {
    if (scout.archived) {
      archived += 1;
      continue;
    }
    byStatus[scout.status] += 1;
    byPatrol[scout.patrol] += 1;
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
export async function countCurrentScouts(): Promise<number> {
  const scouts = await store.allScouts();
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

export async function addScout(details: ScoutDetails): Promise<ServiceResult<Scout>> {
  const conflict = await emailConflict(details.email);
  if (conflict) return conflict;

  return { ok: true, data: await store.createScout(details) };
}

export async function editScout(
  id: string,
  details: ScoutDetails,
): Promise<ServiceResult<Scout>> {
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
