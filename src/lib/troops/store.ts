import { createJsonStore } from "@/lib/json-store";
import { troopSlug, TROOP_NAMES, type Troop } from "@/lib/troops/types";

/**
 * Troop repository - the only module that knows how troops are persisted.
 *
 * The six troops are fixed by the group's structure, so this store only ever
 * seeds and reads; there is no create or delete.
 *
 * Node-only.
 */

const SEEDED_AT = "2026-08-01T09:00:00.000Z";

const DESCRIPTIONS: Record<string, string> = {
  Jeannettes: "The group's youngest section.",
  Louveteaux: "Cub-age scouts, building the basics through games and badges.",
  Guides: "Guide-age members, running their own patrol programme.",
  Scouts: "The group's flagship section - expeditions, camps and skills work.",
  Caravelles: "Senior section for older girls, more independence in planning.",
  Routiers: "The oldest section - service, expedition and leadership projects.",
};

/** Records written before troops existed carried no field at all. */
function migrateTroop(record: Troop): Troop {
  return record;
}

const store = createJsonStore<Troop>(
  "troops.json",
  () =>
    TROOP_NAMES.map((name) => ({
      id: troopSlug(name),
      name,
      description: DESCRIPTIONS[name] ?? "",
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
    })),
  { migrate: migrateTroop },
);

export async function allTroops(): Promise<Troop[]> {
  return store.all();
}

export async function findTroop(id: string): Promise<Troop | null> {
  const troops = await store.all();
  return troops.find((troop) => troop.id === id) ?? null;
}

/** True when `id` is one of the six real troops. */
export async function isTroopId(id: string): Promise<boolean> {
  return (await findTroop(id)) !== null;
}

export async function updateTroopDescription(
  id: string,
  description: string,
): Promise<Troop | null> {
  return store.mutate((troops) => {
    const index = troops.findIndex((troop) => troop.id === id);
    if (index === -1) return null;

    const next: Troop = {
      ...troops[index],
      description: description.trim(),
      updatedAt: new Date().toISOString(),
    };
    troops[index] = next;
    return next;
  });
}
