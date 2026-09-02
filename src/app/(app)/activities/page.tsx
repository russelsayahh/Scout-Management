import type { Metadata } from "next";
import Link from "next/link";
import { CalendarSearch, Plus } from "lucide-react";

import { ActivityCalendar } from "@/components/activities/activity-calendar";
import { ActivityFilters } from "@/components/activities/activity-filters";
import { ActivityTable } from "@/components/activities/activity-table";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { buildCalendarMonth, monthOf, resolveMonth } from "@/lib/activities/calendar";
import { activitiesHref, parseActivityQuery } from "@/lib/activities/query";
import {
  activitiesForCalendar,
  activityContext,
  activityCounts,
  expectedAttendance,
  listActivities,
  patrolChoices,
} from "@/lib/activities/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Activities",
  description: "The troop's programme: meetings, days out, skills sessions and competitions.",
};

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "activities.view")) {
    return <AccessDenied sectionName="Activities" role={user.role} />;
  }

  const canManage = can(user.role, "activities.manage");

  // One reference instant for the whole request, so nothing on the page can
  // disagree about where the line between upcoming and past falls.
  const now = new Date();

  const query = parseActivityQuery(await searchParams);
  const [context, patrols, counts] = await Promise.all([
    activityContext(now),
    patrolChoices(),
    activityCounts(now),
  ]);

  const calendarView = query.view === "calendar";

  // Drafts belong to the leaders planning the programme, not to everyone.
  const month = calendarView
    ? buildCalendarMonth(
        resolveMonth(query.month, now),
        await activitiesForCalendar(query, context, canManage),
        now,
      )
    : null;

  const page = calendarView ? null : await listActivities(query, context, canManage);
  const expected = page ? await expectedAttendance(page.items) : {};

  const from = page ? (page.page - 1) * page.pageSize + 1 : 0;
  const to = page ? Math.min(page.page * page.pageSize, page.total) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description="Everything the troop has planned, from the weekly meeting to camps and competitions."
        actions={
          <>
            {/* These add up to the rows the default filter shows, so the two
                figures can be reconciled rather than quietly disagreeing. */}
            <Badge tone="neutral">{counts.upcomingByStatus.published} published</Badge>
            {canManage && counts.upcomingByStatus.draft > 0 && (
              <Badge tone="neutral">{counts.upcomingByStatus.draft} draft</Badge>
            )}
            {counts.upcomingByStatus.cancelled > 0 && (
              <Badge tone="neutral">{counts.upcomingByStatus.cancelled} cancelled</Badge>
            )}
            {counts.upcomingByStatus.completed > 0 && (
              <Badge tone="neutral">{counts.upcomingByStatus.completed} completed</Badge>
            )}
            {canManage && (
              <Link href="/activities/new" className={buttonStyles()}>
                <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                New activity
              </Link>
            )}
          </>
        }
      />

      <ActivityFilters
        query={query}
        total={month ? month.total : (page?.total ?? 0)}
        patrols={patrols}
        canManage={canManage}
      />

      {month ? (
        <ActivityCalendar month={month} query={query} todayMonth={monthOf(now)} />
      ) : (
        <>
          <Card className="overflow-hidden">
            {page && page.items.length > 0 ? (
              <ActivityTable
                activities={page.items}
                query={query}
                context={context}
                expected={expected}
                canManage={canManage}
                now={now}
              />
            ) : (
              <EmptyState
                icon={CalendarSearch}
                title="No activities match these filters"
                description={
                  counts.total === 0
                    ? "Nothing has been added to the programme yet."
                    : "Try a different search, widen the dates, or clear the filters to see the whole programme."
                }
                action={
                  <>
                    <Link href="/activities" className={buttonStyles({ variant: "secondary" })}>
                      Clear filters
                    </Link>
                    {canManage && (
                      <Link href="/activities/new" className={buttonStyles()}>
                        <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                        New activity
                      </Link>
                    )}
                  </>
                }
              />
            )}
          </Card>

          {page && page.total > 0 && (
            <Pagination
              page={page.page}
              pageCount={page.pageCount}
              hrefFor={(next) => activitiesHref({ ...query, page: next })}
              summary={`Showing ${from}-${to} of ${page.total}`}
            />
          )}
        </>
      )}
    </div>
  );
}
