"use client";

import Link from "next/link";
import { useState } from "react";
import { ArchiveRestore, ArchiveX, Pencil } from "lucide-react";

import {
  ArchivePatrolDialog,
  RestorePatrolDialog,
} from "@/components/patrols/patrol-archive-dialogs";
import { Button, buttonStyles } from "@/components/ui/button";
import type { Patrol } from "@/lib/patrols/types";
import { cn } from "@/lib/utils";

/**
 * Edit / archive / restore controls for one patrol.
 *
 * Rendering nothing for read-only roles is presentation; the Server Actions
 * re-check `patrols.manage` regardless.
 */
export function PatrolActions({
  patrol,
  memberCount,
  canManage,
  variant = "row",
}: {
  patrol: Patrol;
  memberCount: number;
  canManage: boolean;
  /** `row` is icon-only for lists; `detail` is labelled for the patrol page. */
  variant?: "row" | "detail";
}) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  if (!canManage) return null;

  const iconOnly = variant === "row";

  return (
    <>
      <div className={cn("flex items-center", iconOnly ? "justify-end gap-1" : "gap-2")}>
        <Link
          href={`/patrols/${patrol.id}/edit`}
          className={buttonStyles({
            variant: "secondary",
            size: iconOnly ? "icon-sm" : "md",
          })}
          aria-label={iconOnly ? `Edit ${patrol.name} Patrol` : undefined}
          title={iconOnly ? `Edit ${patrol.name} Patrol` : undefined}
        >
          <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
          {!iconOnly && "Edit"}
        </Link>

        {patrol.archived ? (
          <Button
            variant="secondary"
            size={iconOnly ? "icon-sm" : "md"}
            onClick={() => setRestoreOpen(true)}
            aria-label={iconOnly ? `Restore ${patrol.name} Patrol` : undefined}
            title={iconOnly ? `Restore ${patrol.name} Patrol` : undefined}
          >
            <ArchiveRestore className="size-3.5" strokeWidth={2} aria-hidden />
            {!iconOnly && "Restore"}
          </Button>
        ) : (
          <Button
            variant={iconOnly ? "ghost" : "secondary"}
            size={iconOnly ? "icon-sm" : "md"}
            onClick={() => setArchiveOpen(true)}
            aria-label={iconOnly ? `Archive ${patrol.name} Patrol` : undefined}
            title={iconOnly ? `Archive ${patrol.name} Patrol` : undefined}
            className={cn(!iconOnly && "text-negative")}
          >
            <ArchiveX className="size-3.5" strokeWidth={2} aria-hidden />
            {!iconOnly && "Archive"}
          </Button>
        )}
      </div>

      <ArchivePatrolDialog
        patrol={patrol}
        memberCount={memberCount}
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
      />
      <RestorePatrolDialog
        patrol={patrol}
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
      />
    </>
  );
}
