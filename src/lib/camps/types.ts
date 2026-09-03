/**
 * A camp: a residential event with a roster.
 *
 * The difference from an activity is registration. An activity's audience is
 * derived - whoever is in the patrols invited - because nobody signs up for a
 * troop night. A camp has beds, tents and a minibus, so who is coming is
 * recorded one scout at a time and capacity is a rule rather than a warning.
 *
 * Dates are plain ISO days. A camp runs from a Friday to a Sunday wherever you
 * read it, so there is no instant to get wrong across time zones.
 */

/* --------------------------------- status --------------------------------- */

export type CampStatus =
  | "planning"
  | "registration-open"
  | "registration-closed"
  | "ongoing"
  | "completed"
  | "cancelled";

export const CAMP_STATUSES: readonly CampStatus[] = [
  "planning",
  "registration-open",
  "registration-closed",
  "ongoing",
  "completed",
  "cancelled",
];

export const campStatusLabels: Record<CampStatus, string> = {
  planning: "Planning",
  "registration-open": "Registration open",
  "registration-closed": "Registration closed",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const campStatusDescriptions: Record<CampStatus, string> = {
  planning: "Being put together. Not announced to the group yet.",
  "registration-open": "Announced, and scouts can be signed up.",
  "registration-closed": "Numbers are settled and the roster is being finalised.",
  ongoing: "Happening now.",
  completed: "It has run. Kept on file as a record.",
  cancelled: "Called off. The record is kept so everyone can see why.",
};

/**
 * Which status changes are allowed.
 *
 * Registration can be reopened from closed - a late place often comes free -
 * but nothing returns from completed, and a cancelled camp goes back to
 * planning rather than straight to open, so it has to be announced again.
 */
export const allowedTransitions: Record<CampStatus, CampStatus[]> = {
  planning: ["registration-open", "cancelled"],
  "registration-open": ["registration-closed", "cancelled"],
  "registration-closed": ["registration-open", "ongoing", "cancelled"],
  ongoing: ["completed", "cancelled"],
  completed: [],
  cancelled: ["planning"],
};

export function canTransition(from: CampStatus, to: CampStatus): boolean {
  return allowedTransitions[from].includes(to);
}

/** A camp whose record is final: no roster changes, no further transitions. */
export function isClosed(status: CampStatus): boolean {
  return status === "completed" || status === "cancelled";
}

/* --------------------------------- record --------------------------------- */

export interface CampRegistration {
  scoutId: string;
  registeredAt: string;
  /** User id of the leader who signed them up. */
  registeredBy: string;
}

export interface Camp {
  id: string;

  name: string;
  description: string;
  location: string;

  /** ISO days. A one-day camp has the same start and end. */
  startDate: string;
  endDate: string;
  /** ISO day. Never after `startDate`. */
  registrationDeadline: string;

  /** User accounts of the leaders responsible. At least one. */
  leaderIds: string[];
  /** Patrols invited. Empty means the whole troop is invited. */
  patrolIds: string[];

  /** Places available. Required - a camp always has a physical limit. */
  maxParticipants: number;

  status: CampStatus;
  registrations: CampRegistration[];

  /* Milestones, recorded as they happen, so the timeline is history rather
     than a guess reconstructed from the current status. */
  registrationOpenedAt: string | null;
  registrationClosedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * The editable half - what the create and edit forms produce.
 *
 * Status and the roster are absent: both move through their own named
 * operations, so saving a change to the location cannot quietly open
 * registration or drop somebody from the camp.
 */
export type CampDetails = Pick<
  Camp,
  | "name"
  | "description"
  | "location"
  | "startDate"
  | "endDate"
  | "registrationDeadline"
  | "leaderIds"
  | "patrolIds"
  | "maxParticipants"
>;

/* --------------------------------- timing --------------------------------- */

function asDate(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00.000Z`);
}

/** Whole days from start to end inclusive: a Fri-Sun camp is 3 days. */
export function campDays(camp: Pick<Camp, "startDate" | "endDate">): number {
  const start = asDate(camp.startDate).getTime();
  const end = asDate(camp.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Nights under canvas: one fewer than the days. */
export function campNights(camp: Pick<Camp, "startDate" | "endDate">): number {
  return Math.max(0, campDays(camp) - 1);
}

/** "3 days, 2 nights"; a single day reads as "1 day". */
export function formatCampLength(camp: Pick<Camp, "startDate" | "endDate">): string {
  const days = campDays(camp);
  const nights = campNights(camp);
  if (days === 0) return "-";
  if (nights === 0) return "1 day";
  return `${days} days, ${nights} ${nights === 1 ? "night" : "nights"}`;
}

/** True once the camp's last day is behind us. */
export function hasFinished(camp: Pick<Camp, "endDate">, now: Date): boolean {
  // The end day counts in full, so the camp is over at the end of it.
  return asDate(camp.endDate).getTime() + 86_400_000 <= now.getTime();
}

export function hasStarted(camp: Pick<Camp, "startDate">, now: Date): boolean {
  return asDate(camp.startDate).getTime() <= now.getTime();
}

export function deadlinePassed(
  camp: Pick<Camp, "registrationDeadline">,
  now: Date,
): boolean {
  // The deadline day counts in full.
  return asDate(camp.registrationDeadline).getTime() + 86_400_000 <= now.getTime();
}

/** Whole days until the deadline; negative once it has gone. */
export function daysUntilDeadline(
  camp: Pick<Camp, "registrationDeadline">,
  now: Date,
): number {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((asDate(camp.registrationDeadline).getTime() - today) / 86_400_000);
}

/**
 * Still to come: it has not finished, and it is still going ahead.
 *
 * A camp that is running counts as upcoming - it is very much still live for
 * everyone involved.
 */
export function isUpcoming(
  camp: Pick<Camp, "endDate" | "status">,
  now: Date,
): boolean {
  if (camp.status === "cancelled" || camp.status === "completed") return false;
  return !hasFinished(camp, now);
}

/* ------------------------------- registration ------------------------------ */

/**
 * Whether scouts can be signed up right now, and why not when they cannot.
 *
 * The rule is deliberately narrow: only a finished or called-off camp refuses
 * roster changes outright. A leader adding somebody after the deadline is doing
 * ordinary admin, not breaking a rule - so the system tells them where things
 * stand rather than blocking them. Capacity is the one hard limit, because beds
 * do not stretch.
 */
export type RegistrationState =
  | "open"
  | "before-opening"
  | "after-deadline"
  | "closed"
  | "full"
  | "finished";

export function registrationState(camp: Camp, now: Date): RegistrationState {
  if (isClosed(camp.status)) return "finished";
  if (camp.registrations.length >= camp.maxParticipants) return "full";
  if (camp.status === "planning") return "before-opening";
  if (camp.status === "registration-closed" || camp.status === "ongoing") return "closed";
  if (deadlinePassed(camp, now)) return "after-deadline";
  return "open";
}

export const registrationStateMessages: Record<RegistrationState, string> = {
  open: "Open for registrations.",
  "before-opening": "Registration has not been opened yet, but scouts can still be added.",
  "after-deadline": "The deadline has passed. Late additions are still possible.",
  closed: "Registration is closed. Late changes are still possible.",
  full: "Every place is taken.",
  finished: "This camp is finished, so the roster is fixed.",
};

/** Places left. Never negative. */
export function placesLeft(camp: Camp): number {
  return Math.max(0, camp.maxParticipants - camp.registrations.length);
}

export function isRegistered(camp: Camp, scoutId: string): boolean {
  return camp.registrations.some((entry) => entry.scoutId === scoutId);
}

/** Stable, readable ids for the seeded camps. */
export function campSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
