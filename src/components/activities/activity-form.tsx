"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Send, TriangleAlert, Users } from "lucide-react";

import { ActivityStatusBadge } from "@/components/activities/activity-status-badge";

import { PatrolPicker, type PatrolChoice } from "@/components/shared/patrol-picker";
import { Button, buttonStyles } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectField, TextField, TextareaField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { createActivityAction, updateActivityAction } from "@/lib/activities/actions";
import {
  ACTIVITY_TYPES,
  activityStatusDescriptions,
  activityTypeDescriptions,
  activityTypeLabels,
  type Activity,
  type ActivityType,
} from "@/lib/activities/types";
import {
  CAPACITY_MAX,
  validateActivityDescription,
  validateActivityLocation,
  validateActivityName,
  validateEndTime,
} from "@/lib/activities/validation";
import { roleLabels, type Role } from "@/lib/auth/types";
import { initialFormState } from "@/lib/form-state";
import { cn } from "@/lib/utils";
import { validateTime } from "@/lib/validation";

/**
 * The create, duplicate and edit form.
 *
 * Status is not a field here. Creating offers "Save as draft" or "Publish",
 * and every later change of state - publish, complete, cancel, reinstate - is
 * its own decision on the activity's own page. That keeps a routine edit to the
 * location from quietly announcing something that was not ready.
 */

export interface LeaderChoice {
  id: string;
  name: string;
  role: Role;
}

type ActivityFormProps = {
  patrols: PatrolChoice[];
  leaders: LeaderChoice[];
  /** Active scouts on the register, for the whole-troop head count. */
  troopSize: number;
} & (
  | { mode: "create"; activity?: undefined }
  | { mode: "duplicate"; activity: Activity }
  | { mode: "edit"; activity: Activity }
);

/** A rejected submission returns the ticked patrols as one comma-joined value. */
function parsePatrolIds(value: string | undefined): string[] | null {
  if (value === undefined) return null;
  return value ? value.split(",").filter(Boolean) : [];
}

