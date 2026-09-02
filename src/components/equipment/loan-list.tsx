"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, PackageCheck, PackageOpen, TriangleAlert } from "lucide-react";

import { ReturnDialog } from "@/components/equipment/return-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { holderKindLabels, type HolderKind } from "@/lib/equipment/types";
import { cn } from "@/lib/utils";

/**
 * Who has the kit, and who has had it.
 *
 * Dates arrive pre-formatted from the server so the list cannot disagree with
 * the rest of the page about what day something happened.
 */

export interface LoanRowView {
  id: string;
  quantity: number;
  holderKind: HolderKind;
  holderName: string;
  holderHref: string | null;
  holderDetail: string;
  checkedOutOn: string;
  checkedOutByName: string;
  dueBackOn: string | null;
  note: string;
  overdue: boolean;
  /** How late, in words. Null when it is not late. */
  overdueBy: string | null;
  returnedOn: string | null;
  returnedByName: string | null;
  returnedGood: number;
  returnedDamaged: number;
  returnedLost: number;
}

function HolderLine({ row }: { row: LoanRowView }) {
  const name = row.holderHref ? (
    <Link href={row.holderHref} className="font-medium text-ink hover:text-brand-text hover:underline">
      {row.holderName}
    </Link>
  ) : (
    <span className="font-medium text-ink">{row.holderName}</span>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge tone="neutral">{holderKindLabels[row.holderKind]}</Badge>
      <span className="text-[13.5px]">{name}</span>
    </div>
  );
}

export function OpenLoanList({
  itemId,
  itemName,
  loans,
  canManage,
}: {
  itemId: string;
  itemName: string;
  loans: LoanRowView[];
  canManage: boolean;
}) {
  const [returning, setReturning] = useState<LoanRowView | null>(null);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            Out on loan
            <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
              {loans.reduce((sum, loan) => sum + loan.quantity, 0)}
            </span>
          </CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            {loans.length === 0
              ? "Everything is in the store"
              : `${loans.length} ${loans.length === 1 ? "loan" : "loans"} open`}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loans.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="Nothing is out"
            description="Every unit is accounted for in the store."
          />
        ) : (
          <ul className="divide-y divide-line">
            {loans.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "flex flex-wrap items-start gap-3 px-5 py-3.5",
                  row.overdue && "bg-status-critical/5",
                )}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-[13px] font-semibold text-ink tabular-nums">
                  {row.quantity}
                </span>

                <div className="min-w-0 flex-1">
                  <HolderLine row={row} />

                  <p className="mt-1 text-[12px] text-ink-muted">
                    Out since {row.checkedOutOn} · booked by {row.checkedOutByName}
                    {row.holderDetail && ` · ${row.holderDetail}`}
                  </p>

                  {row.dueBackOn && (
                    <p
                      className={cn(
                        "mt-1 inline-flex items-center gap-1.5 text-[12px]",
                        row.overdue ? "font-medium text-negative" : "text-ink-secondary",
                      )}
                    >
                      {row.overdue ? (
                        <TriangleAlert className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                      ) : (
                        <CalendarClock className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                      )}
                      {row.overdue ? `Overdue - due back ${row.dueBackOn}` : `Due back ${row.dueBackOn}`}
                      {row.overdueBy && ` (${row.overdueBy})`}
                    </p>
                  )}

                  {row.note && (
                    <p className="mt-1.5 rounded-lg bg-surface-muted px-3 py-2 text-[12.5px] leading-snug text-ink-secondary">
                      {row.note}
                    </p>
                  )}
                </div>

                {canManage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setReturning(row)}
                    className="shrink-0"
                  >
                    Book in
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {returning && (
        <ReturnDialog
          itemId={itemId}
          itemName={itemName}
          loanId={returning.id}
          quantity={returning.quantity}
          holderName={returning.holderName}
          open={returning !== null}
          onClose={() => setReturning(null)}
        />
      )}
    </Card>
  );
}

export function LoanHistory({ loans }: { loans: LoanRowView[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Loan history</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            {loans.length === 0
              ? "Nothing has been booked out yet"
              : "Everything that has been out and come back"}
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loans.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No history yet"
            description="Once kit goes out and comes back, the record appears here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {loans.map((row) => {
              const problem = row.returnedDamaged > 0 || row.returnedLost > 0;

              return (
                <li key={row.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                    <div className="min-w-0 flex-1">
                      <HolderLine row={row} />
                      <p className="mt-1 text-[12px] text-ink-muted">
                        {row.quantity} out {row.checkedOutOn} · back {row.returnedOn}
                        {row.returnedByName && ` · booked in by ${row.returnedByName}`}
                      </p>
                    </div>

                    {problem ? (
                      <span className="shrink-0 text-[12px] font-medium text-negative tabular-nums">
                        {row.returnedDamaged > 0 && `${row.returnedDamaged} damaged`}
                        {row.returnedDamaged > 0 && row.returnedLost > 0 && ", "}
                        {row.returnedLost > 0 && `${row.returnedLost} lost`}
                      </span>
                    ) : (
                      <Badge tone="good" className="shrink-0">
                        All back
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
