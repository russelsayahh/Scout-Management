import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Plus } from "lucide-react";

import { PatrolGrid } from "@/components/patrols/patrol-grid";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { listPatrols } from "@/lib/patrols/service";

export const metadata: Metadata = {
  title: "Patrols",
  description: "The troop's patrols, their leaders and their members.",
};

export default async function PatrolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "patrols.view")) {
    return <AccessDenied sectionName="Patrols" role={user.role} />;
  }

  const canManage = can(user.role, "patrols.manage");
  const scope = await resolveTroopScope(user);

  const params = await searchParams;
  const showArchived = params.archived === "1";

  const patrols = await listPatrols(scope, showArchived);
  const current = patrols.filter((entry) => !entry.patrol.archived);
  const archivedCount = patrols.length - current.length;

  // The archived count is only known when they are included in the query.
  const allPatrols = showArchived ? patrols : await listPatrols(scope, true);
  const totalArchived = allPatrols.filter((entry) => entry.patrol.archived).length;

  const assigned = patrols.reduce((sum, entry) => sum + entry.memberCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patrols"
        description="Small groups within the troop, each with its own leader and members."
        actions={
          <>
            <Badge tone="neutral">{current.length} active</Badge>
            <Badge tone="neutral">{assigned} assigned</Badge>
            {canManage && (
              <Link href="/patrols/new" className={buttonStyles()}>
                <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                New patrol
              </Link>
            )}
          </>
        }
      />

      {totalArchived > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-[12.5px] text-ink-muted">
          <span>
            {totalArchived} archived {totalArchived === 1 ? "patrol" : "patrols"}
          </span>
          <Link
            href={showArchived ? "/patrols" : "/patrols?archived=1"}
            className="font-medium text-brand-text hover:underline"
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </Link>
        </div>
      )}

      {patrols.length === 0 ? (
        <Card>
          <EmptyState
            icon={Flag}
            title="No patrols yet"
            description="Create the troop's first patrol, then assign scouts to it."
            action={
              canManage ? (
                <Link href="/patrols/new" className={buttonStyles()}>
                  <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                  New patrol
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <PatrolGrid patrols={patrols} canManage={canManage} />
      )}

      {archivedCount > 0 && (
        <p className="text-center text-[12px] text-ink-muted">
          Archived patrols are shown greyed out. Their members were released when they were
          archived.
        </p>
      )}
    </div>
  );
}
