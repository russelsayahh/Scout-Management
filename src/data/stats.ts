import { CalendarDays, ClipboardCheck, ShieldCheck, Tent, Users } from "lucide-react";

import type { Stat } from "@/types";

/**
 * Headline tile template for the dashboard: key, label, format and icon are
 * fixed here, but every `value` (and `caption`) is overridden in
 * `StatGrid` with a real figure computed from the database. None of the
 * numbers below are ever shown - `0` is just a placeholder to satisfy the
 * type before that override runs.
 *
 * `trend` is deliberately omitted everywhere: there is no real history to
 * draw yet, and an invented one would be worse than none.
 */
export const dashboardStats: Stat[] = [
  {
    key: "total-scouts",
    label: "Total scouts",
    value: 0,
    format: "number",
    polarity: "up-is-good",
    caption: "",
    href: "/scouts",
    icon: Users,
  },
  {
    key: "total-leaders",
    label: "Total leaders",
    value: 0,
    format: "number",
    polarity: "up-is-good",
    caption: "",
    href: "/leaders",
    icon: ShieldCheck,
  },
  {
    key: "upcoming-activities",
    label: "Upcoming activities",
    value: 0,
    format: "number",
    polarity: "up-is-good",
    caption: "",
    href: "/activities",
    icon: CalendarDays,
  },
  {
    key: "upcoming-camps",
    label: "Upcoming camps",
    value: 0,
    format: "number",
    polarity: "up-is-good",
    caption: "",
    href: "/camps",
    icon: Tent,
  },
  {
    key: "attendance-rate",
    label: "Attendance rate",
    value: 0,
    format: "percent",
    polarity: "up-is-good",
    caption: "",
    href: "/attendance",
    icon: ClipboardCheck,
  },
];
