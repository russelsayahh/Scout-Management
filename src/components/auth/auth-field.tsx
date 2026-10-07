"use client";

import { useId, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Fields for the sign-in/register card only.
 *
 * The card sits on a fixed dark backdrop regardless of the site's light/dark
 * preference (see `(auth)/layout.tsx`), so these are built from fixed colours
 * rather than the `ink`/`surface` tokens `components/ui/form-field.tsx` uses -
 * reusing that would mean fighting its theme-reactive classes field by field.
 * Kept separate on purpose: nothing outside the auth pages imports this file,
 * so it cannot change how any other form in the app looks.
 */

const control =
  "h-11 w-full rounded-xl border border-transparent bg-white/95 pr-3 pl-10 text-[14px] text-slate-900 " +
  "placeholder:text-slate-400 transition-colors focus:border-white focus:bg-white focus:outline-none " +
  "focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-400";

function Shell({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-white/90">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-red-300" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[12px] text-white/50">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

interface BaseProps {
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function AuthTextField({
  label,
  icon: Icon,
  error,
  hint,
  className,
  ...props
}: BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">) {
  const id = useId();

  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.9}
          aria-hidden
        />
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(control, className)}
          {...props}
        />
      </div>
    </Shell>
  );
}

export function AuthPasswordField({
  label,
  icon: Icon,
  error,
  hint,
  className,
  ...props
}: BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "type">) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.9}
          aria-hidden
        />
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(control, "pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition-colors hover:text-slate-600"
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="size-4" strokeWidth={1.9} aria-hidden />
          ) : (
            <Eye className="size-4" strokeWidth={1.9} aria-hidden />
          )}
        </button>
      </div>
    </Shell>
  );
}

export function AuthSelectField({
  label,
  icon: Icon,
  error,
  hint,
  className,
  children,
  ...props
}: BaseProps & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  const id = useId();

  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400"
          strokeWidth={1.9}
          aria-hidden
        />
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(control, "cursor-pointer appearance-none pr-9", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>
    </Shell>
  );
}
