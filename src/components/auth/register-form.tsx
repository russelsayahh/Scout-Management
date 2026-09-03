"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { PasswordField, SelectField, TextField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { registerAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/form-state";
import { SELF_SIGNUP_ROLES, roleDescriptions, roleLabels } from "@/lib/auth/types";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "@/lib/auth/validation";

/** The roles a person may pick for themselves; administrator is granted, not chosen. */
type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const [role, setRole] = useState<SelfSignupRole>(
    (state.values?.role as SelfSignupRole) ?? "assistant-leader",
  );

  const showFormError =
    state.status === "error" && state.message && Object.keys(errors).length === 0;

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Join your group on Trailhead. It takes a minute.
        </p>
      </header>

      {showFormError && (
        <Callout tone="error" className="mb-5">
          {state.message}
        </Callout>
      )}

      <form action={formAction} noValidate className="space-y-4">
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Alex Fielding"
          defaultValue={state.values?.name}
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
          placeholder="you@1striverside.org"
          defaultValue={state.values?.email}
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
          autoComplete="tel"
          placeholder="+44 7700 900000"
          defaultValue={state.values?.phone}
          onChange={() => clearField("phone")}
          onBlur={(event) => setFieldError("phone", validatePhone(event.target.value))}
          error={errors.phone}
          disabled={pending}
        />

        {/* The option list stays short; the chosen role is explained underneath,
            where the text has room to be read. */}
        <SelectField
          label="Role"
          name="role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as SelfSignupRole);
            clearField("role");
          }}
          error={errors.role}
          hint={roleDescriptions[role]}
          disabled={pending}
        >
          {SELF_SIGNUP_ROLES.map((option) => (
            <option key={option} value={option}>
              {roleLabels[option]}
            </option>
          ))}
        </SelectField>

        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 10 characters"
          onChange={() => clearField("password")}
          onBlur={(event) => setFieldError("password", validatePassword(event.target.value))}
          error={errors.password}
          hint="At least 10 characters, with upper case, lower case and a number."
          disabled={pending}
        />

        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          onChange={() => clearField("confirmPassword")}
          error={errors.confirmPassword}
          disabled={pending}
        />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner label="Creating account" />}
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-text hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-center text-[11.5px] text-ink-muted">
        Administrator access is granted by an existing administrator, not chosen here.
      </p>
    </div>
  );
}
