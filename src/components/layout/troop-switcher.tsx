"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { setSelectedTroopAction } from "@/lib/troops/actions";

/**
 * Lets an administrator switch which troop's records every scoped list and
 * count on the page reflects. Auto-submits on change, the same interaction as
 * the role `<select>` on the user accounts page - there is no separate save
 * step because there is nothing to lose by picking the wrong troop.
 */
export function TroopSwitcher({
  troops,
  selected,
}: {
  troops: { id: string; name: string }[];
  /** `"all"` or one of the six troop ids. */
  selected: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const troopId = event.target.value;
    setError(undefined);
    startTransition(async () => {
      const result = await setSelectedTroopAction(troopId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Select
          defaultValue={selected}
          onChange={handleChange}
          disabled={pending}
          aria-label="Viewing troop"
          className="h-9 text-[12.5px]"
        >
          <option value="all">All troops</option>
          {troops.map((troop) => (
            <option key={troop.id} value={troop.id}>
              {troop.name}
            </option>
          ))}
        </Select>
        {pending && <Spinner className="size-3.5 shrink-0 text-ink-muted" label="Switching troop" />}
      </div>
      {error && (
        <p className="text-[11px] text-negative" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
