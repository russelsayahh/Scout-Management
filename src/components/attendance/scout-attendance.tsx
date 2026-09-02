import Link from "next/link";
import { CalendarOff, TriangleAlert } from "lucide-react";

import { AttendanceMarkBadge } from "@/components/attendance/attendance-mark-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import type { ScoutAttendance } from "@/lib/attendance/service";
import {
  ATTENDANCE_TARGET,
  FLAG_THRESHOLD,
  attendanceMarkLabels,
} from "@/lib/attendance/types";
import { formatPercent, formatShortDate } from "@/lib/format";

/**
 * One scout's attendance: the totals, and then the sessions behind them.
 *
 * The counts and the history are the same data read two ways, so a leader can
 * check a surprising percentage against the sessions that produced it.
 */

const HISTORY_LIMIT = 8;

export function ScoutAttendanceCard({
  attendance,
  firstName,
}: {
  attendance: ScoutAttendance;
  /** Used in the empty state, so it reads about a person. */
  firstName: string;
}) {
  const { tally, flagged } = attendance;
  const rate = tally.rate ?? 0;

  if (tally.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={CalendarOff}
            title="No sessions recorded"
            description={`${firstName} has not been on a register yet. Take the register for a session and the figures appear here.`}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Attendance</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Across {tally.total} recorded {tally.total === 1 ? "session" : "sessions"}
          </p>
        </div>

        {flagged && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-medium text-negative">
            <TriangleAlert className="size-3.5" strokeWidth={2} aria-hidden />
            Below {FLAG_THRESHOLD}%
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[30px] leading-none font-semibold tracking-tight text-ink">
              {formatPercent(rate)}
            </span>
            <span className="text-[12.5px] text-ink-secondary">
              present or late at{" "}
              <span className="tabular-nums">
                {tally.attended} of {tally.total}
              </span>
            </span>
          </div>

          <div className="mt-3">
            <Meter
              value={rate}
              target={ATTENDANCE_TARGET}
              targetLabel={`Target ${ATTENDANCE_TARGET}%`}
              tone={rate >= ATTENDANCE_TARGET ? "good" : flagged ? "warning" : "accent"}
              label={`Attendance ${rate}% against a ${ATTENDANCE_TARGET}% target`}
            />
            <p className="mt-2 text-[11.5px] text-ink-muted">
              {rate >= ATTENDANCE_TARGET ? "Above" : "Below"} the {ATTENDANCE_TARGET}% target ·
              marker shows target
            </p>
          </div>
        </div>

        {/* The four counts the profile is required to show, plus late. */}
        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-5">
          <div>
            <dt className="text-[11.5px] text-ink-muted">Total sessions</dt>
            <dd className="mt-0.5 text-[17px] font-semibold text-ink tabular-nums">
              {tally.total}
            </dd>
          </div>
          {(["present", "absent", "excused", "late"] as const).map((mark) => (
            <div key={mark}>
              <dt className="text-[11.5px] text-ink-muted">{attendanceMarkLabels[mark]}</dt>
              <dd className="mt-0.5 text-[17px] font-semibold text-ink tabular-nums">
                {tally[mark]}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function ScoutAttendanceHistory({ attendance }: { attendance: ScoutAttendance }) {
  const { history } = attendance;
  if (history.length === 0) return null;

  const shown = history.slice(0, HISTORY_LIMIT);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Attendance history</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            {history.length <= HISTORY_LIMIT
              ? "Every recorded session, newest first"
              : `The ${HISTORY_LIMIT} most recent of ${history.length} sessions`}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y divide-line">
          {shown.map((session) => (
            <li key={session.activityId} className="px-5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/activities/${session.activityId}`}
                    className="truncate text-[13.5px] font-medium text-ink hover:text-brand-text hover:underline"
                  >
                    {session.activityName}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-ink-muted tabular-nums">
                    {formatShortDate(session.date)}
                  </p>
                </div>

                <AttendanceMarkBadge mark={session.mark} className="shrink-0" />
              </div>

              {session.note && (
                <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-[12.5px] leading-snug text-ink-secondary">
                  {session.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
