import Link from "next/link";
import { ArrowLeft, HeartPulse, MapPin, Phone, ShieldAlert } from "lucide-react";

import {
  ScoutAttendanceCard,
  ScoutAttendanceHistory,
} from "@/components/attendance/scout-attendance";
import { ScoutCamps } from "@/components/camps/scout-camps";
import { ScoutActions } from "@/components/scouts/scout-actions";
import { ScoutStatusBadge } from "@/components/scouts/scout-status-badge";
import { Avatar } from "@/components/ui/avatar";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList, EmptyValue } from "@/components/ui/detail-list";
import type { ScoutAttendance } from "@/lib/attendance/service";
import type { CampSummary } from "@/lib/camps/service";
import { formatLongDate } from "@/lib/format";
import {
  ageOn,
  genderLabels,
  scoutFullName,
  scoutStatusDescriptions,
  scoutStatusLabels,
  type Scout,
} from "@/lib/scouts/types";

/** Everything held on one scout. Server-rendered, so ages resolve once. */
export function ScoutProfile({
  scout,
  canManage,
  today,
  patrol,
  attendance,
  camps,
}: {
  scout: Scout;
  canManage: boolean;
  today: Date;
  /** The scout's patrol, or null when unassigned. */
  patrol: { id: string; name: string } | null;
  /** Their register history and the totals drawn from it. */
  attendance: ScoutAttendance;
  /** Camps they are registered for, upcoming first. */
  camps: CampSummary[];
}) {
  const age = ageOn(scout.dateOfBirth, today);
  const name = scoutFullName(scout);

  return (
    <div className="space-y-4">
      <Link
        href="/scouts"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to the register
      </Link>

      {scout.archived && (
        <Callout tone="warning" title="This scout is archived">
          {scout.archiveReason || "No reason was recorded."}
          {scout.archivedAt && ` Archived on ${formatLongDate(scout.archivedAt)}.`}
        </Callout>
      )}

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <Avatar name={name} src={scout.avatar} size="xl" />

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{name}</h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <ScoutStatusBadge status={scout.status} archived={scout.archived} />
              {patrol ? (
                <Link
                  href={`/patrols/${patrol.id}`}
                  className="text-[13px] text-ink-secondary hover:text-brand-text hover:underline"
                >
                  {patrol.name} Patrol
                </Link>
              ) : (
                <span className="text-[13px] text-ink-muted">No patrol</span>
              )}
              {age !== null && (
                <span className="text-[13px] text-ink-secondary">
                  {age} years old
                </span>
              )}
            </div>

            <p className="mt-2 text-[12.5px] text-ink-muted">
              Joined {formatLongDate(scout.joinDate)}
            </p>
          </div>

          <div className="shrink-0">
            <ScoutActions scout={scout} canManage={canManage} variant="detail" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Personal details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: "First name", value: scout.firstName },
                { label: "Last name", value: scout.lastName },
                { label: "Date of birth", value: formatLongDate(scout.dateOfBirth) },
                { label: "Age", value: age === null ? <EmptyValue /> : `${age} years` },
                { label: "Gender", value: genderLabels[scout.gender] },
              ]}
            />
          </CardContent>
        </Card>

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
                  label: "Phone",
                  value: scout.phone ? (
                    <a href={`tel:${scout.phone}`} className="hover:text-brand-text hover:underline">
                      {scout.phone}
                    </a>
                  ) : (
                    <EmptyValue />
                  ),
                },
                {
                  label: "Email",
                  value: scout.email ? (
                    <a
                      href={`mailto:${scout.email}`}
                      className="break-all hover:text-brand-text hover:underline"
                    >
                      {scout.email}
                    </a>
                  ) : (
                    <EmptyValue />
                  ),
                },
                {
                  label: "Address",
                  wide: true,
                  value: scout.address ? (
                    <span className="inline-flex items-start gap-1.5">
                      <MapPin
                        className="mt-0.5 size-3.5 shrink-0 text-ink-muted"
                        strokeWidth={2}
                        aria-hidden
                      />
                      {scout.address}
                    </span>
                  ) : (
                    <EmptyValue />
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* Emergency */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-status-critical" strokeWidth={1.9} aria-hidden />
              <CardTitle>Emergency contact</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: "Name", value: scout.emergencyContactName || <EmptyValue /> },
                {
                  label: "Phone",
                  value: scout.emergencyContactPhone ? (
                    <a
                      href={`tel:${scout.emergencyContactPhone}`}
                      className="font-medium hover:text-brand-text hover:underline"
                    >
                      {scout.emergencyContactPhone}
                    </a>
                  ) : (
                    <EmptyValue />
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>

        {/* Medical */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HeartPulse className="size-4 text-status-serious" strokeWidth={1.9} aria-hidden />
              <CardTitle>Medical and allergies</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {scout.medicalNotes ? (
              <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-ink">
                {scout.medicalNotes}
              </p>
            ) : (
              <p className="text-[13.5px] text-ink-muted italic">
                Nothing recorded. Check with the parent or guardian before camps and adventurous
                activities.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <div className="lg:col-span-2">
          <ScoutAttendanceCard attendance={attendance} firstName={scout.firstName} />
        </div>

        {/* Membership */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Membership</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                {
                  label: "Patrol",
                  value: patrol ? (
                    <Link
                      href={`/patrols/${patrol.id}`}
                      className="hover:text-brand-text hover:underline"
                    >
                      {patrol.name}
                    </Link>
                  ) : (
                    <EmptyValue>Unassigned</EmptyValue>
                  ),
                },
                {
                  label: "Status",
                  value: (
                    <span className="flex flex-wrap items-center gap-2">
                      {scoutStatusLabels[scout.status]}
                      <span className="text-[12px] text-ink-muted">
                        {scoutStatusDescriptions[scout.status]}
                      </span>
                    </span>
                  ),
                },
                { label: "Join date", value: formatLongDate(scout.joinDate) },
                { label: "Record updated", value: formatLongDate(scout.updatedAt) },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ScoutAttendanceHistory attendance={attendance} />
        <ScoutCamps camps={camps} firstName={scout.firstName} />
      </div>
    </div>
  );
}
