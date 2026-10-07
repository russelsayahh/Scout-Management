import { randomUUID } from "node:crypto";

import * as activityStore from "@/lib/activities/store";
import * as userStore from "@/lib/auth/store";
import { inScope, type TroopScope } from "@/lib/auth/troop-scope";
import * as campStore from "@/lib/camps/store";
import type {
  AvailabilityStatus,
  EquipmentCategory,
  EquipmentCondition,
  EquipmentDetails,
  EquipmentItem,
  EquipmentLoan,
  HolderKind,
} from "@/lib/equipment/types";
import { equipmentSlug } from "@/lib/equipment/types";
import { createJsonStore } from "@/lib/json-store";
import { troopSlug } from "@/lib/troops/types";

/**
 * Equipment repository - the only module that knows how the store and its
 * loans are persisted.
 *
 * Two collections rather than one: an item is a long-lived stock line, a loan
 * is an event against it. Keeping loans separate means the history survives
 * every edit to the item, and closing a loan never rewrites the item's record.
 *
 * Node-only.
 */

const SEEDED_AT = "2026-01-15T09:00:00.000Z";

/* --------------------------------- items ---------------------------------- */

interface SeedItem {
  name: string;
  category: EquipmentCategory;
  quantity: number;
  damaged?: number;
  lost?: number;
  condition: EquipmentCondition;
  location: string;
  serialNumber?: string;
  purchaseDate?: string;
  notes?: string;
  availability?: AvailabilityStatus;
}

