import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";

import { CampActions } from "@/components/camps/camp-actions";
import { CampDashboard } from "@/components/camps/camp-dashboard";
import { CampLeaders } from "@/components/camps/camp-leaders";
import { CampStatusBadge } from "@/components/camps/camp-status-badge";
import { CampTimeline } from "@/components/camps/camp-timeline";
import {
  ParticipantList,
  type ParticipantRow,
} from "@/components/camps/participant-list";
import type { CandidateScout } from "@/components/camps/register-scouts-dialog";
import { HolderEquipmentCard } from "@/components/equipment/holder-equipment-card";
import { AccessDenied } from "@/components/shared/access-denied";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailList, EmptyValue } from "@/components/ui/detail-list";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { inScope, resolveTroopScope } from "@/lib/auth/troop-scope";
import {
  getCamp,
  leaderOptions,
  registrationCandidates,
} from "@/lib/camps/service";
import {
  campStatusDescriptions,
  daysUntilDeadline,
  formatCampLength,
  isClosed,
  registrationStateMessages,
} from "@/lib/camps/types";
import { formatDateRange, formatLongDate, formatShortDate } from "@/lib/format";
import * as patrolStore from "@/lib/patrols/store";
import { scoutFullName } from "@/lib/scouts/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await getCamp(id, new Date());

  return { title: found ? found.camp.name : "Camp not found" };
}

