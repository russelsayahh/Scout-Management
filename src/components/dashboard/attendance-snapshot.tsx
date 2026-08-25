import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { attendanceSummary } from "@/data/stats";
import { formatPercent } from "@/lib/format";

/**
 * Attendance against the group's target. The meter's position is stated in
 * words underneath, so the reading never depends on the fill color.
 */
export function AttendanceSnapshot() {
  const { rate, target, registersTaken, registersExpected, flaggedScouts } = attendanceSummary;
  const aboveTarget = rate >= target;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Attendance this term</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">Across all sections</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] leading-none font-semibold tracking-tight text-ink">
            {formatPercent(rate)}
          </span>
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-positive">
            <TrendingUp className="size-3.5" strokeWidth={2.5} aria-hidden />
            +2.1pp
          </span>
        </div>

        <div className="mt-4">
          <Meter
            value={rate}
            target={target}
            targetLabel={`Target ${target}%`}
            label={`Attendance rate ${rate}% against a ${target}% target`}
          />
          <p className="mt-2 text-[11.5px] text-ink-muted">
            {aboveTarget ? "Above" : "Below"} the {target}% target · marker shows target
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div>
            <dt className="text-[11.5px] text-ink-muted">Registers taken</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
              {registersTaken}
              <span className="text-[12px] font-normal text-ink-muted">
                {" "}
                / {registersExpected}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-muted">Flagged scouts</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
              {flaggedScouts}
            </dd>
          </div>
        </dl>

        <Link
          href="/attendance"
          className="mt-4 text-[12.5px] font-medium text-brand-text hover:underline"
        >
          Open attendance
        </Link>
      </CardContent>
    </Card>
  );
}
