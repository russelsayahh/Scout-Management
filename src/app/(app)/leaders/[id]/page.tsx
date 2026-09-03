import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeaderProfile } from "@/components/leaders/leader-profile";
import { AccessDenied } from "@/components/shared/access-denied";
import { Callout } from "@/components/ui/callout";
import { activitiesLedBy } from "@/lib/activities/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { assignedPatrols, getLeader } from "@/lib/leaders/service";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const leader = await getLeader(id);

  return { title: leader ? leader.name : "Leader not found" };
}

export default async function LeaderDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "leaders.view")) {
    return <AccessDenied sectionName="Leaders" role={user.role} />;
  }

  const { id } = await params;
  const leader = await getLeader(id);
  if (!leader) notFound();

  const saved = "saved" in (await searchParams);

  const [patrols, activities] = await Promise.all([assignedPatrols(id), activitiesLedBy(id)]);

  return (
    <div className="space-y-4">
      {saved && <Callout tone="success">Changes saved.</Callout>}

      <LeaderProfile
        leader={leader}
        canManage={can(user.role, "leaders.manage")}
        isSelf={leader.id === user.id}
        patrols={patrols}
        activities={activities}
      />
    </div>
  );
}
