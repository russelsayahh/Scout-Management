"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserRoundMinus, UserRoundPlus } from "lucide-react";

import {
  RegisterScoutsDialog,
  type CandidateScout,
} from "@/components/camps/register-scouts-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { removeScoutAction } from "@/lib/camps/actions";
import { registrationStateMessages, type RegistrationState } from "@/lib/camps/types";

/**
 * Who is coming, with the controls for changing it.
 *
 * Registration dates come formatted from the server so the list cannot disagree
 * with the rest of the page about what day something happened.
 */

export interface ParticipantRow {
  id: string;
  name: string;
  avatar: string | null;
  patrolName: string | null;
  /** Pre-formatted on the server. */
  registeredOn: string;
  registeredByName: string;
  outsideInvitedPatrols: boolean;
}

export function ParticipantList({
  campId,
  campName,
  participants,
  candidates,
  placesLeft,
  state,
  canManage,
}: {
  campId: string;
  campName: string;
  participants: ParticipantRow[];
  candidates: { invited: CandidateScout[]; others: CandidateScout[] };
  placesLeft: number;
  state: RegistrationState;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [removing, setRemoving] = useState<ParticipantRow | null>(null);

  // A finished camp is a record; everything else is ordinary admin.
  const rosterFixed = state === "finished";
  const canChange = canManage && !rosterFixed;

  function confirmRemove() {
    if (!removing) return;
    const scout = removing;

    setError(undefined);
    startTransition(async () => {
      const result = await removeScoutAction(campId, scout.id);

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
            Participants
            <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
              {participants.length}
            </span>
          </CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            {registrationStateMessages[state]}
          </p>
        </div>

        {canChange && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRegisterOpen(true)}
            disabled={placesLeft === 0}
            title={placesLeft === 0 ? "Every place is taken" : undefined}
          >
            <UserRoundPlus className="size-3.5" strokeWidth={2} aria-hidden />
            Register scouts
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <div className="px-5 pt-4">
            <Callout tone="error">{error}</Callout>
          </div>
        )}

        {participants.length === 0 ? (
          <EmptyState
            icon={UserRoundPlus}
            title="Nobody registered yet"
            description={
              rosterFixed
                ? "No scouts were registered for this camp."
                : canManage
                  ? "Sign scouts up and they appear here, with who added them and when."
                  : "Nobody has been signed up for this camp yet."
            }
            action={
              canChange && placesLeft > 0 ? (
                <Button variant="secondary" onClick={() => setRegisterOpen(true)}>
                  <UserRoundPlus className="size-4" strokeWidth={2} aria-hidden />
                  Register scouts
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {participants.map((participant) => (
              <li
                key={participant.id}
                className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
              >
                <Avatar name={participant.name} src={participant.avatar} size="sm" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/scouts/${participant.id}`}
                      className="truncate text-[13.5px] font-medium text-ink hover:text-brand-text hover:underline"
                    >
                      {participant.name}
                    </Link>
                    {participant.outsideInvitedPatrols && (
                      <Badge tone="neutral">Outside the invited patrols</Badge>
                    )}
                  </div>
                  <p className="truncate text-[11.5px] text-ink-muted">
                    {participant.patrolName ? `${participant.patrolName} Patrol` : "No patrol"} ·
                    registered {participant.registeredOn} by {participant.registeredByName}
                  </p>
                </div>

                {canChange && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    onClick={() => setRemoving(participant)}
                    aria-label={`Remove ${participant.name} from ${campName}`}
                    title="Remove from the camp"
                    className="shrink-0"
                  >
                    <UserRoundMinus className="size-3.5" strokeWidth={2} aria-hidden />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <RegisterScoutsDialog
        campId={campId}
        campName={campName}
        invited={candidates.invited}
        others={candidates.others}
        placesLeft={placesLeft}
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        onClose={() => {
          setError(undefined);
          setRemoving(null);
        }}
        onConfirm={confirmRemove}
        title={removing ? `Remove ${removing.name}?` : "Remove scout?"}
        description={`They come off the roster for ${campName} and their place goes back into the pool. Their scout record is not affected.`}
        confirmLabel="Remove from camp"
        tone="danger"
        pending={pending}
      />
    </Card>
  );
}
