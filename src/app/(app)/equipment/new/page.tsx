import type { Metadata } from "next";

import { EquipmentForm } from "@/components/equipment/equipment-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Add equipment",
  description: "Put an item into the store.",
};

export default async function NewEquipmentPage() {
  const user = await requireUser();
  if (!can(user.role, "equipment.manage")) {
    return <AccessDenied sectionName="adding equipment" role={user.role} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Equipment"
        title="Add equipment"
        description="One record per line of kit. A box of twenty pegs is one item with a quantity of twenty."
      />

      <EquipmentForm mode="create" />
    </div>
  );
}
