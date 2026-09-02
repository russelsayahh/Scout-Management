import { CalendarDays, ClipboardCheck, Tent } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { dashboardStats } from "@/data/stats";
import type { Stat } from "@/types";

/**
 * The headline KPI row. Five tiles wrap down to two columns on tablet and one
 * on phones, so no tile ever squeezes its value.
 *
 * The activities, camps and attendance tiles are counted from real records;
 * the rest are still sample figures waiting on the modules behind them. Where a
 * figure is real but its history is not, the tile ships without a trend line
 * rather than with an invented one.
 */
export function StatGrid({
  upcomingActivities,
  attendanceRate,
  registersTaken,
  upcomingCamps,
  campPlacesBooked,
}: {
  upcomingActivities: number;
  /** Null when no register has been taken yet. */
  attendanceRate: number | null;
  registersTaken: number;
  upcomingCamps: number;
  /** Scouts registered across every camp still to come. */
  campPlacesBooked: number;
}) {
  const stats: Stat[] = dashboardStats.map((stat) => {
    if (stat.key === "upcoming-activities") {
      return {
        ...stat,
        value: upcomingActivities,
        caption: "Published and still to come",
        delta: undefined,
        deltaPeriod: undefined,
        trend: undefined,
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
        delta: undefined,
        deltaPeriod: undefined,
        trend: undefined,
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
        delta: undefined,
        deltaPeriod: undefined,
        trend: undefined,
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
