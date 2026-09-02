import {
  Backpack,
  Flag,
  Hammer,
  HeartPulse,
  Package,
  Radio,
  Tent,
  Trophy,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  availabilityLabels,
  categoryLabels,
  conditionLabels,
  type AvailabilityStatus,
  type EquipmentCategory,
  type EquipmentCondition,
} from "@/lib/equipment/types";
import { cn } from "@/lib/utils";

/**
 * Categories are told apart by icon, conditions and availability by tone.
 *
 * Colour is reserved for the two things a quartermaster needs to notice at a
 * glance - what is broken and what may go out - so nine categories are carried
 * by shape instead, and every badge shows its word regardless.
 */

export const categoryIcons: Record<EquipmentCategory, LucideIcon> = {
  camping: Backpack,
  tents: Tent,
  cooking: Utensils,
  "first-aid": HeartPulse,
  tools: Hammer,
  sports: Trophy,
  scouting: Flag,
  electronics: Radio,
  other: Package,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: EquipmentCategory;
  className?: string;
}) {
  const Icon = categoryIcons[category];
  return <Icon className={cn("size-4", className)} strokeWidth={1.9} aria-hidden />;
}

export function CategoryLabel({
  category,
  className,
}: {
  category: EquipmentCategory;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <CategoryIcon category={category} className="size-3.5 shrink-0 text-ink-muted" />
      {categoryLabels[category]}
    </span>
  );
}

const conditionTones: Record<EquipmentCondition, BadgeTone> = {
  new: "info",
  good: "good",
  "needs-maintenance": "warning",
  damaged: "critical",
  retired: "neutral",
};

export function ConditionBadge({
  condition,
  className,
}: {
  condition: EquipmentCondition;
  className?: string;
}) {
  return (
    <Badge tone={conditionTones[condition]} dot className={className}>
      {conditionLabels[condition]}
    </Badge>
  );
}

const availabilityTones: Record<AvailabilityStatus, BadgeTone> = {
  available: "good",
  reserved: "info",
  "out-of-service": "neutral",
};

export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: AvailabilityStatus;
  className?: string;
}) {
  return (
    <Badge tone={availabilityTones[availability]} className={className}>
      {availabilityLabels[availability]}
    </Badge>
  );
}
