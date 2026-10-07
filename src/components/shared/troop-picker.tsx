"use client";

import { cn } from "@/lib/utils";

export interface TroopChoice {
  id: string;
  name: string;
}

/**
 * Picks the troops a leader is assigned to.
 *
 * `disabled` covers the locked case, where the caller only has one troop
 * available - a disabled checkbox submits nothing, so the selection is
 * carried by hidden inputs instead, the same trick `scout-form` uses for a
 * locked select.
 */
export function TroopPicker({
  troops,
  selected,
  onChange,
  disabled = false,
  error,
}: {
  troops: TroopChoice[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((entry) => entry !== id) : [...selected, id]);
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-[13px] font-medium text-ink">Troops</legend>
        <span className="text-[11.5px] text-ink-muted">
          {selected.length === 0 ? "None selected" : `${selected.length} selected`}
        </span>
      </div>

      {troops.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-[12.5px] text-ink-secondary">
          There are no troops available to assign.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {troops.map((troop) => {
            const checked = selected.includes(troop.id);

            return (
              <label
                key={troop.id}
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
                  name={disabled ? undefined : "troopIds"}
                  value={troop.id}
                  checked={checked}
                  onChange={() => toggle(troop.id)}
                  disabled={disabled}
                  className="size-4 shrink-0 accent-brand-solid"
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                  {troop.name}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {disabled && selected.map((id) => <input key={id} type="hidden" name="troopIds" value={id} />)}

      {error ? (
        <p className="text-[12px] text-negative" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-[12px] text-ink-muted">
          Which sections this leader can access. Their patrol responsibility below is limited to
          these troops.
        </p>
      )}
    </fieldset>
  );
}
