import { randomUUID } from "node:crypto";

import type { TroopScope } from "@/lib/auth/troop-scope";
import { inScope } from "@/lib/auth/troop-scope";
import { createJsonStore } from "@/lib/json-store";
import { PATROL_TROOP_BY_SLUG, patrolTroopName } from "@/lib/patrols/store";
import { patrolSlug } from "@/lib/patrols/types";
import { buildSeedScouts } from "@/lib/scouts/seed-data";
import type { Scout, ScoutDetails } from "@/lib/scouts/types";

/**
 * Scout repository - the only module that knows how scouts are persisted.
 *
 * Node-only.
 */

const SEEDED_AT = "2026-08-01T09:00:00.000Z";

/**
 * Records written before patrols became real carried a `patrol` name string;
 * records written before troops existed carry no `troopId` at all. Both are
 * brought up to date on read, so an existing `.data` folder keeps working and
 * is rewritten in the current shape on its next write.
 */
type LegacyScout = Scout & { patrol?: string };

function migrateScout(record: Scout): Scout {
  const legacy = record as LegacyScout;

  let next: Scout = record;
  if (legacy.patrolId === undefined && legacy.patrol !== undefined) {
    const { patrol, ...rest } = legacy;
    next = {
      ...rest,
      patrolId: patrol === "Unassigned" || !patrol ? null : patrolSlug(patrol),
    };
  }

  if (next.troopId !== undefined) return next;

  const troopId = next.patrolId
    ? (PATROL_TROOP_BY_SLUG[next.patrolId] ?? patrolTroopName(""))
    : patrolTroopName("");

  return { ...next, troopId };
}

const store = createJsonStore<Scout>(
  "scouts.json",
  () =>
    buildSeedScouts().map((seed) => ({
      ...seed,
      id: randomUUID(),
      archivedAt: seed.archived ? SEEDED_AT : null,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
    })),
  { migrate: migrateScout, autoSeed: false },
);

export async function allScouts(): Promise<Scout[]> {
  return store.all();
}

/** Scouts visible under `scope` - every scout for an admin, or just the caller's troop(s) otherwise. */
export async function scoutsInScope(scope: TroopScope): Promise<Scout[]> {
  const scouts = await store.all();
  return scouts.filter((scout) => inScope(scope, scout.troopId));
}

export async function findScout(id: string): Promise<Scout | null> {
  const scouts = await store.all();
  return scouts.find((scout) => scout.id === id) ?? null;
}

export async function createScout(details: ScoutDetails): Promise<Scout> {
  return store.mutate((scouts) => {
    const now = new Date().toISOString();
    const scout: Scout = {
      ...details,
      id: randomUUID(),
      archived: false,
      archivedAt: null,
      archiveReason: "",
      createdAt: now,
      updatedAt: now,
    };

    scouts.push(scout);
    return scout;
  });
}

/** Returns the updated scout, or null when the id no longer exists. */
export async function updateScout(
  id: string,
  changes: Partial<Omit<Scout, "id" | "createdAt">>,
): Promise<Scout | null> {
  return store.mutate((scouts) => {
    const index = scouts.findIndex((scout) => scout.id === id);
    if (index === -1) return null;

    const next: Scout = {
      ...scouts[index],
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    scouts[index] = next;
    return next;
  });
}

/** True when another scout already has this email. Blank emails never clash. */
export async function scoutEmailTaken(email: string, exceptId?: string): Promise<boolean> {
  const target = email.trim().toLowerCase();
  if (!target) return false;

  const scouts = await store.all();
  return scouts.some((scout) => scout.email === target && scout.id !== exceptId);
}

/* ------------------------------ patrol membership ----------------------------- */

/** Non-archived scouts in one patrol. */
export async function scoutsInPatrol(patrolId: string): Promise<Scout[]> {
  const scouts = await store.all();
  return scouts.filter((scout) => !scout.archived && scout.patrolId === patrolId);
}

/** Non-archived, patrol-less scouts in `troopId`. */
export async function unassignedScouts(troopId: string): Promise<Scout[]> {
  const scouts = await store.all();
  return scouts.filter(
    (scout) => !scout.archived && scout.patrolId === null && scout.troopId === troopId,
  );
}

/** Member counts per patrol id, for the list page and the nav badge. */
export async function memberCounts(): Promise<Map<string, number>> {
  const scouts = await store.all();
  const counts = new Map<string, number>();

  for (const scout of scouts) {
    if (scout.archived || !scout.patrolId) continue;
    counts.set(scout.patrolId, (counts.get(scout.patrolId) ?? 0) + 1);
  }

  return counts;
}

export interface ActiveScoutCounts {
  total: number;
  /** Keyed by patrol id; scouts with no patrol are counted only in `total`. */
  byPatrol: Map<string, number>;
}

/**
 * The scouts who would actually turn up to something: on the register, not
 * archived, and currently active. Used to work out how many are expected at an
 * activity, which is why inactive and waiting-list scouts are left out.
 */
export async function activeScoutCounts(): Promise<ActiveScoutCounts> {
  const scouts = await store.all();
  const byPatrol = new Map<string, number>();
  let total = 0;

  for (const scout of scouts) {
    if (scout.archived || scout.status !== "active") continue;
    total += 1;
    if (scout.patrolId) byPatrol.set(scout.patrolId, (byPatrol.get(scout.patrolId) ?? 0) + 1);
  }

  return { total, byPatrol };
}

/**
 * Moves scouts into a patrol (or out of one, with `null`) in a single write.
 * Returns how many records actually changed.
 */
export async function setPatrolForScouts(
  scoutIds: string[],
  patrolId: string | null,
): Promise<number> {
  return store.mutate((scouts) => {
    const wanted = new Set(scoutIds);
    const now = new Date().toISOString();
    let changed = 0;

    for (let index = 0; index < scouts.length; index += 1) {
      const scout = scouts[index];
      if (!wanted.has(scout.id) || scout.patrolId === patrolId) continue;

      scouts[index] = { ...scout, patrolId, updatedAt: now };
      changed += 1;
    }

    return changed;
  });
}

/** Clears the patrol from every member at once, used when a patrol is archived. */
export async function clearPatrolMembership(patrolId: string): Promise<number> {
  return store.mutate((scouts) => {
    const now = new Date().toISOString();
    let changed = 0;

    for (let index = 0; index < scouts.length; index += 1) {
      if (scouts[index].patrolId !== patrolId) continue;
      scouts[index] = { ...scouts[index], patrolId: null, updatedAt: now };
      changed += 1;
    }

    return changed;
  });
}
