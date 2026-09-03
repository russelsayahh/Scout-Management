import type { Metadata } from "next";

import { LeaderTable } from "@/components/leaders/leader-table";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { roleLabels, type SessionUser } from "@/lib/auth/types";
import { leaderCounts, listLeaders } from "@/lib/leaders/service";
import { patrolNameMap } from "@/lib/patrols/service";

export const metadata: Metadata = {
  title: "Leaders",
  description: "Adult volunteers: contact details, position and what they run.",
};

export default async function LeadersPage() {
  const user = await requireUser();
  if (!can(user.role, "leaders.view")) {
    return <AccessDenied sectionName="Leaders" role={user.role} />;
  }

  const canManage = can(user.role, "leaders.manage");

  const [leaders, counts, names] = await Promise.all([
    listLeaders(),
    leaderCounts(),
    patrolNameMap(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaders"
        description="Every adult volunteer, their position, and which patrols they run."
        actions={<Badge tone="neutral">{leaders.length} leaders</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {counts.map(({ role, count }) => (
          <div key={role} className="rounded-xl border border-line bg-surface px-5 py-4 shadow-xs">
            <p className="text-[12.5px] text-ink-secondary">{roleLabels[role]}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink tabular-nums">
              {count}
            </p>
          </div>
        ))}
      </div>

      <LeaderTable
        leaders={leaders}
        patrolNamesFor={(leader: SessionUser) =>
          leader.assignedPatrolIds.map((id) => names.get(id)).filter((name): name is string => Boolean(name))
        }
        canManage={canManage}
      />
    </div>
  );
}
