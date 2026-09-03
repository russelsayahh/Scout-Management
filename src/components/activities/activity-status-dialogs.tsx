"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog, type ConfirmTone } from "@/components/ui/confirm-dialog";
import { TextareaField } from "@/components/ui/form-field";
import {
  cancelActivityAction,
  completeActivityAction,
  publishActivityAction,
  reinstateActivityAction,
} from "@/lib/activities/actions";
import type { ActionResult } from "@/lib/form-state";

/**
 * Confirmation steps for the four status changes.
 *
 * Each one is a decision with consequences outside this page - publishing puts
 * something on everybody's dashboard, cancelling takes it off - so none of them
 * happen on a single click.
 */

interface Target {
  id: string;
  name: string;
}

interface TransitionDialogProps {
  activity: Target;
  open: boolean;
  onClose: () => void;
  /** Where to go afterwards; refreshes in place when omitted. */
  redirectTo?: string;
}

function TransitionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone,
  redirectTo,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<ActionResult>;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: ConfirmTone;
  redirectTo?: string;
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
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      tone={tone}
      pending={pending}
      error={error}
    >
      {children}
    </ConfirmDialog>
  );
}

/* --------------------------------- publish -------------------------------- */

export function PublishActivityDialog({
  activity,
  open,
  onClose,
  redirectTo,
}: TransitionDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => publishActivityAction(activity.id)}
      title={`Publish ${activity.name}?`}
      description="It goes onto the calendar and onto the dashboard for everyone in the group. You can still edit the details afterwards."
      confirmLabel="Publish activity"
      redirectTo={redirectTo}
    />
  );
}

/* -------------------------------- complete -------------------------------- */

export function CompleteActivityDialog({
  activity,
  open,
  onClose,
  redirectTo,
}: TransitionDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => completeActivityAction(activity.id)}
      title={`Mark ${activity.name} as completed?`}
      description="It stays on the programme as a record of what the troop has done. Completed is final - it cannot be published or cancelled afterwards."
      confirmLabel="Mark as completed"
      redirectTo={redirectTo}
    />
  );
}

/* ------------------------------- reinstate -------------------------------- */

export function ReinstateActivityDialog({
  activity,
  open,
  onClose,
  redirectTo,
}: TransitionDialogProps) {
  return (
    <TransitionDialog
      open={open}
      onClose={onClose}
      onConfirm={() => reinstateActivityAction(activity.id)}
      title={`Reinstate ${activity.name}?`}
      description="It returns as a draft and the cancellation reason is cleared. Publish it again when the details are settled."
      confirmLabel="Reinstate activity"
      redirectTo={redirectTo}
    />
  );
}

/* ---------------------------------- cancel -------------------------------- */

export function CancelActivityDialog({
  activity,
  open,
  onClose,
  redirectTo,
}: TransitionDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [reason, setReason] = useState("");

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await cancelActivityAction(activity.id, reason);

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
      title={`Cancel ${activity.name}?`}
      description="It comes off the calendar and off the dashboard. The record is kept, with the reason, so everyone can see what happened."
      confirmLabel="Cancel activity"
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
        placeholder="e.g. River levels too high after heavy rain."
        hint="Shown on the activity, so nobody has to ask why it was called off."
        disabled={pending}
      />
    </ConfirmDialog>
  );
}
