import { CalendarDays, ClipboardCheck, ShieldCheck, Tent, Users } from "lucide-react";

import type { Stat } from "@/types";

/**
 * Headline figures for the dashboard. Sample data only - these are replaced by
 * a real query layer later, so the shape here is what the UI is written against.
 *
 * `trend` is always 12 points, oldest first, matching the stat-tile contract.
 */
export const dashboardStats: Stat[] = [
  {
    key: "total-scouts",
    label: "Total scouts",
    value: 248,
    format: "number",
    delta: 12,
    deltaUnit: "absolute",
    deltaPeriod: "vs last term",
    polarity: "up-is-good",
    caption: "Across 4 sections",
    trend: [214, 218, 221, 219, 226, 231, 230, 236, 238, 241, 244, 248],
    href: "/scouts",
    icon: Users,
  },
  {
    key: "total-leaders",
    label: "Total leaders",
    value: 32,
    format: "number",
    delta: 3,
    deltaUnit: "absolute",
    deltaPeriod: "vs last term",
    polarity: "up-is-good",
    caption: "21 warranted",
    trend: [26, 26, 27, 27, 28, 28, 29, 29, 30, 31, 31, 32],
    href: "/leaders",
    icon: ShieldCheck,
  },
  {
    key: "upcoming-activities",
    label: "Upcoming activities",
    value: 12,
    format: "number",
    delta: 4,
    deltaUnit: "absolute",
    deltaPeriod: "vs last month",
    polarity: "up-is-good",
    caption: "Next 30 days",
    trend: [7, 9, 8, 10, 9, 11, 10, 8, 9, 11, 10, 12],
    href: "/activities",
    icon: CalendarDays,
  },
  {
    key: "upcoming-camps",
    label: "Upcoming camps",
    value: 4,
    format: "number",
    delta: 1,
    deltaUnit: "absolute",
    deltaPeriod: "vs last term",
    polarity: "up-is-good",
    caption: "126 places booked",
    trend: [2, 2, 3, 3, 2, 3, 4, 3, 3, 4, 4, 4],
    href: "/camps",
    icon: Tent,
  },
  {
    key: "attendance-rate",
    label: "Attendance rate",
    value: 87.4,
    format: "percent",
    delta: 2.1,
    deltaUnit: "percentage-point",
    deltaPeriod: "vs last term",
    polarity: "up-is-good",
    caption: "Target 85%",
    trend: [81.2, 82.4, 80.9, 83.1, 84.0, 83.6, 85.2, 84.8, 86.1, 86.9, 86.4, 87.4],
    href: "/attendance",
    icon: ClipboardCheck,
  },
];
