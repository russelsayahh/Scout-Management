import type { Metadata } from "next";

import { CampForm } from "@/components/camps/camp-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { leaderOptions, patrolChoices } from "@/lib/camps/service";
import * as scoutStore from "@/lib/scouts/store";

export const metadata: Metadata = {
  title: "New camp",
  description: "Plan a camp.",
};

export default async function NewCampPage() {
  const user = await requireUser();
  if (!can(user.role, "camps.manage")) {
    return <AccessDenied sectionName="planning camps" role={user.role} />;
  }

  const [patrols, leaders, counts] = await Promise.all([
    patrolChoices(),
    leaderOptions(),
    scoutStore.activeScoutCounts(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Camps"
        title="New camp"
        description="It starts in planning. Open registration once the dates, the site and the cost are settled."
      />

      <CampForm mode="create" patrols={patrols} leaders={leaders} troopSize={counts.total} />
    </div>
  );
}
