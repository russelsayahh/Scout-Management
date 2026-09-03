"use client";

import { useActionState, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { changeRoleAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/form-state";
import { ROLES, roleDescriptions, roleLabels, type SessionUser } from "@/lib/auth/types";

/**
 * Role, i.e. permissions, editor for one leader's profile.
 *
 * Submits on change rather than needing a separate "save" - a role either
 * changes or it does not, so there is nothing to draft. `changeRoleAction`
 * carries its own guards (no self-change, last administrator protected),
 * enforced regardless of what this control allows to be selected.
 */
export function LeaderRoleControl({ leader, isSelf }: { leader: SessionUser; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState(changeRoleAction, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  if (isSelf) {
    return (
      <div className="space-y-1.5">
        <Badge tone="brand" dot>
          {roleLabels[leader.role]}
        </Badge>
        <p className="text-[12px] text-ink-muted">
          This is your own account - ask another administrator to change your role.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="userId" value={leader.id} />

      <div className="flex items-center gap-2">
        <Select
          name="role"
          defaultValue={leader.role}
          disabled={pending}
          aria-label={`Role for ${leader.name}`}
          className="h-9 w-full text-[13px] sm:w-56"
          onChange={() => formRef.current?.requestSubmit()}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </Select>
        {pending && <Spinner className="size-4 text-ink-muted" label="Saving role" />}
      </div>

      <p className="text-[12px] text-ink-muted">{roleDescriptions[leader.role]}</p>

      {state.status === "error" && state.message && (
        <p className="text-[12px] text-negative" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "success" && state.message && (
        <p className="text-[12px] text-positive">{state.message}</p>
      )}
    </form>
  );
}