/** A troop's store, roughly as a quartermaster would have written it up. */
const SEED_ITEMS: SeedItem[] = [
  /* --------------------------------- tents -------------------------------- */
  {
    name: "Vango Force Ten patrol tent",
    category: "tents",
    quantity: 6,
    condition: "good",
    location: "Store room - tent rack",
    purchaseDate: "2022-05-14",
    notes: "Two sleep six. Check the guy lines before every camp.",
  },
  {
    name: "Lightweight backpacking tent",
    category: "tents",
    quantity: 8,
    condition: "good",
    location: "Store room - tent rack",
    purchaseDate: "2024-03-02",
    notes: "Two-person. Kept for expeditions rather than standing camps.",
  },
  {
    name: "Dining shelter",
    category: "tents",
    quantity: 1,
    damaged: 1,
    condition: "needs-maintenance",
    location: "Store room - tent rack",
    purchaseDate: "2019-06-20",
    notes: "One has a bent centre pole. Replacement pole is on order.",
  },

  /* -------------------------------- camping ------------------------------- */
  {
    name: "Sleeping mat",
    category: "camping",
    quantity: 24,
    condition: "good",
    location: "Store room - shelf A",
    purchaseDate: "2023-04-11",
  },
  {
    name: "Steel tent peg",
    category: "camping",
    quantity: 240,
    condition: "good",
    location: "Store room - shelf B",
    notes: "Counted in tens. Anything bent goes in the scrap bucket.",
  },
  {
    name: "Peg mallet",
    category: "camping",
    quantity: 8,
    condition: "good",
    location: "Store room - shelf B",
  },
  {
    name: "Rucksack 65L",
    category: "camping",
    quantity: 9,
    damaged: 1,
    condition: "good",
    location: "Store room - shelf C",
    purchaseDate: "2021-09-08",
    notes: "One came back from Snowdonia with a torn hip belt.",
  },
  {
    name: "Bivvy bag",
    category: "camping",
    quantity: 12,
    condition: "new",
    location: "Store room - shelf C",
    purchaseDate: "2026-06-30",
  },

  /* -------------------------------- cooking ------------------------------- */
  {
    name: "Trangia 27 stove set",
    category: "cooking",
    quantity: 8,
    condition: "good",
    location: "Kitchen cupboard",
    purchaseDate: "2023-02-17",
    notes: "One set per patrol. Check the burner seal each time.",
  },
  {
    name: "Gas burner",
    category: "cooking",
    quantity: 6,
    condition: "good",
    location: "Kitchen cupboard",
    notes: "Gas canisters are bought per camp, never stored in the hut.",
  },
  {
    name: "Dixie set",
    category: "cooking",
    quantity: 10,
    condition: "good",
    location: "Kitchen cupboard",
  },
  {
    name: "Water carrier 10L",
    category: "cooking",
    quantity: 6,
    condition: "good",
    location: "Kitchen cupboard",
  },
  {
    name: "Cool box",
    category: "cooking",
    quantity: 2,
    condition: "good",
    location: "Store room - floor",
    purchaseDate: "2020-07-01",
  },

  /* ------------------------------- first aid ------------------------------ */
  {
    name: "Patrol first aid kit",
    category: "first-aid",
    quantity: 8,
    condition: "needs-maintenance",
    location: "Office cupboard",
    notes: "Three need restocking - plasters and triangular bandages.",
  },
  {
    name: "Group first aid kit",
    category: "first-aid",
    quantity: 1,
    condition: "good",
    location: "Office cupboard",
    notes: "The big one. Goes to every camp.",
    availability: "reserved",
  },
  {
    name: "Burns kit",
    category: "first-aid",
    quantity: 2,
    condition: "new",
    location: "Kitchen cupboard",
    purchaseDate: "2026-05-19",
  },

  /* --------------------------------- tools -------------------------------- */
  {
    name: "Bow saw",
    category: "tools",
    quantity: 6,
    condition: "good",
    location: "Store room - tool rack",
    notes: "Blades are replaced each spring.",
  },
  {
    name: "Hand axe",
    category: "tools",
    quantity: 4,
    condition: "good",
    location: "Store room - locked cabinet",
    notes: "Signed out to a leader only, never straight to a scout.",
  },
  {
    name: "Pioneering pole",
    category: "tools",
    quantity: 40,
    condition: "good",
    location: "Outside store - pole rack",
  },
  {
    name: "Sisal rope 10m",
    category: "tools",
    quantity: 24,
    condition: "good",
    location: "Store room - shelf D",
  },

  /* -------------------------------- sports -------------------------------- */
  {
    name: "Football",
    category: "sports",
    quantity: 6,
    condition: "good",
    location: "Games box",
  },
  {
    name: "Rounders set",
    category: "sports",
    quantity: 2,
    condition: "good",
    location: "Games box",
  },

  /* ------------------------------- scouting ------------------------------- */
  {
    name: "Silva compass",
    category: "scouting",
    quantity: 20,
    condition: "good",
    location: "Office cupboard",
    purchaseDate: "2024-09-16",
    notes: "Numbered 1 to 20 on the base plate.",
  },
  {
    name: "Patrol flag",
    category: "scouting",
    quantity: 8,
    condition: "good",
    location: "Hut - flag rack",
  },
  {
    name: "Troop flag",
    category: "scouting",
    quantity: 1,
    condition: "good",
    location: "Hut - flag rack",
    notes: "Parade use only.",
    availability: "reserved",
  },

  /* ------------------------------ electronics ----------------------------- */
  {
    name: "Garmin eTrex 32x GPS",
    category: "electronics",
    quantity: 1,
    condition: "good",
    location: "Office cupboard",
    serialNumber: "GRM-ETX-4417",
    purchaseDate: "2025-01-22",
  },
  {
    name: "Two-way radio set",
    category: "electronics",
    quantity: 3,
    condition: "good",
    location: "Office cupboard",
    notes: "Four handsets per set, with chargers.",
  },
  {
    name: "Head torch",
    category: "electronics",
    quantity: 20,
    condition: "good",
    location: "Store room - shelf A",
    purchaseDate: "2025-10-05",
  },
  {
    name: "Projector",
    category: "electronics",
    quantity: 1,
    condition: "needs-maintenance",
    location: "Office cupboard",
    serialNumber: "EPS-EB-98122",
    purchaseDate: "2018-11-30",
    notes: "Lamp is dimming. Quote for a replacement is with the executive.",
    availability: "out-of-service",
  },

  /* --------------------------------- other -------------------------------- */
  {
    name: "Gazebo 3x3m",
    category: "other",
    quantity: 2,
    condition: "good",
    location: "Outside store",
  },
  {
    name: "Storage crate",
    category: "other",
    quantity: 15,
    condition: "good",
    location: "Store room - floor",
  },
  {
    name: "Calor gas cooker",
    category: "cooking",
    quantity: 0,
    lost: 0,
    condition: "retired",
    location: "Disposed of",
    purchaseDate: "2009-04-01",
    notes: "Failed its gas safety check in 2025 and was scrapped.",
    availability: "out-of-service",
  },
];

