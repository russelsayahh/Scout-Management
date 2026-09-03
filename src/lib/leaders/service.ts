import * as userStore from "@/lib/auth/store";
import type { Role, SessionUser } from "@/lib/auth/types";
import * as patrolStore from "@/lib/patrols/store";
import * as scoutStore from "@/lib/scouts/store";
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

export async function listLeaders(): Promise<SessionUser[]> {
  const users = await userStore.listUsers();
  return users.map(userStore.toSessionUser);
}

export async function getLeader(id: string): Promise<SessionUser | null> {
  const user = await userStore.findById(id);
  return user ? userStore.toSessionUser(user) : null;
}

export async function leaderCounts(): Promise<{ role: Role; count: number }[]> {
  const users = await userStore.listUsers();
  const roles: Role[] = ["administrator", "scout-leader", "assistant-leader"];
  return roles.map((role) => ({
    role,
    count: users.filter((user) => user.role === role).length,
  }));
}

export interface PatrolChoice {
  id: string;
  name: string;
  /** Active scouts currently in the patrol. */
  memberCount: number;
}

/** Patrols a leader may be assigned to, archived ones excluded. */
export async function patrolChoices(): Promise<PatrolChoice[]> {
  const [patrols, counts] = await Promise.all([
    patrolStore.allPatrols(),
    scoutStore.activeScoutCounts(),
  ]);

  return patrols
    .filter((patrol) => !patrol.archived)
    .map((patrol) => ({
      id: patrol.id,
      name: patrol.name,
      memberCount: counts.byPatrol.get(patrol.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
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

export interface UpdateLeaderInput {
  name: string;
  email: string;
  phone: string;
  position: string;
  avatar: string | null;
  patrolIds: string[];
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

  const badPatrols = await patrolsInvalid(input.patrolIds);
  if (badPatrols) return badPatrols;

  const updated = await userStore.updateUser(id, {
    name: input.name,
    email: input.email,
    phone: input.phone,
    position: input.position,
    avatar: input.avatar,
    assignedPatrolIds: input.patrolIds,
  });

  if (!updated) return failure("That leader could not be found.");

  return { ok: true, data: userStore.toSessionUser(updated) };
}
