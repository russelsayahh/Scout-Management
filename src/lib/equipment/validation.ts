import {
  AVAILABILITY_STATUSES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
} from "@/lib/equipment/types";
import {
  validateChoice,
  validateDate,
  validateInteger,
  validateText,
  type FieldErrors,
} from "@/lib/validation";

/**
 * Equipment form validation, run in the browser for immediate feedback and
 * again in the Server Action, which is the authority.
 */

export const QUANTITY_MAX = 9999;

export function validateEquipmentName(value: string): string | undefined {
  return validateText(value, { label: "an item name", required: true, min: 2, max: 80 });
}

export function validateLocation(value: string): string | undefined {
  return validateText(value, { label: "a location", required: true, min: 2, max: 80 });
}

export function validateSerialNumber(value: string): string | undefined {
  return validateText(value, { label: "a serial number", max: 60 });
}

export function validateNotes(value: string): string | undefined {
  return validateText(value, { label: "notes", max: 500 });
}

export function validateQuantity(value: string): string | undefined {
  return validateInteger(value, {
    label: "a quantity",
    required: true,
    min: 0,
    max: QUANTITY_MAX,
  });
}

export function validatePurchaseDate(value: string): string | undefined {
  // Optional: plenty of group kit predates anyone writing a receipt down.
  return validateDate(value, { label: "a purchase date", noFuture: true, earliest: "1950-01-01" });
}

export interface EquipmentFormInput {
  name: string;
  category: string;
  quantity: string;
  condition: string;
  location: string;
  serialNumber: string;
  purchaseDate: string;
  notes: string;
  availability: string;
}

export function validateEquipmentInput(input: EquipmentFormInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = validateEquipmentName(input.name);
  if (name) errors.name = name;

  const category = validateChoice(input.category, EQUIPMENT_CATEGORIES, "a category");
  if (category) errors.category = category;

  const quantity = validateQuantity(input.quantity);
  if (quantity) errors.quantity = quantity;

  const condition = validateChoice(input.condition, EQUIPMENT_CONDITIONS, "a condition");
  if (condition) errors.condition = condition;

  const location = validateLocation(input.location);
  if (location) errors.location = location;

  const serial = validateSerialNumber(input.serialNumber);
  if (serial) errors.serialNumber = serial;

  const purchased = validatePurchaseDate(input.purchaseDate);
  if (purchased) errors.purchaseDate = purchased;

  const notes = validateNotes(input.notes);
  if (notes) errors.notes = notes;

  const availability = validateChoice(
    input.availability,
    AVAILABILITY_STATUSES,
    "an availability status",
  );
  if (availability) errors.availability = availability;

  return errors;
}

/* --------------------------------- loans ---------------------------------- */

export function validateLoanQuantity(value: string, available: number): string | undefined {
  const base = validateInteger(value, {
    label: "a number of units",
    required: true,
    min: 1,
    max: QUANTITY_MAX,
  });
  if (base) return base;

  if (Number(value.trim()) > available) {
    return `Only ${available} ${available === 1 ? "unit is" : "units are"} in the store.`;
  }
  return undefined;
}

export function validateDueBack(value: string): string | undefined {
  // Open-ended loans are normal for kit that lives with a leader.
  return validateDate(value, { label: "a return date", earliest: "2000-01-01" });
}
