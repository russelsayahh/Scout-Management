import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EquipmentForm } from "@/components/equipment/equipment-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { Callout } from "@/components/ui/callout";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { getItem } from "@/lib/equipment/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getItem(id, new Date());

  return { title: found ? `Edit ${found.item.name}` : "Equipment not found" };
}

export default async function EditEquipmentPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "equipment.manage")) {
    return <AccessDenied sectionName="editing equipment" role={user.role} />;
  }

  const { id } = await params;
  const found = await getItem(id, new Date());
  if (!found) notFound();

  const { item } = found;

  // Retired kit is a record. Bringing it back is its own decision, made on the
  // item's page, so the form does not quietly un-retire it on save.
  if (item.condition === "retired") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader eyebrow="Equipment" title={item.name} />
        <Callout tone="warning" title="This item is retired">
          Bring it back into the store from its own page, and it can be edited again.
        </Callout>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Equipment"
        title={`Edit ${item.name}`}
        description="Loans, damage and retiring are handled from the item's own page."
      />

      <EquipmentForm mode="edit" item={item} />
    </div>
  );
}
