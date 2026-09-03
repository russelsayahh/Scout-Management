"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { PasswordField, TextField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { loginAction } from "@/lib/auth/actions";
import { DEMO_PASSWORD, demoAccounts } from "@/lib/auth/demo-accounts";
import { initialFormState } from "@/lib/form-state";
import { roleLabels } from "@/lib/auth/types";
import { validateEmail } from "@/lib/auth/validation";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") ?? "";

  // Controlled so the demo buttons can fill the form.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // A form-level message that is not already shown under a field.
  const showFormError =
    state.status === "error" && state.message && Object.keys(errors).length === 0;

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-ink-secondary">
          Sign in to manage your group.
        </p>
      </header>

      {showFormError && (
        <Callout tone="error" className="mb-5">
          {state.message}
        </Callout>
      )}

      {redirectTo && state.status === "idle" && (
        <Callout tone="info" className="mb-5">
          Sign in to continue to that page.
        </Callout>
      )}

      <form action={formAction} noValidate className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@1striverside.org"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearField("email");
          }}
          onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
          error={errors.email}
          disabled={pending}
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearField("password");
          }}
          error={errors.password}
          disabled={pending}
        />

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Spinner label="Signing in" />}
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-secondary">
        New to {"Trailhead"}?{" "}
        <Link href="/register" className="font-medium text-brand-text hover:underline">
          Create an account
        </Link>
      </p>

      {/* Development aid: the seeded accounts, one per role. */}
      <section className="mt-8 rounded-xl border border-line bg-surface-muted p-4">
        <h2 className="text-[12px] font-semibold tracking-wide text-ink">Demo accounts</h2>
        <p className="mt-0.5 text-[11.5px] text-ink-muted">
          Seeded on first run. Pick one to fill the form and see how the roles differ.
        </p>

        <ul className="mt-3 space-y-1.5">
          {demoAccounts.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  clearField("email");
                  clearField("password");
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-brand-border hover:bg-brand-soft disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-ink">
                    {roleLabels[account.role]}
                  </span>
                  <span className="block truncate text-[11px] text-ink-muted">
                    {account.email}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-medium text-brand-text">Use</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
