"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem as NavItemType } from "@/types";

export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface NavItemProps {
  item: NavItemType;
  /** Live count, overriding the static one in the nav config. */
  badge?: number;
  /** Icon-only rail. The label becomes a hover tooltip. */
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function NavItem({ item, badge, collapsed = false, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const active = isRouteActive(pathname, item.href);
  const Icon = item.icon;
  const count = badge ?? item.badge;

  // On the collapsed rail the label is only available as a native tooltip.
  const title = collapsed
    ? count !== undefined
      ? `${item.title} (${count})`
      : item.title
    : undefined;

  return (
    <li className="relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        title={title}
        className={cn(
          "relative flex h-9 items-center rounded-lg text-[13.5px] font-medium transition-colors",
          collapsed ? "w-9 justify-center px-0" : "gap-3 px-3",
          active
            ? "bg-brand-soft text-brand-text"
            : "text-ink-secondary hover:bg-surface-hover hover:text-ink",
        )}
      >
        {/* Active marker doubles the signal so it is not carried by color alone. */}
        {active && (
          <span
            className="absolute top-1/2 -left-2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-solid"
            aria-hidden
          />
        )}

        <Icon className="size-4.5 shrink-0" strokeWidth={active ? 2.2 : 1.9} aria-hidden />

        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.title}</span>
            {count !== undefined && (
              <span
                className={cn(
                  "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-brand-100 text-brand-800 dark:bg-brand-800 dark:text-brand-100" : "bg-surface-inset text-ink-muted",
                )}
              >
                {count}
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
}
