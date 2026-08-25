import { StatCard } from "@/components/ui/stat-card";
import { dashboardStats } from "@/data/stats";

/**
 * The headline KPI row. Five tiles wrap down to two columns on tablet and one
 * on phones, so no tile ever squeezes its value.
 */
export function StatGrid() {
  return (
    <section aria-label="Key figures">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.key} stat={stat} />
        ))}
      </div>
    </section>
  );
}
