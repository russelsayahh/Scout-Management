"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { Input, Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  isFiltered,
  retiredFilterLabels,
  type EquipmentQuery,
} from "@/lib/equipment/query";
import {
  AVAILABILITY_STATUSES,
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_CONDITIONS,
  availabilityLabels,
  categoryLabels,
  conditionLabels,
} from "@/lib/equipment/types";
import { cn } from "@/lib/utils";

/**
 * Search and filters for the store.
 *
 * Every control writes to the URL rather than to local state, so the server
 * renders the filtered list, the back button works, and "all the tents that
 * need attention" is a link somebody can be sent.
 */
export function EquipmentFilters({
  query,
  total,
}: {
  query: EquipmentQuery;
  total: number;
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
    return search ? `/equipment?${search}` : "/equipment";
  }

  function apply(changes: Record<string, string | null>) {
    startTransition(() => router.replace(hrefWith(changes), { scroll: false }));
  }

  // Debounced so the list does not navigate on every keystroke. The URL is
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
        router.replace(search ? `/equipment?${search}` : "/equipment", { scroll: false }),
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [term, searchParams, router]);

  const filtered = isFiltered(query);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.9}
          aria-hidden
        />
        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search by name, location, serial number or note..."
          aria-label="Search equipment"
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          value={query.category}
          onChange={(event) =>
            apply({ category: event.target.value === "all" ? null : event.target.value })
          }
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {EQUIPMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {categoryLabels[category]}
            </option>
          ))}
        </Select>

        <Select
          value={query.condition}
          onChange={(event) =>
            apply({ condition: event.target.value === "all" ? null : event.target.value })
          }
          aria-label="Filter by condition"
        >
          <option value="all">All conditions</option>
          {EQUIPMENT_CONDITIONS.filter((condition) => condition !== "retired").map(
            (condition) => (
              <option key={condition} value={condition}>
                {conditionLabels[condition]}
              </option>
            ),
          )}
        </Select>

        <Select
          value={query.availability}
          onChange={(event) =>
            apply({ availability: event.target.value === "all" ? null : event.target.value })
          }
          aria-label="Filter by availability"
        >
          <option value="all">Any availability</option>
          {AVAILABILITY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {availabilityLabels[status]}
            </option>
          ))}
        </Select>

        <Select
          value={query.retired}
          onChange={(event) =>
            apply({ retired: event.target.value === "current" ? null : event.target.value })
          }
          aria-label="Include retired equipment"
        >
          {(["current", "retired", "all"] as const).map((value) => (
            <option key={value} value={value}>
              {retiredFilterLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          {pending ? (
            <Spinner className="size-3.5" label="Updating results" />
          ) : (
            <SlidersHorizontal className="size-3.5" strokeWidth={2} aria-hidden />
          )}
          <span className={cn(pending && "opacity-60")}>
            {total} {total === 1 ? "item" : "items"}
            {filtered
              ? total === 1
                ? " matches these filters"
                : " match these filters"
              : " in the store"}
          </span>
        </span>

        <Link
          href={hrefWith({ out: query.onLoanOnly ? null : "1" })}
          className={cn(
            "font-medium hover:underline",
            query.onLoanOnly ? "text-brand-text" : "text-ink-secondary",
          )}
        >
          {query.onLoanOnly ? "Showing only kit that is out" : "Show only kit that is out"}
        </Link>

        {filtered && (
          <Link
            href="/equipment"
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
