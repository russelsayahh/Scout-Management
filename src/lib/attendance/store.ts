import { randomUUID } from "node:crypto";

import * as activityStore from "@/lib/activities/store";
import type {
  AttendanceEntry,
  AttendanceEventKind,
  AttendanceMark,
  AttendanceRecord,
} from "@/lib/attendance/types";
import { createJsonStore } from "@/lib/json-store";
import * as scoutStore from "@/lib/scouts/store";

/**
 * Register repository - the only module that knows how attendance is persisted.
 *
 * Node-only.
 */

/* ---------------------------------- seed ---------------------------------- */

/** Stable non-negative hash, so the seeded registers never shift on a reseed. */
function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 1_000_003;
  }
  return total;
}

const EXCUSED_NOTES = [
  "Away with family.",
  "Exam revision.",
  "Unwell - parent called ahead.",
  "Clashed with a school fixture.",
];

const LATE_NOTES = ["Arrived about twenty minutes in.", "Held up after school."];

/**
 * A mark for one scout at one session.
 *
 * Most scouts turn up most of the time. A tenth of the register is given a
 * patchier pattern so the dashboard has genuinely low attenders to flag rather
 * than a uniform wall of green.
 */
function seededMark(scoutId: string, activityId: string): AttendanceMark {
  const drifting = hash(scoutId) % 10 === 0;
  const roll = hash(`${scoutId}:${activityId}`) % 100;

  if (drifting) {
    if (roll < 40) return "present";
    if (roll < 80) return "absent";
    if (roll < 92) return "excused";
    return "late";
  }

  if (roll < 80) return "present";
  if (roll < 88) return "absent";
  if (roll < 94) return "excused";
  return "late";
}

function seededNote(scoutId: string, activityId: string, mark: AttendanceMark): string {
  const roll = hash(`note:${scoutId}:${activityId}`);

  if (mark === "excused") return EXCUSED_NOTES[roll % EXCUSED_NOTES.length];
  // Only some late arrivals get a note; most are just marked and moved past.
  if (mark === "late" && roll % 3 === 0) return LATE_NOTES[roll % LATE_NOTES.length];
  return "";
}

type LegacyRecord = AttendanceRecord & { updatedBy?: string };

/** Registers written before `updatedBy` existed are read as never edited. */
function migrateRecord(record: AttendanceRecord): AttendanceRecord {
  const legacy = record as LegacyRecord;
  if (legacy.updatedBy !== undefined) return record;
  return { ...record, updatedBy: record.takenBy };
}

/**
 * Registers for every activity already marked as completed, so the statistics,
 * the history and the patrol panels have something real to read. Sample data in
 * the same sense as the scouts and the programme themselves.
 */
const store = createJsonStore<AttendanceRecord>(
  "attendance.json",
  async () => {
    const [activities, scouts] = await Promise.all([
      activityStore.allActivities(),
      scoutStore.allScouts(),
    ]);

    const eligible = scouts.filter((scout) => !scout.archived && scout.status === "active");

    return activities
      .filter((activity) => activity.status === "completed")
      .map((activity) => {
        const roster = eligible.filter(
          (scout) =>
            activity.patrolIds.length === 0 ||
            (scout.patrolId !== null && activity.patrolIds.includes(scout.patrolId)),
        );

        const entries: AttendanceEntry[] = roster.map((scout) => {
          const mark = seededMark(scout.id, activity.id);
          return {
            scoutId: scout.id,
            mark,
            note: seededNote(scout.id, activity.id, mark),
          };
        });

        // Taken at the end of the session, by the leader who ran it.
        const takenAt = `${activity.date}T${activity.endTime}:00.000Z`;

        return {
          id: `${activity.id}-register`,
          eventKind: "activity" as const,
          eventId: activity.id,
          entries,
          takenBy: activity.leaderId,
          takenAt,
          updatedBy: activity.leaderId,
          updatedAt: takenAt,
        };
      });
  },
  { migrate: migrateRecord },
);

/* --------------------------------- queries -------------------------------- */

export async function allRecords(): Promise<AttendanceRecord[]> {
  return store.all();
}

export async function findRecord(
  eventKind: AttendanceEventKind,
  eventId: string,
): Promise<AttendanceRecord | null> {
  const records = await store.all();
  return (
    records.find((record) => record.eventKind === eventKind && record.eventId === eventId) ??
    null
  );
}

/** Event ids that already have a register, for the "still to take" list. */
export async function recordedEventIds(eventKind: AttendanceEventKind): Promise<Set<string>> {
  const records = await store.all();
  return new Set(
    records.filter((record) => record.eventKind === eventKind).map((record) => record.eventId),
  );
}

/* -------------------------------- mutations ------------------------------- */

/**
 * Writes the register for one event, replacing any earlier one.
 *
 * Upsert rather than separate create and update calls: a register is the state
 * of one event, and taking it twice is editing it, not adding a second.
 */
export async function saveRecord(
  eventKind: AttendanceEventKind,
  eventId: string,
  entries: AttendanceEntry[],
  savedBy: string,
): Promise<AttendanceRecord> {
  return store.mutate((records) => {
    const now = new Date().toISOString();
    const index = records.findIndex(
      (record) => record.eventKind === eventKind && record.eventId === eventId,
    );

    if (index === -1) {
      const record: AttendanceRecord = {
        id: randomUUID(),
        eventKind,
        eventId,
        entries,
        takenBy: savedBy,
        takenAt: now,
        updatedBy: savedBy,
        updatedAt: now,
      };
      records.push(record);
      return record;
    }

    // takenBy and takenAt are kept: they say who took the register and when.
    // Correcting a mark afterwards is an edit, recorded separately.
    const updated: AttendanceRecord = {
      ...records[index],
      entries,
      updatedBy: savedBy,
      updatedAt: now,
    };
    records[index] = updated;
    return updated;
  });
}
