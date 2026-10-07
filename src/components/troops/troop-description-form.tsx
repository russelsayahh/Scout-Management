"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { updateTroopDescriptionAction } from "@/lib/troops/actions";

/**
 * Inline description editor on a troop's own page. There is no separate edit
 * mode - the field is just always there for anyone with `troops.manage`, and
 * the save button only lights up once something has actually changed.
 */
export function TroopDescriptionForm({
  troopId,
  description,
}: {
  troopId: string;
  description: string;
}) {
  const [value, setValue] = useState(description);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);

  function save() {
    setError(undefined);
    startTransition(async () => {
      const result = await updateTroopDescriptionAction(troopId, value);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSaved(true);
    });
  }

  const dirty = value.trim() !== description.trim();

  return (
    <div className="space-y-2">
      <TextareaField
        label="Description"
        rows={3}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setSaved(false);
        }}
        disabled={pending}
        hint="Shown on the troop's overview card and its own page."
      />

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending || !dirty}>
          {pending && <Spinner label="Saving" />}
          {pending ? "Saving..." : "Save description"}
        </Button>
        {saved && !dirty && <span className="text-[12px] text-positive">Saved.</span>}
        {error && (
          <span className="text-[12px] text-negative" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
