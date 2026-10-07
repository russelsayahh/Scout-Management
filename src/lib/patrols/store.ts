import { randomUUID } from "node:crypto";

import type { TroopScope } from "@/lib/auth/troop-scope";
import { inScope } from "@/lib/auth/troop-scope";
import { createJsonStore } from "@/lib/json-store";
import { troopSlug } from "@/lib/troops/types";
import {
  patrolSlug,
  type Patrol,
  type PatrolDetails,
  type PatrolStatus,
} from "@/lib/patrols/types";

/**
 * Patrol repository - the only module that knows how patrols are persisted.
 *
 * Node-only.
 */

const SEEDED_AT = "2026-08-01T09:00:00.000Z";

/**
 * The troop's standing patrols. Ids are slugs so the seed data stays
 * readable. Each patrol belongs to exactly one troop - `scouts/seed-data.ts`
 * and the activity/camp seeds resolve a patrol's troop through
 * `patrolTroopName` below, so this table is the single source of truth for
 * which patrol sits in which troop.
 */
const SEED: [name: string, description: string, status: PatrolStatus, troop: string][] = [
  ["Kestrel", "The troop's oldest patrol, strong on navigation and hillcraft.", "active", "Jeannettes"],
  ["Falcon", "Known for pioneering and camp gadgets.", "active", "Louveteaux"],
  ["Otter", "Water activities specialists - kayaking and rafting.", "active", "Guides"],
  ["Kingfisher", "Focused on backwoods cooking and fire lighting.", "active", "Guides"],
  ["Badger", "Night hikes, wide games and expedition work.", "active", "Scouts"],
  ["Heron", "Strong first aid and emergency-aid record.", "active", "Scouts"],
  ["Peregrine", "Climbing and high-ropes enthusiasts.", "active", "Caravelles"],
  ["Osprey", "Newest patrol, building up its membership.", "forming", "Routiers"],
];

/** Patrol name -> troop id, e.g. `"Kestrel"` -> `"jeannettes"`. */
const PATROL_TROOP_NAME: Record<string, string> = Object.fromEntries(
  SEED.map(([name, , , troop]) => [name, troopSlug(troop)]),
);

/** Patrol id (slug) -> troop id, for migrating older records synchronously. */
export const PATROL_TROOP_BY_SLUG: Record<string, string> = Object.fromEntries(
  SEED.map(([name, , , troop]) => [patrolSlug(name), troopSlug(troop)]),
);

/** The troop a seeded patrol belongs to, resolved by name. Falls back to Scouts for anything unrecognised. */
export function patrolTroopName(patrolName: string): string {
  return PATROL_TROOP_NAME[patrolName] ?? troopSlug("Scouts");
}

/** Records written before troops existed carried no `troopId`. */
function migratePatrol(record: Patrol): Patrol {
  if (record.troopId !== undefined) return record;
  return { ...record, troopId: patrolTroopName(record.name) };
}

const store = createJsonStore<Patrol>(
  "patrols.json",
  () =>
    SEED.map(([name, description, status, troop]) => ({
      id: patrolSlug(name),
      name,
      description,
      // Leaders are appointed after seeding, from the patrol's own members.
      patrolLeaderId: null,
      status,
      troopId: troopSlug(troop),
      archived: false,
      archivedAt: null,
      archiveReason: "",
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
    })),
  { migrate: migratePatrol, autoSeed: false },
);

export async function allPatrols(): Promise<Patrol[]> {
  return store.all();
}

/** Patrols visible under `scope` - every patrol for an admin, or just the caller's troop(s) otherwise. */
export async function patrolsInScope(scope: TroopScope): Promise<Patrol[]> {
  const patrols = await store.all();
  return patrols.filter((patrol) => inScope(scope, patrol.troopId));
}

export async function findPatrol(id: string): Promise<Patrol | null> {
  const patrols = await store.all();
  return patrols.find((patrol) => patrol.id === id) ?? null;
}

/** Case-insensitive name check; patrol names have to be tellable apart. */
export async function patrolNameTaken(name: string, exceptId?: string): Promise<boolean> {
  const target = name.trim().toLowerCase();
  const patrols = await store.all();
  return patrols.some(
    (patrol) => patrol.name.trim().toLowerCase() === target && patrol.id !== exceptId,
  );
}

export async function createPatrol(details: PatrolDetails): Promise<Patrol> {
  return store.mutate((patrols) => {
    const now = new Date().toISOString();
    const patrol: Patrol = {
      ...details,
      name: details.name.trim(),
      description: details.description.trim(),
      id: randomUUID(),
      archived: false,
      archivedAt: null,
      archiveReason: "",
      createdAt: now,
      updatedAt: now,
    };

    patrols.push(patrol);
    return patrol;
  });
}

/**
 * Returns the updated patrol, or null when the id no longer exists.
 * `troopId` is never accepted here - see the note on `Patrol.troopId`.
 */
export async function updatePatrol(
  id: string,
  changes: Partial<Omit<Patrol, "id" | "createdAt" | "troopId">>,
): Promise<Patrol | null> {
  return store.mutate((patrols) => {
    const index = patrols.findIndex((patrol) => patrol.id === id);
    if (index === -1) return null;

    const next: Patrol = {
      ...patrols[index],
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    if (changes.name !== undefined) next.name = changes.name.trim();
    if (changes.description !== undefined) next.description = changes.description.trim();

    patrols[index] = next;
    return next;
  });
}
