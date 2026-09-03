"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { PatrolPicker, type PatrolChoice } from "@/components/shared/patrol-picker";
import { AvatarField } from "@/components/ui/avatar-field";
import { Button, buttonStyles } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { validateLeaderName, validatePosition } from "@/lib/leaders/validation";
import { updateLeaderAction } from "@/lib/leaders/actions";
import { initialFormState } from "@/lib/form-state";
import type { SessionUser } from "@/lib/auth/types";
import { validateEmail, validatePhone } from "@/lib/validation";

/** A rejected submission returns the ticked patrols as one comma-joined value. */
function parsePatrolIds(value: string | undefined): string[] | null {
  if (value === undefined) return null;
  return value ? value.split(",").filter(Boolean) : [];
}

/**
 * The leader profile edit form.
 *
 * Role is deliberately not here - it has its own guarded action (self-change
 * and last-administrator rules) and lives on the profile page next to the
 * rest of what a role means, rather than being one field among many here.
 */
export function LeaderForm({
  leader,
  patrols,
  assignedPatrolIds,
}: {
  leader: SessionUser;
  /** Patrols this leader may be assigned to, archived ones excluded. */
  patrols: PatrolChoice[];
  assignedPatrolIds: string[];
}) {
  const [state, formAction, pending] = useActionState(updateLeaderAction, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const initial = (field: string, fallback: string) => state.values?.[field] ?? fallback;

  const [name, setName] = useState(initial("name", leader.name));
  const [selectedPatrols, setSelectedPatrols] = useState<string[]>(
    parsePatrolIds(state.values?.patrolIds) ?? assignedPatrolIds,
  );

  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="id" value={leader.id} />

      {formError && <Callout tone="error">{formError}</Callout>}
      {state.status === "error" && Object.keys(errors).length > 0 && (
        <Callout tone="error">{state.message}</Callout>
      )}

      {/* Identity */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Leader details</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Name, picture and position within the group.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AvatarField
            name="avatar"
            initialSrc={leader.avatar}
            displayName={name || leader.name}
            label="Profile picture"
            description="Optional. Cropped to a square and resized to 256px."
            disabled={pending}
            error={errors.avatar}
          />

          <TextField
            label="Full name"
            name="name"
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearField("name");
            }}
            onBlur={(event) => setFieldError("name", validateLeaderName(event.target.value))}
            error={errors.name}
            disabled={pending}
          />

          <TextField
            label="Position"
            labelAside="Optional"
            name="position"
            autoComplete="off"
            placeholder="e.g. Group Scout Leader, Quartermaster"
            defaultValue={initial("position", leader.position)}
            onChange={() => clearField("position")}
            onBlur={(event) => setFieldError("position", validatePosition(event.target.value))}
            error={errors.position}
            hint="Their title within the group. Separate from their role, which controls what they can access."
            disabled={pending}
          />
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Email address"
              name="email"
              type="email"
              autoComplete="off"
              defaultValue={initial("email", leader.email)}
              onChange={() => clearField("email")}
              onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
              error={errors.email}
              disabled={pending}
            />

            <TextField
              label="Phone number"
              labelAside="Optional"
              name="phone"
              type="tel"
              autoComplete="off"
              placeholder="+44 7700 900000"
              defaultValue={initial("phone", leader.phone)}
              onChange={() => clearField("phone")}
              onBlur={(event) => setFieldError("phone", validatePhone(event.target.value))}
              error={errors.phone}
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignment */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Patrol responsibility</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Which patrols this leader is responsible for day to day.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <PatrolPicker
            patrols={patrols}
            selected={selectedPatrols}
            onChange={setSelectedPatrols}
            disabled={pending}
            error={errors.patrolIds}
            subject="leader"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href={`/leaders/${leader.id}`} className={buttonStyles({ variant: "secondary" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner label="Saving" />}
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
