import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ScoutForm } from "@/components/scouts/scout-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getScout } from "@/lib/scouts/service";
import { scoutFullName } from "@/lib/scouts/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const scout = await getScout(id);

  return { title: scout ? `Edit ${scoutFullName(scout)}` : "Scout not found" };
}

export default async function EditScoutPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "scouts.manage")) {
    return <AccessDenied sectionName="editing scouts" role={user.role} />;
  }

  const { id } = await params;
  const scout = await getScout(id);
  if (!scout) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Scouts"
        title={`Edit ${scoutFullName(scout)}`}
        description="Changes are saved to the register immediately."
      />

      <ScoutForm mode="edit" scout={scout} />
    </div>
  );
}
