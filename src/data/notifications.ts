import type { Notification } from "@/types";

export const notifications: Notification[] = [
  {
    id: "ntf-1",
    title: "18 permission forms outstanding",
    body: "Autumn Survival Camp closes for consent on 11 September.",
    timeAgo: "20 minutes ago",
    tone: "warning",
    unread: true,
  },
  {
    id: "ntf-2",
    title: "3 leader renewals due",
    body: "Safeguarding checks expire within the next 30 days.",
    timeAgo: "2 hours ago",
    tone: "critical",
    unread: true,
  },
  {
    id: "ntf-3",
    title: "Register submitted",
    body: "Priya Raman completed the register for Tuesday Troop Night.",
    timeAgo: "Yesterday",
    tone: "good",
    unread: true,
  },
  {
    id: "ntf-4",
    title: "New document published",
    body: "Group Safeguarding Policy v4 is now available to all leaders.",
    timeAgo: "2 days ago",
    tone: "info",
    unread: false,
  },
  {
    id: "ntf-5",
    title: "Equipment returned",
    body: "6 items checked in from the Hillwalking Weekend.",
    timeAgo: "3 days ago",
    tone: "info",
    unread: false,
  },
];

export const unreadNotificationCount = notifications.filter((n) => n.unread).length;
