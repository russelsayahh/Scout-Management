import { SELF_SIGNUP_ROLES, type Role } from "@/lib/auth/types";
import {
  validateAvatar,
  validateChoice,
  validateEmail,
  validatePhone,
  validateText,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Account-form validation. The generic field rules live in `lib/validation.ts`
 * and are re-exported here so auth components have a single import.
 */
export {
  AVATAR_MAX_BYTES,
  dataUrlByteSize,
  hasErrors,
  validateAvatar,
  validateEmail,
  validatePhone,
  type FieldErrors,
} from "@/lib/validation";

export function validateName(value: string): string | undefined {
  return validateText(value, { label: "your full name", required: true, min: 2, max: 80 });
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Enter a password.";
  if (value.length < 10) return "Password must be at least 10 characters.";
  if (value.length > 200) return "Password must be 200 characters or fewer.";
  if (!/[a-z]/.test(value)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(value)) return "Password must include an uppercase letter.";
  if (!/\d/.test(value)) return "Password must include a number.";
  return undefined;
}

export function validateRole(value: string, allowed: Role[]): string | undefined {
  return validateChoice(value, allowed, "role");
}

/* ------------------------------- form shapes ------------------------------- */

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  role: string;
  troopId: string;
  password: string;
  confirmPassword: string;
}

export function validateRegisterInput(input: RegisterInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = validateName(input.name);
  if (name) errors.name = name;

  const email = validateEmail(input.email);
  if (email) errors.email = email;

  const phone = validatePhone(input.phone);
  if (phone) errors.phone = phone;

  const role = validateRole(input.role, SELF_SIGNUP_ROLES);
  if (role) errors.role = role;

  if (!input.troopId) errors.troopId = "Choose a troop.";

  const password = validatePassword(input.password);
  if (password) errors.password = password;

  if (!input.confirmPassword) {
    errors.confirmPassword = "Re-enter your password.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLoginInput(input: LoginInput): FieldErrors {
  const errors: FieldErrors = {};

  const email = validateEmail(input.email);
  if (email) errors.email = email;
  if (!input.password) errors.password = "Enter your password.";

  return errors;
}

export interface ProfileInput {
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
}

export function validateProfileInput(input: ProfileInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = validateName(input.name);
  if (name) errors.name = name;

  const email = validateEmail(input.email);
  if (email) errors.email = email;

  const phone = validatePhone(input.phone);
  if (phone) errors.phone = phone;

  const avatar = validateAvatar(input.avatar);
  if (avatar) errors.avatar = avatar;

  return errors;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function validatePasswordChangeInput(input: PasswordChangeInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.currentPassword) errors.currentPassword = "Enter your current password.";

  const newPassword = validatePassword(input.newPassword);
  if (newPassword) errors.newPassword = newPassword;
  else if (input.newPassword === input.currentPassword) {
    errors.newPassword = "Choose a password different from your current one.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Re-enter your new password.";
  } else if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
