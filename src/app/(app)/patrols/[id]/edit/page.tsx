import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PatrolForm } from "@/components/patrols/patrol-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import { getPatrol } from "@/lib/patrols/service";
import { listTroops } from "@/lib/troops/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getPatrol(id);

  return { title: found ? `Edit ${found.patrol.name} Patrol` : "Patrol not found" };
}

export default async function EditPatrolPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "patrols.manage")) {
    return <AccessDenied sectionName="editing patrols" role={user.role} />;
  }

  const { id } = await params;
  const found = await getPatrol(id);
  const scope = await resolveTroopScope(user);
  if (!found || !inScope(scope, found.patrol.troopId)) notFound();

  // Edit only ever shows the patrol's own troop, since it cannot be changed.
  const troops = await listTroops();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Patrols"
        title={`Edit ${found.patrol.name} Patrol`}
        description="Members and the patrol leader are managed on the patrol's own page."
      />

      <PatrolForm mode="edit" patrol={found.patrol} troops={troops} />
    </div>
  );
}
