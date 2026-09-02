import * as activityStore from "@/lib/activities/store";
import { activityStartsAt, type Activity } from "@/lib/activities/types";
import * as store from "@/lib/attendance/store";
import {
  ATTENDANCE_MARKS,
  NOTE_MAX,
  addMark,
  emptyTally,
  isFlagged,
  type AttendanceEntry,
  type AttendanceMark,
  type AttendanceRecord,
  type AttendanceTally,
} from "@/lib/attendance/types";
import * as userStore from "@/lib/auth/store";
import * as patrolStore from "@/lib/patrols/store";
import * as scoutStore from "@/lib/scouts/store";
import { scoutFullName, type Scout } from "@/lib/scouts/types";

/**
 * Attendance rules, and everything that spans registers, activities, scouts and
 * patrols.
 *
 * Two decisions live here:
 *
 * - **A register can only be taken once the event has started.** Marking a
 *   scout present at next month's hike would be a guess, not a record.
 * - **The roster is the union of who is eligible now and who was on the
 *   register when it was taken.** A scout who has since left or moved patrol
 *   keeps their mark, because deleting it would rewrite what happened.
 *
 * Node-only.
 */

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function failure(message: string): ServiceResult<never> {
  return { ok: false, message };
}

/* ------------------------------- eligibility ------------------------------ */

/** Why a register cannot be taken, or `ready` when it can. */
export type RegisterAvailability = "ready" | "not-started" | "draft" | "cancelled";

export function registerAvailability(activity: Activity, now: Date): RegisterAvailability {
  if (activity.status === "draft") return "draft";
  if (activity.status === "cancelled") return "cancelled";
  if (activityStartsAt(activity).getTime() > now.getTime()) return "not-started";
  return "ready";
}

export const availabilityMessages: Record<Exclude<RegisterAvailability, "ready">, string> = {
  "not-started": "This has not started yet, so there is nobody to mark.",
  draft: "Publish this activity before taking a register for it.",
  cancelled: "This activity was cancelled, so no register is taken.",
};

/* --------------------------------- roster --------------------------------- */

export interface RosterScout {
  scout: Scout;
  /** The saved mark, or null when this scout has not been marked yet. */
  mark: AttendanceMark | null;
  note: string;
  /**
   * On the register only because they were marked when it was taken - they have
   * since left the section or moved patrol.
   */
  carriedOver: boolean;
}

export interface RosterGroup {
  /** Patrol id, or null for scouts in no patrol. */
  patrolId: string | null;
  name: string;
  scouts: RosterScout[];
}

export interface Register {
  activity: Activity;
  leaderName: string;
  groups: RosterGroup[];
  total: number;
  record: AttendanceRecord | null;
  takenByName: string | null;
  /** Who last corrected it, when that is somebody other than the taker. */
  updatedByName: string | null;
  availability: RegisterAvailability;
}

/** Active scouts an activity is aimed at: its patrols, or the whole troop. */
function eligibleFor(activity: Activity, scouts: Scout[]): Scout[] {
  return scouts.filter((scout) => {
    if (scout.archived || scout.status !== "active") return false;
    if (activity.patrolIds.length === 0) return true;
    return scout.patrolId !== null && activity.patrolIds.includes(scout.patrolId);
  });
}

/**
 * Groups the roster by patrol, which is what makes "mark the whole patrol"
 * possible - and is how a leader reads a hall full of scouts anyway.
 */
function groupByPatrol(
  entries: RosterScout[],
  patrolNames: Map<string, string>,
): RosterGroup[] {
  const groups = new Map<string, RosterGroup>();

  for (const entry of entries) {
    const patrolId = entry.scout.patrolId;
    const key = patrolId ?? "";

    let group = groups.get(key);
    if (!group) {
      group = {
        patrolId,
        name: patrolId ? (patrolNames.get(patrolId) ?? "Unknown patrol") : "No patrol",
        scouts: [],
      };
      groups.set(key, group);
    }
    group.scouts.push(entry);
  }

  for (const group of groups.values()) {
    group.scouts.sort((a, b) => scoutFullName(a.scout).localeCompare(scoutFullName(b.scout)));
  }

  // Named patrols first, alphabetically; scouts with no patrol last.
  return [...groups.values()].sort((a, b) => {
    if (a.patrolId === null) return 1;
    if (b.patrolId === null) return -1;
    return a.name.localeCompare(b.name);
  });
}