const itemStore = createJsonStore<EquipmentItem>("equipment.json", () =>
  SEED_ITEMS.map((entry) => ({
    id: equipmentSlug(entry.name),
    name: entry.name,
    category: entry.category,
    quantity: entry.quantity,
    damaged: entry.damaged ?? 0,
    lost: entry.lost ?? 0,
    condition: entry.condition,
    location: entry.location,
    serialNumber: entry.serialNumber ?? "",
    purchaseDate: entry.purchaseDate ?? "",
    notes: entry.notes ?? "",
    availability:
      entry.availability ?? (entry.condition === "retired" ? "out-of-service" : "available"),
    retiredAt: entry.condition === "retired" ? SEEDED_AT : null,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  })),
  { autoSeed: false },
);

/* --------------------------------- loans ---------------------------------- */

interface SeedLoan {
  item: string;
  quantity: number;
  holderKind: HolderKind;
  /** Slug for an activity or camp; an email for a leader. */
  holder: string;
  checkedOutAt: string;
  byEmail: string;
  dueBack?: string;
  note?: string;
  returned?: { at: string; good: number; damaged: number; lost: number };
}

const ADMIN = "admin@1striverside.org";
const LEADER = "priya.raman@1striverside.org";
const ASSISTANT = "tom.nowak@1striverside.org";

const SEED_LOANS: SeedLoan[] = [
  {
    item: "Trangia 27 stove set",
    quantity: 4,
    holderKind: "camp",
    holder: "autumn-survival-camp",
    checkedOutAt: "2026-08-24T18:00:00.000Z",
    byEmail: LEADER,
    dueBack: "2026-09-21",
    note: "One per patrol for the backwoods cooking session.",
  },
  {
    item: "Silva compass",
    quantity: 12,
    holderKind: "activity",
    holder: "navigation-and-map-skills",
    checkedOutAt: "2026-08-25T19:30:00.000Z",
    byEmail: LEADER,
    dueBack: "2026-09-06",
  },
  {
    item: "Patrol first aid kit",
    quantity: 2,
    holderKind: "activity",
    holder: "navigation-and-map-skills",
    checkedOutAt: "2026-08-25T19:30:00.000Z",
    byEmail: ASSISTANT,
    dueBack: "2026-09-06",
  },
  {
    item: "Garmin eTrex 32x GPS",
    quantity: 1,
    holderKind: "leader",
    holder: LEADER,
    checkedOutAt: "2026-07-28T17:00:00.000Z",
    byEmail: ADMIN,
    dueBack: "2026-08-14",
    note: "Borrowed to plan the Beacon Hill route.",
  },
  {
    item: "Football",
    quantity: 2,
    holderKind: "leader",
    holder: ASSISTANT,
    checkedOutAt: "2026-08-11T20:00:00.000Z",
    byEmail: ASSISTANT,
    note: "Living in the boot of the minibus for wide games.",
  },
  {
    item: "Rucksack 65L",
    quantity: 6,
    holderKind: "camp",
    holder: "summer-expedition",
    checkedOutAt: "2026-07-23T16:00:00.000Z",
    byEmail: ADMIN,
    dueBack: "2026-07-30",
    returned: { at: "2026-07-29T11:00:00.000Z", good: 5, damaged: 1, lost: 0 },
  },
  {
    item: "Head torch",
    quantity: 10,
    holderKind: "camp",
    holder: "spring-adventure-camp",
    checkedOutAt: "2026-04-16T18:00:00.000Z",
    byEmail: LEADER,
    dueBack: "2026-04-20",
    returned: { at: "2026-04-20T14:00:00.000Z", good: 10, damaged: 0, lost: 0 },
  },
];

/**
 * Who a loan belongs to, resolved from its holder.
 *
 * An activity or camp lends the loan its own troop directly. A leader is a
 * soft attribution rather than a hard boundary - equipment is not a strict
 * per-troop resource - so a leader assigned to several troops just gets the
 * first, and one with none (an administrator, say) falls back to Scouts.
 */
