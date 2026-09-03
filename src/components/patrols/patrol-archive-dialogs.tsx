"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextareaField } from "@/components/ui/form-field";
import { archivePatrolAction, restorePatrolAction } from "@/lib/patrols/actions";
import type { Patrol } from "@/lib/patrols/types";

interface DialogProps {
  patrol: Pick<Patrol, "id" | "name">;
  /** Members released back to the unassigned pool by archiving. */
  memberCount?: number;
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export function ArchivePatrolDialog({
  patrol,
  memberCount = 0,
  open,
  onClose,
  redirectTo,
}: DialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [reason, setReason] = useState("");

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await archivePatrolAction(patrol.id, reason);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setReason("");
      onClose();
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        setError(undefined);
        onClose();
      }}
      onConfirm={confirm}
      title={`Archive ${patrol.name} Patrol?`}
      description={
        memberCount > 0
          ? `The ${memberCount} ${memberCount === 1 ? "member" : "members"} will be released and left unassigned, ready to join another patrol. The patrol record is kept and can be restored.`
          : "The patrol record is kept and can be restored at any time."
      }
      confirmLabel="Archive patrol"
      tone="danger"
      pending={pending}
      error={error}
    >
      <TextareaField
        label="Reason"
        labelAside="Optional"
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="e.g. Merged into Falcon Patrol, or too few members to run."
        hint="Recorded on the patrol's file for future reference."
        disabled={pending}
      />
    </ConfirmDialog>
  );
}

export function RestorePatrolDialog({ patrol, open, onClose }: DialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await restorePatrolAction(patrol.id);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      onClose();
      router.refresh();
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        setError(undefined);
        onClose();
      }}
      onConfirm={confirm}
      title={`Restore ${patrol.name} Patrol?`}
      description="The patrol returns to the list. Its former members are not re-added automatically - assign them again from the patrol page."
      confirmLabel="Restore patrol"
      pending={pending}
      error={error}
    />
  );
}
