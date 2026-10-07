"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { TriangleAlert, Users } from "lucide-react";

import { CampStatusBadge } from "@/components/camps/camp-status-badge";
import { LeaderPicker, type LeaderChoice } from "@/components/shared/leader-picker";
import { PatrolPicker, type PatrolChoice as PickerPatrolChoice } from "@/components/shared/patrol-picker";
import { Button, buttonStyles } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectField, TextField, TextareaField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { createCampAction, updateCampAction } from "@/lib/camps/actions";
import { campStatusDescriptions, formatCampLength, type Camp } from "@/lib/camps/types";
import {
  MAX_PARTICIPANTS_LIMIT,
  validateCampDescription,
  validateCampLocation,
  validateCampName,
  validateDeadline,
  validateEndDate,
  validateMaxParticipants,
  validateStartDate,
} from "@/lib/camps/validation";
import { initialFormState } from "@/lib/form-state";
import type { Troop } from "@/lib/troops/types";
import { cn } from "@/lib/utils";

/**
 * The create and edit form.
 *
 * Status and the roster are not fields here. A new camp always starts in
 * planning, and every later move - opening registration, closing it, running
 * it, cancelling it - is its own decision on the camp's own page. That keeps a
 * correction to the location from quietly announcing something.
 */

/** A patrol choice with its troop, so the form can filter by the chosen troop. */
interface PatrolChoice extends PickerPatrolChoice {
  troopId: string;
}

type CampFormProps = {
  /** Patrols the caller may pick from - already scoped to their troop(s). */
  patrols: PatrolChoice[];
  leaders: LeaderChoice[];
  /** Troops the caller may place this camp in - a leader sees only their own. */
  troops: Troop[];
  /** Active scouts on the register, per troop id, for the whole-troop head count. */
  troopSizes: Record<string, number>;
} & (
  | { mode: "create"; camp?: undefined; registered?: undefined }
  | { mode: "edit"; camp: Camp; registered: number }
);

/** A rejected submission returns ticked boxes as one comma-joined value. */
function parseIds(value: string | undefined): string[] | null {
  if (value === undefined) return null;
  return value ? value.split(",").filter(Boolean) : [];
}

