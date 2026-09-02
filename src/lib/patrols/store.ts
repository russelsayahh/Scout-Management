import { randomUUID } from "node:crypto";

import { createJsonStore } from "@/lib/json-store";
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

/** The troop's standing patrols. Ids are slugs so the seed data stays readable. */
const SEED: [name: string, description: string, status: PatrolStatus][] = [
  ["Kestrel", "The troop's oldest patrol, strong on navigation and hillcraft.", "active"],
  ["Falcon", "Known for pioneering and camp gadgets.", "active"],
  ["Otter", "Water activities specialists - kayaking and rafting.", "active"],
  ["Kingfisher", "Focused on backwoods cooking and fire lighting.", "active"],
  ["Badger", "Night hikes, wide games and expedition work.", "active"],
  ["Heron", "Strong first aid and emergency-aid record.", "active"],
  ["Peregrine", "Climbing and high-ropes enthusiasts.", "active"],
  ["Osprey", "Newest patrol, building up its membership.", "forming"],
];

const store = createJsonStore<Patrol>("patrols.json", () =>
  SEED.map(([name, description, status]) => ({
    id: patrolSlug(name),
    name,
    description,
    // Leaders are appointed after seeding, from the patrol's own members.
    patrolLeaderId: null,
    status,
    archived: false,
    archivedAt: null,
    archiveReason: "",
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  })),
);

export async function allPatrols(): Promise<Patrol[]> {
  return store.all();
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

/** Returns the updated patrol, or null when the id no longer exists. */
export async function updatePatrol(
  id: string,
  changes: Partial<Omit<Patrol, "id" | "createdAt">>,
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