export async function getRegister(activityId: string, now: Date): Promise<Register | null> {
  const activity = await activityStore.findActivity(activityId);
  if (!activity) return null;

  const [scouts, patrols, record] = await Promise.all([
    scoutStore.allScouts(),
    patrolStore.allPatrols(),
    store.findRecord("activity", activityId),
  ]);

  const patrolNames = new Map(patrols.map((patrol) => [patrol.id, patrol.name]));
  const marks = new Map((record?.entries ?? []).map((entry) => [entry.scoutId, entry]));

  const eligible = eligibleFor(activity, scouts);
  const eligibleIds = new Set(eligible.map((scout) => scout.id));

  const roster: RosterScout[] = eligible.map((scout) => {
    const entry = marks.get(scout.id);
    return {
      scout,
      mark: entry?.mark ?? null,
      note: entry?.note ?? "",
      carriedOver: false,
    };
  });

  // Anyone marked at the time who no longer qualifies keeps their place.
  for (const entry of record?.entries ?? []) {
    if (eligibleIds.has(entry.scoutId)) continue;
    const scout = scouts.find((candidate) => candidate.id === entry.scoutId);
    if (!scout) continue;
    roster.push({ scout, mark: entry.mark, note: entry.note, carriedOver: true });
  }

  const leader = await userStore.findById(activity.leaderId);
  const takenBy = record ? await userStore.findById(record.takenBy) : null;
  const updatedBy =
    record && record.updatedBy !== record.takenBy
      ? await userStore.findById(record.updatedBy)
      : null;

  return {
    activity,
    leaderName: leader?.name ?? "Unassigned",
    groups: groupByPatrol(roster, patrolNames),
    total: roster.length,
    record,
    takenByName: takenBy?.name ?? null,
    updatedByName: updatedBy?.name ?? null,
    availability: registerAvailability(activity, now),
  };
}

/* -------------------------------- saving ---------------------------------- */

export async function saveRegister(
  activityId: string,
  entries: AttendanceEntry[],
  savedBy: string,
  now: Date,
): Promise<ServiceResult<AttendanceRecord>> {
  const activity = await activityStore.findActivity(activityId);
  if (!activity) return failure("That activity could not be found.");

  const availability = registerAvailability(activity, now);
  if (availability !== "ready") return failure(availabilityMessages[availability]);

  if (entries.length === 0) return failure("Mark at least one scout before saving.");

  const scouts = await scoutStore.allScouts();
  const byId = new Map(scouts.map((scout) => [scout.id, scout]));

  const seen = new Set<string>();
  const clean: AttendanceEntry[] = [];

  for (const entry of entries) {
    if (!byId.has(entry.scoutId)) return failure("One of those scouts could not be found.");
    if (seen.has(entry.scoutId)) return failure("A scout was marked twice.");
    if (!ATTENDANCE_MARKS.includes(entry.mark)) return failure("That is not a valid mark.");

    seen.add(entry.scoutId);
    clean.push({
      scoutId: entry.scoutId,
      mark: entry.mark,
      note: entry.note.trim().slice(0, NOTE_MAX),
    });
  }

  const saved = await store.saveRecord("activity", activityId, clean, savedBy);
  return { ok: true, data: saved };
}

/* ------------------------------- statistics ------------------------------- */

/** One session in a scout's history. */
export interface ScoutAttendanceSession {
  activityId: string;
  activityName: string;
  date: string;
  startTime: string;
  mark: AttendanceMark;
  note: string;
}

export interface ScoutAttendance {
  tally: AttendanceTally;
  /** Most recent first. */
  history: ScoutAttendanceSession[];
  flagged: boolean;
}