export function CampForm({
  mode,
  camp,
  registered,
  patrols,
  leaders,
  troops,
  troopSizes,
}: CampFormProps) {
  const isEdit = mode === "edit";
  const action = isEdit ? updateCampAction : createCampAction;

  const [state, formAction, pending] = useActionState(action, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const initial = (field: string, fallback: string) => state.values?.[field] ?? fallback;

  const [startDate, setStartDate] = useState(initial("startDate", camp?.startDate ?? ""));
  const [endDate, setEndDate] = useState(initial("endDate", camp?.endDate ?? ""));
  const [maxParticipants, setMaxParticipants] = useState(
    initial("maxParticipants", camp ? String(camp.maxParticipants) : ""),
  );
  const [troopId, setTroopId] = useState(initial("troopId", camp?.troopId ?? troops[0]?.id ?? ""));
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>(
    parseIds(state.values?.leaderIds) ?? camp?.leaderIds ?? [],
  );
  const [selectedPatrols, setSelectedPatrols] = useState<string[]>(
    parseIds(state.values?.patrolIds) ?? camp?.patrolIds ?? [],
  );

  // A camp's patrols have to belong to its troop, so switching the troop
  // clears any patrol that no longer applies.
  const patrolsInTroop = patrols.filter((patrol) => patrol.troopId === troopId);
  const troopLocked = troops.length <= 1;

  // Real numbers from the register: how many scouts the camp is open to.
  const invited =
    selectedPatrols.length === 0
      ? (troopSizes[troopId] ?? 0)
      : patrolsInTroop
          .filter((patrol) => selectedPatrols.includes(patrol.id))
          .reduce((sum, patrol) => sum + patrol.memberCount, 0);

  const maxNumber = maxParticipants.trim() ? Number(maxParticipants.trim()) : null;
  const validMax = maxNumber !== null && Number.isFinite(maxNumber);
  // Only a problem when it would leave scouts already signed up without a place.
  const belowRegistered = validMax && registered !== undefined && maxNumber < registered;

  const length =
    startDate && endDate ? formatCampLength({ startDate, endDate }) : null;

  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {isEdit && <input type="hidden" name="id" value={camp.id} />}

      {formError && <Callout tone="error">{formError}</Callout>}
      {state.status === "error" && Object.keys(errors).length > 0 && (
        <Callout tone="error">{state.message}</Callout>
      )}

      {/* ------------------------------- What -------------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>What the camp is</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              The name and description are what the group sees once registration opens.
            </p>
          </div>
          {isEdit && <CampStatusBadge status={camp.status} />}
        </CardHeader>

        <CardContent className="space-y-4">
          <TextField
            label="Camp name"
            name="name"
            autoComplete="off"
            placeholder="e.g. Autumn Survival Camp"
            defaultValue={initial("name", camp?.name ?? "")}
            onChange={() => clearField("name")}
            onBlur={(event) => setFieldError("name", validateCampName(event.target.value))}
            error={errors.name}
            disabled={pending}
          />

          <TextareaField
            label="Description"
            labelAside="Optional"
            name="description"
            rows={3}
            placeholder="What the camp involves, what to bring, and anything parents need to know."
            defaultValue={initial("description", camp?.description ?? "")}
            onChange={() => clearField("description")}
            onBlur={(event) =>
              setFieldError("description", validateCampDescription(event.target.value))
            }
            error={errors.description}
            disabled={pending}
          />

          <TextField
            label="Location"
            name="location"
            autoComplete="off"
            placeholder="e.g. Gilwell Park"
            defaultValue={initial("location", camp?.location ?? "")}
            onChange={() => clearField("location")}
            onBlur={(event) =>
              setFieldError("location", validateCampLocation(event.target.value))
            }
            error={errors.location}
            disabled={pending}
          />
        </CardContent>
      </Card>

      {/* ------------------------------- When -------------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Dates</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              A one-day camp has the same start and end date.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField
              label="Start date"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                clearField("startDate");
                clearField("endDate");
                clearField("registrationDeadline");
              }}
              onBlur={(event) =>
                setFieldError("startDate", validateStartDate(event.target.value))
              }
              error={errors.startDate}
              disabled={pending}
            />

            <TextField
              label="End date"
              name="endDate"
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                clearField("endDate");
              }}
              onBlur={(event) =>
                setFieldError("endDate", validateEndDate(startDate, event.target.value))
              }
              error={errors.endDate}
              disabled={pending}
            />

            <TextField
              label="Registration deadline"
              name="registrationDeadline"
              type="date"
              defaultValue={initial(
                "registrationDeadline",
                camp?.registrationDeadline ?? "",
              )}
              onChange={() => clearField("registrationDeadline")}
              onBlur={(event) =>
                setFieldError(
                  "registrationDeadline",
                  validateDeadline(startDate, event.target.value),
                )
              }
              error={errors.registrationDeadline}
              hint="On or before the first day."
              disabled={pending}
            />
          </div>

          {length && (
            <p className="text-[12.5px] text-ink-secondary">
              That is <span className="font-medium text-ink">{length}</span>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* -------------------------------- Who -------------------------------- */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Who is going</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Scouts are registered one at a time from the camp&rsquo;s own page once it exists.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <LeaderPicker
            leaders={leaders}
            selected={selectedLeaders}
            onChange={setSelectedLeaders}
            disabled={pending}
            error={errors.leaderIds}
            hint="At least one leader has to take responsibility for the camp."
          />

          <div>
            {troopLocked && <input type="hidden" name="troopId" value={troopId} />}
            <SelectField
              label="Troop"
              // A disabled select submits nothing, so the locked case is
              // carried by the hidden input above instead.
              name={troopLocked ? undefined : "troopId"}
              value={troopId}
              onChange={(event) => {
                setTroopId(event.target.value);
                clearField("troopId");
                // Patrols from the previous troop no longer apply.
                setSelectedPatrols((current) =>
                  current.filter((id) =>
                    patrols.some((patrol) => patrol.id === id && patrol.troopId === event.target.value),
                  ),
                );
              }}
              error={errors.troopId}
              hint={troopLocked ? "Set by your own troop assignment." : "Which section this camp is for."}
              disabled={pending || troopLocked}
            >
              {troops.map((troop) => (
                <option key={troop.id} value={troop.id}>
                  {troop.name}
                </option>
              ))}
            </SelectField>
          </div>

          <PatrolPicker
            patrols={patrolsInTroop}
            selected={selectedPatrols}
            onChange={setSelectedPatrols}
            disabled={pending}
            subject="camp"
          />

          <TextField
            label="Maximum participants"
            name="maxParticipants"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_PARTICIPANTS_LIMIT}
            placeholder="e.g. 40"
            value={maxParticipants}
            onChange={(event) => {
              setMaxParticipants(event.target.value);
              clearField("maxParticipants");
            }}
            onBlur={(event) =>
              setFieldError("maxParticipants", validateMaxParticipants(event.target.value))
            }
            error={errors.maxParticipants}
            hint="Scout places. Leaders are counted separately."
            disabled={pending}
          />

          <div
            className={cn(
              "flex gap-2.5 rounded-lg border px-3 py-2.5",
              belowRegistered
                ? "border-status-warning/40 bg-status-warning/10"
                : "border-line bg-surface-muted",
            )}
            role={belowRegistered ? "alert" : undefined}
          >
            {belowRegistered ? (
              <TriangleAlert
                className="mt-px size-4 shrink-0 text-status-warning"
                strokeWidth={2}
                aria-hidden
              />
            ) : (
              <Users className="mt-px size-4 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
            )}
            <p className="text-[12.5px] leading-snug text-ink-secondary">
              <span className="font-medium text-ink tabular-nums">{invited}</span>{" "}
              {invited === 1 ? "active scout is" : "active scouts are"}{" "}
              {selectedPatrols.length === 0 ? "on the register" : "in the invited patrols"}
              {validMax ? `, for ${maxNumber} ${maxNumber === 1 ? "place" : "places"}.` : "."}
              {belowRegistered && (
                <>
                  {" "}
                  {registered} are already registered, so the maximum cannot go below that.
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {isEdit && (
        <p className="text-[12px] text-ink-muted">
          {campStatusDescriptions[camp.status]} Opening and closing registration, running and
          cancelling are done from the camp&rsquo;s own page.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={isEdit ? `/camps/${camp.id}` : "/camps"}
          className={buttonStyles({ variant: "secondary" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner label="Saving" />}
          {pending ? "Saving..." : isEdit ? "Save changes" : "Create camp"}
        </Button>
      </div>
    </form>
  );
}
