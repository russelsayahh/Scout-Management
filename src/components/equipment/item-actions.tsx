"use client";

import Link from "next/link";
import { useState } from "react";
import { ArchiveRestore, ArchiveX, PackageMinus, Pencil, Send, Wrench } from "lucide-react";

import { CheckoutDialog, type CheckoutTargetOption } from "@/components/equipment/checkout-dialog";
import {
  RecordDamageDialog,
  RecordRepairDialog,
  RetireItemDialog,
  ReturnToServiceDialog,
} from "@/components/equipment/stock-dialogs";
import { Button, buttonStyles } from "@/components/ui/button";
import type { Role } from "@/lib/auth/types";
import type { CheckoutBlock, EquipmentItem, StockPosition } from "@/lib/equipment/types";

/**
 * Everything a quartermaster can do to one item.
 *
 * The book-out button is disabled rather than hidden when the item cannot go
 * out, with the reason on the button itself - "why can't I lend this" is a
 * question worth answering in place instead of leaving a gap where a control
 * used to be. Rendering nothing at all for read-only roles is presentation; the
 * Server Actions re-check `equipment.manage` regardless.
 */
export function ItemActions({
  item,
  position,
  block,
  blockMessage,
  leaders,
  activities,
  camps,
  canManage,
}: {
  item: EquipmentItem;
  position: StockPosition;
  block: CheckoutBlock;
  blockMessage: string | null;
  leaders: (CheckoutTargetOption & { role: Role })[];
  activities: CheckoutTargetOption[];
  camps: CheckoutTargetOption[];
  canManage: boolean;
}) {
  const [checkout, setCheckout] = useState(false);
  const [damage, setDamage] = useState(false);
  const [repair, setRepair] = useState(false);
  const [retire, setRetire] = useState(false);
  const [restore, setRestore] = useState(false);

  if (!canManage) return null;

  const retired = item.condition === "retired";
  // What is physically on the shelf, which is what can be written off here.
  const inStore = position.available;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {!retired && (
          <Button
            onClick={() => setCheckout(true)}
            disabled={block !== "ready"}
            title={blockMessage ?? undefined}
          >
            <Send className="size-4" strokeWidth={2} aria-hidden />
            Book out
          </Button>
        )}

        {!retired && item.damaged > 0 && (
          <Button variant="secondary" onClick={() => setRepair(true)}>
            <Wrench className="size-4" strokeWidth={2} aria-hidden />
            Record a repair
          </Button>
        )}

        {!retired && (
          <Button variant="secondary" onClick={() => setDamage(true)} disabled={inStore === 0}>
            <PackageMinus className="size-4" strokeWidth={2} aria-hidden />
            Damage or loss
          </Button>
        )}

        {!retired && (
          <Link
            href={`/equipment/${item.id}/edit`}
            className={buttonStyles({ variant: "secondary" })}
          >
            <Pencil className="size-4" strokeWidth={2} aria-hidden />
            Edit
          </Link>
        )}

        {retired ? (
          <Button variant="secondary" onClick={() => setRestore(true)}>
            <ArchiveRestore className="size-4" strokeWidth={2} aria-hidden />
            Back into the store
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => setRetire(true)} className="text-negative">
            <ArchiveX className="size-4" strokeWidth={2} aria-hidden />
            Retire
          </Button>
        )}
      </div>

      <CheckoutDialog
        itemId={item.id}
        itemName={item.name}
        available={position.available}
        leaders={leaders}
        activities={activities}
        camps={camps}
        open={checkout}
        onClose={() => setCheckout(false)}
      />
      <RecordDamageDialog
        itemId={item.id}
        itemName={item.name}
        inStore={inStore}
        open={damage}
        onClose={() => setDamage(false)}
      />
      <RecordRepairDialog
        itemId={item.id}
        itemName={item.name}
        damagedCount={item.damaged}
        open={repair}
        onClose={() => setRepair(false)}
      />
      <RetireItemDialog
        itemId={item.id}
        itemName={item.name}
        onLoan={position.onLoan}
        open={retire}
        onClose={() => setRetire(false)}
      />
      <ReturnToServiceDialog
        itemId={item.id}
        itemName={item.name}
        open={restore}
        onClose={() => setRestore(false)}
      />
    </>
  );
}
