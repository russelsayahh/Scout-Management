import Link from "next/link";
import { ClipboardCheck, ClipboardList, TriangleAlert, Users } from "lucide-react";

import { AttendanceMarkBadge } from "@/components/attendance/attendance-mark-badge";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { formatTimeRange } from "@/lib/activities/types";
import type {
  FlaggedScout,
  OutstandingRegister,
  PatrolAttendanceRow,
  TakenRegister,
} from "@/lib/attendance/service";
import { ATTENDANCE_TARGET, FLAG_THRESHOLD } from "@/lib/attendance/types";
import { formatPercent, formatShortDate } from "@/lib/format";
import { scoutFullName } from "@/lib/scouts/types";

/** The four panels on the attendance dashboard. */

/* ------------------------------- outstanding ------------------------------ */

export function OutstandingRegisters({
  outstanding,
  canRecord,
}: {
  outstanding: OutstandingRegister[];
  canRecord: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>
            Still to take
            <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
              {outstanding.length}
            </span>
          </CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Sessions that have happened with no register
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {outstanding.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Every register is in"
            description="Nothing that has happened is waiting to be marked."
          />
        ) : (
          <ul className="divide-y divide-line">
            {outstanding.slice(0, 6).map(({ activity, expected }) => (
              <li key={activity.id}>
                <Link
                  href={`/attendance/${activity.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{activity.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted tabular-nums">
                      {formatShortDate(activity.date)} · {formatTimeRange(activity)} ·{" "}
                      {expected} {expected === 1 ? "scout" : "scouts"}
                    </p>
                  </div>

                  <span
                    className={buttonStyles({
                      variant: canRecord ? "subtle" : "secondary",
                      size: "sm",
                      className: "shrink-0",
                    })}
                  >
                    {canRecord ? "Take register" : "View"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {outstanding.length > 6 && (
        <div className="border-t border-line px-5 py-2.5 text-[12px] text-ink-muted">
          {outstanding.length - 6} more not shown.
        </div>
      )}
    </Card>
  );
}

/* --------------------------------- recent --------------------------------- */

export function RecentRegisters({ recent }: { recent: TakenRegister[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Recent registers</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">Most recently held sessions</p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {recent.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No registers yet"
            description="Take the register for a session and it will appear here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {recent.map(({ activity, tally, takenByName }) => (
              <li key={activity.id}>
                <Link
                  href={`/attendance/${activity.id}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{activity.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {formatShortDate(activity.date)} · taken by {takenByName}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5">
                    <span className="text-[12px] text-ink-secondary tabular-nums">
                      {tally.attended}/{tally.total}
                    </span>
                    <Badge tone={(tally.rate ?? 0) >= ATTENDANCE_TARGET ? "good" : "neutral"}>
                      {tally.rate === null ? "-" : formatPercent(tally.rate, 0)}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------- by patrol -------------------------------- */

export function PatrolAttendanceBreakdown({ rows }: { rows: PatrolAttendanceRow[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>By patrol</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Present or late, across every register
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {rows.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-ink-muted">
            No patrol has been marked on a register yet.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {rows.map((row) => (
              <li key={row.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/patrols/${row.id}`}
                    className="min-w-0 truncate text-[13px] font-medium text-ink hover:text-brand-text hover:underline"
                  >
                    {row.name}
                  </Link>
                  <span className="shrink-0 text-[12.5px] text-ink-secondary tabular-nums">
                    {row.tally.rate === null ? "-" : formatPercent(row.tally.rate, 0)}
                    <span className="text-ink-muted">
                      {" "}
                      ({row.tally.attended}/{row.tally.total})
                    </span>
                  </span>
                </div>
                <Meter
                  className="mt-1.5"
                  size="sm"
                  value={row.tally.rate ?? 0}
                  target={ATTENDANCE_TARGET}
                  targetLabel={`Target ${ATTENDANCE_TARGET}%`}
                  tone={(row.tally.rate ?? 0) >= ATTENDANCE_TARGET ? "good" : "accent"}
                  label={`${row.name} attendance ${row.tally.rate ?? 0}% against a ${ATTENDANCE_TARGET}% target`}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <div className="border-t border-line px-5 py-2.5 text-[11.5px] text-ink-muted">
        Marker shows the {ATTENDANCE_TARGET}% target. Counted where each scout is now.
      </div>
    </Card>
  );
}

/* --------------------------------- flagged -------------------------------- */

export function FlaggedScouts({ flagged }: { flagged: FlaggedScout[] }) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>
            Worth a word
            <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
              {flagged.length}
            </span>
          </CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Below {FLAG_THRESHOLD}% and drifting away
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {flagged.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nobody is drifting"
            description={`Every scout with enough sessions recorded is above ${FLAG_THRESHOLD}%.`}
          />
        ) : (
          <ul className="divide-y divide-line">
            {flagged.slice(0, 8).map(({ scout, tally, patrolName }) => (
              <li key={scout.id}>
                <Link
                  href={`/scouts/${scout.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={scoutFullName(scout)} src={scout.avatar} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">
                      {scoutFullName(scout)}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                      {patrolName ? `${patrolName} Patrol` : "No patrol"} ·{" "}
                      <span className="tabular-nums">
                        {tally.attended} of {tally.total} sessions
                      </span>
                    </p>
                  </div>

                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium text-negative tabular-nums">
                    <TriangleAlert className="size-3.5" strokeWidth={2} aria-hidden />
                    {tally.rate === null ? "-" : formatPercent(tally.rate, 0)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ mark summary ------------------------------ */

/** The overall split of marks, as a written breakdown rather than a pie. */
export function MarkBreakdown({
  tally,
}: {
  tally: { present: number; absent: number; excused: number; late: number; total: number };
}) {
  const rows = [
    { mark: "present" as const, value: tally.present },
    { mark: "late" as const, value: tally.late },
    { mark: "excused" as const, value: tally.excused },
    { mark: "absent" as const, value: tally.absent },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rows.map((row) => (
        <div key={row.mark} className="rounded-lg border border-line bg-surface-muted px-3 py-2.5">
          <dt>
            <AttendanceMarkBadge mark={row.mark} />
          </dt>
          <dd className="mt-1.5 text-[19px] font-semibold text-ink tabular-nums">
            {row.value}
            <span className="ml-1.5 text-[12px] font-normal text-ink-muted">
              {tally.total === 0 ? "" : `${Math.round((row.value / tally.total) * 100)}%`}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
