import * as activityStore from "@/lib/activities/store";
import { formatTimeRange } from "@/lib/activities/types";
import * as userStore from "@/lib/auth/store";
import type { Role } from "@/lib/auth/types";
import * as campStore from "@/lib/camps/store";
import { isUpcoming as campUpcoming } from "@/lib/camps/types";
import {
  applyEquipmentQuery,
  type EquipmentPage,
  type EquipmentQuery,
} from "@/lib/equipment/query";
import * as store from "@/lib/equipment/store";
import {
  checkoutBlock,
  checkoutBlockMessages,
  conditionBlocksLoan,
  isOpen,
  isOverdue,
  totalOwned,
  type CheckoutBlock,
  type EquipmentDetails,
  type EquipmentItem,
  type EquipmentLoan,
  type HolderKind,
  type StockPosition,
} from "@/lib/equipment/types";
import { formatShortDate } from "@/lib/format";
import type { FieldErrors } from "@/lib/validation";

/**
 * Equipment rules, and everything that spans the store, the loans, activities,
 * camps and accounts.
 *
 * Three decisions live here:
 *
 * - **Availability is derived, never stored.** How many units are out is
 *   arithmetic over the open loans; the item only records the quartermaster's
 *   decision about whether the line may go out at all.
 * - **Stock only moves through named operations.** Units leave `quantity` in
 *   the same write that adds them to `damaged` or `lost`, so the three counts
 *   cannot drift apart.
 * - **Removing is retiring.** Loans point at items, and the history of what
 *   went where is the point of an inventory, so an item is withdrawn rather
 *   than deleted - and it can come back.
 *
 * Node-only.
 */

export type ServiceResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

function failure(message: string, fieldErrors?: FieldErrors): ServiceResult<never> {
  return { ok: false, message, fieldErrors };
}

/* -------------------------------- positions ------------------------------- */

/** Units out on loan, per item id. */
async function onLoanMap(): Promise<Map<string, number>> {
  const loans = await store.allLoans();
  const out = new Map<string, number>();

  for (const loan of loans) {
    if (!isOpen(loan)) continue;
    out.set(loan.itemId, (out.get(loan.itemId) ?? 0) + loan.quantity);
  }

  return out;
}

function positionOf(item: EquipmentItem, onLoan: number): StockPosition {
  return {
    quantity: item.quantity,
    onLoan,
    available: Math.max(0, item.quantity - onLoan),
    damaged: item.damaged,
    lost: item.lost,
  };
}

/* --------------------------------- queries -------------------------------- */

export interface EquipmentRow {
  item: EquipmentItem;
  position: StockPosition;
}

export interface EquipmentListing extends EquipmentPage {
  positions: Record<string, StockPosition>;
}

export async function listEquipment(query: EquipmentQuery): Promise<EquipmentListing> {
  const [items, onLoan] = await Promise.all([store.allItems(), onLoanMap()]);
  const page = applyEquipmentQuery(items, query, onLoan);

  const positions: Record<string, StockPosition> = {};
  for (const item of page.items) {
    positions[item.id] = positionOf(item, onLoan.get(item.id) ?? 0);
  }

  return { ...page, positions };
}

/** Who or what has the kit, resolved to something readable. */
export interface LoanHolder {
  kind: HolderKind;
  id: string;
  name: string;
  /** Where the holder can be opened, when it has a page of its own. */
  href: string | null;
  /** Dates or role, whichever fits the kind. */
  detail: string;
}

export interface LoanRow {
  loan: EquipmentLoan;
  holder: LoanHolder;
  checkedOutByName: string;
  returnedByName: string | null;
  overdue: boolean;
}

