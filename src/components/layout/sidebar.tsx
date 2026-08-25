"use client";

import { ChevronsUpDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import { useSession } from "@/components/auth/session-provider";
import { BrandLockup } from "@/components/layout/brand-mark";
import { NavItem } from "@/components/layout/nav-item";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { Button } from "@/components/ui/button";
import { visibleSecondaryItems, visibleSections } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Live counts keyed by nav item, overriding the static badges. */
export type NavCounts = Record<string, number>;

/** Nav body shared by the desktop rail and the mobile drawer. */
function SidebarContent({
  collapsed,
  counts,
  onNavigate,
}: {
  collapsed: boolean;
  counts: NavCounts;
  onNavigate?: () => void;
}) {
  // Only the sections this role can actually open are rendered.
  const { role } = useSession();
  const sections = visibleSections(role);
  const secondary = visibleSecondaryItems(role);

  return (
    <>
      <nav
        className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4"
        aria-label="Main navigation"
      >
        {sections.map((section, index) => (
          <div key={section.title ?? `section-${index}`} className={cn(index > 0 && "mt-5")}>
            {section.title && (
              <p
                className={cn(
                  "mb-1.5 px-3 text-[10.5px] font-semibold tracking-widest text-ink-muted uppercase transition-opacity",
                  collapsed && "sr-only",
                )}
              >
                {section.title}
              </p>
            )}
            {/* A hairline stands in for the heading on the collapsed rail. */}
            {section.title && collapsed && index > 0 && (
              <div className="mx-auto mb-2 h-px w-6 bg-line" aria-hidden />
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  badge={counts[item.key]}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <ul className="space-y-0.5">
          {secondary.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              badge={counts[item.key]}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>

        {!collapsed && (
          <button
            type="button"
            className="mt-3 flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-muted px-2.5 py-2 text-left transition-colors hover:bg-surface-hover"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-[11px] font-semibold text-brand-text">
              1R
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-ink">
                {siteConfig.organisation}
              </span>
              <span className="block text-[11px] text-ink-muted">Switch group</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-ink-muted" aria-hidden />
          </button>
        )}
      </div>
    </>
  );
}

/** Persistent rail from the `lg` breakpoint up. */
export function DesktopSidebar({ counts }: { counts: NavCounts }) {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-line bg-surface transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-line",
          collapsed ? "justify-center px-2" : "gap-2 pr-2 pl-4",
        )}
      >
        <BrandLockup compact={collapsed} className="min-w-0 flex-1" />
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="size-4.5" strokeWidth={1.75} aria-hidden />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center border-b border-line py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="size-4.5" strokeWidth={1.75} aria-hidden />
          </Button>
        </div>
      )}

      <SidebarContent collapsed={collapsed} counts={counts} />
    </aside>
  );
}

/** Off-canvas drawer below `lg`. */
export function MobileSidebar({ counts }: { counts: NavCounts }) {
  const { mobileOpen, closeMobile } = useSidebar();

  if (!mobileOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="overlay-in absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={closeMobile}
        aria-label="Close navigation"
      />

      <div
        className="drawer-in absolute inset-y-0 left-0 flex w-[min(17rem,85vw)] flex-col border-r border-line bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-line pr-2 pl-4">
          <BrandLockup className="min-w-0 flex-1" />
          <Button variant="ghost" size="icon-sm" onClick={closeMobile} aria-label="Close navigation">
            <X className="size-4.5" strokeWidth={1.75} aria-hidden />
          </Button>
        </div>

        <SidebarContent collapsed={false} counts={counts} onNavigate={closeMobile} />
      </div>
    </div>
  );
}
