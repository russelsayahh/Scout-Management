import { Flag, FolderOpen, ShieldCheck, Tent, Users } from "lucide-react";

import type { SearchResult } from "@/types";

/**
 * Sample search corpus. The search field filters this list client-side purely
 * to demonstrate the interaction - there is no query layer behind it yet.
 */
export const searchResults: SearchResult[] = [
  { id: "s-1", title: "Amara Osei", subtitle: "Scout - Kestrel Patrol", group: "Scouts", href: "/scouts", icon: Users },
  { id: "s-2", title: "Ben Carter", subtitle: "Scout - Falcon Patrol", group: "Scouts", href: "/scouts", icon: Users },
  { id: "s-3", title: "Ines Moreau", subtitle: "Scout - Otter Patrol", group: "Scouts", href: "/scouts", icon: Users },
  { id: "s-4", title: "Priya Raman", subtitle: "Assistant Scout Leader", group: "Leaders", href: "/leaders", icon: ShieldCheck },
  { id: "s-5", title: "Daniel Okafor", subtitle: "Section Leader - Cubs", group: "Leaders", href: "/leaders", icon: ShieldCheck },
  { id: "s-6", title: "Kestrel Patrol", subtitle: "9 scouts - PL Amara Osei", group: "Patrols", href: "/patrols", icon: Flag },
  { id: "s-7", title: "Falcon Patrol", subtitle: "8 scouts - PL Ben Carter", group: "Patrols", href: "/patrols", icon: Flag },
  { id: "s-8", title: "Autumn Survival Camp", subtitle: "18-20 Sep - Gilwell Park", group: "Camps", href: "/camps", icon: Tent },
  { id: "s-9", title: "Summer Expedition", subtitle: "Archived - Aug 2026", group: "Camps", href: "/camps", icon: Tent },
  { id: "s-10", title: "Group Safeguarding Policy", subtitle: "Policy - v4", group: "Documents", href: "/documents", icon: FolderOpen },
  { id: "s-11", title: "Camp Permission Form", subtitle: "Template - updated Aug 2026", group: "Documents", href: "/documents", icon: FolderOpen },
  { id: "s-12", title: "Hillwalking Risk Assessment", subtitle: "Assessment - approved", group: "Documents", href: "/documents", icon: FolderOpen },
];

/** Shown when the search field is focused but empty. */
export const recentSearches = [
  "Autumn Survival Camp",
  "Kestrel Patrol",
  "Safeguarding Policy",
];
