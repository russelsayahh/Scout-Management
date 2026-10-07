import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ScoutProfile } from "@/components/scouts/scout-profile";
import { AccessDenied } from "@/components/shared/access-denied";
import { Callout } from "@/components/ui/callout";
import { scoutAttendance } from "@/lib/attendance/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import { campsForScout } from "@/lib/camps/service";
import { patrolNameMap } from "@/lib/patrols/service";
import { getScout } from "@/lib/scouts/service";
import { scoutFullName } from "@/lib/scouts/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const scout = await getScout(id);

  return { title: scout ? scoutFullName(scout) : "Scout not found" };
}

export default async function ScoutDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "scouts.view")) {
    return <AccessDenied sectionName="Scouts" role={user.role} />;
  }

  const { id } = await params;
  const scout = await getScout(id);
  const scope = await resolveTroopScope(user);
  if (!scout || !inScope(scope, scout.troopId)) notFound();

  const saved = "saved" in (await searchParams);

  const [names, attendance, camps] = await Promise.all([
    patrolNameMap(scope),
    scoutAttendance(scout.id),
    campsForScout(scout.id, new Date()),
  ]);
  const patrol =
    scout.patrolId && names.has(scout.patrolId)
      ? { id: scout.patrolId, name: names.get(scout.patrolId)! }
      : null;

  return (
    <div className="space-y-4">
      {saved && <Callout tone="success">Changes saved.</Callout>}

      <ScoutProfile
        scout={scout}
        canManage={can(user.role, "scouts.manage")}
        today={new Date()}
        patrol={patrol}
        attendance={attendance}
        camps={camps}
      />
    </div>
  );
}
