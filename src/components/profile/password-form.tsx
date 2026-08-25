"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { changePasswordAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/form-state";
import { validatePassword } from "@/lib/auth/validation";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const formRef = useRef<HTMLFormElement>(null);

  // Clearing the fields after a successful change is a DOM side effect, which
  // is exactly what an effect is for - no React state is touched here.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : undefined;

  return (
    <Card>
      <form ref={formRef} action={formAction} noValidate>
        <CardHeader>
          <div>
            <CardTitle>Password</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Choose something you do not use anywhere else.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {state.status === "success" && <Callout tone="success">{state.message}</Callout>}
          {formError && <Callout tone="error">{formError}</Callout>}

          <PasswordField
            label="Current password"
            name="currentPassword"
            autoComplete="current-password"
            onChange={() => clearField("currentPassword")}
            error={errors.currentPassword}
            disabled={pending}
          />

          <PasswordField
            label="New password"
            name="newPassword"
            autoComplete="new-password"
            onChange={() => clearField("newPassword")}
            onBlur={(event) => setFieldError("newPassword", validatePassword(event.target.value))}
            error={errors.newPassword}
            hint="At least 10 characters, with upper case, lower case and a number."
            disabled={pending}
          />

          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            onChange={() => clearField("confirmPassword")}
            error={errors.confirmPassword}
            disabled={pending}
          />
        </CardContent>

        <CardFooter className="flex justify-end">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending && <Spinner label="Updating password" />}
            {pending ? "Updating..." : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
