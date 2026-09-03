import Link from "next/link";
import {
  Award,
  Backpack,
  ClipboardCheck,
  FileText,
  Tent,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recentActivity } from "@/data/activity";
import type { ActivityKind } from "@/types";

const kindIcon: Record<ActivityKind, LucideIcon> = {
  member: Users,
  attendance: ClipboardCheck,
  camp: Tent,
  document: FileText,
  equipment: Backpack,
  award: Award,
};

/** Timeline of what leaders have done across the group. */
export function RecentActivity() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Recent activity</CardTitle>
          <p className="mt-0.5 text-[13px] text-ink-secondary">
            Latest changes across the group
          </p>
        </div>
        <Link
          href="/reports"
          className="shrink-0 text-[12.5px] font-medium text-brand-text hover:underline"
        >
          View all
        </Link>
      </CardHeader>

      <CardContent className="flex-1 py-2">
        <ul className="relative">
          {recentActivity.map((entry, index) => {
            const Icon = kindIcon[entry.kind];
            const isLast = index === recentActivity.length - 1;

            return (
              <li key={entry.id} className="relative flex gap-3.5 py-2.5">
                {/* Connector rail between markers. */}
                {!isLast && (
                  <span
                    className="absolute top-10 bottom-0 left-[15px] w-px bg-line"
                    aria-hidden
                  />
                )}

                <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface-muted text-ink-secondary">
                  <Icon className="size-[15px]" strokeWidth={1.9} aria-hidden />
                </span>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13px] leading-snug text-ink-secondary">
                    <span className="font-medium text-ink">{entry.actor}</span>{" "}
                    {entry.action}{" "}
                    <span className="font-medium text-ink">{entry.target}</span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ink-muted">{entry.timeAgo}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
