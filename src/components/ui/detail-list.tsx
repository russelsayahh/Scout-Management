import { cn } from "@/lib/utils";

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  /** Renders across both columns - for addresses and notes. */
  wide?: boolean;
}

/**
 * Label/value pairs for read-only record views. Stacks on narrow screens and
 * splits into two columns from `sm` up.
 */
export function DetailList({
  items,
  className,
  columns = 2,
}: {
  items: DetailItem[];
  className?: string;
  columns?: 1 | 2;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn(item.wide && "sm:col-span-2")}>
          <dt className="text-[11.5px] tracking-wide text-ink-muted uppercase">{item.label}</dt>
          <dd className="mt-1 text-[13.5px] leading-relaxed break-words text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Consistent placeholder for a field with nothing in it. */
export function EmptyValue({ children = "Not recorded" }: { children?: React.ReactNode }) {
  return <span className="text-ink-muted italic">{children}</span>;
}
