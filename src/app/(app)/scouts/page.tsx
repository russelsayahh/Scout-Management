import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserRoundSearch, Users } from "lucide-react";

import { ScoutFilters } from "@/components/scouts/scout-filters";
import { ScoutTable } from "@/components/scouts/scout-table";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { patrolNameMap, patrolOptions } from "@/lib/patrols/service";
import { parseScoutQuery, scoutsHref } from "@/lib/scouts/query";
import { listScouts, scoutCounts } from "@/lib/scouts/service";

export const metadata: Metadata = {
  title: "Scouts",
  description: "The scout register: search, filter and manage member records.",
};

export default async function ScoutsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "scouts.view")) {
    return <AccessDenied sectionName="Scouts" role={user.role} />;
  }

  const canManage = can(user.role, "scouts.manage");

  const query = parseScoutQuery(await searchParams);
  const [patrolNames, patrols] = await Promise.all([patrolNameMap(), patrolOptions()]);
  const [page, counts] = await Promise.all([listScouts(query, patrolNames), scoutCounts()]);

  // Computed once here so every row agrees on today's date.
  const today = new Date();

  const from = (page.page - 1) * page.pageSize + 1;
  const to = Math.min(page.page * page.pageSize, page.total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scouts"
        description="Every young person on the register, with their patrol, status and emergency details."
        actions={
          <>
            <Badge tone="neutral">{counts.current} current</Badge>
            {counts.archived > 0 && (
              <Badge tone="neutral">{counts.archived} archived</Badge>
            )}
            {canManage && (
              <Link href="/scouts/new" className={buttonStyles()}>
                <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                Add scout
              </Link>
            )}
          </>
        }
      />

      <ScoutFilters query={query} total={page.total} patrols={patrols} />

      <Card className="overflow-hidden">
        {page.items.length === 0 ? (
          <EmptyState
            icon={UserRoundSearch}
            title="No scouts match these filters"
            description="Try a different search term, or clear the filters to see the whole register."
            action={
              <>
                <Link href="/scouts" className={buttonStyles({ variant: "secondary" })}>
                  Clear filters
                </Link>
                {canManage && (
                  <Link href="/scouts/new" className={buttonStyles()}>
                    <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                    Add scout
                  </Link>
                )}
              </>
            }
          />
        ) : (
          <ScoutTable
            scouts={page.items}
            query={query}
            canManage={canManage}
            today={today}
            patrolNames={patrolNames}
          />
        )}
      </Card>

      {page.total > 0 && (
        <Pagination
          page={page.page}
          pageCount={page.pageCount}
          hrefFor={(next) => scoutsHref({ ...query, page: next })}
          summary={`Showing ${from}-${to} of ${page.total}`}
        />
      )}

      {counts.total === 0 && (
        <EmptyState
          icon={Users}
          title="The register is empty"
          description="Add the first scout to get started."
        />
      )}
    </div>
  );
}
