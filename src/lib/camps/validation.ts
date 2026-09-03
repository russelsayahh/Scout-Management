import {
  parseDateOnly,
  validateDate,
  validateInteger,
  validateText,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Camp form validation, run in the browser for immediate feedback and again in
 * the Server Action, which is the authority.
 */

export const MAX_PARTICIPANTS_LIMIT = 500;

export function validateCampName(value: string): string | undefined {
  return validateText(value, { label: "a camp name", required: true, min: 3, max: 80 });
}

export function validateCampDescription(value: string): string | undefined {
  return validateText(value, { label: "a description", max: 1000 });
}

export function validateCampLocation(value: string): string | undefined {
  return validateText(value, { label: "a location", required: true, min: 2, max: 120 });
}

export function validateStartDate(value: string): string | undefined {
  // Past camps are allowed: a record is often written up afterwards.
  return validateDate(value, { label: "a start date", required: true, earliest: "2000-01-01" });
}

/** Checked against the start rather than on its own, so the message names the problem. */
export function validateEndDate(start: string, end: string): string | undefined {
  const format = validateDate(end, {
    label: "an end date",
    required: true,
    earliest: "2000-01-01",
  });
  if (format) return format;

  const startDate = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  if (!startDate || !endDate) return undefined;

  if (endDate.getTime() < startDate.getTime()) {
    return "The end date cannot be before the start date.";
  }
  return undefined;
}

/** The deadline has to fall before the camp does. */
export function validateDeadline(start: string, deadline: string): string | undefined {
  const format = validateDate(deadline, {
    label: "a registration deadline",
    required: true,
    earliest: "2000-01-01",
  });
  if (format) return format;

  const startDate = parseDateOnly(start);
  const deadlineDate = parseDateOnly(deadline);
  if (!startDate || !deadlineDate) return undefined;

  if (deadlineDate.getTime() > startDate.getTime()) {
    return "The deadline has to be on or before the first day of the camp.";
  }
  return undefined;
}

export function validateMaxParticipants(value: string): string | undefined {
  return validateInteger(value, {
    label: "a maximum number of participants",
    required: true,
    min: 1,
    max: MAX_PARTICIPANTS_LIMIT,
  });
}

export interface CampFormInput {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  leaderIds: string[];
  patrolIds: string[];
  maxParticipants: string;
}

export function validateCampInput(input: CampFormInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = validateCampName(input.name);
  if (name) errors.name = name;

  const description = validateCampDescription(input.description);
  if (description) errors.description = description;

  const location = validateCampLocation(input.location);
  if (location) errors.location = location;

  const startDate = validateStartDate(input.startDate);
  if (startDate) errors.startDate = startDate;

  const endDate = validateEndDate(input.startDate, input.endDate);
  if (endDate) errors.endDate = endDate;

  const deadline = validateDeadline(input.startDate, input.registrationDeadline);
  if (deadline) errors.registrationDeadline = deadline;

  // A camp without somebody in charge is not a camp anyone can run.
  if (input.leaderIds.length === 0) {
    errors.leaderIds = "Choose at least one leader to take responsibility.";
  }

  const max = validateMaxParticipants(input.maxParticipants);
  if (max) errors.maxParticipants = max;

  return errors;
}
