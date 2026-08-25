import { cn } from "@/lib/utils";

/** Vertical breathing room inside the viewBox so a 2px stroke never clips. */
const PAD = 3;
const VIEW_H = 40;
/** Space reserved on the right for the end marker. */
const END_GUTTER = 5;

export interface SparklineProps {
  /** Series values, oldest first. */
  data: number[];
  /** Rendered height in px. */
  height?: number;
  className?: string;
  /** Accessible description; the sparkline is decorative without it. */
  label?: string;
}

/**
 * Trend line for a stat tile: 2px stroke, the series in the de-emphasis hue and
 * the current period in the accent, with an end marker ringed in the surface
 * color so it stays legible against the card.
 *
 * The SVG stretches horizontally (`preserveAspectRatio="none"`) and keeps its
 * stroke weight with `vector-effect`; the end marker is a positioned element
 * rather than a `<circle>` so the non-uniform scale never squashes it.
 */
export function Sparkline({ data, height = 40, className, label }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min;

  const toPoint = (value: number, index: number) => {
    const x = (index / (data.length - 1)) * 100;
    const norm = span === 0 ? 0.5 : (value - min) / span;
    const y = PAD + (1 - norm) * (VIEW_H - PAD * 2);
    return [x, y] as const;
  };

  const points = data.map(toPoint);
  const toPath = (slice: readonly (readonly [number, number])[]) =>
    slice.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");

  const bodyPath = toPath(points.slice(0, -1));
  const currentPath = toPath(points.slice(-2));
  const endY = points[points.length - 1][1];

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ height }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg
        className="absolute top-0 left-0 h-full"
        // An <svg> is a replaced element: left+right alone leave it at its
        // intrinsic ratio width, so the width is set explicitly.
        style={{ width: `calc(100% - ${END_GUTTER}px)` }}
        viewBox={`0 0 100 ${VIEW_H}`}
        preserveAspectRatio="none"
        focusable="false"
      >
        <path
          d={bodyPath}
          fill="none"
          stroke="var(--viz-accent-soft)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={currentPath}
          fill="none"
          stroke="var(--viz-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* End marker: 8px, ringed in the surface color. */}
      <span
        className="absolute size-2 rounded-full bg-viz-accent ring-2 ring-surface"
        style={{
          right: END_GUTTER - 4,
          top: `${(endY / VIEW_H) * 100}%`,
          transform: "translateY(-50%)",
        }}
        aria-hidden
      />
    </div>
  );
}
