"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextareaField } from "@/components/ui/form-field";
import { archiveScoutAction, restoreScoutAction } from "@/lib/scouts/actions";
import { scoutFullName, type Scout } from "@/lib/scouts/types";

/**
 * Confirmation dialogs for archiving and restoring.
 *
 * The actions are called directly rather than through a form, so the dialog can
 * stay open and show the failure in place when the server refuses.
 */

interface DialogProps {
  scout: Pick<Scout, "id" | "firstName" | "lastName">;
  open: boolean;
  onClose: () => void;
  /** Where to go after success; stays put when omitted. */
  redirectTo?: string;
}

export function ArchiveScoutDialog({ scout, open, onClose, redirectTo }: DialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [reason, setReason] = useState("");

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await archiveScoutAction(scout.id, reason);

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
      title={`Archive ${scoutFullName(scout)}?`}
      description="The record is kept and can be restored at any time. Archived scouts are hidden from the register and excluded from the current count."
      confirmLabel="Archive scout"
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
        placeholder="e.g. Moved out of the district, or aged up to Explorers."
        hint="Recorded on the scout's file for future reference."
        disabled={pending}
      />
    </ConfirmDialog>
  );
}

export function RestoreScoutDialog({ scout, open, onClose }: DialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await restoreScoutAction(scout.id);

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
      title={`Restore ${scoutFullName(scout)}?`}
      description="The scout returns to the register with the status they had before, and is counted again."
      confirmLabel="Restore scout"
      pending={pending}
      error={error}
    />
  );
}
