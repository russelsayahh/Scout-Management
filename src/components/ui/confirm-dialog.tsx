"use client";

import { Button, type ButtonVariant } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

export type ConfirmTone = "danger" | "default";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** True while the action runs; blocks dismissal and shows a spinner. */
  pending?: boolean;
  /** Message from a failed attempt, shown inside the dialog. */
  error?: string;
  /** Extra fields, e.g. a reason for archiving. */
  children?: React.ReactNode;
}

/**
 * Confirmation step for actions that change or hide a record.
 *
 * The dialog stays open on failure so the reason is visible next to the button
 * that caused it, rather than disappearing behind a closed modal.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "default",
  pending = false,
  error,
  children,
}: ConfirmDialogProps) {
  const confirmVariant: ButtonVariant = tone === "danger" ? "danger" : "primary";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={pending}>
            {pending && <Spinner label={confirmLabel} />}
            {pending ? "Working..." : confirmLabel}
          </Button>
        </>
      }
    >
      {(error ?? children) && (
        <div className="space-y-3">
          {error && <Callout tone="error">{error}</Callout>}
          {children}
        </div>
      )}
    </Dialog>
  );
}
