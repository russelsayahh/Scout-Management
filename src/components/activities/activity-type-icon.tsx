import {
  CalendarDays,
  Compass,
  GraduationCap,
  HeartHandshake,
  Mountain,
  PartyPopper,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { activityTypeLabels, type ActivityType } from "@/lib/activities/types";
import { cn } from "@/lib/utils";

/**
 * Activity types are told apart by icon rather than by colour.
 *
 * Colour in this app is reserved for status - draft, published, completed,
 * cancelled - and there is no validated categorical palette wide enough for
 * seven more hues. An icon carries the distinction without competing with the
 * status a reader actually needs to notice.
 */
export const activityTypeIcons: Record<ActivityType, LucideIcon> = {
  meeting: CalendarDays,
  outdoor: Mountain,
  skills: Compass,
  service: HeartHandshake,
  competition: Trophy,
  training: GraduationCap,
  social: PartyPopper,
};

export function ActivityTypeIcon({
  type,
  className,
}: {
  type: ActivityType;
  className?: string;
}) {
  const Icon = activityTypeIcons[type];
  return <Icon className={cn("size-4", className)} strokeWidth={1.9} aria-hidden />;
}

/** Icon plus the written type, for rows and detail panels. */
export function ActivityTypeLabel({
  type,
  className,
}: {
  type: ActivityType;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <ActivityTypeIcon type={type} className="size-3.5 shrink-0 text-ink-muted" />
      {activityTypeLabels[type]}
    </span>
  );
}
