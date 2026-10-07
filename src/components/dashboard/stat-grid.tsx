import { CalendarDays, ClipboardCheck, ShieldCheck, Tent, Users } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { dashboardStats } from "@/data/stats";
import type { Stat } from "@/types";

/**
 * The headline KPI row. Five tiles wrap down to two columns on tablet and one
 * on phones, so no tile ever squeezes its value.
 *
 * Every tile is counted from real records, passed in as props. None ship with
 * a trend line or a period-over-period delta: there is no real history
 * tracked yet, and an invented one would be worse than none.
 */
export function StatGrid({
  totalScouts,
  totalLeaders,
  upcomingActivities,
  attendanceRate,
  registersTaken,
  upcomingCamps,
  campPlacesBooked,
}: {
  totalScouts: number;
  totalLeaders: number;
  upcomingActivities: number;
  /** Null when no register has been taken yet. */
  attendanceRate: number | null;
  registersTaken: number;
  upcomingCamps: number;
  /** Scouts registered across every camp still to come. */
  campPlacesBooked: number;
}) {
  const stats: Stat[] = dashboardStats.map((stat) => {
    if (stat.key === "total-scouts") {
      return {
        ...stat,
        value: totalScouts,
        caption: "Active members",
        icon: Users,
      };
    }

    if (stat.key === "total-leaders") {
      return {
        ...stat,
        value: totalLeaders,
        caption: "Across every troop you can see",
        icon: ShieldCheck,
      };
    }

    if (stat.key === "upcoming-activities") {
      return {
        ...stat,
        value: upcomingActivities,
        caption: "Published and still to come",
        icon: CalendarDays,
      };
    }

    if (stat.key === "attendance-rate") {
      return {
        ...stat,
        value: attendanceRate ?? 0,
        caption:
          registersTaken === 0
            ? "No registers taken yet"
            : `Across ${registersTaken} ${registersTaken === 1 ? "register" : "registers"}`,
        icon: ClipboardCheck,
      };
    }

    if (stat.key === "upcoming-camps") {
      return {
        ...stat,
        value: upcomingCamps,
        caption:
          campPlacesBooked === 0
            ? "No places booked yet"
            : `${campPlacesBooked} places booked`,
        icon: Tent,
      };
    }

    return stat;
  });

  return (
    <section aria-label="Key figures">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>
    </section>
  );
}
