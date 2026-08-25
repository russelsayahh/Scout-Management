import { randomUUID } from "node:crypto";

import { createJsonStore } from "@/lib/json-store";
import { buildSeedScouts } from "@/lib/scouts/seed-data";
import type { Scout, ScoutDetails } from "@/lib/scouts/types";

/**
 * Scout repository - the only module that knows how scouts are persisted.
 *
 * Node-only.
 */

const SEEDED_AT = "2026-08-01T09:00:00.000Z";

const store = createJsonStore<Scout>("scouts.json", () =>
  buildSeedScouts().map((seed) => ({
    ...seed,
    id: randomUUID(),
    archivedAt: seed.archived ? SEEDED_AT : null,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  })),
);

export async function allScouts(): Promise<Scout[]> {
  return store.all();
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
