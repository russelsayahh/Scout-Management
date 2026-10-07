import type { Metadata } from "next";

import { CampForm } from "@/components/camps/camp-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { leaderOptions, patrolChoices, troopSizes } from "@/lib/camps/service";
import { troopsInScope } from "@/lib/troops/service";

export const metadata: Metadata = {
  title: "New camp",
  description: "Plan a camp.",
};

export default async function NewCampPage() {
  const user = await requireUser();
  if (!can(user.role, "camps.manage")) {
    return <AccessDenied sectionName="planning camps" role={user.role} />;
  }

  const scope = await resolveTroopScope(user);
  const [patrols, leaders, sizes, troops] = await Promise.all([
    patrolChoices(scope),
    leaderOptions(),
    troopSizes(scope),
    troopsInScope(scope),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Camps"
        title="New camp"
        description="It starts in planning. Open registration once the dates, the site and the cost are settled."
      />

      <CampForm
        mode="create"
        patrols={patrols}
        leaders={leaders}
        troops={troops}
        troopSizes={sizes}
      />
    </div>
  );
}
