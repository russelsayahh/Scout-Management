import Link from "next/link";
import { Star, Users } from "lucide-react";

import { PatrolActions } from "@/components/patrols/patrol-actions";
import { PatrolStatusBadge } from "@/components/patrols/patrol-status-badge";
import { Card } from "@/components/ui/card";
import type { PatrolSummary } from "@/lib/patrols/service";
import { cn } from "@/lib/utils";

/**
 * The patrol list, as cards.
 *
 * Patrols carry a description and a leader rather than a row of comparable
 * figures, so cards read better here than a table - and they reflow to one
 * column on a phone without any horizontal scrolling.
 */
export function PatrolGrid({
  patrols,
  canManage,
}: {
  patrols: PatrolSummary[];
  canManage: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {patrols.map(({ patrol, memberCount, leaderName }) => (
        <Card
          key={patrol.id}
          className={cn("flex flex-col p-5", patrol.archived && "bg-surface-muted/60")}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/patrols/${patrol.id}`}
                className="text-[15px] font-semibold tracking-tight text-ink hover:text-brand-text hover:underline"
              >
                {patrol.name}
              </Link>
              <div className="mt-1.5">
                <PatrolStatusBadge status={patrol.status} archived={patrol.archived} />
              </div>
            </div>

            <PatrolActions patrol={patrol} memberCount={memberCount} canManage={canManage} />
          </div>

          <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-[12.5px] leading-relaxed text-ink-secondary">
            {patrol.description || "No description yet."}
          </p>

          <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-3.5">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Members</dt>
              <dd className="text-[12.5px] text-ink-secondary tabular-nums">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </dd>
            </div>

            <div className="flex min-w-0 items-center gap-1.5">
              <Star className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Patrol leader</dt>
              <dd className="min-w-0 truncate text-[12.5px] text-ink-secondary">
                {leaderName ?? <span className="text-ink-muted">No leader appointed</span>}
              </dd>
            </div>
          </dl>
        </Card>
      ))}
    </div>
  );
}
