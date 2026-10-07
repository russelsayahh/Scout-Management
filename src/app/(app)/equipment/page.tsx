import type { Metadata } from "next";
import Link from "next/link";
import { Backpack, PackageSearch, Plus, TriangleAlert } from "lucide-react";

import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { equipmentHref, parseEquipmentQuery } from "@/lib/equipment/query";
import { equipmentSummary, listEquipment } from "@/lib/equipment/service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Equipment",
  description: "The group's store: what there is, what shape it is in and who has it.",
};

/** A figure with a label, linking to the filtered view behind it. */
function Tile({
  label,
  value,
  caption,
  href,
  tone = "plain",
}: {
  label: string;
  value: number;
  caption?: string;
  href?: string;
  tone?: "plain" | "warning";
}) {
  const body = (
    <>
      <p className="text-[12px] text-ink-secondary">{label}</p>
      <p
        className={cn(
          "mt-1 text-[24px] leading-none font-semibold tracking-tight tabular-nums",
          tone === "warning" && value > 0 ? "text-negative" : "text-ink",
        )}
      >
        {value}
      </p>
      {caption && <p className="mt-1.5 text-[11.5px] text-ink-muted">{caption}</p>}
    </>
  );

  const className = cn(
    "rounded-lg border border-line bg-surface-muted px-4 py-3",
    href && "transition-colors hover:border-line-strong hover:bg-surface-hover",
  );

  return href ? (
    <Link href={href} className={cn(className, "block")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "equipment.view")) {
    return <AccessDenied sectionName="Equipment" role={user.role} />;
  }

  const canManage = can(user.role, "equipment.manage");
  const scope = await resolveTroopScope(user);

  // The catalog itself stays shared across every troop; only the loan-derived
  // figures in `summary` (onLoan, overdue) are narrowed to scope.
  const query = parseEquipmentQuery(await searchParams);
  const [page, summary] = await Promise.all([
    listEquipment(query),
    equipmentSummary(scope, new Date()),
  ]);

  const from = (page.page - 1) * page.pageSize + 1;
  const to = Math.min(page.page * page.pageSize, page.total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment"
        description="The quartermaster's store: what there is, what shape it is in, and who has it."
        actions={
          <>
            <Badge tone="neutral">{summary.items} items</Badge>
            {summary.overdue > 0 && (
              <Badge tone="critical" dot>
                {summary.overdue} overdue
              </Badge>
            )}
            {canManage && (
              <Link href="/equipment/new" className={buttonStyles()}>
                <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                Add equipment
              </Link>
            )}
          </>
        }
      />

      {/* The store at a glance. Each tile is the filter behind it. */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Tile
              label="Units in the store"
              value={summary.units - summary.onLoan}
              caption={`of ${summary.units} serviceable`}
            />
            <Tile
              label="Out on loan"
              value={summary.onLoan}
              caption="Booked out right now"
              href={equipmentHref({ ...parseEquipmentQuery({}), onLoanOnly: true })}
            />
            <Tile
              label="Needing attention"
              value={summary.needingAttention}
              caption="Damaged or due maintenance"
              href={equipmentHref({
                ...parseEquipmentQuery({}),
                condition: "needs-maintenance",
              })}
              tone="warning"
            />
            <Tile
              label="Damaged units"
              value={summary.damaged}
              caption="Kept, awaiting repair"
              tone="warning"
            />
            <Tile
              label="Written off"
              value={summary.lost}
              caption="Lost over the years"
            />
          </div>

          {summary.overdue > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 border-t border-line pt-4 text-[12.5px] text-ink-secondary">
              <TriangleAlert className="size-4 shrink-0 text-status-critical" strokeWidth={2} aria-hidden />
              <span>
                <span className="font-medium text-ink">{summary.overdue}</span>{" "}
                {summary.overdue === 1 ? "loan is past its" : "loans are past their"} return date.{" "}
                <Link
                  href={equipmentHref({ ...parseEquipmentQuery({}), onLoanOnly: true })}
                  className="font-medium text-brand-text hover:underline"
                >
                  See what is out
                </Link>
                .
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      <EquipmentFilters query={query} total={page.total} />

      <Card className="overflow-hidden">
        {page.items.length === 0 ? (
          <EmptyState
            icon={summary.items === 0 ? Backpack : PackageSearch}
            title={
              summary.items === 0 ? "The store is empty" : "Nothing matches these filters"
            }
            description={
              summary.items === 0
                ? "Add the first item and the store starts keeping track of it."
                : "Try a different search, or clear the filters to see everything."
            }
            action={
              <>
                {summary.items > 0 && (
                  <Link href="/equipment" className={buttonStyles({ variant: "secondary" })}>
                    Clear filters
                  </Link>
                )}
                {canManage && (
                  <Link href="/equipment/new" className={buttonStyles()}>
                    <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                    Add equipment
                  </Link>
                )}
              </>
            }
          />
        ) : (
          <EquipmentTable items={page.items} positions={page.positions} query={query} />
        )}
      </Card>

      {page.total > 0 && (
        <Pagination
          page={page.page}
          pageCount={page.pageCount}
          hrefFor={(next) => equipmentHref({ ...query, page: next })}
          summary={`Showing ${from}-${to} of ${page.total}`}
        />
      )}
    </div>
  );
}
