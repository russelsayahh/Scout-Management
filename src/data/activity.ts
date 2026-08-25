import type { ActivityEntry } from "@/types";

/**
 * Recent activity feed. `timeAgo` is stored pre-formatted rather than derived
 * from the clock, so the server and client render identical markup.
 */
export const recentActivity: ActivityEntry[] = [
  {
    id: "act-1",
    kind: "attendance",
    actor: "Priya Raman",
    action: "took the register for",
    target: "Tuesday Troop Night",
    timeAgo: "18 minutes ago",
  },
  {
    id: "act-2",
    kind: "member",
    actor: "Daniel Okafor",
    action: "added a new scout to",
    target: "Kestrel Patrol",
    timeAgo: "1 hour ago",
  },
  {
    id: "act-3",
    kind: "camp",
    actor: "Marta Lindqvist",
    action: "opened bookings for",
    target: "Autumn Survival Camp",
    timeAgo: "3 hours ago",
  },
  {
    id: "act-4",
    kind: "document",
    actor: "Rowan Whitfield",
    action: "published a new version of",
    target: "Group Safeguarding Policy",
    timeAgo: "Yesterday, 16:42",
  },
  {
    id: "act-5",
    kind: "equipment",
    actor: "Tomasz Nowak",
    action: "checked in 6 items from",
    target: "Hillwalking Weekend",
    timeAgo: "Yesterday, 11:05",
  },
  {
    id: "act-6",
    kind: "award",
    actor: "Aisha Bello",
    action: "awarded Chief Scout Gold to",
    target: "4 scouts in Falcon Patrol",
    timeAgo: "2 days ago",
  },
  {
    id: "act-7",
    kind: "member",
    actor: "Priya Raman",
    action: "moved 3 scouts up from",
    target: "Cubs to Scouts",
    timeAgo: "3 days ago",
  },
];