export default async function CampDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "camps.view")) {
    return <AccessDenied sectionName="Camps" role={user.role} />;
  }

  const canManage = can(user.role, "camps.manage");

  const { id } = await params;
  const now = new Date();
  const found = await getCamp(id, now);
  const scope = await resolveTroopScope(user);
  if (!found || !inScope(scope, found.camp.troopId)) notFound();

  const { camp, leaders, patrols, participants, dashboard, timeline, state } = found;
  const saved = "saved" in (await searchParams);

  // Only fetched when it can be used - the picker is hidden otherwise.
  const [candidates, everyLeader, allPatrols] = await Promise.all([
    canManage && !isClosed(camp.status)
      ? registrationCandidates(camp.id)
      : Promise.resolve({ invited: [], others: [] }),
    canManage ? leaderOptions() : Promise.resolve([]),
    patrolStore.allPatrols(),
  ]);

  const patrolNames = new Map(allPatrols.map((patrol) => [patrol.id, patrol.name]));

  const toCandidate = (scout: (typeof candidates.invited)[number]): CandidateScout => ({
    id: scout.id,
    name: scoutFullName(scout),
    avatar: scout.avatar,
    patrolName: scout.patrolId ? (patrolNames.get(scout.patrolId) ?? null) : null,
  });

  // Dates are formatted here so the client list cannot disagree with the page.
  const participantRows: ParticipantRow[] = participants.map((entry) => ({
    id: entry.scout.id,
    name: scoutFullName(entry.scout),
    avatar: entry.scout.avatar,
    patrolName: entry.patrolName,
    registeredOn: formatShortDate(entry.registeredAt),
    registeredByName: entry.registeredByName,
    outsideInvitedPatrols: entry.outsideInvitedPatrols,
  }));

  const daysLeft = daysUntilDeadline(camp, now);

  return (
    <div className="space-y-4">
      {saved && <Callout tone="success">Changes saved.</Callout>}

      <Link
        href="/camps"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to camps
      </Link>

      {camp.status === "cancelled" && (
        <Callout tone="error" title="This camp was cancelled">
          {camp.cancellationReason || "No reason was recorded."}
          {camp.cancelledAt && ` Cancelled on ${formatLongDate(camp.cancelledAt)}.`}
        </Callout>
      )}

      {camp.status === "planning" && (
        <Callout tone="warning" title="Still being planned">
          Registration has not been opened, so the group has not been told about it yet. Scouts
          can still be pencilled in.
        </Callout>
      )}

      {state === "full" && camp.status !== "cancelled" && !isClosed(camp.status) && (
        <Callout tone="info" title="Every place is taken">
          {camp.registrations.length} of {camp.maxParticipants} places are filled. Raise the
          maximum to register anybody else.
        </Callout>
      )}

      {state === "after-deadline" && (
        <Callout tone="info" title="The registration deadline has passed">
          It was {formatLongDate(camp.registrationDeadline)}. Late additions are still possible.
        </Callout>
      )}

      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CampStatusBadge status={camp.status} />
              {state === "open" && daysLeft >= 0 && (
                <span className="text-[12.5px] text-ink-secondary">
                  {daysLeft === 0
                    ? "Deadline today"
                    : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left to register`}
                </span>
              )}
            </div>

            <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {camp.name}
            </h1>

            <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-secondary">
              <div className="flex items-center gap-1.5">
                <CalendarDays
                  className="size-3.5 shrink-0 text-ink-muted"
                  strokeWidth={2}
                  aria-hidden
                />
                <dt className="sr-only">Dates</dt>
                <dd>{formatDateRange(camp.startDate, camp.endDate)}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">Length</dt>
                <dd>{formatCampLength(camp)}</dd>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
                <dt className="sr-only">Location</dt>
                <dd className="truncate">{camp.location}</dd>
              </div>
            </dl>
          </div>

          <div className="shrink-0">
            <CampActions
              camp={camp}
              registered={camp.registrations.length}
              canManage={canManage}
              variant="detail"
            />
          </div>
        </CardContent>
      </Card>

      {/* The camp dashboard */}
      <CampDashboard
        dashboard={dashboard}
        maxParticipants={camp.maxParticipants}
        leaders={leaders}
        patrols={patrols}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About this camp</CardTitle>
            </CardHeader>
            <CardContent>
              {camp.description ? (
                <p className="text-[13.5px] leading-relaxed whitespace-pre-line text-ink">
                  {camp.description}
                </p>
              ) : (
                <p className="text-[13.5px] text-ink-muted italic">
                  No description has been written yet.
                </p>
              )}
            </CardContent>
          </Card>

          <ParticipantList
            campId={camp.id}
            campName={camp.name}
            participants={participantRows}
            candidates={{
              invited: candidates.invited.map(toCandidate),
              others: candidates.others.map(toCandidate),
            }}
            placesLeft={dashboard.availableSpots}
            state={state}
            canManage={canManage}
          />

          {/* Camp information */}
          <Card>
            <CardHeader>
              <CardTitle>Camp information</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Location", value: camp.location },
                  { label: "Dates", value: formatDateRange(camp.startDate, camp.endDate) },
                  { label: "Length", value: formatCampLength(camp) },
                  {
                    label: "Registration deadline",
                    value: formatLongDate(camp.registrationDeadline),
                  },
                  { label: "Maximum participants", value: `${camp.maxParticipants} scouts` },
                  {
                    label: "Invited patrols",
                    value:
                      patrols.length === 0 ? (
                        "The whole troop"
                      ) : (
                        <span className="flex flex-wrap gap-x-1.5">
                          {patrols.map((patrol, index) => (
                            <span key={patrol.id}>
                              <Link
                                href={`/patrols/${patrol.id}`}
                                className="hover:text-brand-text hover:underline"
                              >
                                {patrol.name}
                              </Link>
                              {index < patrols.length - 1 && ","}
                            </span>
                          ))}
                        </span>
                      ),
                  },
                  {
                    label: "Status",
                    value: (
                      <span className="flex flex-col gap-1">
                        <CampStatusBadge status={camp.status} className="self-start" />
                        <span className="text-[12px] text-ink-muted">
                          {campStatusDescriptions[camp.status]} {registrationStateMessages[state]}
                        </span>
                      </span>
                    ),
                    wide: true,
                  },
                  {
                    label: "Added",
                    value: formatLongDate(camp.createdAt),
                  },
                  {
                    label: "Last updated",
                    value: camp.updatedAt ? formatLongDate(camp.updatedAt) : <EmptyValue />,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <CampLeaders
            campId={camp.id}
            campName={camp.name}
            leaders={leaders}
            everyone={everyLeader}
            canManage={canManage}
            fixed={isClosed(camp.status)}
          />

          <CampTimeline milestones={timeline} />

          {can(user.role, "equipment.view") && (
            <HolderEquipmentCard
              holderKind="camp"
              holderId={camp.id}
              canManage={can(user.role, "equipment.manage")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
