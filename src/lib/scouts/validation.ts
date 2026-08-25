import {
  GENDERS,
  PATROLS,
  SCOUT_STATUSES,
  type ScoutDetails,
} from "@/lib/scouts/types";
import {
  parseDateOnly,
  validateAvatar,
  validateChoice,
  validateDate,
  validateOptionalEmail,
  validatePhone,
  validateRequiredPhone,
  validateText,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Scout record validation, run in the browser for feedback and again in the
 * Server Action as the authority.
 */

/** Nobody in a youth section is older than this; guards against typo'd years. */
const MAX_AGE_YEARS = 30;

export function validateFirstName(value: string): string | undefined {
  return validateText(value, { label: "a first name", required: true, min: 2, max: 60 });
}

export function validateLastName(value: string): string | undefined {
  return validateText(value, { label: "a last name", required: true, min: 2, max: 60 });
}

export function validateDateOfBirth(value: string): string | undefined {
  const earliest = new Date();
  earliest.setUTCFullYear(earliest.getUTCFullYear() - MAX_AGE_YEARS);

  return validateDate(value, {
    label: "a date of birth",
    required: true,
    noFuture: true,
    earliest: earliest.toISOString().slice(0, 10),
  });
}

export function validateAddress(value: string): string | undefined {
  return validateText(value, { label: "an address", max: 200 });
}

export function validateEmergencyContactName(value: string): string | undefined {
  return validateText(value, {
    label: "an emergency contact name",
    required: true,
    min: 2,
    max: 80,
  });
}

export function validateMedicalNotes(value: string): string | undefined {
  return validateText(value, { label: "medical notes", max: 1000 });
}

/**
 * Join date must be a real, non-future date - and cannot precede the scout's
 * own birth, which is the one cross-field rule here.
 */
export function validateJoinDate(value: string, dateOfBirth: string): string | undefined {
  const basic = validateDate(value, { label: "a join date", required: true, noFuture: true });
  if (basic) return basic;

  const born = parseDateOnly(dateOfBirth);
  const joined = parseDateOnly(value);
  if (born && joined && joined.getTime() < born.getTime()) {
    return "Join date cannot be before the date of birth.";
  }

  return undefined;
}

/** The raw form values, before they are narrowed to `ScoutDetails`. */
export interface ScoutFormInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string;
  joinDate: string;
  patrol: string;
  status: string;
  avatar: string | null;
}

export function validateScoutInput(input: ScoutFormInput): FieldErrors {
  const errors: FieldErrors = {};

  const set = (field: keyof ScoutFormInput, message: string | undefined) => {
    if (message) errors[field] = message;
  };

  set("firstName", validateFirstName(input.firstName));
  set("lastName", validateLastName(input.lastName));
  set("dateOfBirth", validateDateOfBirth(input.dateOfBirth));
  set("gender", validateChoice(input.gender, GENDERS, "gender"));
  set("phone", validatePhone(input.phone));
  set("email", validateOptionalEmail(input.email));
  set("address", validateAddress(input.address));
  set("emergencyContactName", validateEmergencyContactName(input.emergencyContactName));
  set(
    "emergencyContactPhone",
    validateRequiredPhone(input.emergencyContactPhone, "an emergency contact phone number"),
  );
  set("medicalNotes", validateMedicalNotes(input.medicalNotes));
  set("joinDate", validateJoinDate(input.joinDate, input.dateOfBirth));
  set("patrol", validateChoice(input.patrol, PATROLS, "patrol"));
  set("status", validateChoice(input.status, SCOUT_STATUSES, "status"));
  set("avatar", validateAvatar(input.avatar));

  return errors;
}

/**
 * Narrows validated form values to the stored shape. Only call this once
 * `validateScoutInput` has returned no errors.
 */
export function toScoutDetails(input: ScoutFormInput): ScoutDetails {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dateOfBirth: input.dateOfBirth,
    gender: input.gender as ScoutDetails["gender"],
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    address: input.address.trim(),
    emergencyContactName: input.emergencyContactName.trim(),
    emergencyContactPhone: input.emergencyContactPhone.trim(),
    medicalNotes: input.medicalNotes.trim(),
    joinDate: input.joinDate,
    patrol: input.patrol as ScoutDetails["patrol"],
    status: input.status as ScoutDetails["status"],
    avatar: input.avatar,
  };
}
