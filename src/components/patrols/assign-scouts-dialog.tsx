"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Search, UserRoundPlus } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { assignScoutsAction } from "@/lib/patrols/actions";
import { scoutFullName, type Scout } from "@/lib/scouts/types";
import { cn } from "@/lib/utils";

/**
 * Picks scouts to add to a patrol.
 *
 * Only scouts who are not already in a patrol are offered. That is the
 * one-patrol-per-scout rule made visible: rather than letting someone create a
 * second membership and then rejecting it, the choice is never presented.
 * Moving a scout between patrols is done from their own record.
 */
export function AssignScoutsDialog({
  patrolId,
  patrolName,
  candidates,
  open,
  onClose,
}: {
  patrolId: string;
  patrolName: string;
  /** Unassigned, non-archived scouts. */
  candidates: Scout[];
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [term, setTerm] = useState("");

  const matches = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter((scout) =>
      scoutFullName(scout).toLowerCase().includes(needle),
    );
  }, [candidates, term]);

  function toggle(scoutId: string) {
    setSelected((previous) =>
      previous.includes(scoutId)
        ? previous.filter((id) => id !== scoutId)
        : [...previous, scoutId],
    );
  }

  function close() {
    setError(undefined);
    setSelected([]);
    setTerm("");
    onClose();
  }

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await assignScoutsAction(patrolId, selected);

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
      title={`Add scouts to ${patrolName}`}
      description="Only scouts who are not already in a patrol appear here."
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={pending || selected.length === 0}>
            {pending && <Spinner label="Adding scouts" />}
            {pending
              ? "Adding..."
              : selected.length === 0
                ? "Add scouts"
                : `Add ${selected.length} ${selected.length === 1 ? "scout" : "scouts"}`}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <Callout tone="error">{error}</Callout>}

        {candidates.length === 0 ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
              <UserRoundPlus className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <p className="mt-3 text-[13px] font-medium text-ink">Everyone has a patrol</p>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              To move a scout here, open their record and change their patrol.
            </p>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
                strokeWidth={1.9}
                aria-hidden
              />
              <Input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search unassigned scouts..."
                aria-label="Search unassigned scouts"
                className="pl-9 [&::-webkit-search-cancel-button]:appearance-none"
                disabled={pending}
              />
            </div>

            <ul className="scrollbar-slim max-h-72 space-y-1 overflow-y-auto">
              {matches.length === 0 && (
                <li className="px-2 py-6 text-center text-[12.5px] text-ink-muted">
                  No unassigned scouts match &ldquo;{term.trim()}&rdquo;.
                </li>
              )}

              {matches.map((scout) => {
                const checked = selected.includes(scout.id);

                return (
                  <li key={scout.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                        checked
                          ? "border-brand-border bg-brand-soft"
                          : "border-line hover:bg-surface-hover",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(scout.id)}
                        disabled={pending}
                        className="size-4 shrink-0 accent-brand-solid"
                      />
                      <Avatar name={scoutFullName(scout)} src={scout.avatar} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {scoutFullName(scout)}
                        </span>
                        <span className="block truncate text-[11.5px] text-ink-muted">
                          {scout.email || "No email on file"}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Dialog>
  );
}
