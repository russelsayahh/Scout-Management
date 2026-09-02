import Link from "next/link";
import { MapPin, TentTree, Users } from "lucide-react";

import { CampStatusBadge } from "@/components/camps/camp-status-badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { upcomingCamps } from "@/lib/camps/service";
import { daysUntilDeadline, formatCampLength } from "@/lib/camps/types";
import { formatDateRange, splitDateParts } from "@/lib/format";

/**
 * Camps still to come, on the dashboard.
 *
 * Camps being planned are left out: they have not been announced, so they are
 * not something anyone can act on yet.
 */
export async function UpcomingCamps({
  canManage,
  limit = 3,
}: {
  canManage: boolean;
  limit?: number;
}) {
  const now = new Date();
  const camps = await upcomingCamps(now, limit);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Upcoming camps</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            {camps.length === 0 ? "Nothing announced" : "Announced and still to come"}
          </p>
        </div>
        <Link
          href="/camps"
          className="shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
        >
          All camps
        </Link>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        {camps.length === 0 ? (
          <EmptyState
            icon={TentTree}
            title="No camps announced"
            description={
              canManage
                ? "Plan a camp and open registration, and it appears here."
                : "Nothing has been announced for the months ahead yet."
            }
            action={
              canManage ? (
                <Link href="/camps/new" className={buttonStyles()}>
                  Plan a camp
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {camps.map(({ camp, registered, placesLeft }) => {
              const { day, month } = splitDateParts(camp.startDate);
              const daysLeft = daysUntilDeadline(camp, now);

              return (
                <li key={camp.id}>
                  <Link
                    href={`/camps/${camp.id}`}
                    className="flex gap-3.5 px-5 py-3.5 transition-colors hover:bg-surface-muted"
                  >
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-surface-muted">
                      <span className="text-[15px] leading-none font-semibold text-ink">
                        {day}
                      </span>
                      <span className="mt-0.5 text-[9.5px] font-medium tracking-wide text-ink-muted uppercase">
                        {month}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[13.5px] font-medium text-ink">{camp.name}</p>
                        <CampStatusBadge status={camp.status} className="shrink-0" />
                      </div>

                      <p className="mt-1 text-[12px] text-ink-secondary">
                        {formatDateRange(camp.startDate, camp.endDate)}
                        <span className="text-ink-muted"> · {formatCampLength(camp)}</span>
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                          <span className="truncate">{camp.location}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Users className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                          {registered} of {camp.maxParticipants}
                        </span>
                        {camp.status === "registration-open" && daysLeft >= 0 && (
                          <span>
                            {daysLeft === 0
                              ? "deadline today"
                              : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to register`}
                          </span>
                        )}
                      </div>

                      <Meter
                        className="mt-2"
                        size="sm"
                        value={registered}
                        max={camp.maxParticipants}
                        tone={placesLeft === 0 ? "good" : "accent"}
                        label={`${registered} of ${camp.maxParticipants} places filled`}
                      />
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
