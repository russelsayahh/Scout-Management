import {
  applyActivityQuery,
  filterActivities,
  sortActivities,
  type ActivityContext,
  type ActivityPage,
  type ActivityQuery,
} from "@/lib/activities/query";
import * as store from "@/lib/activities/store";
import {
  activityStartsAt,
  canTransition,
  hasFinished,
  type Activity,
  type ActivityDetails,
  type ActivityStatus,
} from "@/lib/activities/types";
import * as userStore from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";
import * as patrolStore from "@/lib/patrols/store";
import * as scoutStore from "@/lib/scouts/store";
import type { FieldErrors } from "@/lib/validation";

/**
 * Activity rules, including everything that spans activities, patrols, scouts
 * and user accounts.
 *
 * Two decisions live here rather than in the UI:
 *
 * - **Drafts are private to the leaders who manage the programme.** That is
 *   what makes "Draft" mean something, so it is enforced at the query rather
 *   than by hiding a row.
 * - **Status moves through named transitions**, never by assignment, so an
 *   activity cannot jump from cancelled straight back onto the calendar.
 *
 * Node-only.
 */

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

function failure(message: string, fieldErrors?: FieldErrors): ServiceResult<never> {
  return { ok: false, message, fieldErrors };
}

/* --------------------------------- context -------------------------------- */

/**
 * Resolves the names the pure query layer needs.
 *
 * `now` is passed in by the caller so one request cannot disagree with itself
 * about where the line between upcoming and past falls.
 */
export async function activityContext(now: Date): Promise<ActivityContext> {
  const [users, patrols] = await Promise.all([userStore.listUsers(), patrolStore.allPatrols()]);

  return {
    leaderNames: new Map(users.map((user) => [user.id, user.name])),
    patrolNames: new Map(patrols.map((patrol) => [patrol.id, patrol.name])),
    now,
  };
}

/** Leaders who can be made responsible for an activity - every user account. */
export async function leaderOptions(): Promise<{ id: string; name: string; role: Role }[]> {
  const users = await userStore.listUsers();
  return users.map((user) => ({ id: user.id, name: user.name, role: user.role }));
}

export interface PatrolChoice {
  id: string;
  name: string;
  /** Active scouts currently in the patrol, for the running head count. */
  memberCount: number;
}

/** Patrols offered in the participation picker and filter, archived ones excluded. */
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

/** Active scouts on the register: the head count for a whole-troop activity. */
export async function troopSize(): Promise<number> {
  return (await scoutStore.activeScoutCounts()).total;
}

/* --------------------------------- queries -------------------------------- */

export async function listActivities(
  query: ActivityQuery,
  context: ActivityContext,
  includeDrafts: boolean,
): Promise<ActivityPage> {
  return applyActivityQuery(await store.allActivities(), query, context, { includeDrafts });
}

/** Everything in the calendar's month, filtered but neither sorted nor paged. */
export async function activitiesForCalendar(
  query: ActivityQuery,
  context: ActivityContext,
  includeDrafts: boolean,
): Promise<Activity[]> {
  return filterActivities(await store.allActivities(), query, context, {
    includeDrafts,
    ignorePeriod: true,
  });
}

/** A patrol taking part, with enough detail to render it honestly. */
export interface ParticipatingPatrol {
  id: string;
  name: string;
  memberCount: number;
  archived: boolean;
}

/**
 * Who the activity is for, and whether that fits.
 *
 * The expected head count is derived from the register rather than recorded,
 * because there is no sign-up module yet: it is the number of active scouts in
 * the participating patrols, or in the whole troop when no patrol is named.
 */
export interface ActivityAudience {
  wholeTroop: boolean;
  patrols: ParticipatingPatrol[];
  expected: number;
  capacity: number | null;
  /** Places left, or null when the activity is uncapped. */
  remaining: number | null;
  overCapacity: boolean;
}

/**
 * How many active scouts an activity is aimed at: the members of the patrols
 * taking part, or the whole troop when none is named.
 */
function expectedFor(activity: Activity, counts: scoutStore.ActiveScoutCounts): number {
  if (activity.patrolIds.length === 0) return counts.total;
  return activity.patrolIds.reduce(
    (sum, id) => sum + (counts.byPatrol.get(id) ?? 0),
    0,
  );
}

/**
 * Expected numbers for a whole list in one pass, so the table does not query
 * the register once per row.
 */
