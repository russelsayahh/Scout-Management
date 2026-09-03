"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { recentSearches, searchResults } from "@/data/search";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types";

const MAX_RESULTS = 6;

function filterResults(query: string): SearchResult[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return searchResults
    .filter(
      (result) =>
        result.title.toLowerCase().includes(needle) ||
        result.subtitle.toLowerCase().includes(needle),
    )
    .slice(0, MAX_RESULTS);
}

function groupResults(results: SearchResult[]) {
  const groups = new Map<string, SearchResult[]>();
  for (const result of results) {
    const bucket = groups.get(result.group) ?? [];
    bucket.push(result);
    groups.set(result.group, bucket);
  }
  return [...groups.entries()];
}

/** Dropdown body: recent searches when empty, filtered matches otherwise. */
function ResultsPanel({
  query,
  onSelect,
  onPickRecent,
}: {
  query: string;
  onSelect: () => void;
  onPickRecent: (value: string) => void;
}) {
  const results = useMemo(() => filterResults(query), [query]);
  const grouped = groupResults(results);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="popover-panel absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-black/5 dark:shadow-black/40">
      {!hasQuery && (
        <div className="p-2">
          <p className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
            Recent searches
          </p>
          <ul>
            {recentSearches.map((term) => (
              <li key={term}>
                <button
                  type="button"
                  onClick={() => onPickRecent(term)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  <Search className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasQuery && results.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-[13px] font-medium text-ink">No matches</p>
          <p className="mt-1 text-xs text-ink-muted">
            Nothing found for &ldquo;{query.trim()}&rdquo;.
          </p>
        </div>
      )}

      {hasQuery && results.length > 0 && (
        <div className="max-h-[22rem] overflow-y-auto p-2 scrollbar-slim">
          {grouped.map(([group, items]) => (
            <div key={group} className="mb-1 last:mb-0">
              <p className="px-2 py-1.5 text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
                {group}
              </p>
              <ul>
                {items.map((result) => {
                  const Icon = result.icon;
                  return (
                    <li key={result.id}>
                      <Link
                        href={result.href}
                        onClick={onSelect}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-hover"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-inset text-ink-secondary">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-ink">
                            {result.title}
                          </span>
                          <span className="block truncate text-[11.5px] text-ink-muted">
                            {result.subtitle}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line bg-surface-muted px-3 py-2 text-[11px] text-ink-muted">
        <span>Sample data - search is not wired to a backend yet</span>
        <span className="hidden items-center gap-1 sm:flex">
          <CornerDownLeft className="size-3" aria-hidden />
          to open
        </span>
      </div>
    </div>
  );
}

/**
 * Global search. Renders inline from `md` up and behind an icon below it.
 * Filtering runs against the sample corpus purely to show the interaction.
 */
export function TopbarSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useOutsideClick(containerRef, () => setOpen(false), open);
  useOutsideClick(
    mobileRef,
    () => {
      setMobileOpen(false);
      setOpen(false);
    },
    mobileOpen,
  );

  // Ctrl/Cmd+K focuses the field, as in every other tool people use.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (window.matchMedia("(min-width: 768px)").matches) {
          inputRef.current?.focus();
          setOpen(true);
        } else {
          setMobileOpen(true);
          setOpen(true);
          window.setTimeout(() => mobileInputRef.current?.focus(), 0);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const field = (
    <div className="relative flex h-9 items-center">
      <Search
        className="pointer-events-none absolute left-3 size-4 text-ink-muted"
        strokeWidth={1.9}
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search scouts, camps, documents..."
        aria-label="Search"
        className={cn(
          "h-9 w-full rounded-lg border border-line bg-surface-muted pr-16 pl-9 text-[13px] text-ink transition-colors",
          "placeholder:text-ink-muted hover:border-line-strong focus:border-brand-border focus:bg-surface",
          "focus:outline-none [&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      <kbd className="pointer-events-none absolute right-2.5 hidden items-center rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[10.5px] font-medium text-ink-muted lg:flex">
        Ctrl K
      </kbd>
    </div>
  );

  return (
    <>
      {/* Inline field, md and up */}
      <div ref={containerRef} className="relative hidden w-full max-w-md md:block">
        {field}
        {open && (
          <ResultsPanel
            query={query}
            onSelect={() => setOpen(false)}
            onPickRecent={(value) => {
              setQuery(value);
              inputRef.current?.focus();
            }}
          />
        )}
      </div>

      {/* Icon launcher, below md */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => {
          setMobileOpen(true);
          setOpen(true);
          window.setTimeout(() => mobileInputRef.current?.focus(), 0);
        }}
        aria-label="Search"
      >
        <Search className="size-4.5" strokeWidth={1.75} aria-hidden />
      </Button>

      {mobileOpen && (
        <div
          ref={mobileRef}
          className="absolute inset-x-0 top-0 z-50 flex h-16 items-center gap-2 border-b border-line bg-surface px-4 md:hidden"
        >
          <div className="relative flex-1">
            <div className="relative flex h-9 items-center">
              <Search
                className="pointer-events-none absolute left-3 size-4 text-ink-muted"
                strokeWidth={1.9}
                aria-hidden
              />
              <input
                ref={mobileInputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                aria-label="Search"
                className="h-9 w-full rounded-lg border border-line bg-surface-muted pr-3 pl-9 text-[13px] text-ink placeholder:text-ink-muted focus:border-brand-border focus:bg-surface focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
              />
            </div>
            {open && (
              <ResultsPanel
                query={query}
                onSelect={() => {
                  setOpen(false);
                  setMobileOpen(false);
                }}
                onPickRecent={(value) => {
                  setQuery(value);
                  mobileInputRef.current?.focus();
                }}
              />
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setMobileOpen(false);
              setOpen(false);
            }}
            aria-label="Close search"
          >
            <X className="size-4.5" strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      )}
    </>
  );
}
