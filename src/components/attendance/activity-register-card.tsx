import Link from "next/link";
import { ClipboardCheck, ClipboardList } from "lucide-react";

import { AttendanceMarkBadge } from "@/components/attendance/attendance-mark-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import {
  availabilityMessages,
  type RegisterAvailability,
} from "@/lib/attendance/service";
import { ATTENDANCE_TARGET, type AttendanceTally } from "@/lib/attendance/types";
import { formatLongDate, formatPercent } from "@/lib/format";

/**
 * The register, as seen from an activity's own page.
 *
 * Three states, all of them honest about where the session is: not yet due,
 * due and unmarked, or taken - with the actual turnout.
 */
export function ActivityRegisterCard({
  activityId,
  availability,
  attendance,
  canRecord,
}: {
  activityId: string;
  availability: RegisterAvailability;
  /** Null when no register has been taken. */
  attendance: { tally: AttendanceTally; takenAt: string } | null;
  canRecord: boolean;
}) {
  const rate = attendance?.tally.rate ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {attendance ? (
            <ClipboardCheck className="size-4 text-brand-text" strokeWidth={1.9} aria-hidden />
          ) : (
            <ClipboardList className="size-4 text-ink-muted" strokeWidth={1.9} aria-hidden />
          )}
          <CardTitle>Register</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {attendance ? (
          <>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[26px] leading-none font-semibold tracking-tight text-ink">
                  {attendance.tally.rate === null ? "-" : formatPercent(rate)}
                </span>
                <span className="text-[12.5px] text-ink-secondary tabular-nums">
                  {attendance.tally.attended} of {attendance.tally.total} there
                </span>
              </div>

              <div className="mt-3">
                <Meter
                  value={rate}
                  target={ATTENDANCE_TARGET}
                  targetLabel={`Target ${ATTENDANCE_TARGET}%`}
                  tone={rate >= ATTENDANCE_TARGET ? "good" : "accent"}
                  label={`Turnout ${rate}% against a ${ATTENDANCE_TARGET}% target`}
                />
              </div>
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {(["present", "late", "excused", "absent"] as const).map((mark) => (
                <li key={mark} className="flex items-center gap-1.5">
                  <AttendanceMarkBadge mark={mark} />
                  <span className="text-[13px] font-medium text-ink tabular-nums">
                    {attendance.tally[mark]}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-[11.5px] text-ink-muted">
              Taken on {formatLongDate(attendance.takenAt)}.
            </p>

            <Link
              href={`/attendance/${activityId}`}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              {canRecord ? "Edit register" : "View register"}
            </Link>
          </>
        ) : availability === "ready" ? (
          <>
            <p className="text-[13px] text-ink-secondary">
              This has happened, but nobody has been marked yet.
            </p>
            <Link href={`/attendance/${activityId}`} className={buttonStyles({ size: "sm" })}>
              <ClipboardList className="size-3.5" strokeWidth={2} aria-hidden />
              {canRecord ? "Take the register" : "Open the register"}
            </Link>
          </>
        ) : (
          <p className="text-[13px] text-ink-secondary">
            {availabilityMessages[availability]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
