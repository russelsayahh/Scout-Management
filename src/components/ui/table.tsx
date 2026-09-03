import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Table primitives.
 *
 * `Table` owns the horizontal scroll container, so a wide table scrolls inside
 * its own card instead of pushing the page sideways.
 */

export function Table({
  className,
  containerClassName,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement> & { containerClassName?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto", containerClassName)}>
      <table className={cn("w-full border-collapse text-left", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-line bg-surface-muted", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-surface-muted", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle text-[13px]", className)} {...props} />;
}

/**
 * A column header that sorts. Rendered as a link so sorting is a plain
 * navigation - it survives a refresh, and the URL describes the view.
 */
export function SortHeader({
  href,
  active,
  direction,
  children,
  className,
}: {
  href: string;
  active: boolean;
  direction: "asc" | "desc";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = !active ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TH className={cn("p-0", className)} aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <Link
        href={href}
        className={cn(
          "flex w-full items-center gap-1.5 px-4 py-2.5 transition-colors hover:text-ink",
          active && "text-ink",
        )}
      >
        {children}
        <Icon
          className={cn("size-3 shrink-0", active ? "text-brand-text" : "text-ink-muted/60")}
          strokeWidth={2.5}
          aria-hidden
        />
      </Link>
    </TH>
  );
}
