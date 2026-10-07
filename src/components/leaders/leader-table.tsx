import Link from "next/link";
import { Pencil } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import type { SessionUser } from "@/lib/auth/types";
import { roleLabels } from "@/lib/auth/types";

/**
 * The leader directory.
 *
 * A real table from `md` up and a card list below it, same as the scout
 * register - the same data, laid out for the space available.
 */

function LeaderIdentity({ leader }: { leader: SessionUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={leader.name} src={leader.avatar} size="sm" />
      <div className="min-w-0">
        <Link
          href={`/leaders/${leader.id}`}
          className="block truncate font-medium text-ink hover:text-brand-text hover:underline"
        >
          {leader.name}
        </Link>
        <p className="truncate text-[11.5px] text-ink-muted">
          {leader.email || leader.phone || "No contact details"}
        </p>
      </div>
    </div>
  );
}

function troopSummary(names: string[]): string {
  if (names.length === 0) return "None assigned";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function LeaderTable({
  leaders,
  troopNamesFor,
  canManage,
}: {
  leaders: SessionUser[];
  /** Assigned troop names, resolved on the server. */
  troopNamesFor: (leader: SessionUser) => string[];
  canManage: boolean;
}) {
  return (
    <>
      {/* Table, md and up */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Leader</TH>
              <TH>Position</TH>
              <TH>Role</TH>
              <TH>Assigned troop</TH>
              <TH className="text-right">
                <span className={canManage ? undefined : "sr-only"}>Actions</span>
              </TH>
            </TR>
          </THead>

          <TBody>
            {leaders.map((leader) => (
              <TR key={leader.id}>
                <TD className="max-w-[18rem]">
                  <LeaderIdentity leader={leader} />
                </TD>
                <TD className="whitespace-nowrap text-ink-secondary">
                  {leader.position || <span className="text-ink-muted">Not set</span>}
                </TD>
                <TD>
                  <Badge tone={leader.role === "administrator" ? "brand" : "neutral"}>
                    {roleLabels[leader.role]}
                  </Badge>
                </TD>
                <TD className="text-ink-secondary">{troopSummary(troopNamesFor(leader))}</TD>
                <TD className="text-right">
                  {canManage && (
                    <Link
                      href={`/leaders/${leader.id}/edit`}
                      className={buttonStyles({ variant: "secondary", size: "icon-sm" })}
                      aria-label={`Edit ${leader.name}`}
                      title={`Edit ${leader.name}`}
                    >
                      <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
                    </Link>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>

      {/* Cards, below md */}
      <ul className="divide-y divide-line md:hidden">
        {leaders.map((leader) => (
          <li key={leader.id} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <LeaderIdentity leader={leader} />
              <Badge tone={leader.role === "administrator" ? "brand" : "neutral"}>
                {roleLabels[leader.role]}
              </Badge>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
              <div>
                <dt className="text-ink-muted">Position</dt>
                <dd className="mt-0.5 truncate text-ink-secondary">
                  {leader.position || "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Troop</dt>
                <dd className="mt-0.5 truncate text-ink-secondary">
                  {troopSummary(troopNamesFor(leader))}
                </dd>
              </div>
            </dl>

            {canManage && (
              <div className="mt-3 flex justify-end">
                <Link
                  href={`/leaders/${leader.id}/edit`}
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
                  Edit
                </Link>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
