import Link from "next/link";
import { MapPin } from "lucide-react";

import {
  AvailabilityBadge,
  CategoryIcon,
  CategoryLabel,
  ConditionBadge,
} from "@/components/equipment/equipment-badges";
import { SortHeader, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import {
  equipmentHref,
  type EquipmentQuery,
  type EquipmentSort,
} from "@/lib/equipment/query";
import type { EquipmentItem, StockPosition } from "@/lib/equipment/types";
import { cn } from "@/lib/utils";

/**
 * The store, as a list.
 *
 * A real table from `md` up and a card list below it - the same data, laid out
 * for the space available, rather than a table squeezed onto a phone.
 *
 * The stock column reads "available of owned" with what is out alongside,
 * because "how many can I take" is the question the list exists to answer.
 */

function StockCell({
  item,
  position,
}: {
  item: EquipmentItem;
  position: StockPosition | undefined;
}) {
  if (!position) return <span className="text-ink-muted">-</span>;

  const none = position.available === 0;

  return (
    <span className="tabular-nums">
      <span className={cn("font-medium", none ? "text-ink-muted" : "text-ink")}>
        {position.available}
      </span>
      <span className="text-ink-muted"> of {item.quantity}</span>
      {position.onLoan > 0 && (
        <span className="block text-[11.5px] text-ink-muted">{position.onLoan} out</span>
      )}
    </span>
  );
}

export function EquipmentTable({
  items,
  positions,
  query,
}: {
  items: EquipmentItem[];
  positions: Record<string, StockPosition>;
  query: EquipmentQuery;
}) {
  /** Clicking the active column flips direction; a new column starts ascending. */
  const sortHref = (sort: EquipmentSort) =>
    equipmentHref({
      ...query,
      sort,
      dir: query.sort === sort && query.dir === "asc" ? "desc" : "asc",
      page: 1,
    });

  return (
    <>
      {/* Table, md and up */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <SortHeader
                href={sortHref("name")}
                active={query.sort === "name"}
                direction={query.dir}
              >
                Item
              </SortHeader>
              <SortHeader
                href={sortHref("category")}
                active={query.sort === "category"}
                direction={query.dir}
                className="hidden lg:table-cell"
              >
                Category
              </SortHeader>
              <SortHeader
                href={sortHref("quantity")}
                active={query.sort === "quantity"}
                direction={query.dir}
              >
                In store
              </SortHeader>
              <SortHeader
                href={sortHref("condition")}
                active={query.sort === "condition"}
                direction={query.dir}
              >
                Condition
              </SortHeader>
              <TH className="hidden xl:table-cell">Availability</TH>
              <SortHeader
                href={sortHref("location")}
                active={query.sort === "location"}
                direction={query.dir}
                className="hidden lg:table-cell"
              >
                Location
              </SortHeader>
            </TR>
          </THead>

          <TBody>
            {items.map((item) => (
              <TR key={item.id}>
                <TD className="max-w-72">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-secondary">
                      <CategoryIcon category={item.category} className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/equipment/${item.id}`}
                        className={cn(
                          "block truncate font-medium text-ink hover:text-brand-text hover:underline",
                          item.condition === "retired" && "text-ink-secondary",
                        )}
                      >
                        {item.name}
                      </Link>
                      {/* The category and place repeat here only while their
                          own columns are hidden. */}
                      <p className="truncate text-[11.5px] text-ink-muted">
                        <span className="lg:hidden">
                          <CategoryLabel category={item.category} /> · {item.location}
                        </span>
                        <span className="hidden lg:inline">
                          {item.serialNumber || (item.damaged > 0 ? `${item.damaged} damaged` : "")}
                        </span>
                      </p>
                    </div>
                  </div>
                </TD>

                <TD className="hidden text-ink-secondary lg:table-cell">
                  <CategoryLabel category={item.category} />
                </TD>

                <TD className="whitespace-nowrap">
                  <StockCell item={item} position={positions[item.id]} />
                </TD>

                <TD>
                  <ConditionBadge condition={item.condition} />
                </TD>

                <TD className="hidden xl:table-cell">
                  <AvailabilityBadge availability={item.availability} />
                </TD>

                <TD className="hidden max-w-52 truncate text-ink-secondary lg:table-cell">
                  {item.location}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Cards, below md */}
      <ul className="divide-y divide-line md:hidden">
        {items.map((item) => {
          const position = positions[item.id];

          return (
            <li key={item.id} className="p-4">
              <Link href={`/equipment/${item.id}`} className="flex gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-inset text-ink-secondary">
                  <CategoryIcon category={item.category} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-[13.5px] font-medium text-ink">{item.name}</p>
                    <ConditionBadge condition={item.condition} className="shrink-0" />
                  </div>

                  <p className="mt-1 text-[12px] text-ink-secondary tabular-nums">
                    {position ? (
                      <>
                        <span className="font-medium text-ink">{position.available}</span> of{" "}
                        {item.quantity} in the store
                        {position.onLoan > 0 && ` · ${position.onLoan} out`}
                      </>
                    ) : (
                      `${item.quantity} owned`
                    )}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                    <CategoryLabel category={item.category} />
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <MapPin className="size-3 shrink-0" strokeWidth={2} aria-hidden />
                      <span className="truncate">{item.location}</span>
                    </span>
                    {item.availability !== "available" && (
                      <AvailabilityBadge availability={item.availability} />
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
