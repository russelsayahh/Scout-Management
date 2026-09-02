import { ACTIVITY_TYPES } from "@/lib/activities/types";
import {
  parseTimeOfDay,
  validateChoice,
  validateDate,
  validateInteger,
  validateText,
  validateTime,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Activity form validation, run in the browser for immediate feedback and
 * again in the Server Action, which is the authority.
 */

export const CAPACITY_MAX = 500;

export function validateActivityName(value: string): string | undefined {
  return validateText(value, { label: "an activity name", required: true, min: 3, max: 80 });
}

export function validateActivityDescription(value: string): string | undefined {
  return validateText(value, { label: "a description", max: 1000 });
}

export function validateActivityLocation(value: string): string | undefined {
  return validateText(value, { label: "a location", required: true, min: 2, max: 120 });
}

export function validateActivityDate(value: string): string | undefined {
  // Past dates are allowed: a programme is often written up after the event.
  return validateDate(value, { label: "a date", required: true, earliest: "2000-01-01" });
}

export function validateCapacity(value: string): string | undefined {
  return validateInteger(value, { label: "a maximum capacity", min: 1, max: CAPACITY_MAX });
}

/**
 * The end time is checked against the start time rather than on its own, so
 * the message names the actual problem.
 */
export function validateEndTime(start: string, end: string): string | undefined {
  const format = validateTime(end, "an end time");
  if (format) return format;

  const startMinutes = parseTimeOfDay(start);
  const endMinutes = parseTimeOfDay(end);
  if (startMinutes === null || endMinutes === null) return undefined;

  if (endMinutes <= startMinutes) return "The end time must be after the start time.";
  return undefined;
}

export interface ActivityFormInput {
  name: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: string;
  leaderId: string;
  patrolIds: string[];
  capacity: string;
}

export function validateActivityInput(input: ActivityFormInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = validateActivityName(input.name);
  if (name) errors.name = name;

  const description = validateActivityDescription(input.description);
  if (description) errors.description = description;

  const date = validateActivityDate(input.date);
  if (date) errors.date = date;

  const startTime = validateTime(input.startTime, "a start time");
  if (startTime) errors.startTime = startTime;

  const endTime = validateEndTime(input.startTime, input.endTime);
  if (endTime) errors.endTime = endTime;

  const location = validateActivityLocation(input.location);
  if (location) errors.location = location;

  const type = validateChoice(input.type, ACTIVITY_TYPES, "an activity type");
  if (type) errors.type = type;

  if (!input.leaderId) errors.leaderId = "Choose the leader responsible.";

  const capacity = validateCapacity(input.capacity);
  if (capacity) errors.capacity = capacity;

  return errors;
}
