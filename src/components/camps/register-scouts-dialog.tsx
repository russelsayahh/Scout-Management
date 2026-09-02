"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Search, UserRoundPlus } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { registerScoutsAction } from "@/lib/camps/actions";
import { cn } from "@/lib/utils";

/**
 * Signs scouts up for a camp.
 *
 * Scouts from the invited patrols are offered first, because that is who the
 * camp was announced to. Anyone else is one checkbox away rather than
 * forbidden: bringing a single scout from another patrol is normal, and making
 * a leader invite that whole patrol to do it would be worse than letting them
 * choose. Capacity is the one hard stop - the dialog will not let you select
 * more scouts than there are places.
 */

export interface CandidateScout {
  id: string;
  name: string;
  avatar: string | null;
  patrolName: string | null;
}

export function RegisterScoutsDialog({
  campId,
  campName,
  invited,
  others,
  placesLeft,
  open,
  onClose,
}: {
  campId: string;
  campName: string;
  /** Unregistered active scouts from the invited patrols. */
  invited: CandidateScout[];
  /** Everyone else who could still be added. */
  others: CandidateScout[];
  placesLeft: number;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<string[]>([]);
  const [term, setTerm] = useState("");
  const [showEveryone, setShowEveryone] = useState(false);

  const pool = useMemo(
    () => (showEveryone ? [...invited, ...others] : invited),
    [invited, others, showEveryone],
  );

  const matches = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return pool;
    return pool.filter(
      (scout) =>
        scout.name.toLowerCase().includes(needle) ||
        (scout.patrolName ?? "").toLowerCase().includes(needle),
    );
  }, [pool, term]);

  const atCapacity = selected.length >= placesLeft;

  function toggle(scoutId: string) {
    setSelected((previous) =>
      previous.includes(scoutId)
        ? previous.filter((id) => id !== scoutId)
        : previous.length >= placesLeft
          ? previous
          : [...previous, scoutId],
    );
  }

  function close() {
    setError(undefined);
    setSelected([]);
    setTerm("");
    setShowEveryone(false);
    onClose();
  }

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await registerScoutsAction(campId, selected);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      close();
      router.refresh();
    });
  }

  const invitedIds = useMemo(() => new Set(invited.map((scout) => scout.id)), [invited]);

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Register scouts for ${campName}`}
      description={
        placesLeft === 0
          ? "Every place is taken. Raise the maximum on the camp to add anyone else."
          : `${placesLeft} ${placesLeft === 1 ? "place" : "places"} left.`
      }
      dismissible={!pending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={pending || selected.length === 0}>
            {pending && <Spinner label="Registering scouts" />}
            {pending
              ? "Registering..."
              : selected.length === 0
                ? "Register"
                : `Register ${selected.length} ${selected.length === 1 ? "scout" : "scouts"}`}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <Callout tone="error">{error}</Callout>}

        {placesLeft === 0 ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
              <UserRoundPlus className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <p className="mt-3 text-[13px] font-medium text-ink">The camp is full</p>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              Raise the maximum number of participants to take anyone else.
            </p>
          </div>
        ) : pool.length === 0 && !showEveryone && others.length > 0 ? (
          <div className="py-6 text-center">
            <p className="text-[13px] font-medium text-ink">
              Everyone from the invited patrols is registered
            </p>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              Tick the box below to offer the rest of the troop.
            </p>
          </div>
        ) : pool.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[13px] font-medium text-ink">Nobody left to register</p>
            <p className="mt-1 text-[12.5px] text-ink-secondary">
              Every active scout is already signed up.
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
                placeholder="Search by name or patrol..."
                aria-label="Search scouts"
                className="pl-9 [&::-webkit-search-cancel-button]:appearance-none"
                disabled={pending}
              />
            </div>

            {atCapacity && (
              <p className="text-[12px] text-ink-muted">
                That fills the camp. Untick somebody to choose a different scout.
              </p>
            )}

            <ul className="scrollbar-slim max-h-72 space-y-1 overflow-y-auto">
              {matches.length === 0 && (
                <li className="px-2 py-6 text-center text-[12.5px] text-ink-muted">
                  Nobody matches &ldquo;{term.trim()}&rdquo;.
                </li>
              )}

              {matches.map((scout) => {
                const checked = selected.includes(scout.id);
                const blocked = !checked && atCapacity;

                return (
                  <li key={scout.id}>
                    <label
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                        checked
                          ? "border-brand-border bg-brand-soft"
                          : "border-line hover:bg-surface-hover",
                        blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(scout.id)}
                        disabled={pending || blocked}
                        className="size-4 shrink-0 accent-brand-solid"
                      />
                      <Avatar name={scout.name} src={scout.avatar} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {scout.name}
                        </span>
                        <span className="block truncate text-[11.5px] text-ink-muted">
                          {scout.patrolName ? `${scout.patrolName} Patrol` : "No patrol"}
                        </span>
                      </span>
                      {!invitedIds.has(scout.id) && (
                        <Badge tone="neutral" className="shrink-0">
                          Not invited
                        </Badge>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {others.length > 0 && placesLeft > 0 && (
          <label className="flex cursor-pointer items-center gap-2.5 border-t border-line pt-3 text-[12.5px] text-ink-secondary">
            <input
              type="checkbox"
              checked={showEveryone}
              onChange={(event) => setShowEveryone(event.target.checked)}
              disabled={pending}
              className="size-4 shrink-0 accent-brand-solid"
            />
            Also show the {others.length} scouts outside the invited patrols
          </label>
        )}
      </div>
    </Dialog>
  );
}
