import * as userStore from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";
import type { TroopScope } from "@/lib/auth/troop-scope";
import * as store from "@/lib/camps/store";
import { campTimeline, type CampMilestone } from "@/lib/camps/timeline";
import {
  canTransition,
  isClosed,
  isUpcoming,
  placesLeft,
  registrationState,
  type Camp,
  type CampDetails,
  type CampStatus,
  type RegistrationState,
} from "@/lib/camps/types";
import * as patrolStore from "@/lib/patrols/store";
import * as scoutStore from "@/lib/scouts/store";
import { scoutFullName, type Scout } from "@/lib/scouts/types";
import { isTroopId } from "@/lib/troops/store";
import type { FieldErrors } from "@/lib/validation";

/**
 * Camp rules, and everything that spans camps, scouts, patrols and accounts.
 *
 * Three decisions live here:
 *
 * - **Capacity is a hard limit.** Unlike an activity's advisory head count, a
 *   camp has beds; the check runs inside the store's write lock so two leaders
 *   cannot both take the last place.
 * - **Status moves through named transitions**, never by assignment, so a camp
 *   cannot jump from cancelled straight back to running.
 * - **A finished or cancelled camp is a fixed record.** Everything else is
 *   ordinary admin a leader is trusted to do, including adding somebody after
 *   the deadline.
 *
 * Node-only.
 */

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

function failure(message: string, fieldErrors?: FieldErrors): ServiceResult<never> {
  return { ok: false, message, fieldErrors };
}

/* --------------------------------- pickers -------------------------------- */

export interface LeaderChoice {
  id: string;
  name: string;
  role: Role;
}

export async function leaderOptions(): Promise<LeaderChoice[]> {
  const users = await userStore.listUsers();
  return users.map((user) => ({ id: user.id, name: user.name, role: user.role }));
}

export interface PatrolChoice {
  id: string;
  name: string;
  memberCount: number;
  /** The troop this patrol belongs to, so the form can filter by the chosen troop. */
  troopId: string;
}

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

/**
 * Active scouts on the register, per troop in `scope` - the head count for a
 * whole-troop camp, keyed by troop id so the form can look up whichever troop
 * is currently chosen.
 */
export async function troopSizes(scope: TroopScope): Promise<Record<string, number>> {
  const scouts = await scoutStore.scoutsInScope(scope);

  const sizes: Record<string, number> = {};
  for (const scout of scouts) {
    if (scout.archived || scout.status !== "active") continue;
    sizes[scout.troopId] = (sizes[scout.troopId] ?? 0) + 1;
  }
  return sizes;
}

/* --------------------------------- queries -------------------------------- */

export interface CampSummary {
  camp: Camp;
  registered: number;
  placesLeft: number;
  leaderNames: string[];
  patrolNames: string[];
  state: RegistrationState;
}

async function summarise(camps: Camp[]): Promise<CampSummary[]> {
  const [users, patrols] = await Promise.all([userStore.listUsers(), patrolStore.allPatrols()]);
  const userNames = new Map(users.map((user) => [user.id, user.name]));
  const patrolNames = new Map(patrols.map((patrol) => [patrol.id, patrol.name]));
  const now = new Date();

  return camps.map((camp) => ({
    camp,
    registered: camp.registrations.length,
    placesLeft: placesLeft(camp),
    leaderNames: camp.leaderIds.map((id) => userNames.get(id) ?? "Unknown"),
    patrolNames: camp.patrolIds.map((id) => patrolNames.get(id) ?? "Unknown patrol"),
    state: registrationState(camp, now),
  }));
}

export type CampFilter = "upcoming" | "past" | "all";

export const campFilterLabels: Record<CampFilter, string> = {
  upcoming: "Upcoming",
  past: "Past and cancelled",
  all: "All camps",
};

