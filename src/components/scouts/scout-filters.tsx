"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  archivedFilterLabels,
  isFiltered,
  type ScoutQuery,
} from "@/lib/scouts/query";
import { SCOUT_STATUSES, scoutStatusLabels } from "@/lib/scouts/types";
import { cn } from "@/lib/utils";

/**
 * Search and filter controls for the register.
 *
 * Every control writes to the URL rather than to local state, so the server
 * renders the filtered list, the back button works, and a filtered view can be
 * copied to someone else as a link.
 */
export function ScoutFilters({
  query,
  total,
  patrols,
}: {
  query: ScoutQuery;
  total: number;
  /** Assignable patrols, resolved on the server. */
  patrols: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [term, setTerm] = useState(query.q);

  function hrefWith(changes: Record<string, string | null>): string {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // Any change to the filters returns to the first page.
    next.delete("page");

    const search = next.toString();
    return search ? `/scouts?${search}` : "/scouts";
  }

  function apply(changes: Record<string, string | null>) {
    startTransition(() => router.replace(hrefWith(changes), { scroll: false }));
  }

  // Debounce typing so the list does not navigate on every keystroke. The URL
  // is rebuilt inside the effect rather than through `hrefWith`, so there is no
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
        router.replace(search ? `/scouts?${search}` : "/scouts", { scroll: false }),
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [term, searchParams, router]);

  const filtered = isFiltered(query);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
            placeholder="Search by name, email, phone or patrol..."
            aria-label="Search scouts"
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

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <Select
            value={query.status}
            onChange={(event) => apply({ status: event.target.value === "all" ? null : event.target.value })}
            aria-label="Filter by status"
            className="sm:w-40"
          >
            <option value="all">All statuses</option>
            {SCOUT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {scoutStatusLabels[status]}
              </option>
            ))}
          </Select>

          <Select
            value={query.patrol}
            onChange={(event) => apply({ patrol: event.target.value === "all" ? null : event.target.value })}
            aria-label="Filter by patrol"
            className="sm:w-40"
          >
            <option value="all">All patrols</option>
            <option value="none">No patrol</option>
            {patrols.map((patrol) => (
              <option key={patrol.id} value={patrol.id}>
                {patrol.name}
              </option>
            ))}
          </Select>

          <Select
            value={query.archived}
            onChange={(event) =>
              apply({ archived: event.target.value === "current" ? null : event.target.value })
            }
            aria-label="Filter by archive state"
            className="col-span-2 sm:w-44"
          >
            {(["current", "archived", "all"] as const).map((value) => (
              <option key={value} value={value}>
                {archivedFilterLabels[value]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Result summary */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          {pending ? (
            <Spinner className="size-3.5" label="Updating results" />
          ) : (
            <SlidersHorizontal className="size-3.5" strokeWidth={2} aria-hidden />
          )}
          <span className={cn(pending && "opacity-60")}>
            {total} {total === 1 ? "scout" : "scouts"}
            {filtered
              ? total === 1
                ? " matches these filters"
                : " match these filters"
              : " on the register"}
          </span>
        </span>

        {filtered && (
          <Link
            href="/scouts"
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
