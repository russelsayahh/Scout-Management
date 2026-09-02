"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectField, TextField, TextareaField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { initialFormState } from "@/lib/form-state";
import { createPatrolAction, updatePatrolAction } from "@/lib/patrols/actions";
import {
  PATROL_STATUSES,
  patrolStatusDescriptions,
  patrolStatusLabels,
  type Patrol,
  type PatrolStatus,
} from "@/lib/patrols/types";
import {
  validatePatrolDescription,
  validatePatrolName,
} from "@/lib/patrols/validation";

/**
 * The create and edit form.
 *
 * The patrol leader is not set here - a leader has to be one of the patrol's
 * own members, so the appointment lives on the patrol page next to the member
 * list where that choice makes sense.
 */
type PatrolFormProps =
  | { mode: "create"; patrol?: undefined }
  | { mode: "edit"; patrol: Patrol };

export function PatrolForm({ mode, patrol }: PatrolFormProps) {
  const action = mode === "create" ? createPatrolAction : updatePatrolAction;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const [status, setStatus] = useState<PatrolStatus>(
    (state.values?.status as PatrolStatus) ?? patrol?.status ?? "forming",
  );

  const initial = (field: string, fallback: string) => state.values?.[field] ?? fallback;

  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {mode === "edit" && <input type="hidden" name="id" value={patrol.id} />}

      {formError && <Callout tone="error">{formError}</Callout>}
      {state.status === "error" && Object.keys(errors).length > 0 && (
        <Callout tone="error">{state.message}</Callout>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Patrol details</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Patrols are traditionally named after birds or animals.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <TextField
            label="Patrol name"
            name="name"
            autoComplete="off"
            placeholder="e.g. Kestrel"
            defaultValue={initial("name", patrol?.name ?? "")}
            onChange={() => clearField("name")}
            onBlur={(event) => setFieldError("name", validatePatrolName(event.target.value))}
            error={errors.name}
            hint="Must be different from every other patrol."
            disabled={pending}
          />

          <TextareaField
            label="Description"
            labelAside="Optional"
            name="description"
            rows={3}
            placeholder="What this patrol is known for, or what it is working towards."
            defaultValue={initial("description", patrol?.description ?? "")}
            onChange={() => clearField("description")}
            onBlur={(event) =>
              setFieldError("description", validatePatrolDescription(event.target.value))
            }
            error={errors.description}
            disabled={pending}
          />

          <SelectField
            label="Status"
            name="status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as PatrolStatus);
              clearField("status");
            }}
            error={errors.status}
            hint={patrolStatusDescriptions[status]}
            disabled={pending}
          >
            {PATROL_STATUSES.map((option) => (
              <option key={option} value={option}>
                {patrolStatusLabels[option]}
              </option>
            ))}
          </SelectField>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={mode === "edit" ? `/patrols/${patrol.id}` : "/patrols"}
          className={buttonStyles({ variant: "secondary" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner label="Saving" />}
          {pending ? "Saving..." : mode === "create" ? "Create patrol" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
