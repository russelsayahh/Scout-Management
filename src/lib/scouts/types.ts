/** Membership state. Archiving is tracked separately, so a restore returns a scout to their previous status. */
export type ScoutStatus = "active" | "inactive" | "waiting-list";

export const SCOUT_STATUSES: readonly ScoutStatus[] = ["active", "inactive", "waiting-list"];

export const scoutStatusLabels: Record<ScoutStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  "waiting-list": "Waiting list",
};

export const scoutStatusDescriptions: Record<ScoutStatus, string> = {
  active: "Attending meetings and counted in the census.",
  inactive: "Registered but not currently attending.",
  "waiting-list": "Waiting for a place in a section.",
};

export type Gender = "female" | "male" | "non-binary" | "prefer-not-to-say";

export const GENDERS: readonly Gender[] = ["female", "male", "non-binary", "prefer-not-to-say"];

export const genderLabels: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Prefer not to say",
};

/**
 * Patrols are a fixed list until the Patrols module lands, at which point this
 * becomes a lookup against real records.
 */
export const PATROLS = [
  "Unassigned",
  "Kestrel",
  "Falcon",
  "Otter",
  "Kingfisher",
  "Badger",
  "Heron",
  "Peregrine",
  "Osprey",
] as const;

export type Patrol = (typeof PATROLS)[number];

export interface Scout {
  id: string;

  // Identity
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO day, e.g. "2013-04-18"
  gender: Gender;
  avatar: string | null;

  // Contact
  phone: string;
  email: string;
  address: string;

  // Emergency - required, because activities cannot run without it
  emergencyContactName: string;
  emergencyContactPhone: string;

  // Care
  medicalNotes: string;

  // Membership
  joinDate: string; // ISO day
  patrol: Patrol;
  status: ScoutStatus;

  // Archive state
  archived: boolean;
  archivedAt: string | null;
  archiveReason: string;

  createdAt: string;
  updatedAt: string;
}

/** The editable half of a scout - what the add and edit forms produce. */
export type ScoutDetails = Omit<
  Scout,
  "id" | "archived" | "archivedAt" | "archiveReason" | "createdAt" | "updatedAt"
>;

export function scoutFullName(scout: Pick<Scout, "firstName" | "lastName">): string {
  return `${scout.firstName} ${scout.lastName}`.trim();
}

/**
 * Whole years between `dateOfBirth` and `on`.
 *
 * Callers pass the reference date explicitly so this stays a pure function and
 * server-rendered ages never disagree with a client re-render.
 */
export function ageOn(dateOfBirth: string, on: Date): number | null {
  const born = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(born.getTime())) return null;

  let age = on.getUTCFullYear() - born.getUTCFullYear();
  const monthDelta = on.getUTCMonth() - born.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && on.getUTCDate() < born.getUTCDate())) age -= 1;

  return age < 0 ? null : age;
}
