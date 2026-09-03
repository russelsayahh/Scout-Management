import type { Metadata } from "next";

import { ScoutForm } from "@/components/scouts/scout-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { patrolOptions } from "@/lib/patrols/service";

export const metadata: Metadata = {
  title: "Add a scout",
  description: "Create a new scout record.",
};

export default async function NewScoutPage() {
  const user = await requireUser();
  if (!can(user.role, "scouts.manage")) {
    return <AccessDenied sectionName="adding scouts" role={user.role} />;
  }

  const patrols = await patrolOptions();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Scouts"
        title="Add a scout"
        description="Emergency contact details are required; everything else can be filled in later."
      />

      <ScoutForm mode="create" patrols={patrols} />
    </div>
  );
}
