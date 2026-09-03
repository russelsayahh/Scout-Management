import Link from "next/link";
import { CalendarOff, ChevronLeft, ChevronRight, MapPin } from "lucide-react";

import { ActivityStatusBadge } from "@/components/activities/activity-status-badge";
import { ActivityTypeIcon } from "@/components/activities/activity-type-icon";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WEEKDAY_LABELS, type CalendarDay, type CalendarMonth } from "@/lib/activities/calendar";
import { activitiesHref, type ActivityQuery } from "@/lib/activities/query";
import { formatTimeRange, type Activity, type ActivityStatus } from "@/lib/activities/types";
import { formatDayLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The programme as a month.
 *
 * Two layouts, one set of data. From `md` up it is a real month grid, because
 * that is how a term is planned. Below `md` a seven-column grid would give each
 * activity about forty pixels, so the same month is listed as an agenda -
 * day by day, only the days with something on. Both share the month heading and
 * the same links, so moving between phone and laptop shows the same programme.
 *
 * Everything here is a link: no state, no JavaScript, and every month is its
 * own URL.
 */

/** How many chips fit in a cell before it is worth linking to the full day. */
const MAX_CHIPS = 3;

const chipTones: Record<ActivityStatus, string> = {
  draft: "border-dashed border-line-strong bg-surface text-ink-secondary",
  published: "border-brand-border bg-brand-soft text-brand-text",
  completed: "border-line bg-surface-inset text-ink-secondary",
  cancelled: "border-status-critical/30 bg-status-critical/8 text-ink-secondary line-through",
};

function DayChip({ activity }: { activity: Activity }) {
  return (
    <Link
      href={`/activities/${activity.id}`}
      title={`${activity.name} - ${formatTimeRange(activity)} at ${activity.location}`}
      className={cn(
        "flex items-center gap-1 rounded border px-1.5 py-1 text-[11px] leading-tight transition-opacity hover:opacity-80",
        chipTones[activity.status],
      )}
    >
      <ActivityTypeIcon type={activity.type} className="size-3 shrink-0" />
      <span className="shrink-0 tabular-nums opacity-80">{activity.startTime}</span>
      <span className="min-w-0 flex-1 truncate">{activity.name}</span>
    </Link>
  );
}

function MonthCell({ day, query }: { day: CalendarDay; query: ActivityQuery }) {
  const overflow = day.activities.length - MAX_CHIPS;

  return (
    <div
      className={cn(
        "flex min-h-28 flex-col gap-1 border-t border-l border-line p-1.5",
        !day.inMonth && "bg-surface-muted/50",
        day.inMonth && day.isWeekend && "bg-surface-muted/30",
      )}
    >
      <div className="flex items-center justify-between px-0.5">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded text-[11.5px] tabular-nums",
            day.inMonth ? "text-ink-secondary" : "text-ink-muted/60",
            day.isToday && "bg-brand-solid font-semibold text-white",
          )}
        >
          {day.dayOfMonth}
        </span>
        {day.isToday && (
          <span className="text-[9.5px] font-semibold tracking-wide text-brand-text uppercase">
            Today
          </span>
        )}
      </div>

      {day.activities.slice(0, MAX_CHIPS).map((activity) => (
        <DayChip key={activity.id} activity={activity} />
      ))}

      {overflow > 0 && (
        <Link
          href={activitiesHref({
            ...query,
            view: "list",
            period: "all",
            date: day.date,
            page: 1,
          })}
          className="px-1 text-[10.5px] font-medium text-brand-text hover:underline"
        >
          +{overflow} more
        </Link>
      )}
    </div>
  );
}

function AgendaDay({ day }: { day: CalendarDay }) {
  return (
    <li>
      <div
        className={cn(
          "flex items-baseline gap-2 border-b border-line bg-surface-muted px-4 py-2",
          day.isToday && "bg-brand-soft",
        )}
      >
        <span
          className={cn(
            "text-[12.5px] font-semibold",
            day.isToday ? "text-brand-text" : "text-ink",
          )}
        >
          {formatDayLabel(day.date)}
        </span>
        {day.isToday && (
          <span className="text-[10.5px] font-semibold tracking-wide text-brand-text uppercase">
            Today
          </span>
        )}
      </div>

      <ul className="divide-y divide-line">
        {day.activities.map((activity) => (
          <li key={activity.id}>
            <Link
              href={`/activities/${activity.id}`}
              className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-secondary">
                <ActivityTypeIcon type={activity.type} className="size-4" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink",
                      activity.status === "cancelled" && "line-through decoration-1",
                    )}
                  >
                    {activity.name}
                  </span>
                  <ActivityStatusBadge status={activity.status} className="shrink-0" />
                </div>

                <p className="mt-0.5 text-[12px] text-ink-secondary tabular-nums">
                  {formatTimeRange(activity)}
                </p>
                <p className="mt-1 inline-flex min-w-0 items-center gap-1 text-[11.5px] text-ink-muted">
                  <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                  <span className="truncate">{activity.location}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export function ActivityCalendar({
  month,
  query,
  todayMonth,
}: {
  month: CalendarMonth;
  query: ActivityQuery;
  /** "YYYY-MM" for the month containing today, so "Today" can be hidden on it. */
  todayMonth: string;
}) {
  const stepStyles =
    "flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-secondary transition-colors hover:bg-surface-hover";

  return (
    <Card className="overflow-hidden">
      {/* Month heading and navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{month.label}</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">
            {month.total === 0
              ? "Nothing on the programme"
              : `${month.total} ${month.total === 1 ? "activity" : "activities"} this month`}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {month.month !== todayMonth && (
            <Link
              href={activitiesHref({ ...query, month: "", page: 1 })}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Today
            </Link>
          )}
          <Link
            href={activitiesHref({ ...query, month: month.previousMonth, page: 1 })}
            className={stepStyles}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          </Link>
          <Link
            href={activitiesHref({ ...query, month: month.nextMonth, page: 1 })}
            className={stepStyles}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>

      {/* Month grid, md and up */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-[11px] font-semibold tracking-wide text-ink-muted uppercase"
            >
              {label}
            </div>
          ))}
        </div>

        {/* The right and bottom edges come from the card, so cells only draw
            their top and left hairlines and nothing doubles up. */}
        <div className="grid grid-cols-7 border-b border-line [&>*:nth-child(7n+1)]:border-l-0">
          {month.weeks.flat().map((day) => (
            <MonthCell key={day.date} day={day} query={query} />
          ))}
        </div>
      </div>

      {/* Agenda, below md */}
      <div className="md:hidden">
        {month.daysWithActivities.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Nothing this month"
            description="Use the arrows above to look at another month, or switch to the list view."
          />
        ) : (
          <ul>
            {month.daysWithActivities.map((day) => (
              <AgendaDay key={day.date} day={day} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
