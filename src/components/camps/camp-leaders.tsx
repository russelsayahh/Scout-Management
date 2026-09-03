"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ShieldCheck, UsersRound } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { roleLabels, type Role } from "@/lib/auth/types";
import { setLeadersAction } from "@/lib/camps/actions";
import { cn } from "@/lib/utils";

/**
 * The leaders responsible for a camp.
 *
 * Managed here rather than only in the edit form, because who is running a camp
 * changes more often than its dates do - and usually while you are looking at
 * the roster rather than editing the record.
 */

export interface CampLeaderRow {
  id: string;
  name: string;
  role: Role;
  email: string;
}

export function CampLeaders({
  campId,
  campName,
  leaders,
  everyone,
  canManage,
  fixed,
}: {
  campId: string;
  campName: string;
  leaders: CampLeaderRow[];
  /** Every account that could take responsibility. */
  everyone: { id: string; name: string; role: Role }[];
  canManage: boolean;
  /** True once the camp is finished, when its record no longer changes. */
  fixed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<string[]>(leaders.map((leader) => leader.id));

  const canChange = canManage && !fixed;

  function toggle(id: string) {
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((entry) => entry !== id) : [...previous, id],
    );
  }

  function close() {
    setError(undefined);
    setSelected(leaders.map((leader) => leader.id));
    setOpen(false);
  }

  function save() {
    setError(undefined);
    startTransition(async () => {
      const result = await setLeadersAction(campId, selected);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-brand-text" strokeWidth={1.9} aria-hidden />
          <CardTitle>
            Responsible leaders
            <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
              {leaders.length}
            </span>
          </CardTitle>
        </div>

        {canChange && (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Manage
          </Button>
        )}
      </CardHeader>

      <CardContent className={leaders.length === 0 ? "p-0" : undefined}>
        {leaders.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nobody assigned"
            description="A camp needs at least one leader taking responsibility for it."
            action={
              canChange ? (
                <Button variant="secondary" onClick={() => setOpen(true)}>
                  Assign a leader
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="space-y-3">
            {leaders.map((leader) => (
              <li key={leader.id} className="flex items-center gap-3">
                <Avatar name={leader.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-ink">{leader.name}</p>
                  <p className="truncate text-[11.5px] text-ink-muted">
                    {roleLabels[leader.role]} · {leader.email}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={open}
        onClose={close}
        title={`Leaders for ${campName}`}
        description="Everyone with an account can be given responsibility for a camp. At least one is required."
        dismissible={!pending}
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending || selected.length === 0}>
              {pending && <Spinner label="Saving leaders" />}
              {pending ? "Saving..." : "Save leaders"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {error && <Callout tone="error">{error}</Callout>}

          {selected.length === 0 && (
            <Callout tone="warning">
              Choose at least one leader before saving.
            </Callout>
          )}

          <ul className="space-y-1">
            {everyone.map((person) => {
              const checked = selected.includes(person.id);

              return (
                <li key={person.id}>
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
                      onChange={() => toggle(person.id)}
                      disabled={pending}
                      className="size-4 shrink-0 accent-brand-solid"
                    />
                    <Avatar name={person.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {person.name}
                      </span>
                      <span className="block truncate text-[11.5px] text-ink-muted">
                        {roleLabels[person.role]}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </Dialog>
    </Card>
  );
}
