import type { Metadata } from "next";

import { PatrolForm } from "@/components/patrols/patrol-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { troopsInScope } from "@/lib/troops/service";

export const metadata: Metadata = {
  title: "New patrol",
  description: "Create a patrol.",
};

export default async function NewPatrolPage() {
  const user = await requireUser();
  if (!can(user.role, "patrols.manage")) {
    return <AccessDenied sectionName="creating patrols" role={user.role} />;
  }

  const scope = await resolveTroopScope(user);
  const troops = await troopsInScope(scope);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Patrols"
        title="New patrol"
        description="Name the patrol first; you can assign scouts and appoint a leader once it exists."
      />

      <PatrolForm mode="create" troops={troops} />
    </div>
  );
}
