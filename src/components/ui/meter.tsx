import { cn } from "@/lib/utils";

export type MeterTone = "accent" | "good" | "warning" | "critical";

/** Track is a lighter step of the fill's own ramp, so state reads across the bar. */
const toneStyles: Record<MeterTone, { fill: string; track: string }> = {
  accent: { fill: "bg-viz-accent", track: "bg-viz-track" },
  good: { fill: "bg-status-good", track: "bg-status-good/20" },
  warning: { fill: "bg-status-warning", track: "bg-status-warning/22" },
  critical: { fill: "bg-status-critical", track: "bg-status-critical/20" },
};

export interface MeterProps {
  value: number;
  max?: number;
  tone?: MeterTone;
  /** Optional reference marker, e.g. a target rate. */
  target?: number;
  targetLabel?: string;
  className?: string;
  /** Accessible name for the meter. */
  label: string;
  size?: "sm" | "md";
}

export function Meter({
  value,
  max = 100,
  tone = "accent",
  target,
  targetLabel,
  className,
  label,
  size = "md",
}: MeterProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const targetPct =
    target === undefined ? undefined : Math.max(0, Math.min(100, (target / max) * 100));
  const styles = toneStyles[tone];

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-full", styles.track, className)}
      style={{ height: size === "sm" ? 6 : 8 }}
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", styles.fill)}
        style={{ width: `${pct}%` }}
      />
      {targetPct !== undefined && (
        <span
          className="absolute top-0 h-full w-0.5 bg-ink/70"
          style={{ left: `${targetPct}%` }}
          title={targetLabel}
          aria-hidden
        />
      )}
    </div>
  );
}
