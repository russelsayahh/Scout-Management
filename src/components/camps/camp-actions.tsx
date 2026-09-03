"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCheck, Lock, LockOpen, Pencil, TentTree, Undo2, X } from "lucide-react";

import {
  CancelCampDialog,
  CloseRegistrationDialog,
  CompleteCampDialog,
  OpenRegistrationDialog,
  ReinstateCampDialog,
  StartCampDialog,
} from "@/components/camps/camp-status-dialogs";
import { Button, buttonStyles } from "@/components/ui/button";
import { isClosed, type Camp } from "@/lib/camps/types";
import { cn } from "@/lib/utils";

/**
 * Edit and status controls for one camp.
 *
 * Which buttons appear follows the transitions the camp can actually make, so a
 * completed camp offers nothing and a cancelled one offers only reinstating.
 * Rendering nothing for read-only roles is presentation; the Server Actions
 * re-check `camps.manage` regardless.
 */
export function CampActions({
  camp,
  registered,
  canManage,
  variant = "row",
}: {
  camp: Pick<Camp, "id" | "name" | "status">;
  registered: number;
  canManage: boolean;
  /** `row` is a single icon link for the cards; `detail` is the full set. */
  variant?: "row" | "detail";
}) {
  const [openReg, setOpenReg] = useState(false);
  const [closeReg, setCloseReg] = useState(false);
  const [start, setStart] = useState(false);
  const [complete, setComplete] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [reinstate, setReinstate] = useState(false);

  if (!canManage) return null;

  const { status, name } = camp;
  const iconOnly = variant === "row";
  const size = iconOnly ? ("icon-sm" as const) : ("md" as const);
  const iconSize = iconOnly ? "size-3.5" : "size-4";
  const editable = !isClosed(status);

  // The cards stay uncluttered: status changes belong on the camp's own page,
  // where the roster and the timeline are in view alongside them.
  if (iconOnly) {
    if (!editable) return null;
    return (
      <Link
        href={`/camps/${camp.id}/edit`}
        className={buttonStyles({ variant: "secondary", size })}
        aria-label={`Edit ${name}`}
        title={`Edit ${name}`}
      >
        <Pencil className={iconSize} strokeWidth={2} aria-hidden />
      </Link>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status === "planning" && (
          <Button size={size} onClick={() => setOpenReg(true)}>
            <LockOpen className={iconSize} strokeWidth={2} aria-hidden />
            Open registration
          </Button>
        )}

        {status === "registration-open" && (
          <Button variant="secondary" size={size} onClick={() => setCloseReg(true)}>
            <Lock className={iconSize} strokeWidth={2} aria-hidden />
            Close registration
          </Button>
        )}

        {status === "registration-closed" && (
          <>
            <Button size={size} onClick={() => setStart(true)}>
              <TentTree className={iconSize} strokeWidth={2} aria-hidden />
              Mark as running
            </Button>
            <Button variant="secondary" size={size} onClick={() => setOpenReg(true)}>
              <LockOpen className={iconSize} strokeWidth={2} aria-hidden />
              Reopen registration
            </Button>
          </>
        )}

        {status === "ongoing" && (
          <Button size={size} onClick={() => setComplete(true)}>
            <CheckCheck className={iconSize} strokeWidth={2} aria-hidden />
            Mark completed
          </Button>
        )}

        {status === "cancelled" && (
          <Button variant="secondary" size={size} onClick={() => setReinstate(true)}>
            <Undo2 className={iconSize} strokeWidth={2} aria-hidden />
            Reinstate
          </Button>
        )}

        {editable && (
          <Link
            href={`/camps/${camp.id}/edit`}
            className={buttonStyles({ variant: "secondary", size })}
          >
            <Pencil className={iconSize} strokeWidth={2} aria-hidden />
            Edit
          </Link>
        )}

        {editable && status !== "cancelled" && (
          <Button
            variant="secondary"
            size={size}
            onClick={() => setCancel(true)}
            className={cn("text-negative")}
          >
            <X className={iconSize} strokeWidth={2} aria-hidden />
            Cancel camp
          </Button>
        )}
      </div>

      <OpenRegistrationDialog camp={camp} open={openReg} onClose={() => setOpenReg(false)} />
      <CloseRegistrationDialog
        camp={camp}
        registered={registered}
        open={closeReg}
        onClose={() => setCloseReg(false)}
      />
      <StartCampDialog camp={camp} open={start} onClose={() => setStart(false)} />
      <CompleteCampDialog camp={camp} open={complete} onClose={() => setComplete(false)} />
      <CancelCampDialog
        camp={camp}
        registered={registered}
        open={cancel}
        onClose={() => setCancel(false)}
      />
      <ReinstateCampDialog camp={camp} open={reinstate} onClose={() => setReinstate(false)} />
    </>
  );
}