async function resolveHolderTroopId(holderKind: HolderKind, holderId: string): Promise<string> {
  if (holderKind === "activity") {
    const activity = await activityStore.findActivity(holderId);
    return activity?.troopId ?? troopSlug("Scouts");
  }
  if (holderKind === "camp") {
    const camp = await campStore.findCamp(holderId);
    return camp?.troopId ?? troopSlug("Scouts");
  }
  const user = await userStore.findById(holderId);
  return user?.assignedTroopIds[0] ?? troopSlug("Scouts");
}

/**
 * Backfills `troopId` on loans written before troops existed. Cannot live in a
 * `migrate` hook, the same as attendance's registers - resolving it means an
 * async read of the holder's own store.
 */
async function backfillLoanTroopIds(loans: EquipmentLoan[]): Promise<EquipmentLoan[]> {
  const missing = loans.filter((loan) => (loan as Partial<EquipmentLoan>).troopId === undefined);
  if (missing.length === 0) return loans;

  const resolved = new Map<string, string>();
  for (const loan of missing) {
    const key = `${loan.holderKind}:${loan.holderId}`;
    if (resolved.has(key)) continue;
    resolved.set(key, await resolveHolderTroopId(loan.holderKind, loan.holderId));
  }

  return loanStore.mutate((current) => {
    for (let index = 0; index < current.length; index += 1) {
      const loan = current[index];
      if ((loan as Partial<EquipmentLoan>).troopId !== undefined) continue;
      const troopId = resolved.get(`${loan.holderKind}:${loan.holderId}`);
      if (troopId !== undefined) current[index] = { ...loan, troopId };
    }
    return current;
  });
}

const loanStore = createJsonStore<EquipmentLoan>("equipment-loans.json", async () => {
  const users = await userStore.listUsers();
  const byEmail = new Map(users.map((user) => [user.email, user.id]));
  const fallback = users[0]?.id ?? "";

  return Promise.all(
    SEED_LOANS.map(async (entry, index) => {
      const checkedOutBy = byEmail.get(entry.byEmail) ?? fallback;
      const holderId =
        entry.holderKind === "leader"
          ? (byEmail.get(entry.holder) ?? fallback)
          : entry.holder;
      const troopId = await resolveHolderTroopId(entry.holderKind, holderId);

      return {
        id: `seed-loan-${index + 1}`,
        itemId: equipmentSlug(entry.item),
        quantity: entry.quantity,
        holderKind: entry.holderKind,
        holderId,
        troopId,
        checkedOutAt: entry.checkedOutAt,
        checkedOutBy,
        dueBack: entry.dueBack ?? null,
        note: entry.note ?? "",
        returnedAt: entry.returned?.at ?? null,
        returnedBy: entry.returned ? checkedOutBy : null,
        returnedGood: entry.returned?.good ?? 0,
        returnedDamaged: entry.returned?.damaged ?? 0,
        returnedLost: entry.returned?.lost ?? 0,
      };
    }),
  );
}, { autoSeed: false });

/* --------------------------------- queries -------------------------------- */

export async function allItems(): Promise<EquipmentItem[]> {
  return itemStore.all();
}

export async function findItem(id: string): Promise<EquipmentItem | null> {
  const items = await itemStore.all();
  return items.find((item) => item.id === id) ?? null;
}

export async function allLoans(): Promise<EquipmentLoan[]> {
  return backfillLoanTroopIds(await loanStore.all());
}

/** Loans visible under `scope` - every loan for an admin, or just the caller's troop(s) otherwise. */
export async function loansInScope(scope: TroopScope): Promise<EquipmentLoan[]> {
  const loans = await allLoans();
  return loans.filter((loan) => inScope(scope, loan.troopId));
}

export async function loansForItem(itemId: string): Promise<EquipmentLoan[]> {
  const loans = await allLoans();
  return loans.filter((loan) => loan.itemId === itemId);
}

/* ------------------------------ item mutations ----------------------------- */

