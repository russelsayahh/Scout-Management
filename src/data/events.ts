import type { CalendarEvent } from "@/types";

/**
 * Upcoming events. Dates are ISO strings formatted at render with a pinned
 * locale and UTC, so they are stable between server and client.
 */
export const upcomingEvents: CalendarEvent[] = [
  {
    id: "evt-1",
    title: "Tuesday Troop Night",
    kind: "meeting",
    date: "2026-09-01",
    time: "19:00 - 21:00",
    location: "Riverside Scout Hut",
    attendees: 58,
    capacity: 64,
  },
  {
    id: "evt-2",
    title: "Navigation and Map Skills",
    kind: "activity",
    date: "2026-09-05",
    time: "09:30 - 15:00",
    location: "Beacon Hill",
    attendees: 41,
    capacity: 48,
  },
  {
    id: "evt-3",
    title: "Autumn Survival Camp",
    kind: "camp",
    date: "2026-09-18",
    time: "Fri 17:00 - Sun 15:00",
    location: "Gilwell Park",
    attendees: 96,
    capacity: 120,
  },
  {
    id: "evt-4",
    title: "Permission forms due",
    kind: "deadline",
    date: "2026-09-11",
    time: "End of day",
    location: "Autumn Survival Camp",
    attendees: 78,
    capacity: 96,
  },
  {
    id: "evt-5",
    title: "First Aid Refresher",
    kind: "training",
    date: "2026-09-26",
    time: "10:00 - 16:00",
    location: "District HQ",
    attendees: 14,
    capacity: 20,
  },
];
