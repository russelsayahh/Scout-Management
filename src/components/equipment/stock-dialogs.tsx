"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { TextField, TextareaField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import {
  recordDamageAction,
  recordRepairAction,
  retireItemAction,
  returnToServiceAction,
} from "@/lib/equipment/actions";

/**
 * Writing kit off, repairing it, and taking it out of the store for good.
 *
 * All four go through the service so the counts move together: a unit never
 * leaves the serviceable total without arriving somewhere else in the same
 * write.
 */

interface ItemDialogProps {
  itemId: string;
  itemName: string;
  open: boolean;
  onClose: () => void;
}

/* ------------------------------ damage or loss ----------------------------- */

export function RecordDamageDialog({
  itemId,
  itemName,
  inStore,
  open,
  onClose,
}: ItemDialogProps & {
  /** Units physically in the store right now - what can be written off. */
  inStore: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const [damaged, setDamaged] = useState("0");
  const [lost, setLost] = useState("0");
  const [note, setNote] = useState("");

  const damagedNumber = Number(damaged.trim() || "0");
  const lostNumber = Number(lost.trim() || "0");
  const total = damagedNumber + lostNumber;

  const valid =
    Number.isInteger(damagedNumber) &&
    Number.isInteger(lostNumber) &&
    damagedNumber >= 0 &&
    lostNumber >= 0 &&
    total > 0 &&
    total <= inStore;

  function close() {
    setError(undefined);
    setDamaged("0");
    setLost("0");
    setNote("");
    onClose();
  }

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await recordDamageAction(itemId, damagedNumber, lostNumber, note);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      close();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Record damage or loss - ${itemName}`}
      description={`${inStore} ${inStore === 1 ? "unit is" : "units are"} in the store. Anything out on loan is recorded when it comes back in.`}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} disabled={pending || !valid}>
            {pending && <Spinner label="Recording" />}
            {pending ? "Recording..." : "Record it"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Callout tone="error">{error}</Callout>}

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Damaged"
            type="number"
            inputMode="numeric"
            min={0}
            max={inStore}
            value={damaged}
            onChange={(event) => setDamaged(event.target.value)}
            hint="Kept, but not fit to use."
            disabled={pending}
          />
          <TextField
            label="Lost"
            type="number"
            inputMode="numeric"
            min={0}
            max={inStore}
            value={lost}
            onChange={(event) => setLost(event.target.value)}
            hint="Gone. Written off the store."
            disabled={pending}
          />
        </div>

        {total > inStore && (
          <Callout tone="error">
            That is more than the {inStore} in the store. Book the rest back in first.
          </Callout>
        )}

        <TextareaField
          label="What happened"
          labelAside="Optional"
          rows={2}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Centre pole bent on the Snowdonia trip."
          hint="Added to the item's notes."
          disabled={pending}
        />
      </div>
    </Dialog>
  );
}

/* --------------------------------- repair ---------------------------------- */

export function RecordRepairDialog({
  itemId,
  itemName,
  damagedCount,
  open,
  onClose,
}: ItemDialogProps & { damagedCount: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(String(damagedCount));

  const number = Number(quantity.trim() || "0");
  const valid = Number.isInteger(number) && number >= 1 && number <= damagedCount;

  function close() {
    setError(undefined);
    setQuantity(String(damagedCount));
    onClose();
  }

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await recordRepairAction(itemId, number);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      close();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Record a repair - ${itemName}`}
      description={`${damagedCount} ${damagedCount === 1 ? "unit is" : "units are"} recorded as damaged.`}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={pending || !valid}>
            {pending && <Spinner label="Recording repair" />}
            {pending ? "Recording..." : "Back in service"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Callout tone="error">{error}</Callout>}

        <TextField
          label="How many are fixed"
          type="number"
          inputMode="numeric"
          min={1}
          max={damagedCount}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          hint="They go back into the serviceable count."
          disabled={pending}
        />
      </div>
    </Dialog>
  );
}

/* --------------------------- retire and reinstate -------------------------- */

export function RetireItemDialog({
  itemId,
  itemName,
  onLoan,
  open,
  onClose,
}: ItemDialogProps & { onLoan: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [reason, setReason] = useState("");

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await retireItemAction(itemId, reason);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setReason("");
      onClose();
      router.refresh();
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        setError(undefined);
        onClose();
      }}
      onConfirm={confirm}
      title={`Retire ${itemName}?`}
      description={
        onLoan > 0
          ? `${onLoan} ${onLoan === 1 ? "unit is" : "units are"} still out on loan, so this will be refused until they are booked back in.`
          : "It drops out of the store and cannot go out again. The record and every loan against it are kept, and it can be brought back."
      }
      confirmLabel="Retire it"
      tone="danger"
      pending={pending}
      error={error}
    >
      <TextareaField
        label="Reason"
        labelAside="Optional"
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="e.g. Failed its gas safety check and was scrapped."
        hint="Added to the item's notes."
        disabled={pending}
      />
    </ConfirmDialog>
  );
}

export function ReturnToServiceDialog({ itemId, itemName, open, onClose }: ItemDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await returnToServiceAction(itemId);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      onClose();
      router.refresh();
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={() => {
        setError(undefined);
        onClose();
      }}
      onConfirm={confirm}
      title={`Bring ${itemName} back into the store?`}
      description="It returns as available and in good condition. Change either of those on the item if that is not right."
      confirmLabel="Back into the store"
      pending={pending}
      error={error}
    />
  );
}
