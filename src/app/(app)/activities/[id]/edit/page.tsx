import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActivityForm } from "@/components/activities/activity-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import {
  getActivity,
  leaderOptions,
  patrolChoices,
  troopSizes,
} from "@/lib/activities/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import { troopsInScope } from "@/lib/troops/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getActivity(id, new Date());

  return { title: found ? `Edit ${found.activity.name}` : "Activity not found" };
}

export default async function EditActivityPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "activities.manage")) {
    return <AccessDenied sectionName="editing activities" role={user.role} />;
  }

  const { id } = await params;
  const scope = await resolveTroopScope(user);
  const [found, patrols, leaders, sizes, troops] = await Promise.all([
    getActivity(id, new Date()),
    patrolChoices(scope),
    leaderOptions(),
    troopSizes(scope),
    troopsInScope(scope),
  ]);
  if (!found || !inScope(scope, found.activity.troopId)) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Activities"
        title={`Edit ${found.activity.name}`}
        description="Changing the details never changes the status - publishing, completing and cancelling are done from the activity's own page."
      />

      <ActivityForm
        mode="edit"
        activity={found.activity}
        patrols={patrols}
        leaders={leaders}
        troops={troops}
        troopSizes={sizes}
      />
    </div>
  );
}
