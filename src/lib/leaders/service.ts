import * as userStore from "@/lib/auth/store";
import type { Role, SessionUser } from "@/lib/auth/types";
import type { TroopScope } from "@/lib/auth/troop-scope";
import * as patrolStore from "@/lib/patrols/store";
import * as scoutStore from "@/lib/scouts/store";
import { troopsInScope } from "@/lib/troops/service";
import { isTroopId } from "@/lib/troops/store";
import type { FieldErrors } from "@/lib/validation";

/**
 * Leader profile rules: everything that spans user accounts and patrols.
 *
 * A leader is a `StoredUser` - there is no separate leader entity - so this
 * module wraps `auth/store` with the fields and cross-references that are
 * specific to the leader directory rather than to accounts in general.
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

/**
 * True when a leader's own troop assignment overlaps `scope` - an
 * administrator's "all" scope always overlaps, even against an administrator
 * target whose own `assignedTroopIds` is empty and therefore ignored.
 */
export function leaderInScope(leader: Pick<SessionUser, "assignedTroopIds">, scope: TroopScope): boolean {
  return scope === "all" || leader.assignedTroopIds.some((id) => scope.includes(id));
}

/** Leaders visible under `scope` - every leader for an admin, or just those sharing a troop otherwise. */
export async function listLeaders(scope: TroopScope): Promise<SessionUser[]> {
  const users = await userStore.listUsers();
  return users.filter((user) => leaderInScope(user, scope)).map(userStore.toSessionUser);
}

export async function getLeader(id: string): Promise<SessionUser | null> {
  const user = await userStore.findById(id);
  return user ? userStore.toSessionUser(user) : null;
}

export async function leaderCounts(scope: TroopScope): Promise<{ role: Role; count: number }[]> {
  const users = await userStore.listUsers();
  const visible = users.filter((user) => leaderInScope(user, scope));
  const roles: Role[] = ["administrator", "scout-leader", "assistant-leader"];
  return roles.map((role) => ({
    role,
    count: visible.filter((user) => user.role === role).length,
  }));
}

export interface PatrolChoice {
  id: string;
  name: string;
  /** Active scouts currently in the patrol. */
  memberCount: number;
  troopId: string;
}

/** Patrols a leader may be assigned to, archived ones excluded, and scoped to the caller's own troop(s). */
export async function patrolChoices(scope: TroopScope): Promise<PatrolChoice[]> {
  const [patrols, counts] = await Promise.all([
    patrolStore.patrolsInScope(scope),
    scoutStore.activeScoutCounts(),
  ]);

  return patrols
    .filter((patrol) => !patrol.archived)
    .map((patrol) => ({
      id: patrol.id,
      name: patrol.name,
      memberCount: counts.byPatrol.get(patrol.id) ?? 0,
      troopId: patrol.troopId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Troops a leader may be assigned to - a caller with a narrower scope sees only their own. */
export async function troopChoices(scope: TroopScope): Promise<{ id: string; name: string }[]> {
  const troops = await troopsInScope(scope);
  return troops.map((troop) => ({ id: troop.id, name: troop.name }));
}

export interface AssignedPatrol {
  id: string;
  name: string;
  archived: boolean;
}

/** The patrols on a leader's own record, resolved to names for display. */
export async function assignedPatrols(leaderId: string): Promise<AssignedPatrol[]> {
  const leader = await userStore.findById(leaderId);
  if (!leader || leader.assignedPatrolIds.length === 0) return [];

  const patrols = await patrolStore.allPatrols();
  const byId = new Map(patrols.map((patrol) => [patrol.id, patrol]));

  return leader.assignedPatrolIds
    .map((id) => byId.get(id))
    .filter((patrol): patrol is NonNullable<typeof patrol> => patrol !== undefined)
    .map((patrol) => ({ id: patrol.id, name: patrol.name, archived: patrol.archived }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Leaders assigned to one patrol, for the patrol's own detail page. */
export async function leadersForPatrol(patrolId: string): Promise<SessionUser[]> {
  const users = await userStore.listUsers();
  return users
    .filter((user) => user.assignedPatrolIds.includes(patrolId))
    .map(userStore.toSessionUser);
}

/* -------------------------------- mutations ------------------------------- */

/** Rejects patrol ids that do not exist, or that have been archived. */
async function patrolsInvalid(patrolIds: string[]): Promise<ServiceResult<never> | null> {
  if (patrolIds.length === 0) return null;

  const patrols = await patrolStore.allPatrols();
  const byId = new Map(patrols.map((patrol) => [patrol.id, patrol]));

  for (const id of patrolIds) {
    const patrol = byId.get(id);
    if (!patrol) return failure("One of those patrols could not be found.");
    if (patrol.archived) {
      return failure(`${patrol.name} Patrol is archived and cannot be assigned.`);
    }
  }

  return null;
}

/** Rejects troop ids that are not one of the six real troops. */
async function troopsInvalid(troopIds: string[]): Promise<ServiceResult<never> | null> {
  for (const id of troopIds) {
    if (!(await isTroopId(id))) return failure("One of those troops could not be found.");
  }
  return null;
}

/**
 * A leader's patrol responsibility has to sit inside their own troop
 * assignment - a patrol from a troop they are not assigned to would be a
 * responsibility they cannot otherwise act on.
 */
async function patrolsOutsideTroops(
  patrolIds: string[],
  troopIds: string[],
): Promise<ServiceResult<never> | null> {
  if (patrolIds.length === 0) return null;

  const patrols = await patrolStore.allPatrols();
  const byId = new Map(patrols.map((patrol) => [patrol.id, patrol]));

  for (const id of patrolIds) {
    const patrol = byId.get(id);
    if (patrol && !troopIds.includes(patrol.troopId)) {
      return failure(`${patrol.name} Patrol is not in one of this leader's assigned troops.`);
    }
  }

  return null;
}

export interface UpdateLeaderInput {
  name: string;
  email: string;
  phone: string;
  position: string;
  avatar: string | null;
  patrolIds: string[];
  troopIds: string[];
}

export async function updateLeaderProfile(
  id: string,
  input: UpdateLeaderInput,
): Promise<ServiceResult<SessionUser>> {
  if (await userStore.emailTaken(input.email, id)) {
    return failure("That email address is already in use.", {
      email: "Another account already uses this email.",
    });
  }

  const badTroops = await troopsInvalid(input.troopIds);
  if (badTroops) return badTroops;

  const badPatrols = await patrolsInvalid(input.patrolIds);
  if (badPatrols) return badPatrols;

  const mismatch = await patrolsOutsideTroops(input.patrolIds, input.troopIds);
  if (mismatch) return mismatch;

  const updated = await userStore.updateUser(id, {
    name: input.name,
    email: input.email,
    phone: input.phone,
    position: input.position,
    avatar: input.avatar,
    assignedPatrolIds: input.patrolIds,
    assignedTroopIds: input.troopIds,
  });

  if (!updated) return failure("That leader could not be found.");

  return { ok: true, data: userStore.toSessionUser(updated) };
}
