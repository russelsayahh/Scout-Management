"use client";

import { useActionState } from "react";

import { AvatarField } from "@/components/ui/avatar-field";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { updateProfileAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/form-state";
import type { SessionUser } from "@/lib/auth/types";
import { validateEmail, validateName, validatePhone } from "@/lib/auth/validation";

export function ProfileDetailsForm({ user }: { user: SessionUser }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const formError = state.status === "error" ? state.message : undefined;

  return (
    <Card>
      <form action={formAction} noValidate>
        <CardHeader>
          <div>
            <CardTitle>Profile details</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              How you appear to the rest of the group.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {state.status === "success" && <Callout tone="success">{state.message}</Callout>}
          {formError && <Callout tone="error">{formError}</Callout>}

          <AvatarField
            name="avatar"
            initialSrc={user.avatar}
            displayName={user.name}
            label="Profile picture"
            description="PNG, JPEG or WebP. Cropped to a square and resized to 256px."
            disabled={pending}
            error={errors.avatar}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Full name"
              name="name"
              autoComplete="name"
              defaultValue={state.values?.name ?? user.name}
              onChange={() => clearField("name")}
              onBlur={(event) => setFieldError("name", validateName(event.target.value))}
              error={errors.name}
              disabled={pending}
            />

            <TextField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.values?.email ?? user.email}
              onChange={() => clearField("email")}
              onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
              error={errors.email}
              disabled={pending}
              fieldClassName="sm:col-span-1"
            />

            <TextField
              label="Phone number"
              labelAside="Optional"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+44 7700 900000"
              defaultValue={state.values?.phone ?? user.phone}
              onChange={() => clearField("phone")}
              onBlur={(event) => setFieldError("phone", validatePhone(event.target.value))}
              error={errors.phone}
              disabled={pending}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Spinner label="Saving" />}
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
