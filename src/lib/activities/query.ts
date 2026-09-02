import {
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES,
  activityStartsAt,
  activityTypeLabels,
  type Activity,
  type ActivityStatus,
  type ActivityType,
} from "@/lib/activities/types";

/**
 * Search, filter, sort and pagination for the programme.
 *
 * Pure, and entirely described by the URL: a filtered view is shareable, the
 * back button works, and the server renders exactly what the link says. Leader
 * and patrol names are passed in rather than looked up, so nothing here needs a
 * server-only import - the filter bar imports it too.
 */

export type ActivityView = "list" | "calendar";
export type ActivitySort = "date" | "name" | "status" | "type";
export type SortDirection = "asc" | "desc";
/** Which side of "now" to show. */
export type ActivityPeriod = "upcoming" | "past" | "all";

export const ACTIVITY_SORTS: readonly ActivitySort[] = ["date", "name", "status", "type"];

export const activitySortLabels: Record<ActivitySort, string> = {
  date: "Date",
  name: "Name",
  status: "Status",
  type: "Type",
};

export const activityPeriodLabels: Record<ActivityPeriod, string> = {
  upcoming: "Upcoming",
  past: "Past",
  all: "All dates",
};

export interface ActivityQuery {
  q: string;
  status: ActivityStatus | "all";
  type: ActivityType | "all";
  /** A patrol id, `all`, or `troop` for whole-troop activities. */
  patrol: string;
  period: ActivityPeriod;
  /** A single ISO day, set when drilling in from a calendar cell. */
  date: string;
  sort: ActivitySort;
  dir: SortDirection;
  page: number;
  view: ActivityView;
  /** "YYYY-MM" for the calendar. Empty means the month containing today. */
  month: string;
}

export const DEFAULT_ACTIVITY_QUERY: ActivityQuery = {
  q: "",
  status: "all",
  type: "all",
  patrol: "all",
  period: "upcoming",
  date: "",
  sort: "date",
  dir: "asc",
  page: 1,
  view: "list",
  month: "",
};

export const PAGE_SIZE = 10;

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type RawParams = Record<string, string | string[] | undefined>;

function single(params: RawParams, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function parseActivityQuery(params: RawParams): ActivityQuery {
  const status = single(params, "status");
  const type = single(params, "type");
  const patrol = single(params, "patrol");
  const period = single(params, "period");
  const date = single(params, "date");
  const sort = single(params, "sort");
  const dir = single(params, "dir");
  const view = single(params, "view");
  const month = single(params, "month");
  const page = Number.parseInt(single(params, "page"), 10);

  return {
    q: single(params, "q").slice(0, 100),
    status: ACTIVITY_STATUSES.includes(status as ActivityStatus)
      ? (status as ActivityStatus)
      : "all",
    type: ACTIVITY_TYPES.includes(type as ActivityType) ? (type as ActivityType) : "all",
    // An unknown patrol id simply matches nothing, so it needs no allow-list.
    patrol: patrol ? patrol.slice(0, 100) : "all",
    period: period === "past" || period === "all" ? period : DEFAULT_ACTIVITY_QUERY.period,
    date: DAY_PATTERN.test(date) ? date : "",
    sort: ACTIVITY_SORTS.includes(sort as ActivitySort)
      ? (sort as ActivitySort)
      : DEFAULT_ACTIVITY_QUERY.sort,
    dir: dir === "desc" ? "desc" : "asc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    view: view === "calendar" ? "calendar" : "list",
    month: MONTH_PATTERN.test(month) ? month : "",
  };
}

/** Serialises a query, omitting anything left at its default to keep URLs short. */
export function activityQueryToSearchParams(query: ActivityQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.status !== "all") params.set("status", query.status);
  if (query.type !== "all") params.set("type", query.type);
  if (query.patrol !== "all") params.set("patrol", query.patrol);
  if (query.period !== DEFAULT_ACTIVITY_QUERY.period) params.set("period", query.period);
  if (query.date) params.set("date", query.date);
  if (query.sort !== DEFAULT_ACTIVITY_QUERY.sort) params.set("sort", query.sort);
  if (query.dir !== DEFAULT_ACTIVITY_QUERY.dir) params.set("dir", query.dir);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.view !== DEFAULT_ACTIVITY_QUERY.view) params.set("view", query.view);
  if (query.month) params.set("month", query.month);

  return params;
}

export function activitiesHref(query: ActivityQuery): string {
  const search = activityQueryToSearchParams(query).toString();
  return search ? `/activities?${search}` : "/activities";
}

