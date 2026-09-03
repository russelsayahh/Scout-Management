import Link from "next/link";
import { MapPin, Tent } from "lucide-react";

import { CampStatusBadge } from "@/components/camps/camp-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { CampSummary } from "@/lib/camps/service";
import { formatCampLength } from "@/lib/camps/types";
import { formatDateRange } from "@/lib/format";

/**
 * The camps one scout is registered for, on their own record.
 *
 * The roster read from the other end: a leader looking at a scout should not
 * have to open every camp to find out whether they are coming.
 */
export function ScoutCamps({
  camps,
  firstName,
}: {
  /** Upcoming first, then the most recent past ones. */
  camps: CampSummary[];
  firstName: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            Camps
            <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
              {camps.length}
            </span>
          </CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Registered for, upcoming first
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {camps.length === 0 ? (
          <EmptyState
            icon={Tent}
            title="No camps yet"
            description={`${firstName} is not registered for any camp. Sign them up from the camp's own page.`}
          />
        ) : (
          <ul className="divide-y divide-line">
            {camps.map(({ camp }) => (
              <li key={camp.id}>
                <Link
                  href={`/camps/${camp.id}`}
                  className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">{camp.name}</p>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {formatDateRange(camp.startDate, camp.endDate)} · {formatCampLength(camp)}
                    </p>
                    <p className="mt-0.5 inline-flex min-w-0 items-center gap-1 text-[11.5px] text-ink-muted">
                      <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                      <span className="truncate">{camp.location}</span>
                    </p>
                  </div>

                  <CampStatusBadge status={camp.status} className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
