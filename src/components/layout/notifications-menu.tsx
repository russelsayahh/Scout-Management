"use client";

import Link from "next/link";
import { Bell, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { notifications, unreadNotificationCount } from "@/data/notifications";
import { cn } from "@/lib/utils";
import type { NotificationTone } from "@/types";

/** Every tone carries an icon as well as a color - hue never stands alone. */
const toneIcon: Record<NotificationTone, LucideIcon> = {
  info: Info,
  good: CircleCheck,
  warning: TriangleAlert,
  critical: CircleAlert,
};

const toneColor: Record<NotificationTone, string> = {
  info: "text-viz-accent",
  good: "text-status-good",
  warning: "text-status-warning",
  critical: "text-status-critical",
};

export function NotificationsMenu() {
  return (
    <Popover
      role="dialog"
      panelClassName="w-[min(22rem,calc(100vw-2rem))]"
      content={({ close }) => (
        <>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-[13px] font-semibold text-ink">Notifications</p>
              <p className="text-[11.5px] text-ink-muted">
                {unreadNotificationCount} unread
              </p>
            </div>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[11.5px] font-medium text-brand-text transition-colors hover:bg-brand-soft"
            >
              Mark all read
            </button>
          </div>

          <ul className="max-h-[20rem] overflow-y-auto scrollbar-slim">
            {notifications.map((notification) => {
              const Icon = toneIcon[notification.tone];
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={close}
                    className={cn(
                      "flex w-full gap-3 border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-hover",
                      notification.unread && "bg-brand-soft/40",
                    )}
                  >
                    <Icon
                      className={cn("mt-0.5 size-4 shrink-0", toneColor[notification.tone])}
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-medium text-ink">
                          {notification.title}
                        </span>
                        {notification.unread && (
                          <span
                            className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-solid"
                            aria-label="Unread"
                          />
                        )}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-ink-secondary">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-ink-muted">
                        {notification.timeAgo}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line bg-surface-muted px-4 py-2.5 text-center">
            <Link
              href="/reports"
              onClick={close}
              className="text-[12px] font-medium text-brand-text hover:underline"
            >
              View all activity
            </Link>
          </div>
        </>
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={`Notifications, ${unreadNotificationCount} unread`}
      >
        <Bell className="size-4.5" strokeWidth={1.75} aria-hidden />
        {unreadNotificationCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-status-critical text-[9.5px] font-bold text-white ring-2 ring-surface"
            aria-hidden
          >
            {unreadNotificationCount}
          </span>
        )}
      </Button>
    </Popover>
  );
}
