/**
 * An activity is one entry in the troop's programme: a meeting, a day out, a
 * skills session or a competition.
 *
 * Times are stored as a plain ISO day plus two 24-hour clock times rather than
 * as timestamps. A troop night is "Tuesday at 19:00" wherever you read it, and
 * pinning both halves to UTC at render keeps the server and the browser from
 * ever disagreeing about which day something falls on.
 */

/* --------------------------------- status --------------------------------- */

export type ActivityStatus = "draft" | "published" | "completed" | "cancelled";

export const ACTIVITY_STATUSES: readonly ActivityStatus[] = [
  "draft",
  "published",
  "completed",
  "cancelled",
];

export const activityStatusLabels: Record<ActivityStatus, string> = {
  draft: "Draft",
  published: "Published",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const activityStatusDescriptions: Record<ActivityStatus, string> = {
  draft: "Being planned. Only leaders who manage the programme can see it.",
  published: "Announced to the group and on the calendar.",
  completed: "It has run. Kept on the programme as a record.",
  cancelled: "Called off. The record is kept so everyone can see why.",
};

/* ---------------------------------- type ---------------------------------- */

export type ActivityType =
  | "meeting"
  | "outdoor"
  | "skills"
  | "service"
  | "competition"
  | "training"
  | "social";

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  "meeting",
  "outdoor",
  "skills",
  "service",
  "competition",
  "training",
  "social",
];

export const activityTypeLabels: Record<ActivityType, string> = {
  meeting: "Troop meeting",
  outdoor: "Outdoor activity",
  skills: "Skills session",
  service: "Community service",
  competition: "Competition",
  training: "Training",
  social: "Social",
};

export const activityTypeDescriptions: Record<ActivityType, string> = {
  meeting: "The regular weekly night at the hut.",
  outdoor: "Hikes, water activities, climbing and anything off site.",
  skills: "Working towards a badge or a specific skill.",
  service: "Giving time to the local community.",
  competition: "Inter-patrol or district competitions.",
  training: "Leader or young-leader training.",
  social: "Games nights, socials and celebrations.",
};

/* --------------------------------- record --------------------------------- */

export interface Activity {
  id: string;

  name: string;
  description: string;

  /** ISO day, e.g. "2026-09-15". */
  date: string;
  /** 24-hour clock, "HH:MM". */
  startTime: string;
  endTime: string;

  location: string;
  type: ActivityType;

  /** User account of the leader responsible for running it. */
  leaderId: string;

  /** The troop this activity belongs to. Every activity has exactly one. */
  troopId: string;

  /**
   * Patrols taking part. An empty list means the whole troop is invited -
   * which is the common case, so it is the default rather than a special flag.
   * Always patrols of `troopId` - `activities/service.ts` enforces that on
   * every write.
   */
  patrolIds: string[];

  /** Maximum places. Null when the activity is not capped. */
  capacity: number | null;

  status: ActivityStatus;
  /** Recorded when cancelled, so the reason survives on the programme. */
  cancellationReason: string;
  cancelledAt: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * The editable half of an activity - what the create and edit forms produce.
 *
 * `status` is deliberately absent: it moves through publish, complete and
 * cancel, each of which is its own decision with its own rules, rather than
 * through a dropdown that would let any state become any other.
 */
export type ActivityDetails = Omit<
  Activity,
  | "id"
  | "status"
  | "cancellationReason"
  | "cancelledAt"
  | "createdAt"
  | "updatedAt"
>;

/* --------------------------------- timing --------------------------------- */

/**
 * The start of an activity as an instant, read in UTC.
 *
 * Every date in this app is formatted with a pinned locale and UTC, so parsing
 * the same way keeps "which day is this on" consistent everywhere.
 */
export function activityStartsAt(activity: Pick<Activity, "date" | "startTime">): Date {
  return new Date(`${activity.date}T${activity.startTime}:00.000Z`);
}

export function activityEndsAt(activity: Pick<Activity, "date" | "endTime">): Date {
  return new Date(`${activity.date}T${activity.endTime}:00.000Z`);
}

/** True once the activity's end time has passed. */
export function hasFinished(
  activity: Pick<Activity, "date" | "endTime">,
  now: Date,
): boolean {
  return activityEndsAt(activity).getTime() < now.getTime();
}

/** True when the activity has not started yet. */
export function isUpcoming(
  activity: Pick<Activity, "date" | "startTime">,
  now: Date,
): boolean {
  return activityStartsAt(activity).getTime() >= now.getTime();
}

/** "19:00 - 21:00". */
export function formatTimeRange(
  activity: Pick<Activity, "startTime" | "endTime">,
): string {
  return `${activity.startTime} - ${activity.endTime}`;
}

/** Length in minutes, for the "2h 30m" line on the detail page. */
export function durationMinutes(
  activity: Pick<Activity, "startTime" | "endTime">,
): number {
  const [startHour, startMinute] = activity.startTime.split(":").map(Number);
  const [endHour, endMinute] = activity.endTime.split(":").map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

/** 150 -> "2h 30m"; 60 -> "1h"; 45 -> "45m". */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "-";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/* ------------------------------- transitions ------------------------------ */

/**
 * Which status changes are allowed, in one place.
 *
 * Cancelling is reversible - a called-off activity returns to draft so it has
 * to be published again deliberately, rather than silently reappearing on
 * everyone's calendar.
 */
export const allowedTransitions: Record<ActivityStatus, ActivityStatus[]> = {
  draft: ["published", "cancelled"],
  published: ["completed", "cancelled"],
  completed: [],
  cancelled: ["draft"],
};

export function canTransition(from: ActivityStatus, to: ActivityStatus): boolean {
  return allowedTransitions[from].includes(to);
}
