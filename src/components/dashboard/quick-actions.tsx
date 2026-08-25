import Link from "next/link";
import { CalendarPlus, ClipboardCheck, Tent, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuickAction {
  label: string;
  hint: string;
  href: string;
  icon: LucideIcon;
}

const actions: QuickAction[] = [
  { label: "Add scout", hint: "New member record", href: "/scouts", icon: UserPlus },
  { label: "Take register", hint: "Tonight's meeting", href: "/attendance", icon: ClipboardCheck },
  { label: "Plan activity", hint: "Add to programme", href: "/activities", icon: CalendarPlus },
  { label: "Create camp", hint: "Start a residential", href: "/camps", icon: Tent },
];

/** Shortcuts into the sections a leader reaches for most. */
export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2.5 transition-colors hover:border-brand-border hover:bg-brand-soft"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-secondary transition-colors group-hover:text-brand-text">
                <action.icon className="size-4" strokeWidth={1.9} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">
                  {action.label}
                </span>
                <span className="block truncate text-[11px] text-ink-muted">{action.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