async function resolveHolders(loans: EquipmentLoan[]): Promise<Map<string, LoanHolder>> {
  const needs = { leader: false, activity: false, camp: false };
  for (const loan of loans) needs[loan.holderKind] = true;

  const [users, activities, camps] = await Promise.all([
    needs.leader ? userStore.listUsers() : Promise.resolve([]),
    needs.activity ? activityStore.allActivities() : Promise.resolve([]),
    needs.camp ? campStore.allCamps() : Promise.resolve([]),
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const activityById = new Map(activities.map((activity) => [activity.id, activity]));
  const campById = new Map(camps.map((camp) => [camp.id, camp]));

  const holders = new Map<string, LoanHolder>();

  for (const loan of loans) {
    const key = `${loan.holderKind}:${loan.holderId}`;
    if (holders.has(key)) continue;

    if (loan.holderKind === "leader") {
      const user = userById.get(loan.holderId);
      holders.set(key, {
        kind: "leader",
        id: loan.holderId,
        name: user?.name ?? "Unknown leader",
        href: null,
        detail: user?.email ?? "",
      });
      continue;
    }

    if (loan.holderKind === "activity") {
      const activity = activityById.get(loan.holderId);
      holders.set(key, {
        kind: "activity",
        id: loan.holderId,
        name: activity?.name ?? "Unknown activity",
        href: activity ? `/activities/${activity.id}` : null,
        detail: activity
          ? `${formatShortDate(activity.date)} · ${formatTimeRange(activity)}`
          : "",
      });
      continue;
    }

    const camp = campById.get(loan.holderId);
    holders.set(key, {
      kind: "camp",
      id: loan.holderId,
      name: camp?.name ?? "Unknown camp",
      href: camp ? `/camps/${camp.id}` : null,
      detail: camp ? `${formatShortDate(camp.startDate)} · ${camp.location}` : "",
    });
  }

  return holders;
}

async function toRows(loans: EquipmentLoan[], now: Date): Promise<LoanRow[]> {
  const [holders, users] = await Promise.all([resolveHolders(loans), userStore.listUsers()]);
  const names = new Map(users.map((user) => [user.id, user.name]));

  return loans.map((loan) => ({
    loan,
    holder:
      holders.get(`${loan.holderKind}:${loan.holderId}`) ??
      { kind: loan.holderKind, id: loan.holderId, name: "Unknown", href: null, detail: "" },
    checkedOutByName: names.get(loan.checkedOutBy) ?? "Unknown",
    returnedByName: loan.returnedBy ? (names.get(loan.returnedBy) ?? "Unknown") : null,
    overdue: isOverdue(loan, now),
  }));
}

export interface ItemWithDetails {
  item: EquipmentItem;
  position: StockPosition;
  totalOwned: number;
  /** Open loans, longest out first. */
  out: LoanRow[];
  /** Closed loans, most recently returned first. */
  history: LoanRow[];
  block: CheckoutBlock;
  blockMessage: string | null;
}

export async function getItem(id: string, now: Date): Promise<ItemWithDetails | null> {
  const item = await store.findItem(id);
  if (!item) return null;

  const loans = await store.loansForItem(id);
  const rows = await toRows(loans, now);

  const out = rows
    .filter((row) => isOpen(row.loan))
    .sort((a, b) => a.loan.checkedOutAt.localeCompare(b.loan.checkedOutAt));
  const history = rows
    .filter((row) => !isOpen(row.loan))
    .sort((a, b) => (b.loan.returnedAt ?? "").localeCompare(a.loan.returnedAt ?? ""));

  const onLoan = out.reduce((sum, row) => sum + row.loan.quantity, 0);
  const position = positionOf(item, onLoan);
  const block = checkoutBlock(item, position);

  return {
    item,
    position,
    totalOwned: totalOwned(item),
    out,
    history,
    block,
    blockMessage: block === "ready" ? null : checkoutBlockMessages[block],
  };
}

/** Everything currently out, for the store's "who has what" view. */
export async function openLoans(now: Date): Promise<(LoanRow & { item: EquipmentItem })[]> {
  const [loans, items] = await Promise.all([store.allLoans(), store.allItems()]);
  const byId = new Map(items.map((item) => [item.id, item]));

  const open = loans.filter(isOpen);
  const rows = await toRows(open, now);

  return rows
    .map((row) => {
      const item = byId.get(row.loan.itemId);
      return item ? { ...row, item } : null;
    })
    .filter((row): row is LoanRow & { item: EquipmentItem } => row !== null)
    .sort((a, b) => {
      // Overdue first, then whatever is due soonest.
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (a.loan.dueBack === null) return b.loan.dueBack === null ? 0 : 1;
      if (b.loan.dueBack === null) return -1;
      return a.loan.dueBack.localeCompare(b.loan.dueBack);
    });
}

/** What is booked out to one activity or camp, for its own page. */
export async function loansForHolder(
  holderKind: HolderKind,
  holderId: string,
  now: Date,
): Promise<(LoanRow & { item: EquipmentItem })[]> {
  const [loans, items] = await Promise.all([store.allLoans(), store.allItems()]);
  const byId = new Map(items.map((item) => [item.id, item]));

  const mine = loans.filter(
    (loan) => loan.holderKind === holderKind && loan.holderId === holderId,
  );
  const rows = await toRows(mine, now);

  return rows
    .map((row) => {
      const item = byId.get(row.loan.itemId);
      return item ? { ...row, item } : null;
    })
    .filter((row): row is LoanRow & { item: EquipmentItem } => row !== null)
    .sort((a, b) => {
      if (isOpen(a.loan) !== isOpen(b.loan)) return isOpen(a.loan) ? -1 : 1;
      return a.item.name.localeCompare(b.item.name);
    });
}

export interface EquipmentSummary {
  /** Items on the books, retired ones excluded. */
  items: number;
  /** Serviceable units across every item. */
  units: number;
  onLoan: number;
  damaged: number;
  lost: number;
  needingAttention: number;
  overdue: number;
  retired: number;
}

export async function equipmentSummary(now: Date): Promise<EquipmentSummary> {
  const [items, loans] = await Promise.all([store.allItems(), store.allLoans()]);

  let unitCount = 0;
  let damaged = 0;
  let lost = 0;
  let needingAttention = 0;
  let retired = 0;
  let active = 0;

  for (const item of items) {
    if (item.condition === "retired") {
      retired += 1;
      continue;
    }
    active += 1;
    unitCount += item.quantity;
    damaged += item.damaged;
    lost += item.lost;
    if (item.condition === "needs-maintenance" || item.condition === "damaged") {
      needingAttention += 1;
    }
  }

  const open = loans.filter(isOpen);

  return {
    items: active,
    units: unitCount,
    onLoan: open.reduce((sum, loan) => sum + loan.quantity, 0),
    damaged,
    lost,
    needingAttention,
    overdue: open.filter((loan) => isOverdue(loan, now)).length,
    retired,
  };
}

/** The sidebar badge: loans that are late back, which is what needs chasing. */
export async function countOverdueLoans(now: Date): Promise<number> {
  const loans = await store.allLoans();
  return loans.filter((loan) => isOpen(loan) && isOverdue(loan, now)).length;
}

/* ------------------------------ checkout targets --------------------------- */

export interface CheckoutTarget {
  kind: HolderKind;
  id: string;
  name: string;
  detail: string;
}

export interface CheckoutTargets {
  leaders: (CheckoutTarget & { role: Role })[];
  activities: CheckoutTarget[];
  camps: CheckoutTarget[];
}

/**
 * Who kit can go to: any leader, plus the activities and camps still to come.
 *
 * Past events are left out - booking a stove out to last month's meeting would
 * be a mistake nobody meant to make.
 */
export async function checkoutTargets(now: Date): Promise<CheckoutTargets> {
  const [users, activities, camps] = await Promise.all([
    userStore.listUsers(),
    activityStore.allActivities(),
    campStore.allCamps(),
  ]);

  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).getTime();

  return {
    leaders: users.map((user) => ({
      kind: "leader" as const,
      id: user.id,
      name: user.name,
      detail: user.email,
      role: user.role,
    })),
    activities: activities
      .filter(
        (activity) =>
          activity.status !== "cancelled" &&
          new Date(`${activity.date}T00:00:00.000Z`).getTime() >= today,
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((activity) => ({
        kind: "activity" as const,
        id: activity.id,
        name: activity.name,
        detail: `${formatShortDate(activity.date)} · ${activity.location}`,
      })),
    camps: camps
      .filter((camp) => campUpcoming(camp, now))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((camp) => ({
        kind: "camp" as const,
        id: camp.id,
        name: camp.name,
        detail: `${formatShortDate(camp.startDate)} · ${camp.location}`,
      })),
  };
}

/* ------------------------------- item changes ------------------------------ */

export async function addItem(details: EquipmentDetails): Promise<ServiceResult<EquipmentItem>> {
  return { ok: true, data: await store.createItem(details) };
}

export async function editItem(
  id: string,
  details: EquipmentDetails,
): Promise<ServiceResult<EquipmentItem>> {
  const item = await store.findItem(id);
  if (!item) return failure("That item could not be found.");

  const onLoan = (await onLoanMap()).get(id) ?? 0;
  // Cutting the count below what is already out would leave a loan that cannot
  // be explained, so it is refused rather than silently allowed.
  if (details.quantity < onLoan) {
    return failure(
      `${onLoan} ${onLoan === 1 ? "unit is" : "units are"} out on loan, so the quantity cannot be ${details.quantity}.`,
      { quantity: `Cannot be fewer than the ${onLoan} currently out.` },
    );
  }

  const updated = await store.updateItem(id, {
    ...details,
    retiredAt:
      details.condition === "retired" ? (item.retiredAt ?? new Date().toISOString()) : null,
  });
  if (!updated) return failure("That item could not be found.");

  return { ok: true, data: updated };
}

/**
 * Retiring is how kit is removed.
 *
 * The loans point at items and the history of what went where is most of the
 * value of an inventory, so nothing is deleted. Retired kit drops out of the
 * default list and cannot go out again until it is brought back.
 */
export async function retireItem(id: string, reason: string): Promise<ServiceResult<EquipmentItem>> {
  const item = await store.findItem(id);
  if (!item) return failure("That item could not be found.");
  if (item.condition === "retired") return failure("That item is already retired.");

  const onLoan = (await onLoanMap()).get(id) ?? 0;
  if (onLoan > 0) {
    return failure(
      `${onLoan} ${onLoan === 1 ? "unit is" : "units are"} still out on loan. Take them back in first.`,
    );
  }

  const trimmed = reason.trim().slice(0, 300);
  const updated = await store.updateItem(id, {
    condition: "retired",
    availability: "out-of-service",
    retiredAt: new Date().toISOString(),
    notes: trimmed ? [item.notes, trimmed].filter(Boolean).join("\n\n") : item.notes,
  });
  if (!updated) return failure("That item could not be found.");

  return { ok: true, data: updated };
}

export async function returnToService(id: string): Promise<ServiceResult<EquipmentItem>> {
  const item = await store.findItem(id);
  if (!item) return failure("That item could not be found.");
  if (item.condition !== "retired") return failure("That item is not retired.");

  const updated = await store.updateItem(id, {
    condition: "good",
    availability: "available",
    retiredAt: null,
  });
  if (!updated) return failure("That item could not be found.");

  return { ok: true, data: updated };
}

/* --------------------------------- loans ---------------------------------- */

export interface CheckoutRequest {
  itemId: string;
  quantity: number;
  holderKind: HolderKind;
  holderId: string;
  dueBack: string | null;
  note: string;
}

export async function checkOut(
  request: CheckoutRequest,
  checkedOutBy: string,
): Promise<ServiceResult<EquipmentLoan>> {
  const item = await store.findItem(request.itemId);
  if (!item) return failure("That item could not be found.");

  if (conditionBlocksLoan(item.condition)) {
    return failure(
      item.condition === "retired"
        ? "That item has been retired from the store."
        : "That item is damaged, so it cannot go out until it is repaired.",
    );
  }
  if (item.availability !== "available") {
    return failure(
      item.availability === "reserved"
        ? "That item is reserved. Change its availability before lending it elsewhere."
        : "That item is out of service, so it cannot go out.",
    );
  }
  if (request.quantity < 1) return failure("Take out at least one unit.");

  const holderMissing = await holderInvalid(request.holderKind, request.holderId);
  if (holderMissing) return holderMissing;

  const result = await store.checkOut(
    { ...request, checkedOutBy },
    item.quantity,
  );

  if ("overBy" in result) {
    return failure(
      `That is ${result.overBy} more than the store has left. Take out fewer, or wait for some to come back.`,
    );
  }

  return { ok: true, data: result };
}

async function holderInvalid(
  kind: HolderKind,
  id: string,
): Promise<ServiceResult<never> | null> {
  if (!id) return failure("Choose who the kit is going to.");

  if (kind === "leader") {
    const user = await userStore.findById(id);
    return user ? null : failure("That leader no longer has an account.");
  }
  if (kind === "activity") {
    const activity = await activityStore.findActivity(id);
    return activity ? null : failure("That activity could not be found.");
  }

  const camp = await campStore.findCamp(id);
  return camp ? null : failure("That camp could not be found.");
}

/**
 * Books kit back in.
 *
 * The three numbers have to add up to what went out: anything not accounted
 * for would quietly vanish from the store. Damaged and lost units move out of
 * the serviceable count in the same operation.
 */
export async function returnLoan(
  loanId: string,
  split: { good: number; damaged: number; lost: number },
  returnedBy: string,
): Promise<ServiceResult<{ damaged: number; lost: number }>> {
  const loan = await store.findLoan(loanId);
  if (!loan) return failure("That loan could not be found.");
  if (!isOpen(loan)) return failure("That kit has already been booked back in.");

  const { good, damaged, lost } = split;
  if (good < 0 || damaged < 0 || lost < 0) return failure("Those numbers cannot be negative.");

  const total = good + damaged + lost;
  if (total !== loan.quantity) {
    return failure(
      `${loan.quantity} went out, so the numbers coming back have to add up to ${loan.quantity}. That adds up to ${total}.`,
    );
  }

  if (damaged > 0 || lost > 0) {
    const adjusted = await store.adjustStock(loan.itemId, {
      toDamaged: damaged,
      toLost: lost,
    });
    if (adjusted === null) return failure("That item could not be found.");
    if ("shortBy" in adjusted) {
      return failure("The store's counts do not add up. Check the item before booking it in.");
    }
  }

  const closed = await store.closeLoan(loanId, split, returnedBy);
  if (!closed) return failure("That loan could not be found.");

  return { ok: true, data: { damaged, lost } };
}

/** Damage or loss noticed in the store rather than on a loan's return. */
export async function recordDamageOrLoss(
  id: string,
  damaged: number,
  lost: number,
  note: string,
): Promise<ServiceResult<EquipmentItem>> {
  if (damaged < 0 || lost < 0) return failure("Those numbers cannot be negative.");
  if (damaged + lost === 0) return failure("Record at least one damaged or lost unit.");

  const item = await store.findItem(id);
  if (!item) return failure("That item could not be found.");

  const onLoan = (await onLoanMap()).get(id) ?? 0;
  const inStore = item.quantity - onLoan;
  if (damaged + lost > inStore) {
    return failure(
      `Only ${inStore} ${inStore === 1 ? "unit is" : "units are"} in the store right now. Book the rest back in first.`,
    );
  }

  const adjusted = await store.adjustStock(id, { toDamaged: damaged, toLost: lost });
  if (adjusted === null) return failure("That item could not be found.");
  if ("shortBy" in adjusted) {
    return failure(`There are only ${item.quantity} serviceable units to write off.`);
  }

  const trimmed = note.trim().slice(0, 300);
  if (trimmed) {
    await store.updateItem(id, {
      notes: [item.notes, trimmed].filter(Boolean).join("\n\n"),
    });
  }

  const updated = await store.findItem(id);
  return updated ? { ok: true, data: updated } : failure("That item could not be found.");
}

/** Puts repaired units back into the serviceable count. */
export async function recordRepair(
  id: string,
  quantity: number,
): Promise<ServiceResult<EquipmentItem>> {
  if (quantity < 1) return failure("Repair at least one unit.");

  const item = await store.findItem(id);
  if (!item) return failure("That item could not be found.");
  if (quantity > item.damaged) {
    return failure(
      `Only ${item.damaged} ${item.damaged === 1 ? "unit is" : "units are"} recorded as damaged.`,
    );
  }

  const adjusted = await store.adjustStock(id, { repaired: quantity });
  if (adjusted === null) return failure("That item could not be found.");
  if ("shortBy" in adjusted) return failure("There are not that many damaged units.");

  // A line with nothing broken left is fit to go out again.
  if (adjusted.damaged === 0 && adjusted.condition === "damaged") {
    const restored = await store.updateItem(id, {
      condition: "good",
      availability: adjusted.availability === "out-of-service" ? "available" : adjusted.availability,
    });
    if (restored) return { ok: true, data: restored };
  }

  return { ok: true, data: adjusted };
}
