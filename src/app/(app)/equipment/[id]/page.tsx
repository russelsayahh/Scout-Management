import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package } from "lucide-react";

import {
  AvailabilityBadge,
  CategoryIcon,
  ConditionBadge,
} from "@/components/equipment/equipment-badges";
import { ItemActions } from "@/components/equipment/item-actions";
import { LoanHistory, OpenLoanList, type LoanRowView } from "@/components/equipment/loan-list";
import { AccessDenied } from "@/components/shared/access-denied";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList, EmptyValue } from "@/components/ui/detail-list";
import { Meter } from "@/components/ui/meter";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { checkoutTargets, getItem, type LoanRow } from "@/lib/equipment/service";
import {
  availabilityDescriptions,
  categoryLabels,
  conditionDescriptions,
  daysUntilDue,
} from "@/lib/equipment/types";
import { formatLongDate, formatShortDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getItem(id, new Date());

  return { title: found ? found.item.name : "Equipment not found" };
}

/** How late something is, in the words a person would use. */
function lateBy(days: number): string {
  const late = Math.abs(days);
  if (late === 1) return "1 day late";
  if (late < 14) return `${late} days late`;
  const weeks = Math.round(late / 7);
  return `${weeks} weeks late`;
}

export default async function EquipmentDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "equipment.view")) {
    return <AccessDenied sectionName="Equipment" role={user.role} />;
  }

  const canManage = can(user.role, "equipment.manage");

  const { id } = await params;
  const now = new Date();
  const found = await getItem(id, now);
  if (!found) notFound();

  const { item, position, totalOwned, out, history, block, blockMessage } = found;
  const saved = "saved" in (await searchParams);

  const targets = canManage
    ? await checkoutTargets(now)
    : { leaders: [], activities: [], camps: [] };

  // Dates are formatted here so the client lists cannot disagree with the page.
  const toView = (row: LoanRow): LoanRowView => {
    const days = daysUntilDue(row.loan, now);

    return {
      id: row.loan.id,
      quantity: row.loan.quantity,
      holderKind: row.holder.kind,
      holderName: row.holder.name,
      holderHref: row.holder.href,
      holderDetail: row.holder.detail,
      checkedOutOn: formatShortDate(row.loan.checkedOutAt),
      checkedOutByName: row.checkedOutByName,
      dueBackOn: row.loan.dueBack ? formatShortDate(row.loan.dueBack) : null,
      note: row.loan.note,
      overdue: row.overdue,
      overdueBy: row.overdue && days !== null ? lateBy(days) : null,
      returnedOn: row.loan.returnedAt ? formatShortDate(row.loan.returnedAt) : null,
      returnedByName: row.returnedByName,
      returnedGood: row.loan.returnedGood,
      returnedDamaged: row.loan.returnedDamaged,
      returnedLost: row.loan.returnedLost,
    };
  };

  const retired = item.condition === "retired";
  const overdueCount = out.filter((row) => row.overdue).length;

  return (
    <div className="space-y-4">
      {saved && <Callout tone="success">Changes saved.</Callout>}

      <Link
        href="/equipment"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to the store
      </Link>

      {retired && (
        <Callout tone="warning" title="This has been retired">
          It is out of the store and cannot be booked out. Its record and every loan against it
          are kept.
          {item.retiredAt && ` Retired on ${formatLongDate(item.retiredAt)}.`}
        </Callout>
      )}

      {overdueCount > 0 && (
        <Callout tone="error" title="Some of this is late back">
          {overdueCount} {overdueCount === 1 ? "loan is" : "loans are"} past the return date.
        </Callout>
      )}

      {!retired && item.condition === "damaged" && (
        <Callout tone="warning" title="Damaged">
          This cannot go out until it is repaired. Record the repair when it is fixed.
        </Callout>
      )}

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
            <CategoryIcon category={item.category} className="size-6" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ConditionBadge condition={item.condition} />
              <AvailabilityBadge availability={item.availability} />
              <span className="text-[12.5px] text-ink-secondary">
                {categoryLabels[item.category]}
              </span>
            </div>

            <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {item.name}
            </h1>

            <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-secondary">
              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">Location</dt>
                <dd className="truncate">{item.location}</dd>
              </div>
              {item.serialNumber && (
                <div className="flex items-center gap-1.5">
                  <Package
                    className="size-3.5 shrink-0 text-ink-muted"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <dt className="sr-only">Serial number</dt>
                  <dd className="font-mono text-[12px]">{item.serialNumber}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="shrink-0">
            <ItemActions
              item={item}
              position={position}
              block={block}
              blockMessage={blockMessage}
              leaders={targets.leaders}
              activities={targets.activities}
              camps={targets.camps}
              canManage={canManage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stock position */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
              <p className="text-[12px] text-ink-secondary">In the store</p>
              <p className="mt-1 text-[24px] leading-none font-semibold text-brand-text tabular-nums">
                {position.available}
              </p>
              <p className="mt-1.5 text-[11.5px] text-ink-muted">Ready to take out</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
              <p className="text-[12px] text-ink-secondary">Out on loan</p>
              <p className="mt-1 text-[24px] leading-none font-semibold text-ink tabular-nums">
                {position.onLoan}
              </p>
              <p className="mt-1.5 text-[11.5px] text-ink-muted">
                {out.length} {out.length === 1 ? "loan" : "loans"}
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
              <p className="text-[12px] text-ink-secondary">Serviceable</p>
              <p className="mt-1 text-[24px] leading-none font-semibold text-ink tabular-nums">
                {item.quantity}
              </p>
              <p className="mt-1.5 text-[11.5px] text-ink-muted">Owned and usable</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
              <p className="text-[12px] text-ink-secondary">Damaged</p>
              <p
                className={`mt-1 text-[24px] leading-none font-semibold tabular-nums ${
                  item.damaged > 0 ? "text-negative" : "text-ink"
                }`}
              >
                {item.damaged}
              </p>
              <p className="mt-1.5 text-[11.5px] text-ink-muted">Kept, awaiting repair</p>
            </div>
            <div className="rounded-lg border border-line bg-surface-muted px-4 py-3">
              <p className="text-[12px] text-ink-secondary">Lost</p>
              <p className="mt-1 text-[24px] leading-none font-semibold text-ink tabular-nums">
                {item.lost}
              </p>
              <p className="mt-1.5 text-[11.5px] text-ink-muted">Written off for good</p>
            </div>
          </div>

          {item.quantity > 0 && (
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12.5px] text-ink-secondary">How much is out</p>
                <p className="text-[12.5px] text-ink-secondary tabular-nums">
                  {position.onLoan} of {item.quantity}
                </p>
              </div>
              <Meter
                className="mt-2"
                value={position.onLoan}
                max={item.quantity}
                tone={position.available === 0 ? "warning" : "accent"}
                label={`${position.onLoan} of ${item.quantity} units out on loan`}
              />
              <p className="mt-2 text-[11.5px] text-ink-muted">
                {position.available === 0
                  ? "Every serviceable unit is out."
                  : `${position.available} still on the shelf.`}{" "}
                {totalOwned !== item.quantity &&
                  `${totalOwned} owned in total, counting the damaged ones.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <OpenLoanList
            itemId={item.id}
            itemName={item.name}
            loans={out.map(toView)}
            canManage={canManage}
          />
          <LoanHistory loans={history.map(toView)} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Item details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  { label: "Category", value: categoryLabels[item.category] },
                  { label: "Location", value: item.location },
                  {
                    label: "Serial number",
                    value: item.serialNumber || <EmptyValue>Not applicable</EmptyValue>,
                  },
                  {
                    label: "Purchase date",
                    value: item.purchaseDate ? (
                      formatLongDate(item.purchaseDate)
                    ) : (
                      <EmptyValue>Not recorded</EmptyValue>
                    ),
                  },
                  {
                    label: "Condition",
                    value: (
                      <span className="flex flex-col gap-1">
                        <ConditionBadge condition={item.condition} className="self-start" />
                        <span className="text-[12px] text-ink-muted">
                          {conditionDescriptions[item.condition]}
                        </span>
                      </span>
                    ),
                  },
                  {
                    label: "Availability",
                    value: (
                      <span className="flex flex-col gap-1">
                        <AvailabilityBadge
                          availability={item.availability}
                          className="self-start"
                        />
                        <span className="text-[12px] text-ink-muted">
                          {availabilityDescriptions[item.availability]}
                          {blockMessage && ` ${blockMessage}`}
                        </span>
                      </span>
                    ),
                  },
                  { label: "Added", value: formatLongDate(item.createdAt) },
                  { label: "Last updated", value: formatLongDate(item.updatedAt) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {item.notes ? (
                <p className="text-[13px] leading-relaxed whitespace-pre-line text-ink">
                  {item.notes}
                </p>
              ) : (
                <p className="text-[13px] text-ink-muted italic">
                  Nothing recorded. Notes are a good place for what the next person signing this
                  out should know.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
