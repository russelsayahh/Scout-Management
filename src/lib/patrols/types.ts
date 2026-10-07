/**
 * A patrol is a small, named group of scouts with one of its members appointed
 * as patrol leader.
 *
 * Membership is NOT stored here. Each scout carries a single `patrolId`, which
 * makes "a scout belongs to at most one patrol" true by construction rather
 * than by a rule somebody has to remember to enforce. Members are always
 * derived by querying scouts for that id.
 */

export type PatrolStatus = "active" | "forming" | "inactive";

export const PATROL_STATUSES: readonly PatrolStatus[] = ["active", "forming", "inactive"];

export const patrolStatusLabels: Record<PatrolStatus, string> = {
  active: "Active",
  forming: "Forming",
  inactive: "Inactive",
};

export const patrolStatusDescriptions: Record<PatrolStatus, string> = {
  active: "Meeting regularly and taking part in the programme.",
  forming: "Being set up and still recruiting members.",
  inactive: "Dormant for now, but kept on file.",
};

export interface Patrol {
  id: string;
  name: string;
  description: string;
  /** Scout id of the appointed patrol leader, or null while the post is vacant. */
  patrolLeaderId: string | null;
  status: PatrolStatus;

  /**
   * The troop this patrol belongs to. Fixed at creation - moving a patrol to
   * another troop would silently strand its members' troop invariant, so
   * nothing in this module ever changes it after the fact.
   */
  troopId: string;

  archived: boolean;
  archivedAt: string | null;
  archiveReason: string;

  createdAt: string;
  updatedAt: string;
}

/** The editable half of a patrol - what the create and edit forms produce. */
export type PatrolDetails = Pick<
  Patrol,
  "name" | "description" | "status" | "patrolLeaderId" | "troopId"
>;

/** Stable, readable ids for the seeded patrols. */
export function patrolSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