export async function expectedAttendance(
  activities: Activity[],
): Promise<Record<string, number>> {
  const counts = await scoutStore.activeScoutCounts();

  const expected: Record<string, number> = {};
  for (const activity of activities) expected[activity.id] = expectedFor(activity, counts);
  return expected;
}

async function buildAudience(activity: Activity): Promise<ActivityAudience> {
  const [patrols, counts] = await Promise.all([
    patrolStore.allPatrols(),
    scoutStore.activeScoutCounts(),
  ]);

  const byId = new Map(patrols.map((patrol) => [patrol.id, patrol]));

  const participating: ParticipatingPatrol[] = activity.patrolIds.map((id) => {
    const patrol = byId.get(id);
    return {
      id,
      name: patrol?.name ?? "Unknown patrol",
      memberCount: counts.byPatrol.get(id) ?? 0,
      archived: patrol?.archived ?? false,
    };
  });
  participating.sort((a, b) => a.name.localeCompare(b.name));

  const wholeTroop = participating.length === 0;
  const expected = expectedFor(activity, counts);

  const capacity = activity.capacity;

  return {
    wholeTroop,
    patrols: participating,
    expected,
    capacity,
    remaining: capacity === null ? null : capacity - expected,
    overCapacity: capacity !== null && expected > capacity,
  };
}

export interface ActivityWithDetails {
  activity: Activity;
  leaderName: string;
  audience: ActivityAudience;
  /** True for a published activity whose end time has passed. */
  awaitingCompletion: boolean;
}

export async function getActivity(
  id: string,
  now: Date,
): Promise<ActivityWithDetails | null> {
  const activity = await store.findActivity(id);
  if (!activity) return null;

  const [leader, audience] = await Promise.all([
    userStore.findById(activity.leaderId),
    buildAudience(activity),
  ]);

  return {
    activity,
    leaderName: leader?.name ?? "Unassigned",
    audience,
    awaitingCompletion: activity.status === "published" && hasFinished(activity, now),
  };
}

export interface ActivityCounts {
  total: number;
  /** Every activity, by status. */
  byStatus: Record<ActivityStatus, number>;
  /**
   * Still to come, by status. Split this way so the figures on the page can be
   * reconciled: the header badges add up to the number of rows the default
   * filter shows, rather than counting subtly different things.
   */
  upcomingByStatus: Record<ActivityStatus, number>;
  upcoming: number;
}

function emptyStatusCounts(): Record<ActivityStatus, number> {
  return { draft: 0, published: 0, completed: 0, cancelled: 0 };
}

export async function activityCounts(now: Date): Promise<ActivityCounts> {
  const activities = await store.allActivities();

  const byStatus = emptyStatusCounts();
  const upcomingByStatus = emptyStatusCounts();
  let upcoming = 0;

  for (const activity of activities) {
    byStatus[activity.status] += 1;

    if (activityStartsAt(activity).getTime() >= now.getTime()) {
      upcomingByStatus[activity.status] += 1;
      upcoming += 1;
    }
  }

  return { total: activities.length, byStatus, upcomingByStatus, upcoming };
}

/**
 * The dashboard's list. Published only - a draft is not something to announce,
 * and a cancelled activity is not something to turn up to.
 */
export async function upcomingActivities(now: Date, limit: number): Promise<Activity[]> {
  const activities = await store.allActivities();

  const upcoming = activities.filter(
    (activity) =>
      activity.status === "published" &&
      activityStartsAt(activity).getTime() >= now.getTime(),
  );

  return sortActivities(upcoming, "date", "asc").slice(0, limit);
}

/** The sidebar badge: published activities still to come. */
export async function countUpcomingActivities(now: Date): Promise<number> {
  const activities = await store.allActivities();
  return activities.filter(
    (activity) =>
      activity.status === "published" &&
      activityStartsAt(activity).getTime() >= now.getTime(),
  ).length;
}

/**
 * A patrol's recent programme, for its detail page: what it took part in,
 * newest first. Whole-troop activities count - the patrol was there too.
 */
export async function recentActivitiesForPatrol(
  patrolId: string,
  now: Date,
  limit: number,
): Promise<Activity[]> {
  const activities = await store.allActivities();

  const relevant = activities.filter((activity) => {
    if (activity.status !== "completed") return false;
    if (activityStartsAt(activity).getTime() > now.getTime()) return false;
    return activity.patrolIds.length === 0 || activity.patrolIds.includes(patrolId);
  });

  return sortActivities(relevant, "date", "desc").slice(0, limit);
}

