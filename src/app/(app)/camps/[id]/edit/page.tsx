import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CampForm } from "@/components/camps/camp-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { Callout } from "@/components/ui/callout";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getCamp, leaderOptions, patrolChoices } from "@/lib/camps/service";
import { isClosed } from "@/lib/camps/types";
import * as scoutStore from "@/lib/scouts/store";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getCamp(id, new Date());

  return { title: found ? `Edit ${found.camp.name}` : "Camp not found" };
}

export default async function EditCampPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "camps.manage")) {
    return <AccessDenied sectionName="editing camps" role={user.role} />;
  }

  const { id } = await params;
  const [found, patrols, leaders, counts] = await Promise.all([
    getCamp(id, new Date()),
    patrolChoices(),
    leaderOptions(),
    scoutStore.activeScoutCounts(),
  ]);
  if (!found) notFound();

  const { camp } = found;

  // A finished or cancelled camp is a record, not a working document.
  if (isClosed(camp.status)) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader eyebrow="Camps" title={camp.name} />
        <Callout tone="warning" title="This camp can no longer be edited">
          {camp.status === "completed"
            ? "It has run, so its details and roster are kept as a record of what happened."
            : "It was cancelled. Reinstate it from the camp's page to make changes."}
        </Callout>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Camps"
        title={`Edit ${camp.name}`}
        description="Registration and the roster are managed from the camp's own page."
      />

      <CampForm
        mode="edit"
        camp={camp}
        registered={camp.registrations.length}
        patrols={patrols}
        leaders={leaders}
        troopSize={counts.total}
      />
    </div>
  );
}
