/**
 * The quartermaster's store.
 *
 * An item is a **stock line**, not a single object: "20 tent pegs" is one
 * record with a quantity of 20. That is what lets the same model cover a box of
 * pegs and a single GPS unit, and it is why a loan takes out a number of units
 * rather than an item.
 *
 * Serial numbers only make sense on a line of one, so the field is optional and
 * the form says as much.
 */

/* -------------------------------- category -------------------------------- */

export type EquipmentCategory =
  | "camping"
  | "tents"
  | "cooking"
  | "first-aid"
  | "tools"
  | "sports"
  | "scouting"
  | "electronics"
  | "other";

export const EQUIPMENT_CATEGORIES: readonly EquipmentCategory[] = [
  "camping",
  "tents",
  "cooking",
  "first-aid",
  "tools",
  "sports",
  "scouting",
  "electronics",
  "other",
];

export const categoryLabels: Record<EquipmentCategory, string> = {
  camping: "Camping",
  tents: "Tents",
  cooking: "Cooking",
  "first-aid": "First aid",
  tools: "Tools",
  sports: "Sports",
  scouting: "Scout equipment",
  electronics: "Electronics",
  other: "Other",
};

/* -------------------------------- condition ------------------------------- */

export type EquipmentCondition = "new" | "good" | "needs-maintenance" | "damaged" | "retired";

export const EQUIPMENT_CONDITIONS: readonly EquipmentCondition[] = [
  "new",
  "good",
  "needs-maintenance",
  "damaged",
  "retired",
];

export const conditionLabels: Record<EquipmentCondition, string> = {
  new: "New",
  good: "Good",
  "needs-maintenance": "Needs maintenance",
  damaged: "Damaged",
  retired: "Retired",
};

export const conditionDescriptions: Record<EquipmentCondition, string> = {
  new: "Unused, still as bought.",
  good: "Serviceable and fit to go out.",
  "needs-maintenance": "Usable, but something needs attention before long.",
  damaged: "Not fit to go out until it is repaired.",
  retired: "Withdrawn from the store. Kept on file for its history.",
};

/** Conditions that stop something being lent out at all. */
export function conditionBlocksLoan(condition: EquipmentCondition): boolean {
  return condition === "damaged" || condition === "retired";
}

/* ------------------------------- availability ------------------------------ */

/**
 * What the quartermaster has decided about the line, as opposed to what the
 * loans say about it.
 *
 * Kept separate from the derived counts on purpose: "how many are out" is
 * arithmetic over the loans and is never stored, while "may this go out at all"
 * is a decision somebody makes.
 */
export type AvailabilityStatus = "available" | "reserved" | "out-of-service";

export const AVAILABILITY_STATUSES: readonly AvailabilityStatus[] = [
  "available",
  "reserved",
  "out-of-service",
];

export const availabilityLabels: Record<AvailabilityStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  "out-of-service": "Out of service",
};

export const availabilityDescriptions: Record<AvailabilityStatus, string> = {
  available: "In the store and free to take out.",
  reserved: "Set aside for something. Do not lend it elsewhere.",
  "out-of-service": "Withdrawn for now - being repaired, or not fit to use.",
};

/* ---------------------------------- item ---------------------------------- */

export interface EquipmentItem {
  id: string;

  name: string;
  category: EquipmentCategory;

  /** Units owned and serviceable. Damaged and lost units are not counted here. */
  quantity: number;
  /** Units owned but broken, waiting on repair or a write-off. */
  damaged: number;
  /** Units written off as lost, kept as a running total. */
  lost: number;

  condition: EquipmentCondition;
  location: string;
  /** Empty when it does not apply - a box of pegs has no serial number. */
  serialNumber: string;
  /** ISO day, or empty when nobody recorded it. */
  purchaseDate: string;
  notes: string;

  availability: AvailabilityStatus;

  retiredAt: string | null;

  createdAt: string;
  updatedAt: string;
}

