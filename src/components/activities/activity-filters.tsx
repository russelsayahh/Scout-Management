"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CalendarDays, List, Search, SlidersHorizontal, X } from "lucide-react";

import { Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  activityPeriodLabels,
  isFiltered,
  type ActivityQuery,
} from "@/lib/activities/query";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_TYPES,
  activityStatusLabels,
  activityTypeLabels,
} from "@/lib/activities/types";
import { formatDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Search, filters and the list/calendar switch.
 *
 * Every control writes to the URL rather than to local state, so the server
 * renders the filtered programme, the back button works, and a filtered view
 * can be sent to somebody else as a link.
 */
export function ActivityFilters({
  query,
  total,
  patrols,
  canManage,
}: {
  query: ActivityQuery;
  /** Matches in the current view, for the summary line. */
  total: number;
  patrols: { id: string; name: string }[];
  /** Only leaders who manage the programme can see drafts at all. */
  canManage: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [term, setTerm] = useState(query.q);

  const calendarView = query.view === "calendar";

  function hrefWith(changes: Record<string, string | null>): string {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // Any change to the filters returns to the first page.
    next.delete("page");

    const search = next.toString();
    return search ? `/activities?${search}` : "/activities";
  }

  function apply(changes: Record<string, string | null>) {
    startTransition(() => router.replace(hrefWith(changes), { scroll: false }));
  }

  // Debounced so the programme does not navigate on every keystroke. The URL is
  // rebuilt inside the effect rather than through `hrefWith`, so there is no
  // function identity for the dependency list to chase.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (term === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      const trimmed = term.trim();

      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      next.delete("page");

      const search = next.toString();
      startTransition(() =>
        router.replace(search ? `/activities?${search}` : "/activities", { scroll: false }),
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [term, searchParams, router]);

  const filtered = isFiltered(query);
  const statuses = canManage
    ? ACTIVITY_STATUSES
    : ACTIVITY_STATUSES.filter((status) => status !== "draft");

  const toggleStyles =
    "inline-flex h-10 items-center gap-1.5 px-3 text-[13px] font-medium transition-colors";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.9}
            aria-hidden
          />
          <Input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search by name, place, leader or patrol..."
            aria-label="Search activities"
            className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-ink-muted transition-colors hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" strokeWidth={2} aria-hidden />
            </button>
          )}
        </div>

        {/* View switch - the one control that changes how, not what, is shown. */}
        <div
          className="flex shrink-0 overflow-hidden rounded-lg border border-line bg-surface"
          role="group"
          aria-label="View"
        >
          <Link
            href={hrefWith({ view: null, month: null })}
            aria-current={!calendarView ? "true" : undefined}
            className={cn(
              toggleStyles,
              !calendarView
                ? "bg-brand-soft text-brand-text"
                : "text-ink-secondary hover:bg-surface-hover",
            )}
          >
            <List className="size-4" strokeWidth={2} aria-hidden />
            List
          </Link>
          <Link
            href={hrefWith({ view: "calendar" })}
            aria-current={calendarView ? "true" : undefined}
            className={cn(
              toggleStyles,
              "border-l border-line",
              calendarView
                ? "bg-brand-soft text-brand-text"
                : "text-ink-secondary hover:bg-surface-hover",
            )}
          >
            <CalendarDays className="size-4" strokeWidth={2} aria-hidden />
            Calendar
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          value={query.status}
          onChange={(event) =>
            apply({ status: event.target.value === "all" ? null : event.target.value })
          }
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {activityStatusLabels[status]}
            </option>
          ))}
        </Select>

        <Select
          value={query.type}
          onChange={(event) =>
            apply({ type: event.target.value === "all" ? null : event.target.value })
          }
          aria-label="Filter by activity type"
        >
          <option value="all">All types</option>
          {ACTIVITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {activityTypeLabels[type]}
            </option>
          ))}
        </Select>

        <Select
          value={query.patrol}
          onChange={(event) =>
            apply({ patrol: event.target.value === "all" ? null : event.target.value })
          }
          aria-label="Filter by patrol"
        >
          <option value="all">All patrols</option>
          <option value="troop">Whole troop only</option>
          {patrols.map((patrol) => (
            <option key={patrol.id} value={patrol.id}>
              {patrol.name}
            </option>
          ))}
        </Select>

        {/* The calendar already shows one month, so the period does not apply. */}
        {calendarView ? (
          <div className="flex h-10 items-center rounded-lg border border-dashed border-line px-3 text-[12.5px] text-ink-muted">
            Showing one month
          </div>
        ) : (
          <Select
            value={query.period}
            onChange={(event) =>
              apply({ period: event.target.value === "upcoming" ? null : event.target.value })
            }
            aria-label="Filter by date range"
          >
            {(["upcoming", "past", "all"] as const).map((period) => (
              <option key={period} value={period}>
                {activityPeriodLabels[period]}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* A single day, arrived at from a calendar cell. */}
      {query.date && (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-1 font-medium text-brand-text">
            {formatDayLabel(query.date)}
            <Link
              href={hrefWith({ date: null })}
              aria-label="Show every day again"
              className="rounded transition-opacity hover:opacity-70"
            >
              <X className="size-3.5" strokeWidth={2.5} aria-hidden />
            </Link>
          </span>
        </div>
      )}

      {/* Result summary */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          {pending ? (
            <Spinner className="size-3.5" label="Updating results" />
          ) : (
            <SlidersHorizontal className="size-3.5" strokeWidth={2} aria-hidden />
          )}
          <span className={cn(pending && "opacity-60")}>
            {total} {total === 1 ? "activity" : "activities"}
            {calendarView
              ? " this month"
              : filtered
                ? total === 1
                  ? " matches these filters"
                  : " match these filters"
                : " coming up"}
          </span>
        </span>

        {filtered && (
          <Link
            href={hrefWith({
              q: null,
              status: null,
              type: null,
              patrol: null,
              period: null,
              date: null,
            })}
            className="font-medium text-brand-text hover:underline"
            onClick={() => setTerm("")}
          >
            Clear filters
          </Link>
        )}
      </div>
    </div>
  );
}
