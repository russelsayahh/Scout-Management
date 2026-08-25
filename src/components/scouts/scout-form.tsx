"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { AvatarField } from "@/components/ui/avatar-field";
import { Button, buttonStyles } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SelectField,
  TextField,
  TextareaField,
} from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { initialFormState } from "@/lib/form-state";
import { createScoutAction, updateScoutAction } from "@/lib/scouts/actions";
import {
  GENDERS,
  PATROLS,
  SCOUT_STATUSES,
  genderLabels,
  scoutFullName,
  scoutStatusDescriptions,
  scoutStatusLabels,
  type Scout,
  type ScoutStatus,
} from "@/lib/scouts/types";
import {
  validateAddress,
  validateDateOfBirth,
  validateEmergencyContactName,
  validateFirstName,
  validateJoinDate,
  validateLastName,
  validateMedicalNotes,
} from "@/lib/scouts/validation";
import {
  validateOptionalEmail,
  validatePhone,
  validateRequiredPhone,
} from "@/lib/validation";

/**
 * The add and edit form.
 *
 * One component covers both: `create` posts to `createScoutAction`, `edit`
 * carries a hidden id and posts to `updateScoutAction`. Both actions re-run the
 * same validators the fields use on blur, so the rules live in one place.
 */
export function ScoutForm({ mode, scout }: { mode: "create"; scout?: undefined } | { mode: "edit"; scout: Scout }) {
  const action = mode === "create" ? createScoutAction : updateScoutAction;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  // Controlled where a value feeds something else: the avatar initials, the
  // join-date cross-check, and the status hint.
  const [firstName, setFirstName] = useState(state.values?.firstName ?? scout?.firstName ?? "");
  const [lastName, setLastName] = useState(state.values?.lastName ?? scout?.lastName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    state.values?.dateOfBirth ?? scout?.dateOfBirth ?? "",
  );
  const [status, setStatus] = useState<ScoutStatus>(
    (state.values?.status as ScoutStatus) ?? scout?.status ?? "active",
  );

  const initial = (field: string, fallback: string) => state.values?.[field] ?? fallback;

  const displayName = `${firstName} ${lastName}`.trim();
  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {mode === "edit" && <input type="hidden" name="id" value={scout.id} />}

      {formError && <Callout tone="error">{formError}</Callout>}
      {state.status === "error" && Object.keys(errors).length > 0 && (
        <Callout tone="error">{state.message}</Callout>
      )}

      {/* Identity */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Scout details</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Name, picture and date of birth.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AvatarField
            name="avatar"
            initialSrc={scout?.avatar ?? null}
            displayName={displayName || "New scout"}
            label="Profile picture"
            description="Optional. Cropped to a square and resized to 256px."
            disabled={pending}
            error={errors.avatar}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="First name"
              name="firstName"
              autoComplete="off"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                clearField("firstName");
              }}
              onBlur={(event) => setFieldError("firstName", validateFirstName(event.target.value))}
              error={errors.firstName}
              disabled={pending}
            />

            <TextField
              label="Last name"
              name="lastName"
              autoComplete="off"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                clearField("lastName");
              }}
              onBlur={(event) => setFieldError("lastName", validateLastName(event.target.value))}
              error={errors.lastName}
              disabled={pending}
            />

            <TextField
              label="Date of birth"
              name="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(event) => {
                setDateOfBirth(event.target.value);
                clearField("dateOfBirth");
              }}
              onBlur={(event) =>
                setFieldError("dateOfBirth", validateDateOfBirth(event.target.value))
              }
              error={errors.dateOfBirth}
              disabled={pending}
            />

            <SelectField
              label="Gender"
              name="gender"
              defaultValue={initial("gender", scout?.gender ?? "prefer-not-to-say")}
              onChange={() => clearField("gender")}
              error={errors.gender}
              disabled={pending}
            >
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {genderLabels[gender]}
                </option>
              ))}
            </SelectField>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Contact</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              How to reach the scout directly. All optional.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Phone number"
              labelAside="Optional"
              name="phone"
              type="tel"
              autoComplete="off"
              placeholder="+44 7700 900000"
              defaultValue={initial("phone", scout?.phone ?? "")}
              onChange={() => clearField("phone")}
              onBlur={(event) => setFieldError("phone", validatePhone(event.target.value))}
              error={errors.phone}
              disabled={pending}
            />

            <TextField
              label="Email address"
              labelAside="Optional"
              name="email"
              type="email"
              autoComplete="off"
              defaultValue={initial("email", scout?.email ?? "")}
              onChange={() => clearField("email")}
              onBlur={(event) => setFieldError("email", validateOptionalEmail(event.target.value))}
              error={errors.email}
              disabled={pending}
            />
          </div>

          <TextareaField
            label="Address"
            labelAside="Optional"
            name="address"
            rows={2}
            defaultValue={initial("address", scout?.address ?? "")}
            onChange={() => clearField("address")}
            onBlur={(event) => setFieldError("address", validateAddress(event.target.value))}
            error={errors.address}
            disabled={pending}
          />
        </CardContent>
      </Card>

      {/* Emergency and medical */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Emergency and medical</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Required before a scout can take part in activities.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Emergency contact"
              name="emergencyContactName"
              autoComplete="off"
              placeholder="Parent or guardian"
              defaultValue={initial("emergencyContactName", scout?.emergencyContactName ?? "")}
              onChange={() => clearField("emergencyContactName")}
              onBlur={(event) =>
                setFieldError("emergencyContactName", validateEmergencyContactName(event.target.value))
              }
              error={errors.emergencyContactName}
              disabled={pending}
            />

            <TextField
              label="Emergency contact phone"
              name="emergencyContactPhone"
              type="tel"
              autoComplete="off"
              placeholder="+44 7700 900000"
              defaultValue={initial("emergencyContactPhone", scout?.emergencyContactPhone ?? "")}
              onChange={() => clearField("emergencyContactPhone")}
              onBlur={(event) =>
                setFieldError(
                  "emergencyContactPhone",
                  validateRequiredPhone(event.target.value, "an emergency contact phone number"),
                )
              }
              error={errors.emergencyContactPhone}
              disabled={pending}
            />
          </div>

          <TextareaField
            label="Medical and allergy notes"
            labelAside="Optional"
            name="medicalNotes"
            rows={4}
            placeholder="Allergies, medication, conditions and anything leaders should know on camp."
            defaultValue={initial("medicalNotes", scout?.medicalNotes ?? "")}
            onChange={() => clearField("medicalNotes")}
            onBlur={(event) =>
              setFieldError("medicalNotes", validateMedicalNotes(event.target.value))
            }
            error={errors.medicalNotes}
            hint="Visible to every leader who can view scout records."
            disabled={pending}
          />
        </CardContent>
      </Card>

      {/* Membership */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Membership</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Where this scout sits in the group.
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Join date"
              name="joinDate"
              type="date"
              defaultValue={initial("joinDate", scout?.joinDate ?? "")}
              onChange={() => clearField("joinDate")}
              onBlur={(event) =>
                setFieldError("joinDate", validateJoinDate(event.target.value, dateOfBirth))
              }
              error={errors.joinDate}
              disabled={pending}
            />

            <SelectField
              label="Patrol"
              name="patrol"
              defaultValue={initial("patrol", scout?.patrol ?? "Unassigned")}
              onChange={() => clearField("patrol")}
              error={errors.patrol}
              disabled={pending}
            >
              {PATROLS.map((patrol) => (
                <option key={patrol} value={patrol}>
                  {patrol}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Status"
              name="status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ScoutStatus);
                clearField("status");
              }}
              error={errors.status}
              hint={scoutStatusDescriptions[status]}
              disabled={pending}
            >
              {SCOUT_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {scoutStatusLabels[option]}
                </option>
              ))}
            </SelectField>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href={mode === "edit" ? `/scouts/${scout.id}` : "/scouts"}
          className={buttonStyles({ variant: "secondary" })}
        >
          Cancel
        </Link>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner label="Saving" />}
          {pending
            ? "Saving..."
            : mode === "create"
              ? "Add scout"
              : `Save ${scoutFullName({ firstName, lastName }) || "changes"}`}
        </Button>
      </div>
    </form>
  );
}
