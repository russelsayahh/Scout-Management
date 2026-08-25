"use client";

import { useId, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";

import { Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Labelled form controls.
 *
 * Each field owns its label, hint and error text and wires `aria-invalid` and
 * `aria-describedby`, so a validation message is announced rather than only
 * shown.
 */

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Text shown to the right of the label, e.g. "Optional". */
  labelAside?: string;
  children: React.ReactNode;
  className?: string;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  labelAside,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {labelAside && <span className="text-[11.5px] text-ink-muted">{labelAside}</span>}
      </div>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-negative" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

/* -------------------------------- TextField ------------------------------- */

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  labelAside?: string;
  fieldClassName?: string;
}

export function TextField({
  label,
  error,
  hint,
  labelAside,
  fieldClassName,
  ...props
}: TextFieldProps) {
  const id = useId();

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      labelAside={labelAside}
      className={fieldClassName}
    >
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
}

/* ------------------------------ PasswordField ----------------------------- */

export function PasswordField({
  label,
  error,
  hint,
  labelAside,
  fieldClassName,
  ...props
}: TextFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      labelAside={labelAside}
      className={fieldClassName}
    >
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="pr-10"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-ink-muted transition-colors hover:text-ink"
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
    </FieldShell>
  );
}

/* ------------------------------- SelectField ------------------------------ */

export interface SelectFieldProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  labelAside?: string;
  fieldClassName?: string;
}

export function SelectField({
  label,
  error,
  hint,
  labelAside,
  fieldClassName,
  children,
  ...props
}: SelectFieldProps) {
  const id = useId();

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      labelAside={labelAside}
      className={fieldClassName}
    >
      <div className="relative">
        <Select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          {...props}
        >
          {children}
        </Select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-muted"
          aria-hidden
        />
      </div>
    </FieldShell>
  );
}

/* ------------------------------ TextareaField ----------------------------- */

export interface TextareaFieldProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  error?: string;
  hint?: string;
  labelAside?: string;
  fieldClassName?: string;
}

export function TextareaField({
  label,
  error,
  hint,
  labelAside,
  fieldClassName,
  ...props
}: TextareaFieldProps) {
  const id = useId();

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      labelAside={labelAside}
      className={fieldClassName}
    >
      <Textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
}
