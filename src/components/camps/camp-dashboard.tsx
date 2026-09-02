import Link from "next/link";
import { Flag, ShieldCheck, TentTree, UserRoundPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Meter } from "@/components/ui/meter";
import type { CampDashboard as CampDashboardData, CampLeader, CampPatrol } from "@/lib/camps/service";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The five figures a leader wants at the top of a camp: how many are coming,
 * how many of those are scouts, how much room is left, and who is involved.
 *
 * Leaders count towards the total because they need a bed and a seat on the
 * minibus too; the maximum is a limit on scout places, so that is what the
 * meter and the spare places are measured against.
 */

function Tile({
  icon: Icon,
  label,
  value,
  caption,
  emphasis = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  caption?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-surface-muted px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-ink-muted" strokeWidth={2} aria-hidden />
        <p className="text-[12px] text-ink-secondary">{label}</p>
      </div>
      <p
        className={cn(
          "mt-1.5 text-[24px] leading-none font-semibold tracking-tight tabular-nums",
          emphasis ? "text-brand-text" : "text-ink",
        )}
      >
        {value}
      </p>
      {caption && <p className="mt-1.5 text-[11.5px] leading-snug text-ink-muted">{caption}</p>}
    </div>
  );
}

export function CampDashboard({
  dashboard,
  maxParticipants,
  leaders,
  patrols,
}: {
  dashboard: CampDashboardData;
  maxParticipants: number;
  leaders: CampLeader[];
  patrols: CampPatrol[];
}) {
  const full = dashboard.availableSpots === 0;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Tile
            icon={Users}
            label="Total participants"
            value={dashboard.totalParticipants}
            caption={`${dashboard.registeredScouts} scouts and ${dashboard.responsibleLeaders} ${
              dashboard.responsibleLeaders === 1 ? "leader" : "leaders"
            }`}
            emphasis
          />
          <Tile
            icon={UserRoundPlus}
            label="Registered scouts"
            value={dashboard.registeredScouts}
            caption={`of ${maxParticipants} places`}
          />
          <Tile
            icon={TentTree}
            label="Available spots"
            value={dashboard.availableSpots}
            caption={full ? "Every place is taken" : "Still open"}
          />
          <Tile
            icon={Flag}
            label="Participating patrols"
            value={dashboard.participatingPatrols === 0 ? "All" : dashboard.participatingPatrols}
            caption={
              patrols.length === 0 ? (
                "The whole troop is invited"
              ) : (
                <span className="line-clamp-2">
                  {patrols.map((patrol) => patrol.name).join(", ")}
                </span>
              )
            }
          />
          <Tile
            icon={ShieldCheck}
            label="Responsible leaders"
            value={dashboard.responsibleLeaders}
            caption={
              <span className="line-clamp-2">
                {leaders.map((leader) => leader.name).join(", ") || "Nobody assigned"}
              </span>
            }
          />
        </div>

        {/* How full it is, stated in words as well as by the bar. */}
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[12.5px] text-ink-secondary">Places filled</p>
            <p className="text-[12.5px] text-ink-secondary tabular-nums">
              {dashboard.registeredScouts} of {maxParticipants} ·{" "}
              {formatPercent(dashboard.fillRate, 0)}
            </p>
          </div>
          <Meter
            className="mt-2"
            value={dashboard.registeredScouts}
            max={maxParticipants}
            tone={full ? "good" : "accent"}
            label={`${dashboard.registeredScouts} of ${maxParticipants} places filled`}
          />
          <p className="mt-2 text-[11.5px] text-ink-muted">
            {full
              ? "Full. Raise the maximum to take anyone else."
              : `${dashboard.availableSpots} ${
                  dashboard.availableSpots === 1 ? "place" : "places"
                } left.`}{" "}
            {patrols.length > 0 && (
              <>
                Registered by patrol:{" "}
                {patrols.map((patrol, index) => (
                  <span key={patrol.id}>
                    {index > 0 && ", "}
                    <Link
                      href={`/patrols/${patrol.id}`}
                      className="text-brand-text hover:underline"
                    >
                      {patrol.name}
                    </Link>{" "}
                    <span className="tabular-nums">
                      {patrol.registered}/{patrol.memberCount}
                    </span>
                  </span>
                ))}
                .
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
