import {
  AVAILABILITY_STATUSES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  availabilityLabels,
  categoryLabels,
  conditionLabels,
  type AvailabilityStatus,
  type EquipmentCategory,
  type EquipmentCondition,
  type EquipmentItem,
} from "@/lib/equipment/types";

/**
 * Search, filter, sort and pagination for the store.
 *
 * Pure, and entirely described by the URL, so a filtered view is shareable and
 * the back button works. No server-only imports - the filter bar uses it too.
 */

export type EquipmentSort = "name" | "category" | "quantity" | "condition" | "location";
export type SortDirection = "asc" | "desc";
/** Retired kit is hidden by default rather than deleted. */
export type RetiredFilter = "current" | "retired" | "all";

export const EQUIPMENT_SORTS: readonly EquipmentSort[] = [
  "name",
  "category",
  "quantity",
  "condition",
  "location",
];

export const sortLabels: Record<EquipmentSort, string> = {
  name: "Item",
  category: "Category",
  quantity: "In store",
  condition: "Condition",
  location: "Location",
};

export const retiredFilterLabels: Record<RetiredFilter, string> = {
  current: "In the store",
  retired: "Retired only",
  all: "Everything",
};

export interface EquipmentQuery {
  q: string;
  category: EquipmentCategory | "all";
  condition: EquipmentCondition | "all";
  availability: AvailabilityStatus | "all";
  retired: RetiredFilter;
  /** Only kit that has units out on loan right now. */
  onLoanOnly: boolean;
  sort: EquipmentSort;
  dir: SortDirection;
  page: number;
}

export const DEFAULT_EQUIPMENT_QUERY: EquipmentQuery = {
  q: "",
  category: "all",
  condition: "all",
  availability: "all",
  retired: "current",
  onLoanOnly: false,
  sort: "name",
  dir: "asc",
  page: 1,
};

export const PAGE_SIZE = 15;

type RawParams = Record<string, string | string[] | undefined>;

function single(params: RawParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseEquipmentQuery(params: RawParams): EquipmentQuery {
  const category = single(params, "category");
  const condition = single(params, "condition");
  const availability = single(params, "availability");
  const retired = single(params, "retired");
  const sort = single(params, "sort");
  const dir = single(params, "dir");
  const page = Number.parseInt(single(params, "page"), 10);

  return {
    q: single(params, "q").slice(0, 100),
    category: EQUIPMENT_CATEGORIES.includes(category as EquipmentCategory)
      ? (category as EquipmentCategory)
      : "all",
    condition: EQUIPMENT_CONDITIONS.includes(condition as EquipmentCondition)
      ? (condition as EquipmentCondition)
      : "all",
    availability: AVAILABILITY_STATUSES.includes(availability as AvailabilityStatus)
      ? (availability as AvailabilityStatus)
      : "all",
    retired: retired === "retired" || retired === "all" ? retired : "current",
    onLoanOnly: single(params, "out") === "1",
    sort: EQUIPMENT_SORTS.includes(sort as EquipmentSort)
      ? (sort as EquipmentSort)
      : DEFAULT_EQUIPMENT_QUERY.sort,
    dir: dir === "desc" ? "desc" : "asc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Serialises a query, omitting anything left at its default to keep URLs short. */
export function equipmentQueryToSearchParams(query: EquipmentQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.category !== "all") params.set("category", query.category);
  if (query.condition !== "all") params.set("condition", query.condition);
  if (query.availability !== "all") params.set("availability", query.availability);
  if (query.retired !== DEFAULT_EQUIPMENT_QUERY.retired) params.set("retired", query.retired);
  if (query.onLoanOnly) params.set("out", "1");
  if (query.sort !== DEFAULT_EQUIPMENT_QUERY.sort) params.set("sort", query.sort);
  if (query.dir !== DEFAULT_EQUIPMENT_QUERY.dir) params.set("dir", query.dir);
  if (query.page > 1) params.set("page", String(query.page));

  return params;
}

export function equipmentHref(query: EquipmentQuery): string {
  const search = equipmentQueryToSearchParams(query).toString();
  return search ? `/equipment?${search}` : "/equipment";
}

/** True when anything is narrowing the list, so the UI can offer a reset. */
export function isFiltered(query: EquipmentQuery): boolean {
  return (
    query.q.trim() !== "" ||
    query.category !== "all" ||
    query.condition !== "all" ||
    query.availability !== "all" ||
    query.onLoanOnly ||
    query.retired !== DEFAULT_EQUIPMENT_QUERY.retired
  );
}

/* --------------------------------- matching -------------------------------- */

function matchesSearch(item: EquipmentItem, needle: string): boolean {
  if (!needle) return true;

  const haystack = [
    item.name,
    item.location,
    item.serialNumber,
    item.notes,
    categoryLabels[item.category],
    conditionLabels[item.condition],
    availabilityLabels[item.availability],
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

const collator = new Intl.Collator("en-GB", { sensitivity: "base", numeric: true });

/** Sort order for condition, so "sort by condition" reads worst-first. */
const conditionOrder: Record<EquipmentCondition, number> = {
  damaged: 0,
  "needs-maintenance": 1,
  good: 2,
  new: 3,
  retired: 4,
};

function compare(a: EquipmentItem, b: EquipmentItem, sort: EquipmentSort): number {
  switch (sort) {
    case "name":
      return collator.compare(a.name, b.name);
    case "category":
      return (
        collator.compare(categoryLabels[a.category], categoryLabels[b.category]) ||
        collator.compare(a.name, b.name)
      );
    case "quantity":
      return a.quantity - b.quantity || collator.compare(a.name, b.name);
    case "condition":
      return (
        conditionOrder[a.condition] - conditionOrder[b.condition] ||
        collator.compare(a.name, b.name)
      );
    case "location":
      return collator.compare(a.location, b.location) || collator.compare(a.name, b.name);
  }
}

export interface EquipmentPage {
  items: EquipmentItem[];
  /** Matches before pagination. */
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/**
 * Applies the whole query - filter, then sort, then page.
 *
 * `onLoan` is passed in rather than looked up, because it is arithmetic over
 * the loans and this module stays pure.
 */
export function applyEquipmentQuery(
  items: EquipmentItem[],
  query: EquipmentQuery,
  onLoan: ReadonlyMap<string, number>,
): EquipmentPage {
  const needle = query.q.trim().toLowerCase();

  const filtered = items.filter((item) => {
    const retired = item.condition === "retired";
    if (query.retired === "current" && retired) return false;
    if (query.retired === "retired" && !retired) return false;

    if (query.category !== "all" && item.category !== query.category) return false;
    if (query.condition !== "all" && item.condition !== query.condition) return false;
    if (query.availability !== "all" && item.availability !== query.availability) return false;
    if (query.onLoanOnly && (onLoan.get(item.id) ?? 0) === 0) return false;

    return matchesSearch(item, needle);
  });

  const direction = query.dir === "desc" ? -1 : 1;
  const sorted = [...filtered].sort((a, b) => compare(a, b, query.sort) * direction);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), pageCount);
  const start = (page - 1) * PAGE_SIZE;

  return {
    items: sorted.slice(start, start + PAGE_SIZE),
    total: sorted.length,
    page,
    pageCount,
    pageSize: PAGE_SIZE,
  };
}
