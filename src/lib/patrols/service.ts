import type { TroopScope } from "@/lib/auth/troop-scope";
import * as userStore from "@/lib/auth/store";
import * as patrolStore from "@/lib/patrols/store";
import type { Patrol, PatrolDetails } from "@/lib/patrols/types";
import * as scoutStore from "@/lib/scouts/store";
import { scoutFullName, type Scout } from "@/lib/scouts/types";
import { isTroopId } from "@/lib/troops/store";
import type { FieldErrors } from "@/lib/validation";

/**
 * Patrol rules, including everything that spans patrols and scouts.
 *
 * The one-patrol-per-scout invariant is structural - `Scout.patrolId` is a
 * single field - so assigning a scout who is already in another patrol moves
 * them rather than creating a second membership. That move is reported back to
 * the caller so the UI can say what happened.
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

/** A patrol with its derived membership, ready to render. */
export interface PatrolWithMembers {
  patrol: Patrol;
  members: Scout[];
  memberCount: number;
  leader: Scout | null;
}

export interface PatrolSummary {
  patrol: Patrol;
  memberCount: number;
  leaderName: string | null;
}

export async function listPatrols(
  scope: TroopScope,
  includeArchived: boolean,
): Promise<PatrolSummary[]> {
  const [patrols, counts] = await Promise.all([
    patrolStore.patrolsInScope(scope),
    scoutStore.memberCounts(),
  ]);

  const visible = includeArchived ? patrols : patrols.filter((patrol) => !patrol.archived);

  // Leader names need the scout records, but only for patrols that have one.
  const leaderIds = visible
    .map((patrol) => patrol.patrolLeaderId)
    .filter((id): id is string => id !== null);

  const leaders = new Map<string, string>();
  for (const id of leaderIds) {
    const scout = await scoutStore.findScout(id);
    if (scout) leaders.set(id, scoutFullName(scout));
  }

  return visible
    .map((patrol) => ({
      patrol,
      memberCount: counts.get(patrol.id) ?? 0,
      leaderName: patrol.patrolLeaderId ? (leaders.get(patrol.patrolLeaderId) ?? null) : null,
    }))
    .sort((a, b) => a.patrol.name.localeCompare(b.patrol.name));
}

export async function getPatrol(id: string): Promise<PatrolWithMembers | null> {
  const patrol = await patrolStore.findPatrol(id);
  if (!patrol) return null;

  const members = await scoutStore.scoutsInPatrol(id);
  members.sort((a, b) => scoutFullName(a).localeCompare(scoutFullName(b)));

  const leader = patrol.patrolLeaderId
    ? (members.find((scout) => scout.id === patrol.patrolLeaderId) ?? null)
    : null;

  return { patrol, members, memberCount: members.length, leader };
}

/** Id to name, for the scout list's patrol column and filter. */
export async function patrolNameMap(scope: TroopScope): Promise<Map<string, string>> {
  const patrols = await patrolStore.patrolsInScope(scope);
  return new Map(patrols.map((patrol) => [patrol.id, patrol.name]));
}

