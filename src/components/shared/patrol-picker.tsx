"use client";

import { Users } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PatrolChoice {
  id: string;
  name: string;
  /** Active scouts currently in the patrol. */
  memberCount: number;
}

/**
 * Picks the patrols taking part, for an activity or a camp.
 *
 * Ticking nothing means the whole troop, which is the common case, so it is the
 * default state rather than a separate switch. The running head count comes
 * from the register, so a leader can see straight away whether the activity
 * fits inside its capacity.
 */
export function PatrolPicker({
  patrols,
  selected,
  onChange,
  disabled = false,
  error,
  subject = "activity",
}: {
  patrols: PatrolChoice[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
  /** What is being planned, so the empty state reads naturally. */
  subject?: string;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[13px] font-medium text-ink">Participating patrols</legend>
        <span className="text-[11.5px] text-ink-muted">
          {selected.length === 0 ? "Whole troop" : `${selected.length} selected`}
        </span>
      </div>

      {patrols.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-[12.5px] text-ink-secondary">
          There are no active patrols yet, so this {subject} is for the whole troop.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {patrols.map((patrol) => {
            const checked = selected.includes(patrol.id);

            return (
              <label
                key={patrol.id}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
                  checked
                    ? "border-brand-border bg-brand-soft"
                    : "border-line hover:bg-surface-hover",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  name="patrolIds"
                  value={patrol.id}
                  checked={checked}
                  onChange={() => toggle(patrol.id)}
                  className="size-4 shrink-0 accent-brand-solid"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  {patrol.name}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] text-ink-muted tabular-nums">
                  <Users className="size-3" strokeWidth={2} aria-hidden />
                  {patrol.memberCount}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {error ? (
        <p className="text-[12px] text-negative" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-[12px] text-ink-muted">
          Leave every box unticked to invite the whole troop.
        </p>
      )}
    </fieldset>
  );
}
