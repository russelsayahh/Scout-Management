import type { Metadata } from "next";

import { ReportCard } from "@/components/reports/report-card";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { buildAllReports } from "@/lib/reports/service";
import { REPORT_CATEGORIES, reportCategoryLabels, type ReportTable } from "@/lib/reports/types";

export const metadata: Metadata = {
  title: "Reports",
  description: "Attendance, membership, equipment and programme reports.",
};

export default async function ReportsPage() {
  const user = await requireUser();
  if (!can(user.role, "reports.view")) {
    return <AccessDenied sectionName="Reports" role={user.role} />;
  }

  const scope = await resolveTroopScope(user);
  const tables = await buildAllReports(scope, new Date());

  const byCategory = new Map<string, ReportTable[]>();
  for (const table of tables) {
    const list = byCategory.get(table.meta.category) ?? [];
    list.push(table);
    byCategory.set(table.meta.category, list);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Everything below is scoped to what you can see - export a report as CSV or PDF for anything further."
      />

      {REPORT_CATEGORIES.map((category) => (
        <section key={category} className="space-y-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            {reportCategoryLabels[category]}
          </h2>

          <div className="space-y-4">
            {(byCategory.get(category) ?? []).map((table) => (
              <ReportCard key={table.meta.id} table={table} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
