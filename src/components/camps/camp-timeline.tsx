import { Check, CircleDashed, Dot, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampMilestone, MilestoneState } from "@/lib/camps/timeline";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The camp's milestones from first plan to last day.
 *
 * State is carried by the icon and the wording as well as by colour: a filled
 * tick is done, a ring is still to come, a cross is a date the camp will not
 * reach because it was called off.
 */

const stateIcon: Record<MilestoneState, LucideIcon> = {
  done: Check,
  current: Dot,
  upcoming: CircleDashed,
  missed: X,
};

const markerStyles: Record<MilestoneState, string> = {
  done: "border-brand-solid bg-brand-solid text-white",
  current: "border-brand-solid bg-brand-soft text-brand-text",
  upcoming: "border-line bg-surface text-ink-muted",
  missed: "border-status-critical/40 bg-status-critical/10 text-[#b02a26] dark:text-[#f08a8a]",
};

const labelStyles: Record<MilestoneState, string> = {
  done: "text-ink",
  current: "text-ink font-semibold",
  upcoming: "text-ink-secondary",
  missed: "text-ink-secondary line-through decoration-1",
};

export function CampTimeline({ milestones }: { milestones: CampMilestone[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Timeline</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            From first plan to the last day home
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <ol className="relative">
          {milestones.map((milestone, index) => {
            const Icon = stateIcon[milestone.state];
            const last = index === milestones.length - 1;

            return (
              <li key={milestone.key} className="relative flex gap-3 pb-5 last:pb-0">
                {/* The rail, drawn behind each marker except the last. */}
                {!last && (
                  <span
                    className="absolute top-6 left-[11px] h-[calc(100%-1rem)] w-px bg-line"
                    aria-hidden
                  />
                )}

                <span
                  className={cn(
                    "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border",
                    markerStyles[milestone.state],
                  )}
                >
                  <Icon
                    className={milestone.state === "current" ? "size-5" : "size-3"}
                    strokeWidth={milestone.state === "current" ? 3 : 3}
                    aria-hidden
                  />
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className={cn("text-[13.5px]", labelStyles[milestone.state])}>
                      {milestone.label}
                    </p>
                    <p className="shrink-0 text-[12px] text-ink-muted tabular-nums">
                      {formatLongDate(milestone.date)}
                    </p>
                  </div>

                  {milestone.detail && (
                    <p className="mt-1 text-[12px] leading-snug text-ink-muted">
                      {milestone.detail}
                    </p>
                  )}

                  {milestone.state === "upcoming" && !milestone.detail && (
                    <p className="mt-0.5 text-[11.5px] text-ink-muted">Still to come</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