/** Upcoming first by start date; past newest first, which is how they are read. */
export async function listCamps(
  scope: TroopScope,
  filter: CampFilter,
  now: Date,
): Promise<CampSummary[]> {
  const camps = await store.campsInScope(scope);

  const upcoming = camps.filter((camp) => isUpcoming(camp, now));
  const past = camps.filter((camp) => !isUpcoming(camp, now));

  upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
  past.sort((a, b) => b.startDate.localeCompare(a.startDate));

  if (filter === "upcoming") return summarise(upcoming);
  if (filter === "past") return summarise(past);
  return summarise([...upcoming, ...past]);
}

export interface CampCounts {
  total: number;
  upcoming: number;
  byStatus: Record<CampStatus, number>;
  /** Scouts registered across every camp still to come. */
  upcomingRegistrations: number;
}

export async function campCounts(scope: TroopScope, now: Date): Promise<CampCounts> {
  const camps = await store.campsInScope(scope);

  const byStatus: Record<CampStatus, number> = {
    planning: 0,
    "registration-open": 0,
    "registration-closed": 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  };

  let upcoming = 0;
  let upcomingRegistrations = 0;

  for (const camp of camps) {
    byStatus[camp.status] += 1;
    if (isUpcoming(camp, now)) {
      upcoming += 1;
      upcomingRegistrations += camp.registrations.length;
    }
  }

  return { total: camps.length, upcoming, byStatus, upcomingRegistrations };
}

/** One registered scout, with the detail worth showing on the roster. */
export interface Participant {
  scout: Scout;
  registeredAt: string;
  registeredByName: string;
  patrolName: string | null;
  /** Registered even though their patrol was not one of those invited. */
  outsideInvitedPatrols: boolean;
}

export interface CampLeader {
  id: string;
  name: string;
  role: Role;
  email: string;
}

export interface CampPatrol {
  id: string;
  name: string;
  archived: boolean;
  /** Members of this patrol who are registered. */
  registered: number;
  /** Active members in total. */
  memberCount: number;
}

/**
 * The figures the camp dashboard shows.
 *
 * `totalParticipants` counts the leaders as well: they need a bed and a seat on
 * the minibus like everybody else. `availableSpots` is measured against the
 * scout places, which is what the maximum is set for.
 */
export interface CampDashboard {
  totalParticipants: number;
  registeredScouts: number;
  availableSpots: number;
  participatingPatrols: number;
  responsibleLeaders: number;
  /** Registered scouts as a percentage of the maximum. */
  fillRate: number;
}

export interface CampWithDetails {
  camp: Camp;
  leaders: CampLeader[];
  patrols: CampPatrol[];
  participants: Participant[];
  dashboard: CampDashboard;
  timeline: CampMilestone[];
  state: RegistrationState;
}

