import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Flag, ShieldCheck, Users } from "lucide-react";

import { AccessDenied } from "@/components/shared/access-denied";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TroopDescriptionForm } from "@/components/troops/troop-description-form";
import { countUpcomingActivities } from "@/lib/activities/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { roleLabels } from "@/lib/auth/types";
import { listLeaders } from "@/lib/leaders/service";
import { countActivePatrols } from "@/lib/patrols/service";
import { countCurrentScouts } from "@/lib/scouts/service";
import { getTroop } from "@/lib/troops/service";
import { isTroopId } from "@/lib/troops/store";
import { viewTroopSectionAction } from "@/lib/troops/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const troop = await getTroop(id);

  return { title: troop ? troop.name : "Troop not found" };
}

/** Quick link into one of the flat routes, already scoped to this troop. */
function QuickLink({ troopId, path, label }: { troopId: string; path: string; label: string }) {
  return (
    <form action={viewTroopSectionAction.bind(null, troopId, path)}>
      <button type="submit" className={buttonStyles({ variant: "secondary", size: "sm" })}>
        {label}
      </button>
    </form>
  );
}

export default async function TroopDetailPage({ params }: PageProps) {
  const user = await requireUser();
  if (!can(user.role, "troops.view")) {
    return <AccessDenied sectionName="Troops" role={user.role} />;
  }

  const { id } = await params;
  if (!(await isTroopId(id))) notFound();

  const troop = await getTroop(id);
  if (!troop) notFound();

  const canManage = can(user.role, "troops.manage");
  // This page always looks at its own troop, regardless of whatever the
  // admin's own switcher currently has selected.
  const scope = [id];

  const [memberCount, leaders, patrolCount, upcomingActivityCount] = await Promise.all([
    countCurrentScouts(scope),
    listLeaders(scope),
    countActivePatrols(scope),
    countUpcomingActivities(scope, new Date()),
  ]);
  const leaderCount = leaders.length;

  return (
    <div className="space-y-4">
      <Link
        href="/troops"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} aria-hidden />
        Back to troops
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {troop.name}
            </h1>

            {canManage ? (
              <div className="mt-3 max-w-lg">
                <TroopDescriptionForm troopId={troop.id} description={troop.description} />
              </div>
            ) : (
              <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-ink-secondary">
                {troop.description || "No description yet."}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <QuickLink troopId={troop.id} path="/scouts" label="Members" />
            <QuickLink troopId={troop.id} path="/leaders" label="Leaders" />
            <QuickLink troopId={troop.id} path="/patrols" label="Patrols" />
            <QuickLink troopId={troop.id} path="/activities" label="Activities" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Users className="size-4.5" strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <p className="text-[11.5px] text-ink-muted">Members</p>
            <p className="text-lg font-semibold tracking-tight text-ink tabular-nums">
              {memberCount}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <ShieldCheck className="size-4.5" strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <p className="text-[11.5px] text-ink-muted">Leaders</p>
            <p className="text-lg font-semibold tracking-tight text-ink tabular-nums">
              {leaderCount}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <Flag className="size-4.5" strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <p className="text-[11.5px] text-ink-muted">Patrols</p>
            <p className="text-lg font-semibold tracking-tight text-ink tabular-nums">
              {patrolCount}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
            <CalendarDays className="size-4.5" strokeWidth={1.9} aria-hidden />
          </span>
          <div>
            <p className="text-[11.5px] text-ink-muted">Upcoming activities</p>
            <p className="text-lg font-semibold tracking-tight text-ink tabular-nums">
              {upcomingActivityCount}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Leaders</CardTitle>
            <p className="mt-0.5 text-[13px] text-ink-secondary">
              Adults responsible for this troop.
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {leaders.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-ink-secondary">
              No leaders are assigned to this troop yet.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {leaders.map((leader) => (
                <li key={leader.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={leader.name} src={leader.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/leaders/${leader.id}`}
                      className="block truncate text-[13px] font-medium text-ink hover:text-brand-text hover:underline"
                    >
                      {leader.name}
                    </Link>
                    <p className="truncate text-[11.5px] text-ink-muted">
                      {leader.position || "Position not set"}
                    </p>
                  </div>
                  <Badge tone={leader.role === "administrator" ? "brand" : "neutral"}>
                    {roleLabels[leader.role]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
