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

export const metadata: Metadata = {
  title: "New activity",
  description: "Add an activity to the programme.",
};

/**
 * Creating an activity, and duplicating one.
 *
 * Duplicating opens this same form with the source copied in rather than
 * writing a second record straight away, so the date - the thing that always
 * differs - is changed before anything is saved.
 */
export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "activities.manage")) {
    return <AccessDenied sectionName="creating activities" role={user.role} />;
  }

  const scope = await resolveTroopScope(user);

  const params = await searchParams;
  const from = typeof params.from === "string" ? params.from : "";

  const [patrols, leaders, sizes, troops] = await Promise.all([
    patrolChoices(scope),
    leaderOptions(),
    troopSizes(scope),
    troopsInScope(scope),
  ]);

  const source = from ? await getActivity(from, new Date()) : null;
  // Duplicating from a record outside the caller's scope is refused the same
  // way visiting it directly would be - never confirming it exists.
  if (from && (!source || !inScope(scope, source.activity.troopId))) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Activities"
        title={source ? `Duplicate ${source.activity.name}` : "New activity"}
        description={
          source
            ? "A copy of the original, ready to be changed. Nothing is saved until you choose below."
            : "Save it as a draft while you work on it, or publish it straight to the calendar."
        }
      />

      {source ? (
        <ActivityForm
          mode="duplicate"
          activity={source.activity}
          patrols={patrols}
          leaders={leaders}
          troops={troops}
          troopSizes={sizes}
        />
      ) : (
        <ActivityForm
          mode="create"
          patrols={patrols}
          leaders={leaders}
          troops={troops}
          troopSizes={sizes}
        />
      )}
    </div>
  );
}