/* -------------------------------- mutations ------------------------------- */

/** Rejects a leader id that does not belong to a real account. */
async function leaderMissing(leaderId: string): Promise<ServiceResult<never> | null> {
  const leader = await userStore.findById(leaderId);
  if (leader) return null;
  return failure("That leader no longer has an account.", {
    leaderId: "Choose a leader with an account on the system.",
  });
}

/** Rejects patrol ids that do not exist, or that have been archived. */
async function patrolsInvalid(patrolIds: string[]): Promise<ServiceResult<never> | null> {
  if (patrolIds.length === 0) return null;

  const patrols = await patrolStore.allPatrols();
  const byId = new Map(patrols.map((patrol) => [patrol.id, patrol]));

  for (const id of patrolIds) {
    const patrol = byId.get(id);
    if (!patrol) return failure("One of those patrols could not be found.");
    if (patrol.archived) {
      return failure(`${patrol.name} Patrol is archived and cannot take part.`);
    }
  }

  return null;
}

export async function addActivity(
  details: ActivityDetails,
  status: Extract<ActivityStatus, "draft" | "published">,
): Promise<ServiceResult<Activity>> {
  const badLeader = await leaderMissing(details.leaderId);
  if (badLeader) return badLeader;

  const badPatrols = await patrolsInvalid(details.patrolIds);
  if (badPatrols) return badPatrols;

  return { ok: true, data: await store.createActivity(details, status) };
}

/**
 * Edits the details only. Status is left alone - it belongs to the transitions
 * below, so saving a change to the location cannot quietly republish something.
 */
export async function editActivity(
  id: string,
  details: ActivityDetails,
): Promise<ServiceResult<Activity>> {
  const existing = await store.findActivity(id);
  if (!existing) return failure("That activity could not be found.");

  const badLeader = await leaderMissing(details.leaderId);
  if (badLeader) return badLeader;

  const badPatrols = await patrolsInvalid(details.patrolIds);
  if (badPatrols) return badPatrols;

  const updated = await store.updateActivity(id, details);
  if (!updated) return failure("That activity could not be found.");

  return { ok: true, data: updated };
}

/* ------------------------------- transitions ------------------------------ */

const transitionRefusals: Record<ActivityStatus, string> = {
  draft: "Only a cancelled activity can go back to draft.",
  published: "Only a draft can be published.",
  completed: "Only a published activity can be marked as completed.",
  cancelled: "This activity has already run, so it cannot be cancelled.",
};

async function transition(
  id: string,
  to: ActivityStatus,
  extra: Partial<Activity> = {},
): Promise<ServiceResult<Activity>> {
  const activity = await store.findActivity(id);
  if (!activity) return failure("That activity could not be found.");

  if (activity.status === to) {
    return failure("That activity is already in that state.");
  }
  if (!canTransition(activity.status, to)) {
    return failure(transitionRefusals[to]);
  }

  const updated = await store.updateActivity(id, { status: to, ...extra });
  if (!updated) return failure("That activity could not be found.");

  return { ok: true, data: updated };
}

export async function publishActivity(id: string): Promise<ServiceResult<Activity>> {
  return transition(id, "published");
}

/**
 * Completing is only offered once the activity has actually finished. Marking
 * next month's hike as completed would be nonsense, and it would put a
 * completed activity in the "still to come" figures.
 */
export async function completeActivity(
  id: string,
  now: Date,
): Promise<ServiceResult<Activity>> {
  const activity = await store.findActivity(id);
  if (!activity) return failure("That activity could not be found.");

  if (!hasFinished(activity, now)) {
    return failure("This has not happened yet, so it cannot be marked as completed.");
  }

  return transition(id, "completed");
}

export async function cancelActivity(
  id: string,
  reason: string,
): Promise<ServiceResult<Activity>> {
  return transition(id, "cancelled", {
    cancellationReason: reason.trim().slice(0, 300),
    cancelledAt: new Date().toISOString(),
  });
}

/**
 * Reinstating returns a cancelled activity to draft rather than straight to
 * published, so somebody has to decide to announce it again.
 */
export async function reinstateActivity(id: string): Promise<ServiceResult<Activity>> {
  return transition(id, "draft", { cancellationReason: "", cancelledAt: null });
}
