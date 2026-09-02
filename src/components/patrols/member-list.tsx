"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Star, UserRoundMinus, UserRoundPlus } from "lucide-react";

import { AssignScoutsDialog } from "@/components/patrols/assign-scouts-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { removeScoutAction, setPatrolLeaderAction } from "@/lib/patrols/actions";
import { scoutFullName, type Scout } from "@/lib/scouts/types";
import { cn } from "@/lib/utils";

/**
 * The patrol's members, with the controls for changing who is in it and who
 * leads it.
 *
 * Ages arrive as a prepared map rather than being computed here, so the server
 * and the client cannot disagree about them.
 */
export function MemberList({
  patrolId,
  patrolName,
  members,
  leaderId,
  candidates,
  canManage,
  ages,
  archived,
}: {
  patrolId: string;
  patrolName: string;
  members: Scout[];
  leaderId: string | null;
  candidates: Scout[];
  canManage: boolean;
  /** Scout id to age, computed on the server. */
  ages: Record<string, number | null>;
  archived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const [assignOpen, setAssignOpen] = useState(false);
  const [removing, setRemoving] = useState<Scout | null>(null);

  function appointLeader(scoutId: string | null) {
    setError(undefined);
    startTransition(async () => {
      const result = await setPatrolLeaderAction(patrolId, scoutId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  function confirmRemove() {
    if (!removing) return;
    const scout = removing;

    setError(undefined);
    startTransition(async () => {
      const result = await removeScoutAction(patrolId, scout.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRemoving(null);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>
            Members
            <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
              {members.length}
            </span>
          </CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            A scout belongs to one patrol at a time.
          </p>
        </div>

        {canManage && !archived && (
          <Button variant="secondary" size="sm" onClick={() => setAssignOpen(true)}>
            <UserRoundPlus className="size-3.5" strokeWidth={2} aria-hidden />
            Add scouts
          </Button>
        )}
      </CardHeader>

      <CardContent className={cn(members.length === 0 ? "p-0" : "p-0")}>
        {error && (
          <div className="px-5 pt-4">
            <Callout tone="error">{error}</Callout>
          </div>
        )}

        {members.length === 0 ? (
          <EmptyState
            icon={UserRoundPlus}
            title="No members yet"
            description={
              archived
                ? "This patrol is archived. Restore it before adding members."
                : canManage
                  ? "Add scouts who are not yet in a patrol, or change a scout's patrol from their own record."
                  : "Nobody has been assigned to this patrol yet."
            }
            action={
              canManage && !archived ? (
                <Button variant="secondary" onClick={() => setAssignOpen(true)}>
                  <UserRoundPlus className="size-4" strokeWidth={2} aria-hidden />
                  Add scouts
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {members.map((scout) => {
              const isLeader = scout.id === leaderId;
              const age = ages[scout.id];

              return (
                <li
                  key={scout.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                >
                  <Avatar name={scoutFullName(scout)} src={scout.avatar} size="sm" />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/scouts/${scout.id}`}
                        className="truncate text-[13.5px] font-medium text-ink hover:text-brand-text hover:underline"
                      >
                        {scoutFullName(scout)}
                      </Link>
                      {isLeader && (
                        <Badge tone="brand" dot>
                          Patrol leader
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-[11.5px] text-ink-muted">
                      {age === null || age === undefined ? "" : `${age} years`}
                      {age !== null && age !== undefined && scout.email ? " · " : ""}
                      {scout.email}
                    </p>
                  </div>

                  {canManage && !archived && (
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        onClick={() => appointLeader(isLeader ? null : scout.id)}
                        aria-label={
                          isLeader
                            ? `Remove ${scoutFullName(scout)} as patrol leader`
                            : `Make ${scoutFullName(scout)} patrol leader`
                        }
                        title={isLeader ? "Step down as patrol leader" : "Make patrol leader"}
                      >
                        <Star
                          className={cn("size-3.5", isLeader && "fill-current text-brand-text")}
                          strokeWidth={2}
                          aria-hidden
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={pending}
                        onClick={() => setRemoving(scout)}
                        aria-label={`Remove ${scoutFullName(scout)} from ${patrolName}`}
                        title="Remove from patrol"
                      >
                        <UserRoundMinus className="size-3.5" strokeWidth={2} aria-hidden />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <AssignScoutsDialog
        patrolId={patrolId}
        patrolName={patrolName}
        candidates={candidates}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => {
          setError(undefined);
          setRemoving(null);
        }}
        onConfirm={confirmRemove}
        title={removing ? `Remove ${scoutFullName(removing)}?` : "Remove scout?"}
        description={`They leave ${patrolName} and become unassigned. Their scout record is not affected.`}
        confirmLabel="Remove from patrol"
        tone="danger"
        pending={pending}
      />
    </Card>
  );
}

