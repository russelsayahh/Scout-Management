import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { permissionsFor } from "@/lib/auth/permissions";
import { roleDescriptions, roleLabels, type SessionUser } from "@/lib/auth/types";
import { formatLongDate } from "@/lib/format";

const areaLabels: Record<string, string> = {
  dashboard: "Dashboard",
  scouts: "Scouts",
  leaders: "Leaders",
  patrols: "Patrols",
  activities: "Activities",
  camps: "Camps",
  attendance: "Attendance",
  equipment: "Equipment",
  documents: "Documents",
  reports: "Reports",
  settings: "Settings",
  users: "User accounts",
};

const actionLabels: Record<string, string> = {
  view: "View",
  manage: "Manage",
  record: "Take register",
};

/** Read-only view of what the signed-in role may do. */
export function AccessSummary({ user }: { user: SessionUser }) {
  const grouped = new Map<string, string[]>();

  for (const permission of permissionsFor(user.role)) {
    const [area, action] = permission.split(".");
    const actions = grouped.get(area) ?? [];
    actions.push(action);
    grouped.set(area, actions);
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Role and access</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Set by an administrator.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Badge tone="brand" dot>
            {roleLabels[user.role]}
          </Badge>
          <p className="mt-2 text-[12.5px] leading-snug text-ink-secondary">
            {roleDescriptions[user.role]}
          </p>
        </div>

        <dl className="space-y-2 border-t border-line pt-4">
          {[...grouped.entries()].map(([area, actions]) => (
            <div key={area} className="flex items-start justify-between gap-3">
              <dt className="text-[12.5px] text-ink-secondary">
                {areaLabels[area] ?? area}
              </dt>
              <dd className="flex shrink-0 flex-wrap justify-end gap-1">
                {actions.map((action) => (
                  <span
                    key={action}
                    className="inline-flex items-center gap-1 rounded-md bg-surface-inset px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary"
                  >
                    <Check className="size-3 text-status-good" strokeWidth={3} aria-hidden />
                    {actionLabels[action] ?? action}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>

        <p className="border-t border-line pt-4 text-[11.5px] text-ink-muted">
          Member since {formatLongDate(user.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
