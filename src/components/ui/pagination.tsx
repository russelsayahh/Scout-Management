import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Page numbers around the current page, with gaps marked by null. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);

  const result: (number | null)[] = [];
  let previous = 0;
  for (const current of sorted) {
    if (previous && current - previous > 1) result.push(null);
    result.push(current);
    previous = current;
  }
  return result;
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the href for a page number. */
  hrefFor: (page: number) => string;
  /** Describes the range in words, e.g. "13-24 of 42 scouts". */
  summary?: string;
  className?: string;
}

/** Navigation between pages, rendered as links so it works without JavaScript. */
export function Pagination({ page, pageCount, hrefFor, summary, className }: PaginationProps) {
  if (pageCount <= 1) {
    return summary ? (
      <p className={cn("text-[12px] text-ink-muted", className)}>{summary}</p>
    ) : null;
  }

  const pages = pageWindow(page, pageCount);
  const stepStyles =
    "flex h-8 min-w-8 items-center justify-center rounded-lg border border-line px-2 text-[12.5px] font-medium transition-colors";

  return (
    <nav
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
      aria-label="Pagination"
    >
      {summary && <p className="text-[12px] text-ink-muted">{summary}</p>}

      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            className={cn(stepStyles, "bg-surface text-ink-secondary hover:bg-surface-hover")}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        ) : (
          <span className={cn(stepStyles, "cursor-not-allowed text-ink-muted/50")} aria-hidden>
            <ChevronLeft className="size-4" strokeWidth={2} />
          </span>
        )}

        {pages.map((entry, index) =>
          entry === null ? (
            <span key={`gap-${index}`} className="px-1 text-[12.5px] text-ink-muted">
              &hellip;
            </span>
          ) : (
            <Link
              key={entry}
              href={hrefFor(entry)}
              aria-current={entry === page ? "page" : undefined}
              className={cn(
                stepStyles,
                "tabular-nums",
                entry === page
                  ? "border-brand-border bg-brand-soft text-brand-text"
                  : "bg-surface text-ink-secondary hover:bg-surface-hover",
              )}
            >
              {entry}
            </Link>
          ),
        )}

        {page < pageCount ? (
          <Link
            href={hrefFor(page + 1)}
            className={cn(stepStyles, "bg-surface text-ink-secondary hover:bg-surface-hover")}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        ) : (
          <span className={cn(stepStyles, "cursor-not-allowed text-ink-muted/50")} aria-hidden>
            <ChevronRight className="size-4" strokeWidth={2} />
          </span>
        )}
      </div>
    </nav>
  );
}
