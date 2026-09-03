import Link from "next/link";
import { CalendarOff, ClipboardList, MapPin } from "lucide-react";

import { ActivityTypeIcon } from "@/components/activities/activity-type-icon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { Sparkline } from "@/components/ui/sparkline";
import { formatTimeRange, type Activity } from "@/lib/activities/types";
import type { PatrolAttendance } from "@/lib/attendance/service";
import { ATTENDANCE_TARGET } from "@/lib/attendance/types";
import { formatPercent, formatShortDate } from "@/lib/format";

/**
 * The two summary panels on a patrol page.
 *
 * Both read real records now: recent activities from the programme, and the
 * attendance summary from the registers taken for the sessions this patrol was
 * part of. Neither is generated any more, so neither carries a sample badge.
 */

export function PatrolActivityPanel({
  activities,
  patrolId,
}: {
  /** Completed activities this patrol took part in, newest first. */
  activities: Activity[];
  patrolId: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Recent activities</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            What this patrol has taken part in
          </p>
        </div>
        <Link
          href={`/activities?patrol=${patrolId}&period=all`}
          className="shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
        >
          See all
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {activities.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Nothing recorded yet"
            description="Once an activity this patrol took part in is marked as completed, it appears here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {activities.map((activity) => (
              <li key={activity.id}>
                <Link
                  href={`/activities/${activity.id}`}
                  className="flex gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-ink-secondary">
                    <ActivityTypeIcon type={activity.type} className="size-3.75" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {activity.name}
                      </p>
                      {activity.patrolIds.length === 0 && (
                        <Badge tone="neutral" className="shrink-0">
                          Whole troop
                        </Badge>
                      )}
                    </div>

                    <p className="mt-0.5 inline-flex min-w-0 items-center gap-1 text-[12px] text-ink-secondary">
                      <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                      <span className="truncate">{activity.location}</span>
                    </p>

                    <p className="mt-1 text-[11px] text-ink-muted tabular-nums">
                      {formatShortDate(activity.date)} · {formatTimeRange(activity)}
                    </p>
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

export function PatrolAttendancePanel({
  patrolId,
  attendance,
  memberCount,
}: {
  patrolId: string;
  attendance: PatrolAttendance;
  memberCount: number;
}) {
  const { tally, sessionsHeld, averagePresent, trend } = attendance;
  const rate = tally.rate ?? 0;
  const aboveTarget = rate >= ATTENDANCE_TARGET;

  if (sessionsHeld === 0) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle>Attendance summary</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <EmptyState
            icon={ClipboardList}
            title="No registers yet"
            description="Once a register is taken for a session this patrol was part of, its turnout appears here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Attendance summary</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Across {sessionsHeld} {sessionsHeld === 1 ? "session" : "sessions"}
          </p>
        </div>
        <Link
          href="/attendance"
          className="shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
        >
          All attendance
        </Link>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] leading-none font-semibold tracking-tight text-ink">
            {formatPercent(rate)}
          </span>
          <span className="text-[12.5px] text-ink-secondary">average turnout</span>
        </div>

        <div className="mt-4">
          <Meter
            value={rate}
            target={ATTENDANCE_TARGET}
            targetLabel={`Target ${ATTENDANCE_TARGET}%`}
            tone={aboveTarget ? "good" : "accent"}
            label={`Attendance ${rate}% against a ${ATTENDANCE_TARGET}% target`}
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
                data={trend}
                height={40}
                label={`Attendance over the last ${trend.length} sessions`}
              />
            </div>
          </div>
        )}

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div>
            <dt className="text-[11.5px] text-ink-muted">Typically present</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
              {averagePresent}
              <span className="text-[12px] font-normal text-ink-muted"> of {memberCount}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-muted">Sessions held</dt>
            <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">
              {sessionsHeld}
            </dd>
          </div>
        </dl>
      </CardContent>

      <div className="border-t border-line bg-surface-muted px-5 py-2.5 text-[11.5px] text-ink-muted">
        Counted from the registers of every session{" "}
        <Link href={`/activities?patrol=${patrolId}&period=all`} className="text-brand-text hover:underline">
          this patrol took part in
        </Link>
        .
      </div>
    </Card>
  );
}
