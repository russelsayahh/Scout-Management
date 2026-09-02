"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog, type ConfirmTone } from "@/components/ui/confirm-dialog";
import { TextareaField } from "@/components/ui/form-field";
import {
  cancelCampAction,
  closeRegistrationAction,
  completeCampAction,
  openRegistrationAction,
  reinstateCampAction,
  startCampAction,
} from "@/lib/camps/actions";
import type { ActionResult } from "@/lib/form-state";

/**
 * Confirmation steps for the camp's status changes.
 *
 * Each one has consequences outside this page - opening registration announces
 * the camp, cancelling takes it off everyone's calendar - so none of them
 * happen on a single click.
 */

interface Target {
  id: string;
  name: string;
}

interface CampDialogProps {
  camp: Target;
  open: boolean;
  onClose: () => void;
  /** Extra context the wording needs, e.g. how many are registered. */
  registered?: number;
}

function TransitionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<ActionResult>;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await onConfirm();

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
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      pending={pending}
      error={error}
    >
      {children}
    </ConfirmDialog>
  );
}

export function OpenRegistrationDialog({ camp, open, onClose }: CampDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => openRegistrationAction(camp.id)}
      title={`Open registration for ${camp.name}?`}
      description="The camp is announced to the group and scouts can be signed up. You can still change the details afterwards."
      confirmLabel="Open registration"
    />
  );
}

export function CloseRegistrationDialog({
  camp,
  open,
  onClose,
  registered = 0,
}: CampDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => closeRegistrationAction(camp.id)}
      title={`Close registration for ${camp.name}?`}
      description={`Numbers are settled at ${registered} ${
        registered === 1 ? "scout" : "scouts"
      }. You can reopen it, and late changes to the roster are still possible.`}
      confirmLabel="Close registration"
    />
  );
}

export function StartCampDialog({ camp, open, onClose }: CampDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => startCampAction(camp.id)}
      title={`Mark ${camp.name} as running?`}
      description="The camp shows as under way. Use this when everyone has arrived on site."
      confirmLabel="Mark as running"
    />
  );
}

export function CompleteCampDialog({ camp, open, onClose }: CampDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => completeCampAction(camp.id)}
      title={`Mark ${camp.name} as completed?`}
      description="It stays on file as a record of what the troop has done. Completed is final - the details and the roster are fixed afterwards."
      confirmLabel="Mark as completed"
    />
  );
}

export function ReinstateCampDialog({ camp, open, onClose }: CampDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => reinstateCampAction(camp.id)}
      title={`Reinstate ${camp.name}?`}
      description="It returns to planning and the cancellation reason is cleared. Open registration again when the details are settled. Everyone already registered keeps their place."
      confirmLabel="Reinstate camp"
    />
  );
}

export function CancelCampDialog({ camp, open, onClose, registered = 0 }: CampDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [reason, setReason] = useState("");

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await cancelCampAction(camp.id, reason);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setReason("");
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
      title={`Cancel ${camp.name}?`}
      description={
        registered > 0
          ? `${registered} ${
              registered === 1 ? "scout is" : "scouts are"
            } registered. The camp comes off the calendar and the reason is shown on its page, so nobody has to ask what happened. The roster is kept.`
          : "The camp comes off the calendar. The record is kept, with the reason, and it can be reinstated."
      }
      confirmLabel="Cancel camp"
      cancelLabel="Keep it"
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
        placeholder="e.g. The site flooded and there is no alternative for that weekend."
        hint="Shown on the camp, and to everyone who had signed up."
        disabled={pending}
      />
    </ConfirmDialog>
  );
}