export async function scoutAttendance(scoutId: string): Promise<ScoutAttendance> {
  const [records, activities] = await Promise.all([
    store.allRecords(),
    activityStore.allActivities(),
  ]);

  const byId = new Map(activities.map((activity) => [activity.id, activity]));
  const tally = emptyTally();
  const history: ScoutAttendanceSession[] = [];

  for (const record of records) {
    const entry = record.entries.find((candidate) => candidate.scoutId === scoutId);
    if (!entry) continue;

    const activity = byId.get(record.eventId);
    if (!activity) continue;

    addMark(tally, entry.mark);
    history.push({
      activityId: activity.id,
      activityName: activity.name,
      date: activity.date,
      startTime: activity.startTime,
      mark: entry.mark,
      note: entry.note,
    });
  }

  history.sort(
    (a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
  );

  return { tally, history, flagged: isFlagged(tally) };
}

export interface PatrolAttendance {
  tally: AttendanceTally;
  /** Registers that included at least one of this patrol's members. */
  sessionsHeld: number;
  /** Typical number present, rounded. */
  averagePresent: number;
  /** Rate per session, oldest first, most recent 8. */
  trend: number[];
}

/**
 * A patrol's attendance, read from the registers themselves.
 *
 * Membership is current, not historical: a scout who has moved patrol brings
 * their record with them. That is the honest reading of "how is this patrol
 * doing" - it is the group of people in it now.
 */
export async function patrolAttendance(patrolId: string): Promise<PatrolAttendance> {
  const [records, activities, members] = await Promise.all([
    store.allRecords(),
    activityStore.allActivities(),
    scoutStore.scoutsInPatrol(patrolId),
  ]);

  const memberIds = new Set(members.map((scout) => scout.id));
  const byId = new Map(activities.map((activity) => [activity.id, activity]));

  const tally = emptyTally();
  const sessions: { date: string; startTime: string; rate: number; present: number }[] = [];

  for (const record of records) {
    const activity = byId.get(record.eventId);
    if (!activity) continue;

    const sessionTally = emptyTally();
    for (const entry of record.entries) {
      if (!memberIds.has(entry.scoutId)) continue;
      addMark(sessionTally, entry.mark);
      addMark(tally, entry.mark);
    }

    if (sessionTally.total === 0) continue;
    sessions.push({
      date: activity.date,
      startTime: activity.startTime,
      rate: sessionTally.rate ?? 0,
      present: sessionTally.attended,
    });
  }

  sessions.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const averagePresent =
    sessions.length === 0
      ? 0
      : Math.round(sessions.reduce((sum, session) => sum + session.present, 0) / sessions.length);

  return {
    tally,
    sessionsHeld: sessions.length,
    averagePresent,
    trend: sessions.slice(-8).map((session) => session.rate),
  };
}

/* -------------------------------- dashboard ------------------------------- */

export interface OutstandingRegister {
  activity: Activity;
  /** Scouts who would be on it. */
  expected: number;
}

export interface TakenRegister {
  activity: Activity;
  tally: AttendanceTally;
  takenAt: string;
  takenByName: string;
}

export interface PatrolAttendanceRow {
  id: string;
  name: string;
  tally: AttendanceTally;
}

export interface FlaggedScout {
  scout: Scout;
  tally: AttendanceTally;
  patrolName: string | null;
}

export interface AttendanceOverview {
  /** Across every register taken. */
  tally: AttendanceTally;
  registersTaken: number;
  /** Sessions that have happened and still need a register. */
  outstanding: OutstandingRegister[];
  recent: TakenRegister[];
  byPatrol: PatrolAttendanceRow[];
  flagged: FlaggedScout[];
  /** Rate per session, oldest first, most recent 10. */
  trend: { date: string; name: string; rate: number }[];
}

export async function attendanceOverview(now: Date): Promise<AttendanceOverview> {
  const [records, activities, scouts, patrols, users] = await Promise.all([
    store.allRecords(),
    activityStore.allActivities(),
    scoutStore.allScouts(),
    patrolStore.allPatrols(),
    userStore.listUsers(),
  ]);

  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  const scoutById = new Map(scouts.map((scout) => [scout.id, scout]));
  const userNames = new Map(users.map((user) => [user.id, user.name]));
  const patrolNames = new Map(patrols.map((patrol) => [patrol.id, patrol.name]));
  const recorded = new Set(records.map((record) => record.eventId));

  const tally = emptyTally();
  const perScout = new Map<string, AttendanceTally>();
  const perPatrol = new Map<string, AttendanceTally>();
  const taken: TakenRegister[] = [];

  for (const record of records) {
    const activity = activityById.get(record.eventId);
    if (!activity) continue;

    const sessionTally = emptyTally();

    for (const entry of record.entries) {
      addMark(tally, entry.mark);
      addMark(sessionTally, entry.mark);

      let scoutTally = perScout.get(entry.scoutId);
      if (!scoutTally) {
        scoutTally = emptyTally();
        perScout.set(entry.scoutId, scoutTally);
      }
      addMark(scoutTally, entry.mark);

      // Attributed to where the scout is now, matching `patrolAttendance`.
      const patrolId = scoutById.get(entry.scoutId)?.patrolId;
      if (patrolId) {
        let patrolTally = perPatrol.get(patrolId);
        if (!patrolTally) {
          patrolTally = emptyTally();
          perPatrol.set(patrolId, patrolTally);
        }
        addMark(patrolTally, entry.mark);
      }
    }

    taken.push({
      activity,
      tally: sessionTally,
      takenAt: record.takenAt,
      takenByName: userNames.get(record.takenBy) ?? "Unknown",
    });
  }

  // Newest session first for the recent list; oldest first for the trend.
  taken.sort(
    (a, b) =>
      b.activity.date.localeCompare(a.activity.date) ||
      b.activity.startTime.localeCompare(a.activity.startTime),
  );

  const trend = [...taken]
    .reverse()
    .slice(-10)
    .map((entry) => ({
      date: entry.activity.date,
      name: entry.activity.name,
      rate: entry.tally.rate ?? 0,
    }));

  // Sessions that have happened but have no register yet.
  const outstanding: OutstandingRegister[] = activities
    .filter(
      (activity) =>
        registerAvailability(activity, now) === "ready" && !recorded.has(activity.id),
    )
    .map((activity) => ({
      activity,
      expected: eligibleFor(activity, scouts).length,
    }))
    .sort(
      (a, b) =>
        b.activity.date.localeCompare(a.activity.date) ||
        b.activity.startTime.localeCompare(a.activity.startTime),
    );

  const byPatrol: PatrolAttendanceRow[] = patrols
    .filter((patrol) => !patrol.archived)
    .map((patrol) => ({
      id: patrol.id,
      name: patrol.name,
      tally: perPatrol.get(patrol.id) ?? emptyTally(),
    }))
    .filter((row) => row.tally.total > 0)
    .sort((a, b) => (b.tally.rate ?? 0) - (a.tally.rate ?? 0));

  const flagged: FlaggedScout[] = [...perScout.entries()]
    .filter(([, scoutTally]) => isFlagged(scoutTally))
    .map(([scoutId, scoutTally]) => {
      const scout = scoutById.get(scoutId);
      return scout
        ? {
            scout,
            tally: scoutTally,
            patrolName: scout.patrolId ? (patrolNames.get(scout.patrolId) ?? null) : null,
          }
        : null;
    })
    .filter((row): row is FlaggedScout => row !== null && !row.scout.archived)
    .sort((a, b) => (a.tally.rate ?? 0) - (b.tally.rate ?? 0));

  return {
    tally,
    registersTaken: taken.length,
    outstanding,
    recent: taken.slice(0, 6),
    byPatrol,
    flagged,
    trend,
  };
}

/** The sidebar badge: sessions that have happened and still need a register. */
export async function countOutstandingRegisters(now: Date): Promise<number> {
  const [activities, recorded] = await Promise.all([
    activityStore.allActivities(),
    store.recordedEventIds("activity"),
  ]);

  return activities.filter(
    (activity) => registerAvailability(activity, now) === "ready" && !recorded.has(activity.id),
  ).length;
}

/** Tally for one activity, for the summary on its own page. */
export async function activityAttendance(
  activityId: string,
): Promise<{ tally: AttendanceTally; takenAt: string } | null> {
  const record = await store.findRecord("activity", activityId);
  if (!record) return null;

  const tally = emptyTally();
  for (const entry of record.entries) addMark(tally, entry.mark);

  return { tally, takenAt: record.takenAt };
}
