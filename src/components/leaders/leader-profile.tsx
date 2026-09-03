import Link from "next/link";
import { ArrowLeft, CalendarDays, Flag, Phone, ShieldCheck } from "lucide-react";

import { ActivityStatusBadge } from "@/components/activities/activity-status-badge";
import { LeaderRoleControl } from "@/components/leaders/leader-role-control";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList, EmptyValue } from "@/components/ui/detail-list";
import type { Activity } from "@/lib/activities/types";
import { roleLabels, type SessionUser } from "@/lib/auth/types";
import { formatLongDate, formatShortDate } from "@/lib/format";
import type { AssignedPatrol } from "@/lib/leaders/service";

/** Everything held on one leader. Server-rendered. */
export function LeaderProfile({
  leader,
  canManage,
  isSelf,
  patrols,
  activities,
}: {
  leader: SessionUser;
  canManage: boolean;
  isSelf: boolean;
  /** Patrols this leader is responsible for. */
  patrols: AssignedPatrol[];
  /** Activities they are down to run, newest first. */
  activities: Activity[];
}) {
  return (
    <div className="space-y-4">
      <Link
        href="/leaders"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to leaders
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <Avatar name={leader.name} src={leader.avatar} size="xl" />

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {leader.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <Badge tone={leader.role === "administrator" ? "brand" : "neutral"} dot>
                {roleLabels[leader.role]}
              </Badge>
              <span className="text-[13px] text-ink-secondary">
                {leader.position || "No position set"}
              </span>
            </div>

            <p className="mt-2 text-[12.5px] text-ink-muted">
              Joined {formatLongDate(leader.createdAt)}
            </p>
          </div>

          {canManage && (
            <div className="shrink-0">
              <Link href={`/leaders/${leader.id}/edit`} className={buttonStyles({ variant: "secondary" })}>
                Edit profile
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Contact */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-ink-muted" strokeWidth={1.9} aria-hidden />
              <CardTitle>Contact</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                {
                  label: "Email",
                  value: leader.email ? (
                    <a
                      href={`mailto:${leader.email}`}
                      className="break-all hover:text-brand-text hover:underline"
                    >
                      {leader.email}
                    </a>
                  ) : (
                    <EmptyValue />
                  ),
                },
                {
                  label: "Phone",
                  value: leader.phone ? (
                    <a href={`tel:${leader.phone}`} className="hover:text-brand-text hover:underline">
                      {leader.phone}
                    </a>
                  ) : (
                    <EmptyValue />
                  ),
                },
                { label: "Position", value: leader.position || <EmptyValue /> },
              ]}
            />
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-ink-muted" strokeWidth={1.9} aria-hidden />
              <CardTitle>Permissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <LeaderRoleControl leader={leader} isSelf={isSelf} />
            ) : (
              <div className="space-y-1.5">
                <Badge tone={leader.role === "administrator" ? "brand" : "neutral"} dot>
                  {roleLabels[leader.role]}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned patrols */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flag className="size-4 text-ink-muted" strokeWidth={1.9} aria-hidden />
              <CardTitle>Assigned patrols</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {patrols.length === 0 ? (
              <p className="text-[13px] text-ink-secondary">
                Not responsible for any patrol yet.
                {canManage ? " Assign one from Edit profile." : ""}
              </p>
            ) : (
              <ul className="space-y-2">
                {patrols.map((patrol) => (
                  <li key={patrol.id} className="flex items-center justify-between gap-2">
                    <Link
                      href={`/patrols/${patrol.id}`}
                      className="truncate text-[13.5px] font-medium text-ink hover:text-brand-text hover:underline"
                    >
                      {patrol.name} Patrol
                    </Link>
                    {patrol.archived && <Badge tone="neutral">Archived</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Programme */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-ink-muted" strokeWidth={1.9} aria-hidden />
              <CardTitle>Activities they run</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-[13px] text-ink-secondary">
                Not down to run anything at the moment.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {activities.slice(0, 8).map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/activities/${activity.id}`}
                        className="block truncate text-[13.5px] font-medium text-ink hover:text-brand-text hover:underline"
                      >
                        {activity.name}
                      </Link>
                      <p className="text-[11.5px] text-ink-muted">
                        {formatShortDate(activity.date)}
                      </p>
                    </div>
                    <ActivityStatusBadge status={activity.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
