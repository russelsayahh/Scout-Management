"use client";

import { Avatar } from "@/components/ui/avatar";
import { roleLabels, type Role } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export interface LeaderChoice {
  id: string;
  name: string;
  role: Role;
}

/**
 * Picks the leaders responsible for something.
 *
 * A checkbox group rather than a multi-select, because a camp usually has two
 * or three leaders and picking them should not need a keyboard modifier.
 */
export function LeaderPicker({
  leaders,
  selected,
  onChange,
  disabled = false,
  error,
  hint,
}: {
  leaders: LeaderChoice[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
  hint?: string;
}) {
  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id],
    );
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[13px] font-medium text-ink">Responsible leaders</legend>
        <span className="text-[11.5px] text-ink-muted">
          {selected.length === 0
            ? "None chosen"
            : `${selected.length} ${selected.length === 1 ? "leader" : "leaders"}`}
        </span>
      </div>

      {leaders.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-[12.5px] text-ink-secondary">
          There are no accounts to choose from yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {leaders.map((leader) => {
            const checked = selected.includes(leader.id);

            return (
              <label
                key={leader.id}
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
                  name="leaderIds"
                  value={leader.id}
                  checked={checked}
                  onChange={() => toggle(leader.id)}
                  className="size-4 shrink-0 accent-brand-solid"
                />
                <Avatar name={leader.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {leader.name}
                  </span>
                  <span className="block truncate text-[11px] text-ink-muted">
                    {roleLabels[leader.role]}
                  </span>
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
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </fieldset>
  );
}
