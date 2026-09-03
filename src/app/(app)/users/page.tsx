import type { Metadata } from "next";

import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { UserList } from "@/components/users/user-list";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { listUsers } from "@/lib/auth/service";
import { roleLabels, ROLES } from "@/lib/auth/types";

export const metadata: Metadata = {
  title: "User accounts",
  description: "Manage who can sign in and what they can access.",
};

export default async function UsersPage() {
  const user = await requireUser();

  if (!can(user.role, "users.manage")) {
    return <AccessDenied sectionName="User accounts" role={user.role} />;
  }

  const users = await listUsers();
  const counts = ROLES.map((role) => ({
    role,
    count: users.filter((candidate) => candidate.role === role).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="User accounts"
        description="Everyone who can sign in, and what their role lets them do."
        actions={
          <Badge tone="neutral">
            {users.length} {users.length === 1 ? "account" : "accounts"}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {counts.map(({ role, count }) => (
          <div key={role} className="rounded-xl border border-line bg-surface px-5 py-4 shadow-xs">
            <p className="text-[12.5px] text-ink-secondary">{roleLabels[role]}</p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink tabular-nums">
              {count}
            </p>
          </div>
        ))}
      </div>

      <UserList users={users} currentUserId={user.id} />
    </div>
  );
}
