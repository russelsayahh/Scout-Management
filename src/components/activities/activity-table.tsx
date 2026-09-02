import Link from "next/link";
import { MapPin, Users } from "lucide-react";

import { ActivityActions } from "@/components/activities/activity-actions";
import { ActivityStatusBadge } from "@/components/activities/activity-status-badge";
import {
  ActivityTypeIcon,
  ActivityTypeLabel,
} from "@/components/activities/activity-type-icon";
import { SortHeader, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  activitiesHref,
  leaderNameOf,
  patrolNamesOf,
  type ActivityContext,
  type ActivityQuery,
  type ActivitySort,
} from "@/lib/activities/query";
import { formatTimeRange, hasFinished, type Activity } from "@/lib/activities/types";
import { formatShortDate, splitDateParts } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The programme as a list.
 *
 * A real table from `md` up and a card list below it - the same data, laid out
 * for the space available, rather than a table squeezed onto a phone.
 */

/** "Whole troop" is the meaningful answer when no patrol is named. */
function audienceLabel(activity: Activity, context: ActivityContext): string {
  const names = patrolNamesOf(activity, context);
  if (names.length === 0) return "Whole troop";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

function PlacesCell({
  activity,
  expected,
}: {
  activity: Activity;
  expected: number | undefined;
}) {
  if (activity.capacity === null) {
    return <span className="text-ink-muted">No limit</span>;
  }

  // Not worth flagging on an activity that is no longer going ahead.
  const over =
    expected !== undefined && expected > activity.capacity && activity.status !== "cancelled";

  return (
    <span className={cn("tabular-nums", over && "font-medium text-negative")}>
      {expected ?? "-"}/{activity.capacity}
    </span>
  );
}

export function ActivityTable({
  activities,
  query,
  context,
  expected,
  canManage,
  now,
}: {
  activities: Activity[];
  query: ActivityQuery;
  context: ActivityContext;
  /** Expected head count per activity id, resolved on the server. */
  expected: Record<string, number>;
  canManage: boolean;
  /** One reference instant for the whole table, so no two rows disagree. */
  now: Date;
}) {
  /** Clicking the active column flips direction; a new column starts ascending. */
  const sortHref = (sort: ActivitySort) =>
    activitiesHref({
      ...query,
      sort,
      dir: query.sort === sort && query.dir === "asc" ? "desc" : "asc",
      page: 1,
    });

  return (
    <>
      {/* Table, md and up */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <SortHeader
                href={sortHref("name")}
                active={query.sort === "name"}
                direction={query.dir}
              >
                Activity
              </SortHeader>
              <SortHeader
                href={sortHref("date")}
                active={query.sort === "date"}
                direction={query.dir}
              >
                When
              </SortHeader>
              <TH className="hidden lg:table-cell">Where</TH>
              <TH className="hidden xl:table-cell">Leader</TH>
              <TH className="hidden xl:table-cell">For</TH>
              <TH className="text-right">Places</TH>
              <SortHeader
                href={sortHref("status")}
                active={query.sort === "status"}
                direction={query.dir}
              >
                Status
              </SortHeader>
              {canManage && (
                <TH className="text-right">
                  <span className="sr-only">Actions</span>
                </TH>
              )}
            </TR>
          </THead>

          <TBody>
            {activities.map((activity) => (
              <TR key={activity.id}>
                <TD className="max-w-64">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-secondary">
                      <ActivityTypeIcon type={activity.type} className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/activities/${activity.id}`}
                        className={cn(
                          "block truncate font-medium text-ink hover:text-brand-text hover:underline",
                          activity.status === "cancelled" && "line-through decoration-1",
                        )}
                      >
                        {activity.name}
                      </Link>
                      {/* The location repeats here only while its own column is hidden. */}
                      <p className="truncate text-[11.5px] text-ink-muted">
                        <ActivityTypeLabel type={activity.type} />
                        <span className="lg:hidden"> · {activity.location}</span>
                      </p>
                    </div>
                  </div>
                </TD>

                <TD className="whitespace-nowrap">
                  <span className="block text-ink">{formatShortDate(activity.date)}</span>
                  <span className="block text-[11.5px] text-ink-muted tabular-nums">
                    {formatTimeRange(activity)}
                  </span>
                </TD>

                <TD className="hidden max-w-44 truncate text-ink-secondary lg:table-cell">
                  {activity.location}
                </TD>

                <TD className="hidden max-w-40 truncate text-ink-secondary xl:table-cell">
                  {leaderNameOf(activity, context)}
                </TD>

                <TD className="hidden max-w-40 truncate text-ink-secondary xl:table-cell">
                  {audienceLabel(activity, context)}
                </TD>

                <TD className="text-right whitespace-nowrap">
                  <PlacesCell activity={activity} expected={expected[activity.id]} />
                </TD>

                <TD>
                  <ActivityStatusBadge status={activity.status} />
                </TD>

                {canManage && (
                  <TD>
                    <ActivityActions
                      activity={activity}
                      canManage={canManage}
                      finished={hasFinished(activity, now)}
                    />
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Cards, below md */}
      <ul className="divide-y divide-line md:hidden">
        {activities.map((activity) => {
          const { day, month, weekday } = splitDateParts(activity.date);

          return (
            <li key={activity.id} className="p-4">
              <div className="flex gap-3.5">
                <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-surface-muted">
                  <span className="text-[9.5px] font-medium tracking-wide text-ink-muted uppercase">
                    {weekday}
                  </span>
                  <span className="text-[15px] leading-none font-semibold text-ink">{day}</span>
                  <span className="text-[9.5px] font-medium tracking-wide text-ink-muted uppercase">
                    {month}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/activities/${activity.id}`}
                      className={cn(
                        "min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink",
                        activity.status === "cancelled" && "line-through decoration-1",
                      )}
                    >
                      {activity.name}
                    </Link>
                    <ActivityStatusBadge status={activity.status} className="shrink-0" />
                  </div>

                  <p className="mt-1 text-[12px] text-ink-secondary tabular-nums">
                    {formatTimeRange(activity)}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                    <ActivityTypeLabel type={activity.type} />
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                      <span className="truncate">{activity.location}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Users className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                      {expected[activity.id] ?? "-"}
                      {activity.capacity === null ? "" : `/${activity.capacity}`}
                    </span>
                  </div>
                </div>
              </div>

              {canManage && (
                <div className="mt-3 flex justify-end">
                  <ActivityActions
                      activity={activity}
                      canManage={canManage}
                      finished={hasFinished(activity, now)}
                    />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
