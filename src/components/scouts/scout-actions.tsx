"use client";

import Link from "next/link";
import { useState } from "react";
import { ArchiveRestore, ArchiveX, Pencil } from "lucide-react";

import {
  ArchiveScoutDialog,
  RestoreScoutDialog,
} from "@/components/scouts/archive-dialogs";
import { Button, buttonStyles } from "@/components/ui/button";
import { scoutFullName, type Scout } from "@/lib/scouts/types";
import { cn } from "@/lib/utils";

/**
 * Edit / archive / restore controls.
 *
 * Deliberately plain buttons rather than a popover menu: the table scrolls
 * horizontally inside its own container, and an absolutely positioned menu
 * would be clipped by it.
 *
 * Rendering nothing for read-only roles is presentation; the Server Actions
 * re-check `scouts.manage` regardless.
 */
export function ScoutActions({
  scout,
  canManage,
  variant = "row",
}: {
  scout: Scout;
  canManage: boolean;
  /** `row` is icon-only for tables; `detail` is labelled for the profile page. */
  variant?: "row" | "detail";
}) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  if (!canManage) return null;

  const iconOnly = variant === "row";
  const name = scoutFullName(scout);

  return (
    <>
      <div className={cn("flex items-center gap-1", iconOnly ? "justify-end" : "gap-2")}>
        <Link
          href={`/scouts/${scout.id}/edit`}
          className={buttonStyles({
            variant: "secondary",
            size: iconOnly ? "icon-sm" : "md",
          })}
          aria-label={iconOnly ? `Edit ${name}` : undefined}
          title={iconOnly ? `Edit ${name}` : undefined}
        >
          <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
          {!iconOnly && "Edit"}
        </Link>

        {scout.archived ? (
          <Button
            variant="secondary"
            size={iconOnly ? "icon-sm" : "md"}
            onClick={() => setRestoreOpen(true)}
            aria-label={iconOnly ? `Restore ${name}` : undefined}
            title={iconOnly ? `Restore ${name}` : undefined}
          >
            <ArchiveRestore className="size-3.5" strokeWidth={2} aria-hidden />
            {!iconOnly && "Restore"}
          </Button>
        ) : (
          <Button
            variant={iconOnly ? "ghost" : "secondary"}
            size={iconOnly ? "icon-sm" : "md"}
            onClick={() => setArchiveOpen(true)}
            aria-label={iconOnly ? `Archive ${name}` : undefined}
            title={iconOnly ? `Archive ${name}` : undefined}
            className={cn(!iconOnly && "text-negative")}
          >
            <ArchiveX className="size-3.5" strokeWidth={2} aria-hidden />
            {!iconOnly && "Archive"}
          </Button>
        )}
      </div>

      <ArchiveScoutDialog
        scout={scout}
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
      />
      <RestoreScoutDialog
        scout={scout}
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
      />
    </>
  );
}
