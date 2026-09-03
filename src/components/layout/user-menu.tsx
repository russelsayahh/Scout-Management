"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";

import { useSession } from "@/components/auth/session-provider";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { logoutAction } from "@/lib/auth/actions";
import { can } from "@/lib/auth/permissions";
import { roleLabels } from "@/lib/auth/types";

export function UserMenu() {
  const user = useSession();
  const [signingOut, startSignOut] = useTransition();

  const links = [
    { label: "Your profile", href: "/profile", icon: UserRound, show: true },
    {
      label: "Group settings",
      href: "/settings",
      icon: Settings,
      show: can(user.role, "settings.view"),
    },
  ].filter((link) => link.show);

  return (
    <Popover
      panelClassName="w-[min(16rem,calc(100vw-2rem))]"
      content={({ close }) => (
        <>
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar name={user.name} src={user.avatar} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-ink">{user.name}</p>
              <p className="truncate text-[11.5px] text-ink-muted">{user.email}</p>
            </div>
          </div>

          <div className="border-b border-line px-4 py-2.5">
            <Badge tone="brand" dot>
              {roleLabels[user.role]}
            </Badge>
          </div>

          <ul className="p-1.5">
            {links.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
                >
                  <link.icon className="size-4 text-ink-muted" strokeWidth={1.8} aria-hidden />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-line p-1.5">
            <button
              type="button"
              disabled={signingOut}
              onClick={() => startSignOut(() => void logoutAction())}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink disabled:opacity-60"
            >
              {signingOut ? (
                <Spinner className="size-4 text-ink-muted" label="Signing out" />
              ) : (
                <LogOut className="size-4 text-ink-muted" strokeWidth={1.8} aria-hidden />
              )}
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </>
      )}
    >
      <button
        type="button"
        className="flex h-9 items-center gap-2 rounded-lg pr-1.5 pl-1 transition-colors hover:bg-surface-hover"
        aria-label="Account menu"
      >
        <Avatar name={user.name} src={user.avatar} size="sm" />
        <span className="hidden min-w-0 text-left xl:block">
          <span className="block truncate text-[12.5px] leading-tight font-medium text-ink">
            {user.name}
          </span>
          <span className="block truncate text-[11px] leading-tight text-ink-muted">
            {roleLabels[user.role]}
          </span>
        </span>
        <ChevronDown className="hidden size-3.5 shrink-0 text-ink-muted xl:block" aria-hidden />
      </button>
    </Popover>
  );
}
