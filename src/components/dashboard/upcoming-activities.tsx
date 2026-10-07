import Link from "next/link";
import { CalendarPlus, MapPin, Users } from "lucide-react";

import { ActivityTypeLabel } from "@/components/activities/activity-type-icon";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { TroopScope } from "@/lib/auth/troop-scope";
import { expectedAttendance, upcomingActivities } from "@/lib/activities/service";
import { formatTimeRange } from "@/lib/activities/types";
import { splitDateParts } from "@/lib/format";

/**
 * What is coming up, on the dashboard.
 *
 * Published activities only: a draft is not something to turn up to, and a
 * cancelled one is not something to plan around.
 */
export async function UpcomingActivities({
  scope,
  canManage,
  limit = 5,
}: {
  scope: TroopScope;
  canManage: boolean;
  limit?: number;
}) {
  const activities = await upcomingActivities(scope, new Date(), limit);
  const expected = await expectedAttendance(activities);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Upcoming activities</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            The next {activities.length === 1 ? "one" : activities.length} on the programme
          </p>
        </div>
        <Link
          href="/activities?view=calendar"
          className="shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
        >
          Full calendar
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {activities.length === 0 ? (
          <EmptyState
            icon={CalendarPlus}
            title="Nothing coming up"
            description={
              canManage
                ? "The programme is empty from today onwards. Add an activity to get the term started."
                : "Nothing has been published for the weeks ahead yet."
            }
            action={
              canManage ? (
                <Link href="/activities/new" className={buttonStyles()}>
                  Add an activity
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {activities.map((activity) => {
              const { day, month, weekday } = splitDateParts(activity.date);

              return (
                <li key={activity.id}>
                  <Link
                    href={`/activities/${activity.id}`}
                    className="flex gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                  >
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-surface-muted">
                      <span className="text-[9.5px] font-medium tracking-wide text-ink-muted uppercase">
                        {weekday}
                      </span>
                      <span className="text-[15px] leading-none font-semibold text-ink">
                        {day}
                      </span>
                      <span className="text-[9.5px] font-medium tracking-wide text-ink-muted uppercase">
                        {month}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {activity.name}
                        </p>
                        <span className="shrink-0 text-[11.5px] text-ink-muted">
                          <ActivityTypeLabel type={activity.type} />
                        </span>
                      </div>

                      <p className="mt-1 text-[12px] text-ink-secondary tabular-nums">
                        {formatTimeRange(activity)}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                          <span className="truncate">{activity.location}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Users className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                          {expected[activity.id] ?? 0} expected
                          {activity.capacity === null ? "" : ` of ${activity.capacity}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
