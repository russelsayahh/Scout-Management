import Link from "next/link";
import { CalendarDays, Flag, ShieldCheck, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { TroopSummary } from "@/lib/troops/service";

/**
 * One card per troop, for the admin Troops overview.
 *
 * The set of troops is fixed at six, so this is always a grid, never a list
 * with an empty state - there is nothing to create here, only to open.
 */
export function TroopGrid({ summaries }: { summaries: TroopSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {summaries.map(({ troop, memberCount, leaderCount, patrolCount, upcomingActivityCount }) => (
        <Card key={troop.id} className="flex flex-col p-5">
          <Link
            href={`/troops/${troop.id}`}
            className="text-[15px] font-semibold tracking-tight text-ink hover:text-brand-text hover:underline"
          >
            {troop.name}
          </Link>

          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[12.5px] leading-relaxed text-ink-secondary">
            {troop.description || "No description yet."}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-3.5">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Members</dt>
              <dd className="text-[12.5px] text-ink-secondary tabular-nums">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </dd>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Leaders</dt>
              <dd className="text-[12.5px] text-ink-secondary tabular-nums">
                {leaderCount} {leaderCount === 1 ? "leader" : "leaders"}
              </dd>
            </div>

            <div className="flex items-center gap-1.5">
              <Flag className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Patrols</dt>
              <dd className="text-[12.5px] text-ink-secondary tabular-nums">
                {patrolCount} {patrolCount === 1 ? "patrol" : "patrols"}
              </dd>
            </div>

            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Upcoming activities</dt>
              <dd className="text-[12.5px] text-ink-secondary tabular-nums">
                {upcomingActivityCount} upcoming
              </dd>
            </div>
          </dl>
        </Card>
      ))}
    </div>
  );
}
