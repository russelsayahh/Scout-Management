import {
  PATROLS,
  SCOUT_STATUSES,
  scoutFullName,
  type Patrol,
  type Scout,
  type ScoutStatus,
} from "@/lib/scouts/types";

/**
 * Search, filter, sort and pagination for the scout list.
 *
 * All of it is pure and lives in the URL, so a filtered view is shareable, the
 * back button works, and the server can render the exact same result the link
 * describes. No server-only imports here - the filter bar uses it too.
 */

export type ScoutSort = "name" | "patrol" | "status" | "age" | "joined";
export type SortDirection = "asc" | "desc";
/** Archived records are hidden by default rather than deleted. */
export type ArchivedFilter = "current" | "archived" | "all";

export const SCOUT_SORTS: readonly ScoutSort[] = ["name", "patrol", "status", "age", "joined"];

export const scoutSortLabels: Record<ScoutSort, string> = {
  name: "Name",
  patrol: "Patrol",
  status: "Status",
  age: "Age",
  joined: "Joined",
};

export const archivedFilterLabels: Record<ArchivedFilter, string> = {
  current: "Current scouts",
  archived: "Archived only",
  all: "All records",
};

export interface ScoutQuery {
  q: string;
  status: ScoutStatus | "all";
  patrol: Patrol | "all";
  archived: ArchivedFilter;
  sort: ScoutSort;
  dir: SortDirection;
  page: number;
}

export const DEFAULT_SCOUT_QUERY: ScoutQuery = {
  q: "",
  status: "all",
  patrol: "all",
  archived: "current",
  sort: "name",
  dir: "asc",
  page: 1,
};

export const PAGE_SIZE = 12;

type RawParams = Record<string, string | string[] | undefined>;

function single(params: RawParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Reads a query from URL search params, falling back to defaults for anything invalid. */
export function parseScoutQuery(params: RawParams): ScoutQuery {
  const status = single(params, "status");
  const patrol = single(params, "patrol");
  const archived = single(params, "archived");
  const sort = single(params, "sort");
  const dir = single(params, "dir");
  const page = Number.parseInt(single(params, "page"), 10);

  return {
    q: single(params, "q").slice(0, 100),
    status: SCOUT_STATUSES.includes(status as ScoutStatus)
      ? (status as ScoutStatus)
      : "all",
    patrol: PATROLS.includes(patrol as Patrol) ? (patrol as Patrol) : "all",
    archived:
      archived === "archived" || archived === "all" ? archived : DEFAULT_SCOUT_QUERY.archived,
    sort: SCOUT_SORTS.includes(sort as ScoutSort) ? (sort as ScoutSort) : DEFAULT_SCOUT_QUERY.sort,
    dir: dir === "desc" ? "desc" : "asc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Serialises a query, omitting anything left at its default to keep URLs short. */
export function scoutQueryToSearchParams(query: ScoutQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.status !== "all") params.set("status", query.status);
  if (query.patrol !== "all") params.set("patrol", query.patrol);
  if (query.archived !== DEFAULT_SCOUT_QUERY.archived) params.set("archived", query.archived);
  if (query.sort !== DEFAULT_SCOUT_QUERY.sort) params.set("sort", query.sort);
  if (query.dir !== DEFAULT_SCOUT_QUERY.dir) params.set("dir", query.dir);
  if (query.page > 1) params.set("page", String(query.page));

  return params;
}

export function scoutsHref(query: ScoutQuery): string {
  const params = scoutQueryToSearchParams(query);
  const search = params.toString();
  return search ? `/scouts?${search}` : "/scouts";
}

/** True when anything is narrowing the list, so the UI can offer a reset. */
export function isFiltered(query: ScoutQuery): boolean {
  return (
    query.q.trim() !== "" ||
    query.status !== "all" ||
    query.patrol !== "all" ||
    query.archived !== DEFAULT_SCOUT_QUERY.archived
  );
}

/* --------------------------------- matching -------------------------------- */

function matchesSearch(scout: Scout, needle: string): boolean {
  if (!needle) return true;

  const haystack = [
    scout.firstName,
    scout.lastName,
    scoutFullName(scout),
    scout.email,
    scout.phone,
    scout.patrol,
    scout.emergencyContactName,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

const collator = new Intl.Collator("en-GB", { sensitivity: "base", numeric: true });

function compare(a: Scout, b: Scout, sort: ScoutSort): number {
  switch (sort) {
    case "name":
      return (
        collator.compare(a.firstName, b.firstName) || collator.compare(a.lastName, b.lastName)
      );
    case "patrol":
      return collator.compare(a.patrol, b.patrol) || collator.compare(a.firstName, b.firstName);
    case "status":
      return collator.compare(a.status, b.status) || collator.compare(a.firstName, b.firstName);
    case "age":
      // Older first when ascending, which reads as "oldest to youngest".
      return a.dateOfBirth.localeCompare(b.dateOfBirth);
    case "joined":
      return a.joinDate.localeCompare(b.joinDate);
  }
}

export interface ScoutPage {
  items: Scout[];
  /** Matches before pagination. */
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/** Applies the whole query - filter, then sort, then page. */
export function applyScoutQuery(scouts: Scout[], query: ScoutQuery): ScoutPage {
  const needle = query.q.trim().toLowerCase();

  const filtered = scouts.filter((scout) => {
    if (query.archived === "current" && scout.archived) return false;
    if (query.archived === "archived" && !scout.archived) return false;
    if (query.status !== "all" && scout.status !== query.status) return false;
    if (query.patrol !== "all" && scout.patrol !== query.patrol) return false;
    return matchesSearch(scout, needle);
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
