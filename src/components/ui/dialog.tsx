"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Modal dialog built on the native `<dialog>` element.
 *
 * `showModal()` gives us the focus trap, Escape handling, inert background and
 * top-layer stacking for free - all the things a hand-rolled modal gets wrong.
 * The effect here only mirrors React state onto the DOM element, which is
 * exactly what effects are for.
 */

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof sizes;
  /** Hides the corner close button, e.g. while an action is running. */
  dismissible?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Escape fires `cancel`; intercept it so React state stays the source of truth.
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onClose();
      }}
      // A click that lands on the dialog element itself is a backdrop click.
      onClick={(event) => {
        if (dismissible && event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface p-0 text-ink shadow-2xl",
        sizes[size],
      )}
      aria-labelledby="dialog-title"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 id="dialog-title" className="text-[15px] font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-[13px] leading-snug text-ink-secondary">{description}</p>
          )}
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-1 shrink-0 rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            aria-label="Close dialog"
          >
            <X className="size-4" strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>

      {children && <div className="px-5 py-4">{children}</div>}

      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-muted px-5 py-3 sm:flex-row sm:justify-end">
          {footer}
        </div>
      )}
    </dialog>
  );
}
