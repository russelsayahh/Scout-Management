import type { FieldErrors } from "@/lib/validation";

/**
 * Shared shape for every form driven by `useActionState`.
 *
 * Kept out of the `"use server"` modules because those may only export async
 * functions - constants have to live elsewhere.
 */
export interface FormState {
  status: "idle" | "error" | "success";
  /** Form-level message, shown in a callout above the fields. */
  message?: string;
  /** Per-field messages, shown under the input they belong to. */
  fieldErrors?: FieldErrors;
  /** Submitted values, echoed back so a failed form does not lose input. */
  values?: Record<string, string>;
}

export const initialFormState: FormState = { status: "idle" };

/**
 * Result of an action invoked directly rather than through a form - the
 * confirmation dialogs use this.
 */
export type ActionResult = { ok: true } | { ok: false; message: string };