export function ActivityForm({
  mode,
  activity,
  patrols,
  leaders,
  troopSize,
}: ActivityFormProps) {
  const isEdit = mode === "edit";
  const action = isEdit ? updateActivityAction : createActivityAction;

  const [state, formAction, pending] = useActionState(action, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const initial = (field: string, fallback: string) => state.values?.[field] ?? fallback;

  const [startTime, setStartTime] = useState(initial("startTime", activity?.startTime ?? "19:00"));
  const [type, setType] = useState<ActivityType>(
    (state.values?.type as ActivityType) ?? activity?.type ?? "meeting",
  );
  const [capacity, setCapacity] = useState(
    initial("capacity", activity?.capacity != null ? String(activity.capacity) : ""),
  );
  const [selectedPatrols, setSelectedPatrols] = useState<string[]>(
    parsePatrolIds(state.values?.patrolIds) ?? activity?.patrolIds ?? [],
  );

  // The head count is real: it comes from the register, not from sign-ups.
  const expected =
    selectedPatrols.length === 0
      ? troopSize
      : patrols
          .filter((patrol) => selectedPatrols.includes(patrol.id))
          .reduce((sum, patrol) => sum + patrol.memberCount, 0);

  const capacityNumber = capacity.trim() ? Number(capacity.trim()) : null;
  const overCapacity =
    capacityNumber !== null && Number.isFinite(capacityNumber) && expected > capacityNumber;

  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : undefined;

  const defaultName =
    mode === "duplicate" && activity ? `${activity.name} (copy)` : (activity?.name ?? "");

  return (
    <form action={formAction} noValidate className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={activity.id} />}

      {formError && <Callout tone="error">{formError}</Callout>}
      {state.status === "error" && Object.keys(errors).length > 0 && (
        <Callout tone="error">{state.message}</Callout>
      )}

      {mode === "duplicate" && (
        <Callout tone="info" title="Starting from an existing activity">
          Everything has been copied across, including the date. Change what needs changing -
          the original is untouched.
        </Callout>
      )}

      {/* ------------------------------- What ------------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>What is happening</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              The name and description are what the group sees once it is published.
            </p>
          </div>
          {isEdit && <ActivityStatusBadge status={activity.status} />}
        </CardHeader>

        <CardContent className="space-y-4">
          <TextField
            label="Activity name"
            name="name"
            autoComplete="off"
            placeholder="e.g. Navigation and Map Skills"
            defaultValue={initial("name", defaultName)}
            onChange={() => clearField("name")}
            onBlur={(event) => setFieldError("name", validateActivityName(event.target.value))}
            error={errors.name}
            disabled={pending}
          />

          <TextareaField
            label="Description"
            labelAside="Optional"
            name="description"
            rows={3}
            placeholder="What the session covers, what to bring, anything parents need to know."
            defaultValue={initial("description", activity?.description ?? "")}
            onChange={() => clearField("description")}
            onBlur={(event) =>
              setFieldError("description", validateActivityDescription(event.target.value))
            }
            error={errors.description}
            disabled={pending}
          />

          <SelectField
            label="Activity type"
            name="type"
            value={type}
            onChange={(event) => {
              setType(event.target.value as ActivityType);
              clearField("type");
            }}
            error={errors.type}
            hint={activityTypeDescriptions[type]}
            disabled={pending}
          >
            {ACTIVITY_TYPES.map((option) => (
              <option key={option} value={option}>
                {activityTypeLabels[option]}
              </option>
            ))}
          </SelectField>
        </CardContent>
      </Card>

      {/* ------------------------------- When ------------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>When and where</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Times are on the 24-hour clock, as they appear on the programme.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField
              label="Date"
              name="date"
              type="date"
              defaultValue={initial("date", activity?.date ?? "")}
              onChange={() => clearField("date")}
              error={errors.date}
              disabled={pending}
            />

            <TextField
              label="Start time"
              name="startTime"
              type="time"
              value={startTime}
              onChange={(event) => {
                setStartTime(event.target.value);
                clearField("startTime");
                clearField("endTime");
              }}
              onBlur={(event) =>
                setFieldError("startTime", validateTime(event.target.value, "a start time"))
              }
              error={errors.startTime}
              disabled={pending}
            />

            <TextField
              label="End time"
              name="endTime"
              type="time"
              defaultValue={initial("endTime", activity?.endTime ?? "21:00")}
              onChange={() => clearField("endTime")}
              onBlur={(event) =>
                setFieldError("endTime", validateEndTime(startTime, event.target.value))
              }
              error={errors.endTime}
              disabled={pending}
            />
          </div>

          <TextField
            label="Location"
            name="location"
            autoComplete="off"
            placeholder="e.g. Riverside Scout Hut"
            defaultValue={initial("location", activity?.location ?? "")}
            onChange={() => clearField("location")}
            onBlur={(event) =>
              setFieldError("location", validateActivityLocation(event.target.value))
            }
            error={errors.location}
            disabled={pending}
          />
        </CardContent>
      </Card>

      {/* -------------------------------- Who ------------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Who it is for</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              One leader is responsible for running it.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <SelectField
            label="Responsible leader"
            name="leaderId"
            defaultValue={initial("leaderId", activity?.leaderId ?? "")}
            onChange={() => clearField("leaderId")}
            error={errors.leaderId}
            hint="Leaders are the people with an account on the system."
            disabled={pending}
          >
            <option value="">Choose a leader...</option>
            {leaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.name} - {roleLabels[leader.role]}
              </option>
            ))}
          </SelectField>

          <PatrolPicker
            patrols={patrols}
            selected={selectedPatrols}
            onChange={setSelectedPatrols}
            disabled={pending}
          />

          <TextField
            label="Maximum capacity"
            labelAside="Optional"
            name="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={CAPACITY_MAX}
            placeholder="Leave blank for no limit"
            value={capacity}
            onChange={(event) => {
              setCapacity(event.target.value);
              clearField("capacity");
            }}
            error={errors.capacity}
            hint="The most places available, if the activity is capped."
            disabled={pending}
          />

          {/* Real figures from the register, not a sign-up count. */}
          <div
            className={cn(
              "flex gap-2.5 rounded-lg border px-3 py-2.5",
              overCapacity
                ? "border-status-warning/40 bg-status-warning/10"
                : "border-line bg-surface-muted",
            )}
            role={overCapacity ? "alert" : undefined}
          >
            {overCapacity ? (
              <TriangleAlert
                className="mt-px size-4 shrink-0 text-status-warning"
                strokeWidth={2}
                aria-hidden
              />
            ) : (
              <Users className="mt-px size-4 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
            )}
            <p className="text-[12.5px] leading-snug text-ink-secondary">
              <span className="font-medium text-ink tabular-nums">{expected}</span>{" "}
              {expected === 1 ? "active scout is" : "active scouts are"}{" "}
              {selectedPatrols.length === 0 ? "on the register" : "in the chosen patrols"}
              {capacityNumber !== null && Number.isFinite(capacityNumber)
                ? `, against ${capacityNumber} ${capacityNumber === 1 ? "place" : "places"}.`
                : "."}
              {overCapacity && " More scouts are eligible than there are places."}
            </p>
          </div>
        </CardContent>
      </Card>

      {isEdit && (
        <p className="text-[12px] text-ink-muted">
          {activityStatusDescriptions[activity.status]} Publishing, completing and cancelling are
          done from the activity&rsquo;s own page.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={isEdit ? `/activities/${activity.id}` : "/activities"}
          className={buttonStyles({ variant: "secondary" })}
        >
          Cancel
        </Link>

        {isEdit ? (
          <Button type="submit" disabled={pending}>
            {pending && <Spinner label="Saving" />}
            {pending ? "Saving..." : "Save changes"}
          </Button>
        ) : (
          <>
            <Button
              type="submit"
              name="intent"
              value="draft"
              variant="secondary"
              disabled={pending}
            >
              Save as draft
            </Button>
            <Button type="submit" name="intent" value="publish" disabled={pending}>
              {pending ? <Spinner label="Saving" /> : <Send className="size-4" strokeWidth={2} aria-hidden />}
              {pending ? "Saving..." : "Publish activity"}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
