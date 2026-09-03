import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/sparkline";
import { formatCompactNumber, formatDelta, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Stat } from "@/types";

/**
 * Stat tile: label, value, optional signed delta against a named period, a
 * caption, and a 12-point trend line where there is real history behind it.
 *
 * The delta's direction is carried by an arrow icon and a signed number as well
 * as by color, so it never depends on hue alone.
 */
export function StatCard({ stat, className }: { stat: Stat; className?: string }) {
  const Icon = stat.icon;
  const value =
    stat.format === "percent" ? formatPercent(stat.value) : formatCompactNumber(stat.value);

  const hasDelta = stat.delta !== undefined && stat.delta !== 0;
  const improving =
    stat.delta === undefined || stat.polarity === "neutral"
      ? null
      : stat.polarity === "up-is-good"
        ? stat.delta > 0
        : stat.delta < 0;

  const DeltaIcon = !hasDelta ? Minus : stat.delta! > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card
      interactive
      className={cn("group relative flex flex-col overflow-hidden", className)}
    >
      <Link href={stat.href} className="flex flex-1 flex-col p-5 focus-visible:outline-none">
        <span className="absolute inset-0 rounded-xl group-focus-within:ring-2 group-focus-within:ring-ring" aria-hidden />

        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Icon className="size-4" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-[13px] font-medium text-ink-secondary">{stat.label}</span>
        </div>

        <div className="mt-4 flex items-baseline gap-2.5">
          <span className="text-[32px] leading-none font-semibold tracking-tight text-ink">
            {value}
          </span>
          {stat.delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-[13px] font-medium",
                improving === null && "text-ink-secondary",
                improving === true && "text-positive",
                improving === false && "text-negative",
              )}
              title={`${formatDelta(stat.delta, stat.deltaUnit)} ${stat.deltaPeriod ?? ""}`.trim()}
            >
              <DeltaIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
              {formatDelta(stat.delta, stat.deltaUnit)}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-xs text-ink-muted">
          {stat.caption}
          {/* The tiles are narrowest in the 5-column layout, where the period
              would wrap the line - it stays on the delta's tooltip there. */}
          {stat.deltaPeriod && <span className="xl:hidden"> · {stat.deltaPeriod}</span>}
        </p>

        {stat.trend && (
          <div className="mt-auto pt-5">
            <Sparkline data={stat.trend} height={36} />
          </div>
        )}
      </Link>
    </Card>
  );
}
