import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { AttendanceSnapshot } from "@/components/dashboard/attendance-snapshot";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { UpcomingActivities } from "@/components/dashboard/upcoming-activities";
import { UpcomingCamps } from "@/components/dashboard/upcoming-camps";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { siteConfig } from "@/config/site";
import { countUpcomingActivities } from "@/lib/activities/service";
import { attendanceOverview } from "@/lib/attendance/service";
import { campCounts } from "@/lib/camps/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { listLeaders } from "@/lib/leaders/service";
import { countCurrentScouts } from "@/lib/scouts/service";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const canManageActivities = can(user.role, "activities.manage");
  const scope = await resolveTroopScope(user);

  const now = new Date();
  const [scouts, leaders, upcoming, attendance, camps] = await Promise.all([
    countCurrentScouts(scope),
    listLeaders(scope),
    countUpcomingActivities(scope, now),
    attendanceOverview(scope, now),
    campCounts(scope, now),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={siteConfig.organisation}
        title="Dashboard"
        description="Membership, programme and attendance at a glance."
        actions={
          <>
            <Badge tone="neutral">Autumn term 2026</Badge>
            <Link
              href="/activities?view=calendar"
              className={buttonStyles({ variant: "secondary" })}
            >
              Full programme
            </Link>
            {canManageActivities && (
              <Link href="/activities/new" className={buttonStyles()}>
                <Plus className="size-4" strokeWidth={2.2} aria-hidden />
                New activity
              </Link>
            )}
          </>
        }
      />

      <StatGrid
        totalScouts={scouts}
        totalLeaders={leaders.length}
        upcomingActivities={upcoming}
        attendanceRate={attendance.tally.rate}
        registersTaken={attendance.registersTaken}
        upcomingCamps={camps.upcoming}
        campPlacesBooked={camps.upcomingRegistrations}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <UpcomingActivities scope={scope} canManage={canManageActivities} />
          <UpcomingCamps scope={scope} canManage={can(user.role, "camps.manage")} />
          <RecentActivity />
        </div>

        <div className="space-y-4">
          <AttendanceSnapshot scope={scope} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
