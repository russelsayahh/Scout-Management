import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, ShieldCheck, Users } from "lucide-react";

import { ActivityActions } from "@/components/activities/activity-actions";
import { ActivityStatusBadge } from "@/components/activities/activity-status-badge";
import { ActivityTypeIcon } from "@/components/activities/activity-type-icon";
import { ActivityRegisterCard } from "@/components/attendance/activity-register-card";
import { HolderEquipmentCard } from "@/components/equipment/holder-equipment-card";
import { AccessDenied } from "@/components/shared/access-denied";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList, EmptyValue } from "@/components/ui/detail-list";
import { Meter } from "@/components/ui/meter";
import { getActivity } from "@/lib/activities/service";
import { activityAttendance, registerAvailability } from "@/lib/attendance/service";
import {
  activityStatusDescriptions,
  activityTypeLabels,
  durationMinutes,
  formatDuration,
  formatTimeRange,
  hasFinished,
} from "@/lib/activities/types";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { formatDayLabel, formatLongDate } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getActivity(id, new Date());

  return { title: found ? found.activity.name : "Activity not found" };
}

export default async function ActivityDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "activities.view")) {
    return <AccessDenied sectionName="Activities" role={user.role} />;
  }

  const canManage = can(user.role, "activities.manage");

  const { id } = await params;
  const now = new Date();
  const found = await getActivity(id, now);
  if (!found) notFound();

  const { activity, leaderName, audience, awaitingCompletion } = found;

  // A draft is part of planning, not part of the programme everyone can see.
  if (activity.status === "draft" && !canManage) notFound();

  const saved = "saved" in (await searchParams);

  // The register is part of the activity, so it is read here rather than being
  // somewhere the leader has to go looking for.
  const attendance = can(user.role, "attendance.view")
    ? await activityAttendance(activity.id)
    : null;
  const duration = durationMinutes(activity);
  const finished = hasFinished(activity, now);

  return (
    <div className="space-y-4">
      {saved && <Callout tone="success">Changes saved.</Callout>}

      <Link
        href="/activities"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to activities
      </Link>

      {activity.status === "cancelled" && (
        <Callout tone="error" title="This activity was cancelled">
          {activity.cancellationReason || "No reason was recorded."}
          {activity.cancelledAt && ` Cancelled on ${formatLongDate(activity.cancelledAt)}.`}
        </Callout>
      )}

      {activity.status === "draft" && (
        <Callout tone="warning" title="This is a draft">
          Only leaders who manage the programme can see it. Publish it when the details are
          settled.
        </Callout>
      )}

      {awaitingCompletion && (
        <Callout tone="info" title="This has already taken place">
          {canManage
            ? "Mark it as completed to keep the programme accurate."
            : "It is waiting to be marked as completed."}
        </Callout>
      )}

      {audience.overCapacity && activity.status !== "cancelled" && (
        <Callout tone="warning" title="More scouts are eligible than there are places">
          {audience.expected} scouts are in scope but there {audience.capacity === 1 ? "is" : "are"}{" "}
          only {audience.capacity} {audience.capacity === 1 ? "place" : "places"}. Raise the
          capacity, or narrow it to fewer patrols.
        </Callout>
      )}

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ActivityStatusBadge status={activity.status} />
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-secondary">
                <ActivityTypeIcon type={activity.type} className="size-3.5 text-ink-muted" />
                {activityTypeLabels[activity.type]}
              </span>
            </div>

            <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {activity.name}
            </h1>

            <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-secondary">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">When</dt>
                <dd>
                  {formatDayLabel(activity.date)}, {formatTimeRange(activity)}
                </dd>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">Where</dt>
                <dd className="truncate">{activity.location}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">Who</dt>
                <dd>
                  {audience.wholeTroop
                    ? "Whole troop"
                    : `${audience.patrols.length} ${audience.patrols.length === 1 ? "patrol" : "patrols"}`}
                </dd>
              </div>
            </dl>
          </div>

          <div className="shrink-0">
            <ActivityActions
              activity={activity}
              canManage={canManage}
              finished={finished}
              variant="detail"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About this activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.description ? (
                <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-ink">
                  {activity.description}
                </p>
              ) : (
                <p className="text-[13.5px] text-ink-muted italic">
                  No description has been written yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* When and where */}
          <Card>
            <CardHeader>
              <CardTitle>When and where</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Date", value: formatDayLabel(activity.date) },
                  { label: "Time", value: formatTimeRange(activity) },
                  { label: "Duration", value: formatDuration(duration) },
                  { label: "Location", value: activity.location },
                  { label: "Activity type", value: activityTypeLabels[activity.type] },
                  {
                    label: "Status",
                    value: (
                      <span className="flex flex-col gap-0.5">
                        <ActivityStatusBadge status={activity.status} className="self-start" />
                        <span className="mt-1 text-[12px] text-ink-muted">
                          {activityStatusDescriptions[activity.status]}
                        </span>
                      </span>
                    ),
                    wide: true,
                  },
                ]}
              />
            </CardContent>
          </Card>

          {/* Record */}
          <Card>
            <CardHeader>
              <CardTitle>Record</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Added", value: formatLongDate(activity.createdAt) },
                  { label: "Last updated", value: formatLongDate(activity.updatedAt) },
                  ...(activity.cancelledAt
                    ? [
                        {
                          label: "Cancelled",
                          value: formatLongDate(activity.cancelledAt),
                        },
                        {
                          label: "Reason",
                          value: activity.cancellationReason || (
                            <EmptyValue>No reason recorded</EmptyValue>
                          ),
                          wide: true,
                        },
                      ]
                    : []),
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Responsible leader */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand-text" strokeWidth={1.9} aria-hidden />
                <CardTitle>Responsible leader</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar name={leaderName} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-ink">{leaderName}</p>
                  <p className="truncate text-[12px] text-ink-muted">
                    Running this activity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Who it is for */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Who it is for</CardTitle>
                <p className="mt-0.5 text-[13px] text-ink-secondary">
                  {audience.wholeTroop
                    ? "Open to the whole troop"
                    : "Only these patrols are taking part"}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {audience.wholeTroop ? (
                <p className="text-[13px] text-ink-secondary">
                  No patrol has been singled out, so every scout on the register is invited.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {audience.patrols.map((patrol) => (
                    <li key={patrol.id}>
                      <Link
                        href={`/patrols/${patrol.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 transition-colors hover:bg-surface-hover"
                      >
                        <span className="min-w-0 truncate text-[13px] font-medium text-ink">
                          {patrol.name}
                          {patrol.archived && (
                            <Badge tone="neutral" className="ml-2">
                              Archived
                            </Badge>
                          )}
                        </span>
                        <span className="shrink-0 text-[12px] text-ink-muted tabular-nums">
                          {patrol.memberCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Expected numbers come from the register, not from sign-ups. */}
              <div className="border-t border-line pt-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-ink-secondary">Scouts expected</span>
                  <span className="text-[15px] font-semibold text-ink tabular-nums">
                    {audience.expected}
                    {audience.capacity !== null && (
                      <span className="text-[12px] font-normal text-ink-muted">
                        {" "}
                        of {audience.capacity}
                      </span>
                    )}
                  </span>
                </div>

                {audience.capacity !== null && (
                  <div className="mt-2.5">
                    <Meter
                      value={audience.expected}
                      max={audience.capacity}
                      tone={audience.overCapacity ? "warning" : "accent"}
                      label={`${audience.expected} scouts expected against ${audience.capacity} places`}
                    />
                    <p className="mt-2 text-[11.5px] text-ink-muted">
                      {audience.overCapacity
                        ? `${audience.expected - audience.capacity} more eligible than there are places`
                        : `${audience.remaining} ${audience.remaining === 1 ? "place" : "places"} spare`}
                    </p>
                  </div>
                )}

                {audience.capacity === null && (
                  <p className="mt-1.5 text-[11.5px] text-ink-muted">
                    No capacity has been set, so there is no limit on numbers.
                  </p>
                )}

                <p className="mt-3 text-[11.5px] leading-snug text-ink-muted">
                  Counted from the register: active scouts in the patrols above. There is no
                  sign-up yet, so this is who is eligible rather than who has said yes.
                </p>
              </div>
            </CardContent>
          </Card>

          {can(user.role, "attendance.view") && (
            <ActivityRegisterCard
              activityId={activity.id}
              availability={registerAvailability(activity, now)}
              attendance={attendance}
              canRecord={can(user.role, "attendance.record")}
            />
          )}

          {can(user.role, "equipment.view") && (
            <HolderEquipmentCard
              holderKind="activity"
              holderId={activity.id}
              canManage={can(user.role, "equipment.manage")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
