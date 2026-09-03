import Link from "next/link";
import { CalendarDays, MapPin, ShieldCheck, Users } from "lucide-react";

import { CampActions } from "@/components/camps/camp-actions";
import { CampStatusBadge } from "@/components/camps/camp-status-badge";
import { Card } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import type { CampSummary } from "@/lib/camps/service";
import { daysUntilDeadline, formatCampLength, isClosed } from "@/lib/camps/types";
import { formatDateRange } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The camps list, as cards.
 *
 * A camp carries dates, a place, leaders and a fill level rather than a row of
 * comparable figures, so cards read better than a table - and they reflow to
 * one column on a phone without any horizontal scrolling.
 */

/** Deadline pressure, in the words a leader would use. */
function deadlineNote(summary: CampSummary, now: Date): string | null {
  const { camp } = summary;
  if (isClosed(camp.status) || camp.status === "ongoing") return null;

  const days = daysUntilDeadline(camp, now);
  if (days < 0) return "Deadline passed";
  if (days === 0) return "Deadline today";
  if (days === 1) return "Deadline tomorrow";
  if (days <= 14) return `${days} days to register`;
  return null;
}

export function CampGrid({
  camps,
  canManage,
  now,
}: {
  camps: CampSummary[];
  canManage: boolean;
  /** One reference instant, so no two cards disagree about the deadline. */
  now: Date;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {camps.map((summary) => {
        const { camp, registered, placesLeft, leaderNames, patrolNames } = summary;
        const closed = isClosed(camp.status);
        const note = deadlineNote(summary, now);
        const full = placesLeft === 0;

        return (
          <Card
            key={camp.id}
            className={cn("flex flex-col p-5", closed && "bg-surface-muted/60")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/camps/${camp.id}`}
                  className={cn(
                    "text-[15px] font-semibold tracking-tight text-ink hover:text-brand-text hover:underline",
                    camp.status === "cancelled" && "line-through decoration-1",
                  )}
                >
                  {camp.name}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <CampStatusBadge status={camp.status} />
                  {note && <span className="text-[11.5px] text-ink-muted">{note}</span>}
                </div>
              </div>

              <CampActions camp={camp} registered={registered} canManage={canManage} />
            </div>

            <dl className="mt-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays
                  className="size-3.5 shrink-0 text-ink-muted"
                  strokeWidth={2}
                  aria-hidden
                />
                <dt className="sr-only">Dates</dt>
                <dd className="text-[12.5px] text-ink-secondary">
                  {formatDateRange(camp.startDate, camp.endDate)}
                  <span className="text-ink-muted"> · {formatCampLength(camp)}</span>
                </dd>
              </div>

              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">Location</dt>
                <dd className="min-w-0 truncate text-[12.5px] text-ink-secondary">
                  {camp.location}
                </dd>
              </div>

              <div className="flex min-w-0 items-center gap-1.5">
                <ShieldCheck
                  className="size-3.5 shrink-0 text-ink-muted"
                  strokeWidth={2}
                  aria-hidden
                />
                <dt className="sr-only">Responsible leaders</dt>
                <dd className="min-w-0 truncate text-[12.5px] text-ink-secondary">
                  {leaderNames.join(", ") || (
                    <span className="text-ink-muted">Nobody assigned</span>
                  )}
                </dd>
              </div>

              <div className="flex min-w-0 items-center gap-1.5">
                <Users className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">Invited patrols</dt>
                <dd className="min-w-0 truncate text-[12.5px] text-ink-secondary">
                  {patrolNames.length === 0 ? "Whole troop" : patrolNames.join(", ")}
                </dd>
              </div>
            </dl>

            {/* Fill level, stated in words as well as by the bar. */}
            <div className="mt-4 border-t border-line pt-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[12px] text-ink-secondary">Places filled</span>
                <span className="text-[12px] text-ink-secondary tabular-nums">
                  {registered} / {camp.maxParticipants}
                </span>
              </div>
              <Meter
                className="mt-1.5"
                size="sm"
                value={registered}
                max={camp.maxParticipants}
                tone={full ? "good" : "accent"}
                label={`${registered} of ${camp.maxParticipants} places filled`}
              />
              <p className="mt-1.5 text-[11.5px] text-ink-muted">
                {full
                  ? "Full"
                  : `${placesLeft} ${placesLeft === 1 ? "place" : "places"} left`}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
