import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActivityForm } from "@/components/activities/activity-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import {
  getActivity,
  leaderOptions,
  patrolChoices,
  troopSize,
} from "@/lib/activities/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";

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
  const [found, patrols, leaders, troop] = await Promise.all([
    getActivity(id, new Date()),
    patrolChoices(),
    leaderOptions(),
    troopSize(),
  ]);
  if (!found) notFound();

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
        troopSize={troop}
      />
    </div>
  );
}
