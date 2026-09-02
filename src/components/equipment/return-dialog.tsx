"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { returnLoanAction } from "@/lib/equipment/actions";
import { cn } from "@/lib/utils";

/**
 * Books kit back in.
 *
 * The three counts have to add up to what went out. That is the whole point of
 * the dialog: anything unaccounted for would quietly vanish from the store, so
 * the running total is on screen and the button stays disabled until it
 * balances. Damaged and lost units leave the serviceable count as they are
 * recorded, which is what makes "record damaged or lost equipment" a single
 * step rather than two people remembering to do two things.
 */
export function ReturnDialog({
  itemId,
  itemName,
  loanId,
  quantity,
  holderName,
  open,
  onClose,
}: {
  itemId: string;
  itemName: string;
  loanId: string;
  /** How many went out. */
  quantity: number;
  holderName: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const [damaged, setDamaged] = useState("0");
  const [lost, setLost] = useState("0");

  const damagedNumber = Number(damaged.trim() || "0");
  const lostNumber = Number(lost.trim() || "0");
  const valid =
    Number.isInteger(damagedNumber) &&
    Number.isInteger(lostNumber) &&
    damagedNumber >= 0 &&
    lostNumber >= 0;

  // Good is what is left over, so the three always add up by construction and
  // the leader only types the exceptions.
  const good = valid ? quantity - damagedNumber - lostNumber : 0;
  const balanced = valid && good >= 0;

  function close() {
    setError(undefined);
    setDamaged("0");
    setLost("0");
    onClose();
  }

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await returnLoanAction(itemId, loanId, {
        good,
        damaged: damagedNumber,
        lost: lostNumber,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      close();
      router.refresh();
    });
  }

  const allFine = balanced && damagedNumber === 0 && lostNumber === 0;

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Book in ${itemName}`}
      description={`${quantity} ${quantity === 1 ? "unit" : "units"} went out to ${holderName}.`}
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={pending || !balanced}>
            {pending && <Spinner label="Booking in" />}
            {pending ? "Booking in..." : "Book it in"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Callout tone="error">{error}</Callout>}

        <p className="text-[13px] text-ink-secondary">
          Record anything that came back broken or did not come back at all. Everything else is
          counted as fine.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Damaged"
            type="number"
            inputMode="numeric"
            min={0}
            max={quantity}
            value={damaged}
            onChange={(event) => setDamaged(event.target.value)}
            hint="Still owned, but not fit to go out."
            disabled={pending}
          />
          <TextField
            label="Lost"
            type="number"
            inputMode="numeric"
            min={0}
            max={quantity}
            value={lost}
            onChange={(event) => setLost(event.target.value)}
            hint="Written off the store for good."
            disabled={pending}
          />
        </div>

        {/* The running total, so the arithmetic is never a surprise. */}
        <div
          className={cn(
            "flex gap-2.5 rounded-lg border px-3.5 py-3",
            !balanced
              ? "border-status-critical/40 bg-status-critical/8"
              : allFine
                ? "border-status-good/35 bg-status-good/8"
                : "border-status-warning/40 bg-status-warning/10",
          )}
          role={balanced ? undefined : "alert"}
        >
          {balanced ? (
            allFine ? (
              <Check
                className="mt-px size-4 shrink-0 text-status-good"
                strokeWidth={2.5}
                aria-hidden
              />
            ) : (
              <TriangleAlert
                className="mt-px size-4 shrink-0 text-status-warning"
                strokeWidth={2}
                aria-hidden
              />
            )
          ) : (
            <TriangleAlert
              className="mt-px size-4 shrink-0 text-status-critical"
              strokeWidth={2}
              aria-hidden
            />
          )}

          <p className="text-[12.5px] leading-snug text-ink-secondary">
            {!balanced ? (
              <>
                That is more than the {quantity} that went out. Lower the damaged or lost count.
              </>
            ) : allFine ? (
              <>
                All <span className="font-medium text-ink tabular-nums">{quantity}</span> back in
                good order.
              </>
            ) : (
              <>
                <span className="font-medium text-ink tabular-nums">{good}</span> back in good
                order,{" "}
                {damagedNumber > 0 && (
                  <>
                    <span className="font-medium text-ink tabular-nums">{damagedNumber}</span>{" "}
                    damaged
                  </>
                )}
                {damagedNumber > 0 && lostNumber > 0 && ", "}
                {lostNumber > 0 && (
                  <>
                    <span className="font-medium text-ink tabular-nums">{lostNumber}</span> lost
                  </>
                )}
                . Damaged and lost units come out of the serviceable count.
              </>
            )}
          </p>
        </div>
      </div>
    </Dialog>
  );
}
