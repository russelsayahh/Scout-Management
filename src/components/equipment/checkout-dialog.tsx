"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog } from "@/components/ui/dialog";
import { SelectField, TextField, TextareaField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { roleLabels, type Role } from "@/lib/auth/types";
import { checkOutAction } from "@/lib/equipment/actions";
import { holderKindLabels, type HolderKind } from "@/lib/equipment/types";
import { validateDueBack, validateLoanQuantity } from "@/lib/equipment/validation";
import { cn } from "@/lib/utils";

/**
 * Books kit out to a leader, an activity or a camp.
 *
 * Which of the three is picked first, because it changes what the next field
 * offers - and because "who has it" is the question the whole loan exists to
 * answer. Only events still to come are listed: booking a stove out to last
 * month's meeting is a mistake nobody meant to make.
 */

export interface CheckoutTargetOption {
  id: string;
  name: string;
  detail: string;
}

export function CheckoutDialog({
  itemId,
  itemName,
  available,
  leaders,
  activities,
  camps,
  open,
  onClose,
}: {
  itemId: string;
  itemName: string;
  available: number;
  leaders: (CheckoutTargetOption & { role: Role })[];
  activities: CheckoutTargetOption[];
  camps: CheckoutTargetOption[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const [holderKind, setHolderKind] = useState<HolderKind>("camp");
  const [holderId, setHolderId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [dueBack, setDueBack] = useState("");
  const [note, setNote] = useState("");

  const targets = useMemo(() => {
    if (holderKind === "leader") return leaders;
    if (holderKind === "activity") return activities;
    return camps;
  }, [holderKind, leaders, activities, camps]);

  const quantityError = validateLoanQuantity(quantity, available);
  const dueError = validateDueBack(dueBack);
  const ready = holderId !== "" && !quantityError && !dueError;

  function pickKind(kind: HolderKind) {
    setHolderKind(kind);
    // The previous choice belongs to a different list, so it cannot carry over.
    setHolderId("");
    setError(undefined);
  }

  function close() {
    setError(undefined);
    setHolderKind("camp");
    setHolderId("");
    setQuantity("1");
    setDueBack("");
    setNote("");
    onClose();
  }

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await checkOutAction({
        itemId,
        quantity: Number(quantity.trim()),
        holderKind,
        holderId,
        dueBack: dueBack.trim() || null,
        note,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      close();
      router.refresh();
    });
  }

  const kinds: HolderKind[] = ["camp", "activity", "leader"];

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Book out ${itemName}`}
      description={`${available} ${available === 1 ? "unit is" : "units are"} in the store.`}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={pending || !ready}>
            {pending && <Spinner label="Booking out" />}
            {pending ? "Booking out..." : "Book it out"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Callout tone="error">{error}</Callout>}

        <fieldset className="space-y-2" disabled={pending}>
          <legend className="text-[13px] font-medium text-ink">Who is taking it</legend>
          <div
            className="flex overflow-hidden rounded-lg border border-line bg-surface"
            role="group"
            aria-label="Who is taking it"
          >
            {kinds.map((kind, index) => (
              <button
                key={kind}
                type="button"
                onClick={() => pickKind(kind)}
                aria-pressed={holderKind === kind}
                className={cn(
                  "h-10 flex-1 px-3 text-[13px] font-medium transition-colors",
                  index > 0 && "border-l border-line",
                  holderKind === kind
                    ? "bg-brand-soft text-brand-text"
                    : "text-ink-secondary hover:bg-surface-hover",
                )}
              >
                {holderKindLabels[kind]}
              </button>
            ))}
          </div>
        </fieldset>

        {targets.length === 0 ? (
          <Callout tone="info">
            {holderKind === "activity"
              ? "There are no activities still to come. Book it out to a leader instead."
              : holderKind === "camp"
                ? "There are no camps still to come. Book it out to a leader instead."
                : "There are no accounts to book it out to."}
          </Callout>
        ) : (
          <SelectField
            label={
              holderKind === "leader"
                ? "Leader"
                : holderKind === "activity"
                  ? "Activity"
                  : "Camp"
            }
            value={holderId}
            onChange={(event) => setHolderId(event.target.value)}
            disabled={pending}
            hint={
              holderKind === "leader"
                ? "Anybody with an account can sign kit out."
                : "Only events still to come are listed."
            }
          >
            <option value="">Choose...</option>
            {/* Leaders carry a role rather than a date, so the two lists are
                rendered apart instead of being cast into one shape. */}
            {holderKind === "leader"
              ? leaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name} - {roleLabels[leader.role]}
                  </option>
                ))
              : targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name} - {target.detail}
                  </option>
                ))}
          </SelectField>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="How many"
            type="number"
            inputMode="numeric"
            min={1}
            max={available}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            error={quantity.trim() ? quantityError : undefined}
            disabled={pending}
          />

          <TextField
            label="Due back"
            labelAside="Optional"
            type="date"
            value={dueBack}
            onChange={(event) => setDueBack(event.target.value)}
            error={dueError}
            hint="Leave blank for kit that lives with a leader."
            disabled={pending}
          />
        </div>

        <TextareaField
          label="Note"
          labelAside="Optional"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. One set per patrol for the backwoods cooking session."
          disabled={pending}
        />
      </div>
    </Dialog>
  );
}