/** True when anything is narrowing the programme, so the UI can offer a reset. */
export function isFiltered(query: ActivityQuery): boolean {
  return (
    query.q.trim() !== "" ||
    query.status !== "all" ||
    query.type !== "all" ||
    query.patrol !== "all" ||
    query.date !== "" ||
    query.period !== DEFAULT_ACTIVITY_QUERY.period
  );
}

/* --------------------------------- matching -------------------------------- */

/** Names resolved on the server, so matching and sorting stay pure. */
export interface ActivityContext {
  /** User id to leader name. */
  leaderNames: ReadonlyMap<string, string>;
  /** Patrol id to patrol name. */
  patrolNames: ReadonlyMap<string, string>;
  /** Reference instant for the upcoming/past split. */
  now: Date;
}

export const emptyContext: ActivityContext = {
  leaderNames: new Map(),
  patrolNames: new Map(),
  now: new Date(0),
};

export function leaderNameOf(activity: Activity, context: ActivityContext): string {
  return context.leaderNames.get(activity.leaderId) ?? "Unassigned";
}

/** The patrols taking part, by name. Empty means the whole troop. */
export function patrolNamesOf(activity: Activity, context: ActivityContext): string[] {
  return activity.patrolIds.map((id) => context.patrolNames.get(id) ?? "Unknown patrol");
}

function matchesSearch(activity: Activity, needle: string, context: ActivityContext): boolean {
  if (!needle) return true;

  const haystack = [
    activity.name,
    activity.description,
    activity.location,
    activityTypeLabels[activity.type],
    leaderNameOf(activity, context),
    ...patrolNamesOf(activity, context),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

export interface FilterOptions {
  /**
   * Drafts are only part of the programme for the leaders planning it, so
   * everyone else never sees them - enforced here rather than by hiding a row.
   */
  includeDrafts: boolean;
  /**
   * The calendar shows a whole month, so the upcoming/past split does not
   * apply to it.
   */
  ignorePeriod?: boolean;
}

/** Filter only - the calendar and the list share this and then diverge. */
export function filterActivities(
  activities: Activity[],
  query: ActivityQuery,
  context: ActivityContext,
  options: FilterOptions,
): Activity[] {
  const needle = query.q.trim().toLowerCase();

  return activities.filter((activity) => {
    if (!options.includeDrafts && activity.status === "draft") return false;

    if (query.status !== "all" && activity.status !== query.status) return false;
    if (query.type !== "all" && activity.type !== query.type) return false;
    if (query.date && activity.date !== query.date) return false;

    if (query.patrol === "troop" && activity.patrolIds.length > 0) return false;
    if (
      query.patrol !== "all" &&
      query.patrol !== "troop" &&
      !activity.patrolIds.includes(query.patrol)
    ) {
      return false;
    }

    if (!options.ignorePeriod && query.period !== "all") {
      const upcoming = activityStartsAt(activity).getTime() >= context.now.getTime();
      if (query.period === "upcoming" && !upcoming) return false;
      if (query.period === "past" && upcoming) return false;
    }

    return matchesSearch(activity, needle, context);
  });
}

const collator = new Intl.Collator("en-GB", { sensitivity: "base", numeric: true });

/** Sort order for status, so "sort by status" reads as a lifecycle. */
const statusOrder: Record<ActivityStatus, number> = {
  draft: 0,
  published: 1,
  completed: 2,
  cancelled: 3,
};

function chronological(a: Activity, b: Activity): number {
  return (
    a.date.localeCompare(b.date) ||
    a.startTime.localeCompare(b.startTime) ||
    collator.compare(a.name, b.name)
  );
}

function compare(a: Activity, b: Activity, sort: ActivitySort): number {
  switch (sort) {
    case "date":
      return chronological(a, b);
    case "name":
      return collator.compare(a.name, b.name) || chronological(a, b);
    case "status":
      return statusOrder[a.status] - statusOrder[b.status] || chronological(a, b);
    case "type":
      return (
        collator.compare(activityTypeLabels[a.type], activityTypeLabels[b.type]) ||
        chronological(a, b)
      );
  }
}

export function sortActivities(
  activities: Activity[],
  sort: ActivitySort,
  dir: SortDirection,
): Activity[] {
  const direction = dir === "desc" ? -1 : 1;
  return [...activities].sort((a, b) => compare(a, b, sort) * direction);
}

export interface ActivityPage {
  items: Activity[];
  /** Matches before pagination. */
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
}

/** The whole list-view query: filter, then sort, then page. */
export function applyActivityQuery(
  activities: Activity[],
  query: ActivityQuery,
  context: ActivityContext,
  options: FilterOptions,
): ActivityPage {
  const sorted = sortActivities(
    filterActivities(activities, query, context, options),
    query.sort,
    query.dir,
  );

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
