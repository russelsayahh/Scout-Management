"use client";

import { useActionState, useRef } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { changeRoleAction } from "@/lib/auth/actions";
import { initialFormState } from "@/lib/form-state";
import { ROLES, roleLabels, type SessionUser } from "@/lib/auth/types";
import { formatLongDate } from "@/lib/format";

function RoleControl({ user, isSelf }: { user: SessionUser; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState(changeRoleAction, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  if (isSelf) {
    return (
      <div className="flex items-center gap-2">
        <Badge tone="brand" dot>
          {roleLabels[user.role]}
        </Badge>
        <span className="text-[11.5px] text-ink-muted">Your account</span>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-1.5">
      <input type="hidden" name="userId" value={user.id} />

      <div className="flex items-center gap-2">
        <Select
          name="role"
          defaultValue={user.role}
          disabled={pending}
          aria-label={`Role for ${user.name}`}
          className="h-9 w-full text-[13px] sm:w-52"
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

      {state.status === "error" && state.message && (
        <p className="text-[11.5px] text-negative" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "success" && state.message && (
        <p className="text-[11.5px] text-positive">{state.message}</p>
      )}
    </form>
  );
}

/**
 * Account list with inline role editing.
 *
 * The server action re-checks the caller's permission and the "last
 * administrator" rule, so this component only has to present the outcome.
 */
export function UserList({
  users,
  currentUserId,
}: {
  users: SessionUser[];
  currentUserId: string;
}) {
  return (
    <Card>
      <Callout tone="info" className="m-4 mb-0">
        Changing a role takes effect on that person&rsquo;s next request. You cannot change
        your own role, and the last administrator cannot be demoted.
      </Callout>

      <ul className="divide-y divide-line">
        {users.map((user) => (
          <li
            key={user.id}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.name} src={user.avatar} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-ink">{user.name}</p>
                <p className="truncate text-[12px] text-ink-muted">{user.email}</p>
              </div>
            </div>

            <div className="min-w-0 text-[12px] text-ink-secondary">
              <p className="truncate">{user.phone || "No phone number"}</p>
              <p className="truncate text-ink-muted">
                Joined {formatLongDate(user.createdAt)}
              </p>
            </div>

            <div className="sm:justify-self-end">
              <RoleControl user={user} isSelf={user.id === currentUserId} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
