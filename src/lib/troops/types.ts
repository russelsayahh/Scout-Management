/**
 * A troop is a section of the group - Jeannettes, Louveteaux, Guides, Scouts,
 * Caravelles or Routiers. It is the top-level organisational boundary: every
 * scout, patrol, leader assignment, activity, camp, attendance record and
 * equipment loan belongs to exactly one troop.
 *
 * The set of troops is fixed by the group's structure, not user-created, so
 * there is no create/delete here - only the six seeded records, editable in
 * their description.
 */

export interface Troop {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/** The group's six sections, in the order they are always shown. */
export const TROOP_NAMES = [
  "Jeannettes",
  "Louveteaux",
  "Guides",
  "Scouts",
  "Caravelles",
  "Routiers",
] as const;

export type TroopName = (typeof TROOP_NAMES)[number];

/** Stable, readable ids for the six troops. */
export function troopSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const TROOP_IDS: string[] = TROOP_NAMES.map(troopSlug);
