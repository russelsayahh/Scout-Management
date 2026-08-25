import Link from "next/link";

import { ScoutActions } from "@/components/scouts/scout-actions";
import { ScoutStatusBadge } from "@/components/scouts/scout-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { SortHeader, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { scoutsHref, type ScoutQuery, type ScoutSort } from "@/lib/scouts/query";
import { ageOn, scoutFullName, type Scout } from "@/lib/scouts/types";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The register.
 *
 * A real table from `md` up and a card list below it - the same data, laid out
 * for the space available, rather than a table squeezed onto a phone.
 *
 * Rendered on the server: ages are computed once here against `today`, so no
 * client re-render can disagree about them.
 */

function ScoutIdentity({ scout }: { scout: Scout }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={scoutFullName(scout)} src={scout.avatar} size="sm" />
      <div className="min-w-0">
        <Link
          href={`/scouts/${scout.id}`}
          className={cn(
            "block truncate font-medium text-ink hover:text-brand-text hover:underline",
            scout.archived && "text-ink-secondary",
          )}
        >
          {scoutFullName(scout)}
        </Link>
        <p className="truncate text-[11.5px] text-ink-muted">
          {scout.email || scout.phone || "No contact details"}
        </p>
      </div>
    </div>
  );
}

export function ScoutTable({
  scouts,
  query,
  canManage,
  today,
}: {
  scouts: Scout[];
  query: ScoutQuery;
  canManage: boolean;
  /** Reference date for age, passed in so the calculation stays pure. */
  today: Date;
}) {
  /** Clicking the active column flips direction; a new column starts ascending. */
  const sortHref = (sort: ScoutSort) =>
    scoutsHref({
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
              <SortHeader href={sortHref("name")} active={query.sort === "name"} direction={query.dir}>
                Scout
              </SortHeader>
              <SortHeader href={sortHref("patrol")} active={query.sort === "patrol"} direction={query.dir}>
                Patrol
              </SortHeader>
              <SortHeader href={sortHref("status")} active={query.sort === "status"} direction={query.dir}>
                Status
              </SortHeader>
              <SortHeader href={sortHref("age")} active={query.sort === "age"} direction={query.dir}>
                Age
              </SortHeader>
              <SortHeader href={sortHref("joined")} active={query.sort === "joined"} direction={query.dir}>
                Joined
              </SortHeader>
              <TH className="text-right">
                <span className={canManage ? undefined : "sr-only"}>Actions</span>
              </TH>
            </TR>
          </THead>

          <TBody>
            {scouts.map((scout) => {
              const age = ageOn(scout.dateOfBirth, today);

              return (
                <TR key={scout.id} className={cn(scout.archived && "bg-surface-muted/60")}>
                  <TD className="max-w-[18rem]">
                    <ScoutIdentity scout={scout} />
                  </TD>
                  <TD className="whitespace-nowrap text-ink-secondary">{scout.patrol}</TD>
                  <TD>
                    <ScoutStatusBadge status={scout.status} archived={scout.archived} />
                  </TD>
                  <TD className="whitespace-nowrap text-ink-secondary tabular-nums">
                    {age === null ? "-" : `${age}`}
                  </TD>
                  <TD className="whitespace-nowrap text-ink-secondary">
                    {formatLongDate(scout.joinDate)}
                  </TD>
                  <TD className="text-right">
                    <ScoutActions scout={scout} canManage={canManage} />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>

      {/* Cards, below md */}
      <ul className="divide-y divide-line md:hidden">
        {scouts.map((scout) => {
          const age = ageOn(scout.dateOfBirth, today);

          return (
            <li
              key={scout.id}
              className={cn("px-4 py-3.5", scout.archived && "bg-surface-muted/60")}
            >
              <div className="flex items-start justify-between gap-3">
                <ScoutIdentity scout={scout} />
                <ScoutStatusBadge status={scout.status} archived={scout.archived} />
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-[11.5px]">
                <div>
                  <dt className="text-ink-muted">Patrol</dt>
                  <dd className="mt-0.5 truncate text-ink-secondary">{scout.patrol}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Age</dt>
                  <dd className="mt-0.5 text-ink-secondary tabular-nums">
                    {age === null ? "-" : age}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Joined</dt>
                  <dd className="mt-0.5 truncate text-ink-secondary">
                    {formatLongDate(scout.joinDate)}
                  </dd>
                </div>
              </dl>

              {canManage && (
                <div className="mt-3 flex justify-end">
                  <ScoutActions scout={scout} canManage={canManage} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
