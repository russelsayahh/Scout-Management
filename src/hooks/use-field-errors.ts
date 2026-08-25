"use client";

import { useState } from "react";

import type { FormState } from "@/lib/form-state";
import type { FieldErrors } from "@/lib/auth/validation";

const NONE: string[] = [];

/**
 * Merges the server action's field errors with client-side ones raised on blur.
 *
 * Editing a field hides the server message it already carried, so a correction
 * does not sit under a stale complaint. The "cleared" set is tagged with the
 * state object it applies to, so the moment a new server response arrives its
 * errors show again - no effect needed to reset anything.
 */
export function useFieldErrors(state: FormState) {
  const [local, setLocal] = useState<FieldErrors>({});
  const [cleared, setCleared] = useState<{ state: FormState | null; fields: string[] }>({
    state: null,
    fields: NONE,
  });

  const clearedFields = cleared.state === state ? cleared.fields : NONE;

  const errors: FieldErrors = {};
  for (const [name, message] of Object.entries(state.fieldErrors ?? {})) {
    if (!clearedFields.includes(name)) errors[name] = message;
  }
  Object.assign(errors, local);

  /** Records (or removes) a client-side message for one field. */
  function setFieldError(name: string, message: string | undefined) {
    setLocal((previous) => {
      if (previous[name] === message) return previous;
      const next = { ...previous };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  /** Called as the user edits: drops both the client and the server message. */
  function clearField(name: string) {
    setLocal((previous) => {
      if (!(name in previous)) return previous;
      const next = { ...previous };
      delete next[name];
      return next;
    });

    setCleared((previous) => {
      const fields = previous.state === state ? previous.fields : NONE;
      if (fields.includes(name)) return previous;
      return { state, fields: [...fields, name] };
    });
  }

  return { errors, setFieldError, clearField };
}
