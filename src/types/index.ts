import type { LucideIcon } from "lucide-react";

import type { Permission } from "@/lib/auth/permissions";

/* ---------------------------------- Navigation --------------------------------- */

export interface NavItem {
  /** Stable key, also used as the module key where a module page exists. */
  key: string;
  title: string;
  href: string;
  icon: LucideIcon;
  /** Small count rendered on the right of the nav row. */
  badge?: number;
  /** The item is hidden from roles that do not hold this permission. */
  permission: Permission;
}

export interface NavSection {
  /** Group heading. `null` renders the items with no heading. */
  title: string | null;
  items: NavItem[];
}

/* ----------------------------------- Modules ----------------------------------- */

export interface PlannedFeature {
  title: string;
  description: string;
}

export interface ModuleMetric {
  label: string;
  value: string;
}

/** Everything a placeholder section page needs to render itself. */
export interface ModuleConfig {
  key: string;
  name: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to open the section at all. */
  permission: Permission;
  /** Permission required to change anything in it. Omit for read-only areas. */
  managePermission?: Permission;
  /** One-line summary shown under the page title. */
  description: string;
  /** Longer copy shown in the placeholder body. */
  summary: string;
  metrics: ModuleMetric[];
  plannedFeatures: PlannedFeature[];
}

/* ------------------------------------ Stats ------------------------------------ */

export type DeltaPolarity = "up-is-good" | "up-is-bad" | "neutral";

export interface Stat {
  key: string;
  /** Sentence case, no trailing colon. */
  label: string;
  value: number;
  /** Rendering hint for the value. */
  format: "number" | "percent";
  /** Signed change vs `deltaPeriod`. Omit when there is nothing to compare. */
  delta?: number;
  deltaUnit?: "absolute" | "percentage-point";
  deltaPeriod?: string;
  polarity: DeltaPolarity;
  /** Extra context line under the value. */
  caption: string;
  /** 12-point trend series, oldest first. */
  trend: number[];
  href: string;
  icon: LucideIcon;
}

/* --------------------------------- Activity feed -------------------------------- */

export type ActivityKind =
  | "member"
  | "attendance"
  | "camp"
  | "document"
  | "equipment"
  | "award";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  actor: string;
  action: string;
  target: string;
  /** Pre-formatted so server and client render identically. */
  timeAgo: string;
}

/* ----------------------------------- Events ------------------------------------ */

export type EventKind = "meeting" | "activity" | "camp" | "training" | "deadline";

export interface CalendarEvent {
  id: string;
  title: string;
  kind: EventKind;
  /** ISO date, formatted at render with a fixed locale + UTC. */
  date: string;
  time: string;
  location: string;
  attendees: number;
  capacity: number;
}

/* -------------------------------- Notifications -------------------------------- */

export type NotificationTone = "info" | "good" | "warning" | "critical";

export interface Notification {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  tone: NotificationTone;
  unread: boolean;
}

/* ------------------------------------- User ------------------------------------ */

export interface UserProfile {
  name: string;
  initials: string;
  role: string;
  email: string;
  group: string;
}

/* ------------------------------------ Search ----------------------------------- */

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  group: "Scouts" | "Leaders" | "Patrols" | "Camps" | "Documents";
  href: string;
  icon: LucideIcon;
}
