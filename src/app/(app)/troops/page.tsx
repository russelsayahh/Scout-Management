import type { Metadata } from "next";

import { TroopGrid } from "@/components/troops/troop-grid";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { troopSummaries } from "@/lib/troops/service";

export const metadata: Metadata = {
  title: "Troops",
  description: "The group's six sections, each with its own members, leaders and patrols.",
};

export default async function TroopsPage() {
  const user = await requireUser();
  if (!can(user.role, "troops.view")) {
    return <AccessDenied sectionName="Troops" role={user.role} />;
  }

  const summaries = await troopSummaries(new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Troops"
        description="The group's six sections. Open one to see its roster, leaders and patrols."
        actions={<Badge tone="neutral">{summaries.length} troops</Badge>}
      />

      <TroopGrid summaries={summaries} />
    </div>
  );
}
