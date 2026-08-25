import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "info"
  | "good"
  | "warning"
  | "serious"
  | "critical";

/**
 * Status colors are never carried by hue alone - a badge always shows a text
 * label, and the optional dot is a supplement, not the signal.
 */
const toneStyles: Record<BadgeTone, string> = {
  neutral: "bg-surface-inset text-ink-secondary",
  brand: "bg-brand-soft text-brand-text",
  info: "bg-viz-accent/12 text-[#1c5cab] dark:text-[#86b6ef]",
  good: "bg-status-good/12 text-[#006300] dark:text-[#0ca30c]",
  warning: "bg-status-warning/16 text-[#7a5200] dark:text-[#fab219]",
  serious: "bg-status-serious/16 text-[#9a4a24] dark:text-[#ec835a]",
  critical: "bg-status-critical/12 text-[#b02a26] dark:text-[#f08a8a]",
};

const dotStyles: Record<BadgeTone, string> = {
  neutral: "bg-ink-muted",
  brand: "bg-brand-500",
  info: "bg-viz-accent",
  good: "bg-status-good",
  warning: "bg-status-warning",
  serious: "bg-status-serious",
  critical: "bg-status-critical",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({
  className,
  tone = "neutral",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className={cn("size-1.5 shrink-0 rounded-full", dotStyles[tone])} aria-hidden />
      )}
      {children}
    </span>
  );
}
