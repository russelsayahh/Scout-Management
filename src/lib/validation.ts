/**
 * Field validators shared by every form in the app.
 *
 * The browser runs these for immediate feedback and the Server Actions run them
 * again as the authority, so a bypassed form cannot write invalid data.
 * Domain-specific rules build on these in `lib/auth/validation.ts` and
 * `lib/scouts/validation.ts`.
 */

export type FieldErrors = Record<string, string>;

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export const AVATAR_MAX_BYTES = 512 * 1024;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Digits, spaces and the usual separators; 7-20 digits once stripped. */
const PHONE_PATTERN = /^[+]?[\d\s()-]{7,24}$/;

/* ---------------------------------- text ---------------------------------- */

export interface TextRules {
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
}

/** Generic required/length check, phrased with the field's own label. */
export function validateText(value: string, rules: TextRules): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return rules.required ? `Enter ${rules.label}.` : undefined;
  }
  if (rules.min !== undefined && trimmed.length < rules.min) {
    return `${capitalise(rules.label)} must be at least ${rules.min} characters.`;
  }
  if (rules.max !== undefined && trimmed.length > rules.max) {
    return `${capitalise(rules.label)} must be ${rules.max} characters or fewer.`;
  }
  return undefined;
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* --------------------------------- contact -------------------------------- */

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email address.";
  if (trimmed.length > 160) return "Email must be 160 characters or fewer.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address.";
  return undefined;
}

/** Email that may be left blank. */
export function validateOptionalEmail(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return validateEmail(value);
}

/** Phone is optional wherever this is used directly. */
export function validatePhone(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!PHONE_PATTERN.test(trimmed)) return "Enter a valid phone number.";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 20) return "Enter a valid phone number.";
  return undefined;
}

export function validateRequiredPhone(value: string, label: string): string | undefined {
  if (!value.trim()) return `Enter ${label}.`;
  return validatePhone(value);
}

/* ---------------------------------- dates --------------------------------- */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  // Parsed as UTC midnight, matching how dates are formatted for display.
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export interface DateRules {
  label: string;
  required?: boolean;
  /** Reject dates after today. */
  noFuture?: boolean;
  /** Earliest acceptable date, as an ISO day string. */
  earliest?: string;
}

export function validateDate(value: string, rules: DateRules): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return rules.required ? `Enter ${rules.label}.` : undefined;
  }

  const date = parseDateOnly(trimmed);
  if (!date) return `Enter ${rules.label} as a valid date.`;

  if (rules.noFuture) {
    const today = new Date();
    const todayUtc = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    );
    if (date.getTime() > todayUtc) return `${capitalise(rules.label)} cannot be in the future.`;
  }

  if (rules.earliest) {
    const earliest = parseDateOnly(rules.earliest);
    if (earliest && date.getTime() < earliest.getTime()) {
      return `${capitalise(rules.label)} cannot be before ${rules.earliest}.`;
    }
  }

  return undefined;
}

/* --------------------------------- choices -------------------------------- */

export function validateChoice<T extends string>(
  value: string,
  allowed: readonly T[],
  label: string,
): string | undefined {
  if (!value) return `Choose ${label}.`;
  if (!allowed.includes(value as T)) return `Choose a valid ${label}.`;
  return undefined;
}

/* --------------------------------- images --------------------------------- */

/** Rough byte size of a data URL's payload, without decoding it. */
export function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function validateAvatar(value: string | null): string | undefined {
  if (!value) return undefined;
  if (!/^data:image\/(png|jpeg|webp);base64,/.test(value)) {
    return "Picture must be a PNG, JPEG or WebP image.";
  }
  if (dataUrlByteSize(value) > AVATAR_MAX_BYTES) {
    return "Picture is too large. Choose an image under 512 KB.";
  }
  return undefined;
}
