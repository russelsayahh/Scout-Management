import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";

import {
  FlaggedScouts,
  MarkBreakdown,
  OutstandingRegisters,
  PatrolAttendanceBreakdown,
  RecentRegisters,
} from "@/components/attendance/attendance-panels";
import { AccessDenied } from "@/components/shared/access-denied";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { PageHeader } from "@/components/ui/page-header";
import { Sparkline } from "@/components/ui/sparkline";
import { attendanceOverview } from "@/lib/attendance/service";
import { ATTENDANCE_TARGET } from "@/lib/attendance/types";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = {
  title: "Attendance",
  description: "Registers, turnout and who is drifting away.",
};

export default async function AttendancePage() {
  const user = await requireUser();
  if (!can(user.role, "attendance.view")) {
    return <AccessDenied sectionName="Attendance" role={user.role} />;
  }

  const canRecord = can(user.role, "attendance.record");
  const overview = await attendanceOverview(new Date());

  const { tally, registersTaken, outstanding, recent, byPatrol, flagged, trend } = overview;
  const rate = tally.rate ?? 0;
  const aboveTarget = rate >= ATTENDANCE_TARGET;

  if (registersTaken === 0 && outstanding.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Attendance"
          description="Registers, turnout and who is drifting away."
        />
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Nothing to mark yet"
            description="Once an activity on the programme has started, its register appears here."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Turnout across the troop, taken session by session."
        actions={
          <>
            <Badge tone="neutral">{registersTaken} registers</Badge>
            {outstanding.length > 0 && (
              <Badge tone="warning" dot>
                {outstanding.length} still to take
              </Badge>
            )}
            {!canRecord && <Badge tone="neutral">View only</Badge>}
          </>
        }
      />

      {/* Headline rate, with the mark split beside it. */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <p className="text-[13px] text-ink-secondary">Attendance rate</p>

            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-[34px] leading-none font-semibold tracking-tight text-ink">
                {tally.rate === null ? "-" : formatPercent(rate)}
              </span>
              <span className="text-[12.5px] text-ink-muted tabular-nums">
                {tally.attended} of {tally.total}
              </span>
            </div>

            <div className="mt-4">
              <Meter
                value={rate}
                target={ATTENDANCE_TARGET}
                targetLabel={`Target ${ATTENDANCE_TARGET}%`}
                tone={aboveTarget ? "good" : "accent"}
                label={`Attendance ${rate}% against a ${ATTENDANCE_TARGET}% target`}
              />
              <p className="mt-2 text-[11.5px] text-ink-muted">
                {aboveTarget ? "Above" : "Below"} the {ATTENDANCE_TARGET}% target · marker shows
                target
              </p>
            </div>

            {trend.length > 1 && (
              <div className="mt-5">
                <p className="text-[11.5px] tracking-wide text-ink-muted uppercase">
                  Last {trend.length} sessions
                </p>
                <div className="mt-2">
                  <Sparkline
                    data={trend.map((point) => point.rate)}
                    height={40}
                    label={`Attendance rate over the last ${trend.length} sessions`}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <p className="text-[13px] text-ink-secondary">How every mark was recorded</p>
            <div className="mt-3">
              <MarkBreakdown tally={tally} />
            </div>
            <p className="mt-3 text-[11.5px] leading-snug text-ink-muted">
              The rate counts <strong className="font-medium text-ink-secondary">present</strong>{" "}
              and <strong className="font-medium text-ink-secondary">late</strong> as having turned
              up. Excused absences are still counted in the total, so the rate answers &ldquo;how
              often was this scout there&rdquo; rather than &ldquo;how often were they at
              fault&rdquo;.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OutstandingRegisters outstanding={outstanding} canRecord={canRecord} />
        <RecentRegisters recent={recent} />
        <PatrolAttendanceBreakdown rows={byPatrol} />
        <FlaggedScouts flagged={flagged} />
      </div>

      {trend.length > 1 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Session by session</CardTitle>
              <p className="mt-0.5 text-[13px] text-ink-secondary">
                Turnout at each of the last {trend.length} sessions
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-line">
              {[...trend].reverse().map((point) => (
                <li
                  key={`${point.date}-${point.name}`}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                    {point.name}
                  </span>
                  <span className="w-28 shrink-0 sm:w-40">
                    <Meter
                      size="sm"
                      value={point.rate}
                      tone={point.rate >= ATTENDANCE_TARGET ? "good" : "accent"}
                      label={`${point.name}: ${point.rate}% attendance`}
                    />
                  </span>
                  <span className="w-12 shrink-0 text-right text-[12.5px] text-ink-secondary tabular-nums">
                    {formatPercent(point.rate, 0)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
