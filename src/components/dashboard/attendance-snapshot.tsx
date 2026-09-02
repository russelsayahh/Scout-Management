import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import { Sparkline } from "@/components/ui/sparkline";
import { attendanceOverview } from "@/lib/attendance/service";
import { ATTENDANCE_TARGET } from "@/lib/attendance/types";
import { formatPercent } from "@/lib/format";

/**
 * Attendance against the group's target, read from the registers themselves.
 *
 * The meter's position is stated in words underneath, so the reading never
 * depends on the fill colour.
 */
export async function AttendanceSnapshot() {
  const { tally, registersTaken, outstanding, flagged, trend } = await attendanceOverview(
    new Date(),
  );

  const rate = tally.rate ?? 0;
  const aboveTarget = rate >= ATTENDANCE_TARGET;
  const expected = registersTaken + outstanding.length;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Attendance this term</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            {registersTaken === 0
              ? "No registers taken yet"
              : `Across ${registersTaken} ${registersTaken === 1 ? "register" : "registers"}`}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        {registersTaken === 0 ? (
          <p className="text-[13px] text-ink-secondary">
            Take the register for a session and the troop&rsquo;s turnout appears here.
          </p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] leading-none font-semibold tracking-tight text-ink">
                {formatPercent(rate)}
              </span>
              <span className="text-[12.5px] text-ink-secondary tabular-nums">
                {tally.attended} of {tally.total}
              </span>
            </div>

            <div className="mt-4">
              <Meter
                value={rate}
                target={ATTENDANCE_TARGET}
                targetLabel={`Target ${ATTENDANCE_TARGET}%`}
                tone={aboveTarget ? "good" : "accent"}
                label={`Attendance rate ${rate}% against a ${ATTENDANCE_TARGET}% target`}
              />
              <p className="mt-2 text-[11.5px] text-ink-muted">
                {aboveTarget ? "Above" : "Below"} the {ATTENDANCE_TARGET}% target · marker shows
                target
              </p>
            </div>

            {trend.length > 1 && (
              <div className="mt-5">
                <p className="text-[11.5px] tracking-wide text-ink-muted uppercase">
                  Last {trend.length} sessions
                </p>
                <div className="mt-2">
                  <Sparkline
                    data={trend.map((point) => point.rate)}
                    height={36}
                    label={`Attendance over the last ${trend.length} sessions`}
                  />
                </div>
              </div>
            )}

            <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4">
              <div>
                <dt className="text-[11.5px] text-ink-muted">Registers taken</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                  {registersTaken}
                  <span className="text-[12px] font-normal text-ink-muted"> / {expected}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-ink-muted">Flagged scouts</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
                  {flagged.length}
                </dd>
              </div>
            </dl>
          </>
        )}

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
