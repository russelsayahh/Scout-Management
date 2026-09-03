import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Tent } from "lucide-react";

import { CampGrid } from "@/components/camps/camp-grid";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { campCounts, campFilterLabels, listCamps, type CampFilter } from "@/lib/camps/service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Camps",
  description: "Residential camps: dates, places, rosters and who is running them.",
};

const FILTERS: CampFilter[] = ["upcoming", "past", "all"];

function parseFilter(value: string | string[] | undefined): CampFilter {
  const single = Array.isArray(value) ? value[0] : value;
  return FILTERS.includes(single as CampFilter) ? (single as CampFilter) : "upcoming";
}

export default async function CampsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  if (!can(user.role, "camps.view")) {
    return <AccessDenied sectionName="Camps" role={user.role} />;
  }

  const canManage = can(user.role, "camps.manage");

  // One reference instant for the whole request, so nothing on the page can
  // disagree about which camps are still to come.
  const now = new Date();

  const params = await searchParams;
  const filter = parseFilter(params.show);

  const [camps, counts] = await Promise.all([listCamps(filter, now), campCounts(now)]);

  const hrefFor = (value: CampFilter) => (value === "upcoming" ? "/camps" : `/camps?show=${value}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Camps"
        description="Residentials from a night in the hut to a week in the hills."
        actions={
          <>
            <Badge tone="neutral">{counts.upcoming} upcoming</Badge>
            {counts.upcomingRegistrations > 0 && (
              <Badge tone="neutral">{counts.upcomingRegistrations} registered</Badge>
            )}
            {canManage && (
              <Link href="/camps/new" className={buttonStyles()}>
                <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                New camp
              </Link>
            )}
          </>
        }
      />

      {/* Which camps to show. Links rather than a control, so each view is a URL. */}
      <div
        className="flex w-full overflow-hidden rounded-lg border border-line bg-surface sm:w-auto sm:self-start"
        role="group"
        aria-label="Which camps to show"
      >
        {FILTERS.map((value, index) => (
          <Link
            key={value}
            href={hrefFor(value)}
            aria-current={filter === value ? "true" : undefined}
            className={cn(
              "flex h-9 flex-1 items-center justify-center px-4 text-[13px] font-medium whitespace-nowrap transition-colors sm:flex-none",
              index > 0 && "border-l border-line",
              filter === value
                ? "bg-brand-soft text-brand-text"
                : "text-ink-secondary hover:bg-surface-hover",
            )}
          >
            {campFilterLabels[value]}
          </Link>
        ))}
      </div>

      {camps.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tent}
            title={
              counts.total === 0
                ? "No camps yet"
                : filter === "upcoming"
                  ? "Nothing coming up"
                  : "No camps to show"
            }
            description={
              counts.total === 0
                ? "Plan the first camp, then open registration when the details are settled."
                : filter === "upcoming"
                  ? "Every camp on file has already run or was called off."
                  : "Try a different view."
            }
            action={
              counts.total === 0 && canManage ? (
                <Link href="/camps/new" className={buttonStyles()}>
                  <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                  New camp
                </Link>
              ) : (
                <Link href="/camps?show=all" className={buttonStyles({ variant: "secondary" })}>
                  Show every camp
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <CampGrid camps={camps} canManage={canManage} now={now} />
      )}
    </div>
  );
}