/**
 * The editable half - what the add and edit forms produce.
 *
 * `damaged` and `lost` are absent: they only move through recording damage or a
 * loss, so a typo in the edit form cannot quietly write off half the store.
 */
export type EquipmentDetails = Pick<
  EquipmentItem,
  | "name"
  | "category"
  | "quantity"
  | "condition"
  | "location"
  | "serialNumber"
  | "purchaseDate"
  | "notes"
  | "availability"
>;

/** Total units the group owns, serviceable or not. */
export function totalOwned(item: EquipmentItem): number {
  return item.quantity + item.damaged;
}

/* ---------------------------------- loans --------------------------------- */

/**
 * Who has it.
 *
 * A loan goes to a person, or to an event. Assigning kit to a camp is the
 * common case - the whole patrol box goes with it - and naming the camp rather
 * than one leader is what a quartermaster actually writes down.
 */
export type HolderKind = "leader" | "activity" | "camp";

export const holderKindLabels: Record<HolderKind, string> = {
  leader: "Leader",
  activity: "Activity",
  camp: "Camp",
};

export interface EquipmentLoan {
  id: string;
  itemId: string;
  /** Units taken out. */
  quantity: number;

  holderKind: HolderKind;
  holderId: string;
  /**
   * Denormalized from the holder at checkout time - see the note in
   * `store.ts`. The catalog item this loan points at stays shared across
   * every troop; only the loan itself carries a troop.
   */
  troopId: string;

  checkedOutAt: string;
  /** User id of whoever booked it out. */
  checkedOutBy: string;
  /** ISO day it is expected back, or null when open-ended. */
  dueBack: string | null;
  note: string;

  returnedAt: string | null;
  returnedBy: string | null;
  /** How the units came back. These sum to `quantity` once returned. */
  returnedGood: number;
  returnedDamaged: number;
  returnedLost: number;
}

export function isOpen(loan: EquipmentLoan): boolean {
  return loan.returnedAt === null;
}

/** Past its due date and still out. */
export function isOverdue(loan: EquipmentLoan, now: Date): boolean {
  if (!isOpen(loan) || loan.dueBack === null) return false;
  // The due day counts in full, so it is late from the following morning.
  return new Date(`${loan.dueBack}T00:00:00.000Z`).getTime() + 86_400_000 <= now.getTime();
}

/** Whole days until it is due; negative once it is late. */
export function daysUntilDue(loan: EquipmentLoan, now: Date): number | null {
  if (loan.dueBack === null) return null;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round(
    (new Date(`${loan.dueBack}T00:00:00.000Z`).getTime() - today) / 86_400_000,
  );
}

/* ------------------------------- derived state ----------------------------- */

export interface StockPosition {
  /** Units owned and serviceable. */
  quantity: number;
  /** Units currently out on loan. */
  onLoan: number;
  /** Units in the store and free to take. */
  available: number;
  damaged: number;
  lost: number;
}

/**
 * Why an item cannot go out, or `ready` when it can.
 *
 * Worked out in one place so the button, the dialog and the Server Action all
 * refuse for the same reason and say the same thing.
 */
export type CheckoutBlock =
  | "ready"
  | "retired"
  | "damaged"
  | "reserved"
  | "out-of-service"
  | "none-left";

export function checkoutBlock(item: EquipmentItem, position: StockPosition): CheckoutBlock {
  if (item.condition === "retired") return "retired";
  if (item.condition === "damaged") return "damaged";
  if (item.availability === "out-of-service") return "out-of-service";
  if (item.availability === "reserved") return "reserved";
  if (position.available <= 0) return "none-left";
  return "ready";
}

export const checkoutBlockMessages: Record<Exclude<CheckoutBlock, "ready">, string> = {
  retired: "This has been retired from the store.",
  damaged: "This is damaged, so it cannot go out until it is repaired.",
  "out-of-service": "This is out of service, so it cannot go out.",
  reserved: "This is reserved. Change its availability before lending it elsewhere.",
  "none-left": "Every unit is already out on loan.",
};

/** Stable, readable ids for the seeded store. */
export function equipmentSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
