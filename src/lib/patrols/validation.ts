import { PATROL_STATUSES } from "@/lib/patrols/types";
import { validateChoice, validateText, type FieldErrors } from "@/lib/validation";

/** Patrol form validation, run in the browser and again in the Server Action. */

export function validatePatrolName(value: string): string | undefined {
  return validateText(value, { label: "a patrol name", required: true, min: 2, max: 40 });
}

export function validatePatrolDescription(value: string): string | undefined {
  return validateText(value, { label: "a description", max: 400 });
}

export interface PatrolFormInput {
  name: string;
  description: string;
  status: string;
  patrolLeaderId: string;
}

export function validatePatrolInput(input: PatrolFormInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = validatePatrolName(input.name);
  if (name) errors.name = name;

  const description = validatePatrolDescription(input.description);
  if (description) errors.description = description;

  const status = validateChoice(input.status, PATROL_STATUSES, "status");
  if (status) errors.status = status;

  return errors;
}
