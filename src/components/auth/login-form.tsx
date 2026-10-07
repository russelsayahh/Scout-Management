"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";

import { AuthPasswordField, AuthTextField } from "@/components/auth/auth-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { loginAction } from "@/lib/auth/actions";
import { DEMO_PASSWORD, demoAccounts } from "@/lib/auth/demo-accounts";
import { siteConfig } from "@/config/site";
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
        <h1 className="text-[28px] font-bold tracking-tight text-white">Login</h1>
        <p className="mt-1.5 text-sm text-white/65">Sign in to manage your group.</p>
      </header>

      {showFormError && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-[13px] text-red-100"
        >
          {state.message}
        </div>
      )}

      {redirectTo && state.status === "idle" && (
        <div className="mb-5 rounded-lg border border-white/20 bg-white/10 px-3.5 py-3 text-[13px] text-white/85">
          Sign in to continue to that page.
        </div>
      )}

      <form action={formAction} noValidate className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <AuthTextField
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearField("email");
          }}
          onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
          error={errors.email}
          disabled={pending}
        />

        <AuthPasswordField
          label="Password"
          icon={Lock}
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

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-[14px] font-semibold text-white transition-colors hover:bg-brand-400 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending && <Spinner label="Signing in" />}
          {pending ? "Signing in..." : "Login"}
          {!pending && <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-white/65">
        New to {siteConfig.name}?{" "}
        <Link href="/register" className="font-medium text-white hover:underline">
          Create an account
        </Link>
      </p>

      {/* Development aid: the seeded accounts, one per role. */}
      <section className="mt-8 rounded-xl border border-white/15 bg-white/6 p-4">
        <h2 className="text-[12px] font-semibold tracking-wide text-white/90">Demo accounts</h2>
        <p className="mt-0.5 text-[11.5px] text-white/55">
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
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left transition-colors hover:border-white/30 hover:bg-white/10 disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-white">
                    {roleLabels[account.role]}
                  </span>
                  <span className="block truncate text-[11px] text-white/55">
                    {account.email}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] font-medium text-white/80">Use</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
