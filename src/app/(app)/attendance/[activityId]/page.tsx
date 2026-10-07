import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, UserRound } from "lucide-react";

import {
  RegisterForm,
  type RegisterGroup,
} from "@/components/attendance/register-form";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTimeRange } from "@/lib/activities/types";
import { availabilityMessages, getRegister } from "@/lib/attendance/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import { formatDayLabel, formatLongDate } from "@/lib/format";
import { scoutFullName } from "@/lib/scouts/types";

interface PageProps {
  params: Promise<{ activityId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { activityId } = await params;
  const register = await getRegister(activityId, new Date());

  return {
    title: register ? `Register - ${register.activity.name}` : "Register not found",
  };
}

export default async function RegisterPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "attendance.view")) {
    return <AccessDenied sectionName="Attendance" role={user.role} />;
  }

  const canRecord = can(user.role, "attendance.record");

  const { activityId } = await params;
  const register = await getRegister(activityId, new Date());
  const scope = await resolveTroopScope(user);
  if (!register || !inScope(scope, register.activity.troopId)) notFound();

  const { activity, groups, total, record, takenByName, availability } = register;

  // A draft activity is not part of the programme anyone else can see.
  if (activity.status === "draft" && !can(user.role, "activities.manage")) notFound();

  const ready = availability === "ready";

  // Trimmed for the client: the register needs a name and a picture, not the
  // whole scout record including medical notes.
  const clientGroups: RegisterGroup[] = groups.map((group) => ({
    key: group.patrolId ?? "unassigned",
    name: group.patrolId ? `${group.name} Patrol` : group.name,
    scouts: group.scouts.map((entry) => ({
      id: entry.scout.id,
      name: scoutFullName(entry.scout),
      avatar: entry.scout.avatar,
      mark: entry.mark,
      note: entry.note,
      carriedOver: entry.carriedOver,
    })),
  }));

  return (
    <div className="space-y-4">
      <Link
        href="/attendance"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to attendance
      </Link>

      {/* What is being marked. Kept short - the register is the point of the page. */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
                {record ? "Register" : "Take the register"}
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                {activity.name}
              </h1>
            </div>

            <Link
              href={`/activities/${activity.id}`}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Activity details
            </Link>
          </div>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-secondary">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Date</dt>
              <dd>{formatDayLabel(activity.date)}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Time</dt>
              <dd className="tabular-nums">{formatTimeRange(activity)}</dd>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Location</dt>
              <dd className="truncate">{activity.location}</dd>
            </div>
            <div className="flex items-center gap-1.5">
              <UserRound className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
              <dt className="sr-only">Scouts on the register</dt>
              <dd className="tabular-nums">{total} on the register</dd>
            </div>
          </dl>

          {record && takenByName && (
            <p className="mt-3 border-t border-line pt-3 text-[12px] text-ink-muted">
              Taken by {takenByName} on {formatLongDate(record.takenAt)}
              {record.updatedAt !== record.takenAt &&
                `, last edited ${formatLongDate(record.updatedAt)}`}
              .
            </p>
          )}
        </CardContent>
      </Card>

      {!ready && (
        <Callout tone="warning" title="No register yet">
          {availabilityMessages[availability]}
        </Callout>
      )}

      {!canRecord && ready && (
        <Callout tone="info">
          <span className="inline-flex items-center gap-2">
            You can see this register but not change it.
            <Badge tone="neutral">View only</Badge>
          </span>
        </Callout>
      )}

      {total === 0 ? (
        <Card>
          <EmptyState
            icon={UserRound}
            title="Nobody to mark"
            description="No active scouts are in scope for this activity. Check its patrols, or the register itself."
          />
        </Card>
      ) : ready || record ? (
        <RegisterForm
          activityId={activity.id}
          groups={clientGroups}
          canRecord={canRecord && ready}
          alreadyTaken={record !== null}
        />
      ) : null}
    </div>
  );
}
