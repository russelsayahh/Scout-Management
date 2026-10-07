"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Lock, Mail, Phone, ShieldCheck, User, Users } from "lucide-react";

import { AuthPasswordField, AuthSelectField, AuthTextField } from "@/components/auth/auth-field";
import { Spinner } from "@/components/ui/spinner";
import { useFieldErrors } from "@/hooks/use-field-errors";
import { registerAction } from "@/lib/auth/actions";
import { siteConfig } from "@/config/site";
import { initialFormState } from "@/lib/form-state";
import { SELF_SIGNUP_ROLES, roleDescriptions, roleLabels } from "@/lib/auth/types";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "@/lib/auth/validation";
import type { Troop } from "@/lib/troops/types";

/** The roles a person may pick for themselves; administrator is granted, not chosen. */
type SelfSignupRole = (typeof SELF_SIGNUP_ROLES)[number];

export function RegisterForm({ troops }: { troops: Troop[] }) {
  const [state, formAction, pending] = useActionState(registerAction, initialFormState);
  const { errors, setFieldError, clearField } = useFieldErrors(state);

  const [role, setRole] = useState<SelfSignupRole>(
    (state.values?.role as SelfSignupRole) ?? "assistant-leader",
  );
  const [troopId, setTroopId] = useState(state.values?.troopId ?? troops[0]?.id ?? "");

  const showFormError =
    state.status === "error" && state.message && Object.keys(errors).length === 0;

  return (
    <div>
      <header className="mb-7">
        <h1 className="text-[28px] font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-1.5 text-sm text-white/65">
          Join your group on {siteConfig.name}. It takes a minute.
        </p>
      </header>

      {showFormError && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-3 text-[13px] text-red-100"
        >
          {state.message}
        </div>
      )}

      <form action={formAction} noValidate className="space-y-4">
        <AuthTextField
          label="Full name"
          icon={User}
          name="name"
          autoComplete="name"
          placeholder="Enter your full name"
          defaultValue={state.values?.name}
          onChange={() => clearField("name")}
          onBlur={(event) => setFieldError("name", validateName(event.target.value))}
          error={errors.name}
          disabled={pending}
        />

        <AuthTextField
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email"
          defaultValue={state.values?.email}
          onChange={() => clearField("email")}
          onBlur={(event) => setFieldError("email", validateEmail(event.target.value))}
          error={errors.email}
          disabled={pending}
        />

        <AuthTextField
          label="Phone number (optional)"
          icon={Phone}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="Enter your phone number"
          defaultValue={state.values?.phone}
          onChange={() => clearField("phone")}
          onBlur={(event) => setFieldError("phone", validatePhone(event.target.value))}
          error={errors.phone}
          disabled={pending}
        />

        {/* The option list stays short; the chosen role is explained underneath,
            where the text has room to be read. */}
        <AuthSelectField
          label="Role"
          icon={ShieldCheck}
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
        </AuthSelectField>

        <AuthSelectField
          label="Troop"
          icon={Users}
          name="troopId"
          value={troopId}
          onChange={(event) => {
            setTroopId(event.target.value);
            clearField("troopId");
          }}
          error={errors.troopId}
          hint="Which section you're the leader for. You'll only see this troop's information once signed in - an administrator can add more later."
          disabled={pending}
        >
          {troops.map((troop) => (
            <option key={troop.id} value={troop.id}>
              {troop.name}
            </option>
          ))}
        </AuthSelectField>

        <AuthPasswordField
          label="Password"
          icon={Lock}
          name="password"
          autoComplete="new-password"
          placeholder="At least 10 characters"
          onChange={() => clearField("password")}
          onBlur={(event) => setFieldError("password", validatePassword(event.target.value))}
          error={errors.password}
          hint="At least 10 characters, with upper case, lower case and a number."
          disabled={pending}
        />

        <AuthPasswordField
          label="Confirm password"
          icon={Lock}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          onChange={() => clearField("confirmPassword")}
          error={errors.confirmPassword}
          disabled={pending}
        />

        <button
          type="submit"
          disabled={pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-[14px] font-semibold text-white transition-colors hover:bg-brand-400 disabled:pointer-events-none disabled:opacity-60"
        >
          {pending && <Spinner label="Creating account" />}
          {pending ? "Creating account..." : "Create account"}
          {!pending && <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden />}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] text-white/65">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-white hover:underline">
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-center text-[11.5px] text-white/45">
        Administrator access is granted by an existing administrator, not chosen here.
      </p>
    </div>
  );
}
