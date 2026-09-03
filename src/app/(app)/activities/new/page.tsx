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

  const params = await searchParams;
  const from = typeof params.from === "string" ? params.from : "";

  const [patrols, leaders, troop] = await Promise.all([
    patrolChoices(),
    leaderOptions(),
    troopSize(),
  ]);

  const source = from ? await getActivity(from, new Date()) : null;
  if (from && !source) notFound();

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
          troopSize={troop}
        />
      ) : (
        <ActivityForm
          mode="create"
          patrols={patrols}
          leaders={leaders}
          troopSize={troop}
        />
      )}
    </div>
  );
}
