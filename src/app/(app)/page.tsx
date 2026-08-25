import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { AttendanceSnapshot } from "@/components/dashboard/attendance-snapshot";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={siteConfig.organisation}
        title="Dashboard"
        description="Membership, programme and attendance at a glance."
        actions={
          <>
            <Badge tone="neutral">Autumn term 2026</Badge>
            {/* Links to the section rather than sitting inert in the header. */}
            <Link href="/activities" className={buttonStyles({ variant: "secondary" })}>
              Full programme
            </Link>
            <Link href="/activities" className={buttonStyles()}>
              <Plus className="size-4" strokeWidth={2.2} aria-hidden />
              New activity
            </Link>
          </>
        }
      />

      <StatGrid />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <UpcomingEvents />
          <RecentActivity />
        </div>

        <div className="space-y-4">
          <AttendanceSnapshot />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
