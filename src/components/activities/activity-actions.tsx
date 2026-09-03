"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarX2, CheckCheck, Copy, Pencil, Send, Undo2 } from "lucide-react";

import {
  CancelActivityDialog,
  CompleteActivityDialog,
  PublishActivityDialog,
  ReinstateActivityDialog,
} from "@/components/activities/activity-status-dialogs";
import { Button, buttonStyles } from "@/components/ui/button";
import type { Activity } from "@/lib/activities/types";
import { cn } from "@/lib/utils";

/**
 * Edit / duplicate / status controls for one activity.
 *
 * Which buttons appear follows the transitions the activity can actually make,
 * so a cancelled activity is never offered "Mark as completed". The row variant
 * leaves cancelling out: it is the destructive one, and it belongs on the page
 * where the whole activity is in view rather than one click away in a dense
 * table. Rendering nothing for read-only roles is presentation; the Server
 * Actions re-check `activities.manage` regardless.
 */
export function ActivityActions({
  activity,
  canManage,
  finished,
  variant = "row",
}: {
  activity: Pick<Activity, "id" | "name" | "status">;
  canManage: boolean;
  /**
   * Whether the end time has passed, worked out on the server so the button and
   * the rule behind it agree. Completing is only offered once it has - marking
   * next month's hike as completed would be nonsense.
   */
  finished: boolean;
  /** `row` is icon-only for the table; `detail` is labelled for the page. */
  variant?: "row" | "detail";
}) {
  const [publishOpen, setPublishOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reinstateOpen, setReinstateOpen] = useState(false);

  if (!canManage) return null;

  const iconOnly = variant === "row";
  const size = iconOnly ? ("icon-sm" as const) : ("md" as const);
  const iconSize = iconOnly ? "size-3.5" : "size-4";

  const { status, name } = activity;

  return (
    <>
      <div className={cn("flex items-center", iconOnly ? "justify-end gap-1" : "flex-wrap gap-2")}>
        {status === "draft" && (
          <Button
            variant={iconOnly ? "ghost" : "primary"}
            size={size}
            onClick={() => setPublishOpen(true)}
            aria-label={iconOnly ? `Publish ${name}` : undefined}
            title={iconOnly ? `Publish ${name}` : undefined}
          >
            <Send className={iconSize} strokeWidth={2} aria-hidden />
            {!iconOnly && "Publish"}
          </Button>
        )}

        {status === "published" && finished && (
          <Button
            variant={iconOnly ? "ghost" : "secondary"}
            size={size}
            onClick={() => setCompleteOpen(true)}
            aria-label={iconOnly ? `Mark ${name} as completed` : undefined}
            title={iconOnly ? `Mark ${name} as completed` : undefined}
          >
            <CheckCheck className={iconSize} strokeWidth={2} aria-hidden />
            {!iconOnly && "Mark completed"}
          </Button>
        )}

        {status === "cancelled" && (
          <Button
            variant="secondary"
            size={size}
            onClick={() => setReinstateOpen(true)}
            aria-label={iconOnly ? `Reinstate ${name}` : undefined}
            title={iconOnly ? `Reinstate ${name}` : undefined}
          >
            <Undo2 className={iconSize} strokeWidth={2} aria-hidden />
            {!iconOnly && "Reinstate"}
          </Button>
        )}

        <Link
          href={`/activities/${activity.id}/edit`}
          className={buttonStyles({ variant: "secondary", size })}
          aria-label={iconOnly ? `Edit ${name}` : undefined}
          title={iconOnly ? `Edit ${name}` : undefined}
        >
          <Pencil className={iconSize} strokeWidth={2} aria-hidden />
          {!iconOnly && "Edit"}
        </Link>

        <Link
          href={`/activities/new?from=${activity.id}`}
          className={buttonStyles({ variant: "secondary", size })}
          aria-label={iconOnly ? `Duplicate ${name}` : undefined}
          title={iconOnly ? `Duplicate ${name}` : "Start a new activity from this one"}
        >
          <Copy className={iconSize} strokeWidth={2} aria-hidden />
          {!iconOnly && "Duplicate"}
        </Link>

        {!iconOnly && (status === "draft" || status === "published") && (
          <Button variant="secondary" size={size} onClick={() => setCancelOpen(true)} className="text-negative">
            <CalendarX2 className={iconSize} strokeWidth={2} aria-hidden />
            Cancel
          </Button>
        )}
      </div>

      <PublishActivityDialog
        activity={activity}
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
      />
      <CompleteActivityDialog
        activity={activity}
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
      />
      <CancelActivityDialog
        activity={activity}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
      />
      <ReinstateActivityDialog
        activity={activity}
        open={reinstateOpen}
        onClose={() => setReinstateOpen(false)}
      />
    </>
  );
}