export async function getCamp(id: string, now: Date): Promise<CampWithDetails | null> {
  const camp = await store.findCamp(id);
  if (!camp) return null;

  const [users, patrols, scouts, counts] = await Promise.all([
    userStore.listUsers(),
    patrolStore.allPatrols(),
    scoutStore.allScouts(),
    scoutStore.activeScoutCounts(),
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const patrolById = new Map(patrols.map((patrol) => [patrol.id, patrol]));
  const scoutById = new Map(scouts.map((scout) => [scout.id, scout]));

  const leaders: CampLeader[] = camp.leaderIds
    .map((leaderId) => userById.get(leaderId))
    .filter((user): user is NonNullable<typeof user> => user !== undefined)
    .map((user) => ({ id: user.id, name: user.name, role: user.role, email: user.email }));

  const registeredByPatrol = new Map<string, number>();
  for (const entry of camp.registrations) {
    const patrolId = scoutById.get(entry.scoutId)?.patrolId;
    if (patrolId) registeredByPatrol.set(patrolId, (registeredByPatrol.get(patrolId) ?? 0) + 1);
  }

  const campPatrols: CampPatrol[] = camp.patrolIds
    .map((patrolId) => {
      const patrol = patrolById.get(patrolId);
      return {
        id: patrolId,
        name: patrol?.name ?? "Unknown patrol",
        archived: patrol?.archived ?? false,
        registered: registeredByPatrol.get(patrolId) ?? 0,
        memberCount: counts.byPatrol.get(patrolId) ?? 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const invited = new Set(camp.patrolIds);

  const participants: Participant[] = camp.registrations
    .map((entry) => {
      const scout = scoutById.get(entry.scoutId);
      if (!scout) return null;

      const patrol = scout.patrolId ? patrolById.get(scout.patrolId) : null;
      return {
        scout,
        registeredAt: entry.registeredAt,
        registeredByName: userById.get(entry.registeredBy)?.name ?? "Unknown",
        patrolName: patrol?.name ?? null,
        outsideInvitedPatrols:
          invited.size > 0 && (scout.patrolId === null || !invited.has(scout.patrolId)),
      };
    })
    .filter((entry): entry is Participant => entry !== null)
    .sort((a, b) => scoutFullName(a.scout).localeCompare(scoutFullName(b.scout)));

  const registeredScouts = camp.registrations.length;

  return {
    camp,
    leaders,
    patrols: campPatrols,
    participants,
    dashboard: {
      totalParticipants: registeredScouts + leaders.length,
      registeredScouts,
      availableSpots: placesLeft(camp),
      participatingPatrols: campPatrols.length,
      responsibleLeaders: leaders.length,
      fillRate:
        camp.maxParticipants === 0
          ? 0
          : Math.round((registeredScouts / camp.maxParticipants) * 1000) / 10,
    },
    timeline: campTimeline(camp, now),
    state: registrationState(camp, now),
  };
}

/** Scouts who could still be signed up, split by whether they were invited. */
export interface RegistrationCandidates {
  invited: Scout[];
  others: Scout[];
}

export async function registrationCandidates(id: string): Promise<RegistrationCandidates> {
  const camp = await store.findCamp(id);
  if (!camp) return { invited: [], others: [] };

  const scouts = await scoutStore.scoutsInScope([camp.troopId]);
  const registered = new Set(camp.registrations.map((entry) => entry.scoutId));

  const available = scouts
    .filter((scout) => !scout.archived && scout.status === "active")
    .filter((scout) => !registered.has(scout.id))
    .sort((a, b) => scoutFullName(a).localeCompare(scoutFullName(b)));

  if (camp.patrolIds.length === 0) return { invited: available, others: [] };

  const invitedPatrols = new Set(camp.patrolIds);
  return {
    invited: available.filter(
      (scout) => scout.patrolId !== null && invitedPatrols.has(scout.patrolId),
    ),
    others: available.filter(
      (scout) => scout.patrolId === null || !invitedPatrols.has(scout.patrolId),
    ),
  };
}

/** The main dashboard's list: camps still to come, soonest first. */
export async function upcomingCamps(
  scope: TroopScope,
  now: Date,
  limit: number,
): Promise<CampSummary[]> {
  const camps = await store.campsInScope(scope);
  const upcoming = camps
    .filter((camp) => isUpcoming(camp, now) && camp.status !== "planning")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);

  return summarise(upcoming);
}

/** The sidebar badge: camps still to come, drafts of the programme included. */
export async function countUpcomingCamps(scope: TroopScope, now: Date): Promise<number> {
  const camps = await store.campsInScope(scope);
  return camps.filter((camp) => isUpcoming(camp, now)).length;
}

/** Camps one scout is registered for, for their profile. */
export async function campsForScout(scoutId: string, now: Date): Promise<CampSummary[]> {
  const camps = await store.allCamps();
  const theirs = camps
    .filter((camp) => camp.registrations.some((entry) => entry.scoutId === scoutId))
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const summaries = await summarise(theirs);
  // Upcoming first, then the most recent past ones.
  return [
    ...summaries.filter((entry) => isUpcoming(entry.camp, now)),
    ...summaries.filter((entry) => !isUpcoming(entry.camp, now)),
  ];
}

/* -------------------------------- mutations ------------------------------- */

async function leadersInvalid(leaderIds: string[]): Promise<ServiceResult<never> | null> {
  if (leaderIds.length === 0) {
    return failure("A camp needs at least one leader responsible for it.", {
      leaderIds: "Choose at least one leader.",
    });
  }

  const users = await userStore.listUsers();
  const known = new Set(users.map((user) => user.id));

  for (const leaderId of leaderIds) {
    if (!known.has(leaderId)) return failure("One of those leaders no longer has an account.");
  }
  return null;
}

/**
 * A camp's troop and patrols have to agree: the chosen troop must exist, and
 * every invited patrol must belong to it. Leaders are exempt - a co-leader can
 * help run another troop's camp.
 */
async function troopPatrolMismatch(details: CampDetails): Promise<ServiceResult<never> | null> {
  if (!(await isTroopId(details.troopId))) {
    return failure("Choose a troop for this camp.", { troopId: "That troop could not be found." });
  }

  if (details.patrolIds.length === 0) return null;

  const patrols = await patrolStore.allPatrols();
  const byId = new Map(patrols.map((patrol) => [patrol.id, patrol]));

  for (const patrolId of details.patrolIds) {
    const patrol = byId.get(patrolId);
    if (!patrol) return failure("One of those patrols could not be found.");
    if (patrol.archived) return failure(`${patrol.name} Patrol is archived and cannot be invited.`);
    if (patrol.troopId !== details.troopId) {
      return failure("Every invited patrol must belong to the chosen troop.", {
        patrolIds: "Choose patrols from the selected troop.",
      });
    }
  }
  return null;
}

export async function addCamp(details: CampDetails): Promise<ServiceResult<Camp>> {
  const mismatch = await troopPatrolMismatch(details);
  if (mismatch) return mismatch;

  const badLeaders = await leadersInvalid(details.leaderIds);
  if (badLeaders) return badLeaders;

  return { ok: true, data: await store.createCamp(details) };
}

export async function editCamp(
  id: string,
  details: CampDetails,
): Promise<ServiceResult<Camp>> {
  const camp = await store.findCamp(id);
  if (!camp) return failure("That camp could not be found.");
  if (isClosed(camp.status)) {
    return failure("This camp is finished, so its details are a fixed record.");
  }

  const mismatch = await troopPatrolMismatch(details);
  if (mismatch) return mismatch;

  const badLeaders = await leadersInvalid(details.leaderIds);
  if (badLeaders) return badLeaders;

  // Shrinking below the number already signed up would leave a roster that
  // cannot be explained, so it is refused rather than silently allowed.
  if (details.maxParticipants < camp.registrations.length) {
    return failure(
      `${camp.registrations.length} scouts are already registered, so the maximum cannot be ${details.maxParticipants}.`,
      { maxParticipants: `Cannot be fewer than the ${camp.registrations.length} already signed up.` },
    );
  }

  const updated = await store.updateCamp(id, details);
  if (!updated) return failure("That camp could not be found.");

  return { ok: true, data: updated };
}

/* ------------------------------- registration ------------------------------ */

export async function registerScouts(
  id: string,
  scoutIds: string[],
  registeredBy: string,
): Promise<ServiceResult<{ added: number }>> {
  const camp = await store.findCamp(id);
  if (!camp) return failure("That camp could not be found.");
  if (isClosed(camp.status)) {
    return failure("This camp is finished, so the roster is fixed.");
  }
  if (scoutIds.length === 0) return failure("Choose at least one scout to register.");

  const scouts = await scoutStore.allScouts();
  const byId = new Map(scouts.map((scout) => [scout.id, scout]));

  for (const scoutId of scoutIds) {
    const scout = byId.get(scoutId);
    if (!scout) return failure("One of those scouts could not be found.");
    if (scout.archived) return failure(`${scoutFullName(scout)} is archived.`);
    if (scout.troopId !== camp.troopId) {
      return failure(`${scoutFullName(scout)} belongs to a different troop.`);
    }
  }

  const result = await store.addRegistrations(id, scoutIds, registeredBy);
  if (result === null) return failure("That camp could not be found.");

  if ("overBy" in result) {
    return failure(
      `That is ${result.overBy} more than there are places. Raise the maximum, or register fewer scouts.`,
    );
  }

  return { ok: true, data: { added: result.added } };
}

export async function removeScout(id: string, scoutId: string): Promise<ServiceResult> {
  const camp = await store.findCamp(id);
  if (!camp) return failure("That camp could not be found.");
  if (isClosed(camp.status)) {
    return failure("This camp is finished, so the roster is fixed.");
  }
  if (!camp.registrations.some((entry) => entry.scoutId === scoutId)) {
    return failure("That scout is not registered for this camp.");
  }

  const updated = await store.removeRegistration(id, scoutId);
  if (!updated) return failure("That camp could not be found.");

  return { ok: true, data: undefined };
}

/** Replaces the responsible leaders wholesale - the picker sends the full set. */
export async function setLeaders(
  id: string,
  leaderIds: string[],
): Promise<ServiceResult<Camp>> {
  const camp = await store.findCamp(id);
  if (!camp) return failure("That camp could not be found.");
  if (isClosed(camp.status)) {
    return failure("This camp is finished, so its record is fixed.");
  }

  const bad = await leadersInvalid(leaderIds);
  if (bad) return bad;

  const updated = await store.updateCamp(id, { leaderIds });
  if (!updated) return failure("That camp could not be found.");

  return { ok: true, data: updated };
}

/* ------------------------------- transitions ------------------------------ */

const refusals: Record<CampStatus, string> = {
  planning: "Only a cancelled camp can go back to planning.",
  "registration-open": "Registration can only be opened from planning, or reopened once closed.",
  "registration-closed": "Registration can only be closed while it is open.",
  ongoing: "Only a camp with registration closed can be marked as running.",
  completed: "Only a camp that is running can be marked as completed.",
  cancelled: "This camp has already run, so it cannot be cancelled.",
};

async function transition(
  id: string,
  to: CampStatus,
  extra: Partial<Camp> = {},
): Promise<ServiceResult<Camp>> {
  const camp = await store.findCamp(id);
  if (!camp) return failure("That camp could not be found.");

  if (camp.status === to) return failure("That camp is already in that state.");
  if (!canTransition(camp.status, to)) return failure(refusals[to]);

  const updated = await store.updateCamp(id, { status: to, ...extra });
  if (!updated) return failure("That camp could not be found.");

  return { ok: true, data: updated };
}

export async function openRegistration(id: string): Promise<ServiceResult<Camp>> {
  const camp = await store.findCamp(id);
  // Reopening keeps the original opening date: it says when the camp was first
  // announced, which is not the same as when a late place came free.
  const openedAt = camp?.registrationOpenedAt ?? new Date().toISOString();

  return transition(id, "registration-open", {
    registrationOpenedAt: openedAt,
    registrationClosedAt: null,
  });
}

export async function closeRegistration(id: string): Promise<ServiceResult<Camp>> {
  return transition(id, "registration-closed", {
    registrationClosedAt: new Date().toISOString(),
  });
}

export async function startCamp(id: string): Promise<ServiceResult<Camp>> {
  return transition(id, "ongoing");
}

export async function completeCamp(id: string): Promise<ServiceResult<Camp>> {
  return transition(id, "completed", { completedAt: new Date().toISOString() });
}

export async function cancelCamp(
  id: string,
  reason: string,
): Promise<ServiceResult<Camp>> {
  return transition(id, "cancelled", {
    cancellationReason: reason.trim().slice(0, 300),
    cancelledAt: new Date().toISOString(),
  });
}

/** Reinstating returns a cancelled camp to planning, not straight to open. */
export async function reinstateCamp(id: string): Promise<ServiceResult<Camp>> {
  return transition(id, "planning", {
    cancellationReason: "",
    cancelledAt: null,
    registrationOpenedAt: null,
    registrationClosedAt: null,
  });
}
