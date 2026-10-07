import {
  validateAvatar,
  validateEmail,
  validatePhone,
  validateText,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Leader profile validation, run in the browser for feedback and again in the
 * Server Action as the authority.
 */

export function validateLeaderName(value: string): string | undefined {
  return validateText(value, { label: "a name", required: true, min: 2, max: 80 });
}

export function validatePosition(value: string): string | undefined {
  return validateText(value, { label: "a position", max: 80 });
}

/** The raw form values, before they are narrowed to `LeaderDetails`. */
export interface LeaderFormInput {
  name: string;
  email: string;
  phone: string;
  position: string;
  avatar: string | null;
  patrolIds: string[];
  troopIds: string[];
}

export function validateLeaderInput(input: LeaderFormInput): FieldErrors {
  const errors: FieldErrors = {};

  const set = (field: keyof LeaderFormInput, message: string | undefined) => {
    if (message) errors[field] = message;
  };

  set("name", validateLeaderName(input.name));
  set("email", validateEmail(input.email));
  set("phone", validatePhone(input.phone));
  set("position", validatePosition(input.position));
  set("avatar", validateAvatar(input.avatar));

  return errors;
}
