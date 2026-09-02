import Link from "next/link";
import { Backpack, TriangleAlert } from "lucide-react";

import { CategoryIcon } from "@/components/equipment/equipment-badges";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { loansForHolder } from "@/lib/equipment/service";
import { isOpen, type HolderKind } from "@/lib/equipment/types";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * What kit is booked out to one activity or camp, on that event's own page.
 *
 * The other half of "assign equipment to activities and camps": booking it out
 * happens in the store, but the person running the event needs to see what they
 * are expected to have without going looking for it.
 */
export async function HolderEquipmentCard({
  holderKind,
  holderId,
  canManage,
}: {
  holderKind: HolderKind;
  holderId: string;
  /** Whether to offer a way into the store to book more out. */
  canManage: boolean;
}) {
  const rows = await loansForHolder(holderKind, holderId, new Date());

  const out = rows.filter((row) => isOpen(row.loan));
  const returned = rows.filter((row) => !isOpen(row.loan));
  const overdue = out.filter((row) => row.overdue).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Backpack className="size-4 text-brand-text" strokeWidth={1.9} aria-hidden />
          <div>
            <CardTitle>
              Equipment
              {out.length > 0 && (
                <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
                  {out.reduce((sum, row) => sum + row.loan.quantity, 0)}
                </span>
              )}
            </CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              {out.length === 0 ? "Nothing booked out" : "Booked out from the store"}
            </p>
          </div>
        </div>

        {canManage && out.length > 0 && (
          <Link
            href="/equipment"
            className="shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
          >
            The store
          </Link>
        )}
      </CardHeader>

      <CardContent className={rows.length === 0 ? "p-0" : "p-0"}>
        {rows.length === 0 ? (
          <EmptyState
            icon={Backpack}
            title="No kit booked out"
            description={
              canManage
                ? "Book equipment out from the store and it is listed here."
                : "Nothing from the store has been assigned to this yet."
            }
            action={
              canManage ? (
                <Link href="/equipment" className={buttonStyles({ variant: "secondary" })}>
                  Open the store
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {[...out, ...returned].map((row) => {
              const open = isOpen(row.loan);

              return (
                <li
                  key={row.loan.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3",
                    row.overdue && "bg-status-critical/5",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-secondary">
                    <CategoryIcon category={row.item.category} className="size-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/equipment/${row.item.id}`}
                        className={cn(
                          "truncate text-[13px] font-medium hover:text-brand-text hover:underline",
                          open ? "text-ink" : "text-ink-secondary",
                        )}
                      >
                        {row.item.name}
                      </Link>
                      <span className="shrink-0 text-[12px] text-ink-muted tabular-nums">
                        ×{row.loan.quantity}
                      </span>
                    </div>

                    <p className="mt-0.5 text-[11.5px] text-ink-muted">
                      {open
                        ? row.loan.dueBack
                          ? `Due back ${formatShortDate(row.loan.dueBack)}`
                          : "No return date set"
                        : `Returned ${row.loan.returnedAt ? formatShortDate(row.loan.returnedAt) : ""}`}
                    </p>
                  </div>

                  {row.overdue ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-negative">
                      <TriangleAlert className="size-3.5" strokeWidth={2} aria-hidden />
                      Overdue
                    </span>
                  ) : open ? (
                    <Badge tone="good" className="shrink-0">
                      Out
                    </Badge>
                  ) : (
                    <Badge tone="neutral" className="shrink-0">
                      Back
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {overdue > 0 && (
        <div className="border-t border-line bg-surface-muted px-5 py-2.5 text-[11.5px] text-ink-muted">
          {overdue} {overdue === 1 ? "item is" : "items are"} past the return date.
        </div>
      )}
    </Card>
  );
}
