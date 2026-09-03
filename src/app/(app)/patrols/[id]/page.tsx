import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";

import { MemberList } from "@/components/patrols/member-list";
import { PatrolActions } from "@/components/patrols/patrol-actions";
import {
  PatrolActivityPanel,
  PatrolAttendancePanel,
} from "@/components/patrols/patrol-insights";
import { PatrolStatusBadge } from "@/components/patrols/patrol-status-badge";
import { AccessDenied } from "@/components/shared/access-denied";
import { Avatar } from "@/components/ui/avatar";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList, EmptyValue } from "@/components/ui/detail-list";
import { recentActivitiesForPatrol } from "@/lib/activities/service";
import { patrolAttendance } from "@/lib/attendance/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { formatLongDate } from "@/lib/format";
import { assignableScouts, getPatrol } from "@/lib/patrols/service";
import { patrolStatusDescriptions, patrolStatusLabels } from "@/lib/patrols/types";
import { buildAgeMap, scoutFullName } from "@/lib/scouts/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getPatrol(id);

  return { title: found ? `${found.patrol.name} Patrol` : "Patrol not found" };
}

export default async function PatrolDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "patrols.view")) {
    return <AccessDenied sectionName="Patrols" role={user.role} />;
  }

  const canManage = can(user.role, "patrols.manage");

  const { id } = await params;
  const found = await getPatrol(id);
  if (!found) notFound();

  const { patrol, members, memberCount, leader } = found;
  const saved = "saved" in (await searchParams);

  // Only fetched when it can be used - the picker is hidden otherwise.
  const candidates = canManage && !patrol.archived ? await assignableScouts() : [];

  // Real programme history: completed activities this patrol was part of.
  const [recent, attendance] = await Promise.all([
    recentActivitiesForPatrol(patrol.id, new Date(), 4),
    patrolAttendance(patrol.id),
  ]);
  const ages = buildAgeMap(members, new Date());

  return (
    <div className="space-y-4">
      {saved && <Callout tone="success">Changes saved.</Callout>}

      <Link
        href="/patrols"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to patrols
      </Link>

      {patrol.archived && (
        <Callout tone="warning" title="This patrol is archived">
          {patrol.archiveReason || "No reason was recorded."}
          {patrol.archivedAt && ` Archived on ${formatLongDate(patrol.archivedAt)}.`}
        </Callout>
      )}

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {patrol.name} Patrol
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
              <PatrolStatusBadge status={patrol.status} archived={patrol.archived} />
              <span className="text-[13px] text-ink-secondary tabular-nums">
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            </div>

            {patrol.description && (
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-secondary">
                {patrol.description}
              </p>
            )}
          </div>

          <div className="shrink-0">
            <PatrolActions
              patrol={patrol}
              memberCount={memberCount}
              canManage={canManage}
              variant="detail"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <MemberList
            patrolId={patrol.id}
            patrolName={`${patrol.name} Patrol`}
            members={members}
            leaderId={patrol.patrolLeaderId}
            candidates={candidates}
            canManage={canManage}
            ages={ages}
            archived={patrol.archived}
          />

          <PatrolActivityPanel activities={recent} patrolId={patrol.id} />
        </div>

        <div className="space-y-4">
          {/* Patrol leader */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="size-4 text-brand-text" strokeWidth={1.9} aria-hidden />
                <CardTitle>Patrol leader</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {leader ? (
                <div className="flex items-center gap-3">
                  <Avatar name={scoutFullName(leader)} src={leader.avatar} size="lg" />
                  <div className="min-w-0">
                    <Link
                      href={`/scouts/${leader.id}`}
                      className="block truncate text-[14px] font-medium text-ink hover:text-brand-text hover:underline"
                    >
                      {scoutFullName(leader)}
                    </Link>
                    <p className="truncate text-[12px] text-ink-muted">
                      {leader.email || "No email on file"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-ink-secondary">
                  No leader appointed.
                  {canManage && !patrol.archived
                    ? " Use the star beside a member to appoint one."
                    : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Patrol information */}
          <Card>
            <CardHeader>
              <CardTitle>Patrol information</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  { label: "Name", value: patrol.name },
                  {
                    label: "Description",
                    value: patrol.description || <EmptyValue>No description</EmptyValue>,
                  },
                  {
                    label: "Status",
                    value: (
                      <span className="flex flex-col gap-0.5">
                        {patrolStatusLabels[patrol.status]}
                        <span className="text-[12px] text-ink-muted">
                          {patrolStatusDescriptions[patrol.status]}
                        </span>
                      </span>
                    ),
                  },
                  { label: "Members", value: `${memberCount}` },
                  { label: "Created", value: formatLongDate(patrol.createdAt) },
                  { label: "Last updated", value: formatLongDate(patrol.updatedAt) },
                ]}
              />
            </CardContent>
          </Card>

          <PatrolAttendancePanel
            patrolId={patrol.id}
            attendance={attendance}
            memberCount={memberCount}
          />
        </div>
      </div>
    </div>
  );
}
