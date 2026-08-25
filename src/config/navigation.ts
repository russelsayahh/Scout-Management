import {
  Backpack,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Flag,
  FolderOpen,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Tent,
  UserCog,
  Users,
} from "lucide-react";

import { can } from "@/lib/auth/permissions";
import type { Role } from "@/lib/auth/types";
import type { NavItem, NavSection } from "@/types";

/**
 * Sidebar contents. Grouping is presentational only - adding a section here is
 * all it takes for it to appear in both the desktop rail and the mobile drawer.
 *
 * Every item declares the permission it needs; `visibleSections` filters the
 * list for the signed-in role, so nobody is shown a door they cannot open.
 */
export const navSections: NavSection[] = [
  {
    title: null,
    items: [
      {
        key: "dashboard",
        title: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
    ],
  },
  {
    title: "People",
    items: [
      {
        key: "scouts",
        title: "Scouts",
        href: "/scouts",
        icon: Users,
        permission: "scouts.view",
      },
      {
        key: "leaders",
        title: "Leaders",
        href: "/leaders",
        icon: ShieldCheck,
        badge: 32,
        permission: "leaders.view",
      },
      {
        key: "patrols",
        title: "Patrols",
        href: "/patrols",
        icon: Flag,
        badge: 14,
        permission: "patrols.view",
      },
    ],
  },
  {
    title: "Programme",
    items: [
      {
        key: "activities",
        title: "Activities",
        href: "/activities",
        icon: CalendarDays,
        permission: "activities.view",
      },
      { key: "camps", title: "Camps", href: "/camps", icon: Tent, permission: "camps.view" },
      {
        key: "attendance",
        title: "Attendance",
        href: "/attendance",
        icon: ClipboardCheck,
        permission: "attendance.view",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        key: "equipment",
        title: "Equipment",
        href: "/equipment",
        icon: Backpack,
        permission: "equipment.view",
      },
      {
        key: "documents",
        title: "Documents",
        href: "/documents",
        icon: FolderOpen,
        badge: 6,
        permission: "documents.view",
      },
    ],
  },
  {
    title: "Insights",
    items: [
      {
        key: "reports",
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        permission: "reports.view",
      },
    ],
  },
];

/** Pinned to the bottom of the sidebar, below the scrolling section list. */
export const secondaryNavItems: NavItem[] = [
  { key: "users", title: "User accounts", href: "/users", icon: UserCog, permission: "users.manage" },
  { key: "settings", title: "Settings", href: "/settings", icon: Settings, permission: "settings.view" },
];

/** Sections filtered for `role`, with any section left empty dropped. */
export function visibleSections(role: Role): NavSection[] {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => can(role, item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}

export function visibleSecondaryItems(role: Role): NavItem[] {
  return secondaryNavItems.filter((item) => can(role, item.permission));
}
