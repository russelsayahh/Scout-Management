import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeaderForm } from "@/components/leaders/leader-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { getLeader, leaderInScope, patrolChoices, troopChoices } from "@/lib/leaders/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const leader = await getLeader(id);

  return { title: leader ? `Edit ${leader.name}` : "Leader not found" };
}

export default async function EditLeaderPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "leaders.manage")) {
    return <AccessDenied sectionName="editing leaders" role={user.role} />;
  }

  const { id } = await params;
  const leader = await getLeader(id);
  if (!leader) notFound();

  const scope = await resolveTroopScope(user);
  if (!leaderInScope(leader, scope)) notFound();

  const [patrols, troops] = await Promise.all([patrolChoices(scope), troopChoices(scope)]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Leaders"
        title={`Edit ${leader.name}`}
        description="Changes are saved to their profile immediately."
      />

      <LeaderForm
        leader={leader}
        patrols={patrols}
        troops={troops}
        assignedPatrolIds={leader.assignedPatrolIds}
        assignedTroopIds={leader.assignedTroopIds}
      />
    </div>
  );
}
