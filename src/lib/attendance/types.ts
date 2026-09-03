/**
 * A register: who turned up to one event.
 *
 * One record per event holding an entry per scout, rather than one row per
 * scout. That is how a register is actually taken - all at once, in one sitting
 * - so saving is a single write and a half-finished register cannot exist.
 */

export type AttendanceMark = "present" | "absent" | "excused" | "late";

export const ATTENDANCE_MARKS: readonly AttendanceMark[] = [
  "present",
  "absent",
  "excused",
  "late",
];

export const attendanceMarkLabels: Record<AttendanceMark, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
  late: "Late",
};

/** Short forms for the register's buttons, where space is tight on a phone. */
export const attendanceMarkShortLabels: Record<AttendanceMark, string> = {
  present: "Present",
  absent: "Absent",
  excused: "Excused",
  late: "Late",
};

export const attendanceMarkDescriptions: Record<AttendanceMark, string> = {
  present: "Turned up and took part.",
  absent: "Did not turn up and did not let anyone know.",
  excused: "Away for a reason given in advance.",
  late: "Turned up, but after the start.",
};

/**
 * Whether a mark means the scout was there.
 *
 * Late counts as attended: they came. The distinction is worth recording, but
 * it is not the same as missing the session.
 */
export function countsAsAttended(mark: AttendanceMark): boolean {
  return mark === "present" || mark === "late";
}

/**
 * What the register was taken for.
 *
 * Only activities exist so far. Camps are named here because a camp register is
 * the same shape and the Camps module is coming: when it lands it slots in
 * against this field rather than needing a second collection.
 */
export type AttendanceEventKind = "activity" | "camp";

export interface AttendanceEntry {
  scoutId: string;
  mark: AttendanceMark;
  /** Optional note, e.g. "left early for a dentist appointment". */
  note: string;
}

export interface AttendanceRecord {
  id: string;
  eventKind: AttendanceEventKind;
  eventId: string;
  entries: AttendanceEntry[];
  /** User id of the leader who took it. Never changes once set. */
  takenBy: string;
  takenAt: string;
  /**
   * Who last changed it. Separate from `takenBy` because correcting a mark
   * afterwards does not make you the person who took the register.
   */
  updatedBy: string;
  updatedAt: string;
}

export const NOTE_MAX = 200;

/* --------------------------------- tallies -------------------------------- */

export interface AttendanceTally {
  present: number;
  absent: number;
  excused: number;
  late: number;
  /** Entries counted, i.e. scouts on the register. */
  total: number;
  /** Present + late. */
  attended: number;
  /** Attended as a percentage of total, one decimal place. Null when empty. */
  rate: number | null;
}

export function emptyTally(): AttendanceTally {
  return { present: 0, absent: 0, excused: 0, late: 0, total: 0, attended: 0, rate: null };
}

/** Adds one mark to a tally in place, keeping the derived figures correct. */
export function addMark(tally: AttendanceTally, mark: AttendanceMark): void {
  tally[mark] += 1;
  tally.total += 1;
  if (countsAsAttended(mark)) tally.attended += 1;
  tally.rate = tally.total === 0 ? null : Math.round((tally.attended / tally.total) * 1000) / 10;
}

export function tallyOf(marks: AttendanceMark[]): AttendanceTally {
  const tally = emptyTally();
  for (const mark of marks) addMark(tally, mark);
  return tally;
}

/** The group's target turnout, used by the meters and the flag below. */
export const ATTENDANCE_TARGET = 85;

/**
 * Worth a leader's attention: a scout who has missed enough to be drifting
 * away. Judged over a minimum number of sessions so one bad week is not a flag.
 */
export const FLAG_THRESHOLD = 60;
export const FLAG_MIN_SESSIONS = 3;

export function isFlagged(tally: AttendanceTally): boolean {
  return (
    tally.total >= FLAG_MIN_SESSIONS && tally.rate !== null && tally.rate < FLAG_THRESHOLD
  );
}