/** Options for a patrol picker: active patrols in scope, grouped by nothing but troop-filtered. */
export async function patrolOptions(
  scope: TroopScope,
): Promise<{ id: string; name: string; troopId: string }[]> {
  const patrols = await patrolStore.patrolsInScope(scope);
  return patrols
    .filter((patrol) => !patrol.archived)
    .map((patrol) => ({ id: patrol.id, name: patrol.name, troopId: patrol.troopId }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function countActivePatrols(scope: TroopScope): Promise<number> {
  const patrols = await patrolStore.patrolsInScope(scope);
  return patrols.filter((patrol) => !patrol.archived).length;
}

/** Scouts in `troopId` with no patrol, offered when assigning members to one of its patrols. */
export async function assignableScouts(troopId: string): Promise<Scout[]> {
  const scouts = await scoutStore.unassignedScouts(troopId);
  return scouts.sort((a, b) => scoutFullName(a).localeCompare(scoutFullName(b)));
}

/* -------------------------------- mutations ------------------------------- */

async function nameConflict(
  name: string,
  exceptId?: string,
): Promise<ServiceResult<never> | null> {
  if (!(await patrolStore.patrolNameTaken(name, exceptId))) return null;
  return failure("A patrol with that name already exists.", {
    name: "That patrol name is already in use.",
  });
}

async function invalidTroop(troopId: string): Promise<ServiceResult<never> | null> {
  if (await isTroopId(troopId)) return null;
  return failure("Choose a troop for this patrol.", { troopId: "That troop could not be found." });
}

export async function addPatrol(details: PatrolDetails): Promise<ServiceResult<Patrol>> {
  const troopError = await invalidTroop(details.troopId);
  if (troopError) return troopError;

  const conflict = await nameConflict(details.name);
  if (conflict) return conflict;

  // A brand-new patrol has no members, so it cannot have a leader yet.
  return { ok: true, data: await patrolStore.createPatrol({ ...details, patrolLeaderId: null }) };
}

export async function editPatrol(
  id: string,
  details: Omit<PatrolDetails, "troopId">,
): Promise<ServiceResult<Patrol>> {
  const conflict = await nameConflict(details.name, id);
  if (conflict) return conflict;

  const existing = await patrolStore.findPatrol(id);
  if (!existing) return failure("That patrol could not be found.");

  const updated = await patrolStore.updatePatrol(id, {
    name: details.name,
    description: details.description,
    status: details.status,
  });
  if (!updated) return failure("That patrol could not be found.");

  return { ok: true, data: updated };
}

/**
 * Archiving a patrol releases its members rather than stranding them: they
 * become unassigned and can be placed in another patrol straight away.
 */
export async function archivePatrol(
  id: string,
  reason: string,
): Promise<ServiceResult<{ patrol: Patrol; released: number }>> {
  const patrol = await patrolStore.findPatrol(id);
  if (!patrol) return failure("That patrol could not be found.");
  if (patrol.archived) return failure("That patrol is already archived.");

  const released = await scoutStore.clearPatrolMembership(id);
  await userStore.removePatrolFromAllLeaders(id);

  const updated = await patrolStore.updatePatrol(id, {
    archived: true,
    archivedAt: new Date().toISOString(),
    archiveReason: reason.trim().slice(0, 300),
    patrolLeaderId: null,
  });
  if (!updated) return failure("That patrol could not be found.");

  return { ok: true, data: { patrol: updated, released } };
}

export async function restorePatrol(id: string): Promise<ServiceResult<Patrol>> {
  const patrol = await patrolStore.findPatrol(id);
  if (!patrol) return failure("That patrol could not be found.");
  if (!patrol.archived) return failure("That patrol is not archived.");

  const updated = await patrolStore.updatePatrol(id, {
    archived: false,
    archivedAt: null,
    archiveReason: "",
  });
  if (!updated) return failure("That patrol could not be found.");

  return { ok: true, data: updated };
}

/* ------------------------------- membership ------------------------------- */

export interface AssignOutcome {
  assigned: number;
  /** Scouts who were moved out of another patrol to get here. */
  moved: string[];
}

export async function assignScoutsToPatrol(
  patrolId: string,
  scoutIds: string[],
): Promise<ServiceResult<AssignOutcome>> {
  const patrol = await patrolStore.findPatrol(patrolId);
  if (!patrol) return failure("That patrol could not be found.");
  if (patrol.archived) return failure("Restore this patrol before assigning members to it.");
  if (scoutIds.length === 0) return failure("Choose at least one scout to assign.");

  // Report anyone being moved out of an existing patrol, so the action can say so.
  const moved: string[] = [];
  for (const scoutId of scoutIds) {
    const scout = await scoutStore.findScout(scoutId);
    if (!scout) return failure("One of those scouts could not be found.");
    if (scout.archived) return failure(`${scoutFullName(scout)} is archived.`);
    if (scout.troopId !== patrol.troopId) {
      return failure(`${scoutFullName(scout)} belongs to a different troop.`);
    }
    if (scout.patrolId && scout.patrolId !== patrolId) moved.push(scoutFullName(scout));
  }

  const assigned = await scoutStore.setPatrolForScouts(scoutIds, patrolId);

  return { ok: true, data: { assigned, moved } };
}

/**
 * Removes one scout from their patrol. If they were the patrol leader, the post
 * is vacated too - a leader who is not a member would be a broken record.
 */
export async function removeScoutFromPatrol(
  patrolId: string,
  scoutId: string,
): Promise<ServiceResult> {
  const patrol = await patrolStore.findPatrol(patrolId);
  if (!patrol) return failure("That patrol could not be found.");

  const scout = await scoutStore.findScout(scoutId);
  if (!scout) return failure("That scout could not be found.");
  if (scout.patrolId !== patrolId) return failure("That scout is not in this patrol.");

  await scoutStore.setPatrolForScouts([scoutId], null);

  if (patrol.patrolLeaderId === scoutId) {
    await patrolStore.updatePatrol(patrolId, { patrolLeaderId: null });
  }

  return { ok: true, data: undefined };
}

/** Appoints a member as patrol leader, or clears the post with `null`. */
export async function setPatrolLeader(
  patrolId: string,
  scoutId: string | null,
): Promise<ServiceResult<Patrol>> {
  const patrol = await patrolStore.findPatrol(patrolId);
  if (!patrol) return failure("That patrol could not be found.");

  if (scoutId !== null) {
    const scout = await scoutStore.findScout(scoutId);
    if (!scout) return failure("That scout could not be found.");
    // The leader must be one of the patrol's own members.
    if (scout.patrolId !== patrolId) {
      return failure("A patrol leader has to be a member of the patrol.");
    }
    if (scout.archived) return failure("An archived scout cannot lead a patrol.");
  }

  const updated = await patrolStore.updatePatrol(patrolId, { patrolLeaderId: scoutId });
  if (!updated) return failure("That patrol could not be found.");

  return { ok: true, data: updated };
}