export async function createItem(details: EquipmentDetails): Promise<EquipmentItem> {
  return itemStore.mutate((items) => {
    const now = new Date().toISOString();
    const item: EquipmentItem = {
      ...details,
      name: details.name.trim(),
      location: details.location.trim(),
      serialNumber: details.serialNumber.trim(),
      notes: details.notes.trim(),
      id: randomUUID(),
      damaged: 0,
      lost: 0,
      retiredAt: details.condition === "retired" ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    items.push(item);
    return item;
  });
}

/** Returns the updated item, or null when the id no longer exists. */
export async function updateItem(
  id: string,
  changes: Partial<Omit<EquipmentItem, "id" | "createdAt">>,
): Promise<EquipmentItem | null> {
  return itemStore.mutate((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const next: EquipmentItem = {
      ...items[index],
      ...changes,
      updatedAt: new Date().toISOString(),
    };
    if (changes.name !== undefined) next.name = changes.name.trim();
    if (changes.location !== undefined) next.location = changes.location.trim();
    if (changes.serialNumber !== undefined) next.serialNumber = changes.serialNumber.trim();
    if (changes.notes !== undefined) next.notes = changes.notes.trim();

    items[index] = next;
    return next;
  });
}

/**
 * Moves units between the serviceable, damaged and lost counts in one write.
 *
 * Every write-off goes through here so the three numbers can never drift: a
 * unit leaves `quantity` in the same operation that adds it to `damaged` or
 * `lost`. Returns null when the item is gone, or the shortfall when there are
 * not enough serviceable units to move.
 */
export async function adjustStock(
  id: string,
  change: { toDamaged?: number; toLost?: number; repaired?: number },
): Promise<EquipmentItem | { shortBy: number } | null> {
  return itemStore.mutate((items) => {
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const item = items[index];
    const toDamaged = change.toDamaged ?? 0;
    const toLost = change.toLost ?? 0;
    const repaired = change.repaired ?? 0;

    const leaving = toDamaged + toLost;
    if (leaving > item.quantity) return { shortBy: leaving - item.quantity };
    if (repaired > item.damaged) return { shortBy: repaired - item.damaged };

    const next: EquipmentItem = {
      ...item,
      quantity: item.quantity - leaving + repaired,
      damaged: item.damaged + toDamaged - repaired,
      lost: item.lost + toLost,
      updatedAt: new Date().toISOString(),
    };

    items[index] = next;
    return next;
  });
}

/* ------------------------------ loan mutations ----------------------------- */

export interface CheckoutInput {
  itemId: string;
  quantity: number;
  holderKind: HolderKind;
  holderId: string;
  dueBack: string | null;
  note: string;
  checkedOutBy: string;
}

/**
 * Books units out.
 *
 * The available count is recomputed inside the lock from the loans themselves,
 * so two quartermasters taking the last stove at the same moment cannot both
 * succeed.
 */
export async function checkOut(
  input: CheckoutInput,
  quantityOwned: number,
): Promise<EquipmentLoan | { overBy: number }> {
  // Resolved before the lock: it only reads the holder, which the checkout
  // itself never changes.
  const troopId = await resolveHolderTroopId(input.holderKind, input.holderId);

  return loanStore.mutate((loans) => {
    const onLoan = loans
      .filter((loan) => loan.itemId === input.itemId && loan.returnedAt === null)
      .reduce((sum, loan) => sum + loan.quantity, 0);

    const available = quantityOwned - onLoan;
    if (input.quantity > available) return { overBy: input.quantity - available };

    const loan: EquipmentLoan = {
      id: randomUUID(),
      itemId: input.itemId,
      quantity: input.quantity,
      holderKind: input.holderKind,
      holderId: input.holderId,
      troopId,
      checkedOutAt: new Date().toISOString(),
      checkedOutBy: input.checkedOutBy,
      dueBack: input.dueBack,
      note: input.note.trim().slice(0, 200),
      returnedAt: null,
      returnedBy: null,
      returnedGood: 0,
      returnedDamaged: 0,
      returnedLost: 0,
    };

    loans.push(loan);
    return loan;
  });
}

export async function closeLoan(
  loanId: string,
  split: { good: number; damaged: number; lost: number },
  returnedBy: string,
): Promise<EquipmentLoan | null> {
  return loanStore.mutate((loans) => {
    const index = loans.findIndex((loan) => loan.id === loanId);
    if (index === -1) return null;

    const next: EquipmentLoan = {
      ...loans[index],
      returnedAt: new Date().toISOString(),
      returnedBy,
      returnedGood: split.good,
      returnedDamaged: split.damaged,
      returnedLost: split.lost,
    };

    loans[index] = next;
    return next;
  });
}

export async function findLoan(loanId: string): Promise<EquipmentLoan | null> {
  const loans = await allLoans();
  return loans.find((loan) => loan.id === loanId) ?? null;
}
