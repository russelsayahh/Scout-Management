"use client";

import { ChevronsUpDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import { useSession } from "@/components/auth/session-provider";
import { BrandLockup } from "@/components/layout/brand-mark";
import { NavItem } from "@/components/layout/nav-item";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { TroopSwitcher } from "@/components/layout/troop-switcher";
import { Button } from "@/components/ui/button";
import { visibleSecondaryItems, visibleSections } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Live counts keyed by nav item, overriding the static badges. */
export type NavCounts = Record<string, number>;

/** Every troop, for the switcher and for resolving a leader's own troop name(s). */
export type NavTroops = { id: string; name: string }[];

/** Which troop is currently selected - `"all"` or one of the six troop ids. */
export type SelectedTroop = string;

/**
 * The troop the sidebar is scoped to. An administrator gets the switcher, so
 * they can change it; anyone else only ever sees their own assignment, which
 * is not theirs to change here.
 */
function TroopContext({ troops, selectedTroopId }: { troops: NavTroops; selectedTroopId: SelectedTroop }) {
  const { role, assignedTroopIds } = useSession();

  if (role === "administrator") {
    return (
      <div className="border-b border-line px-3 py-3">
        <TroopSwitcher troops={troops} selected={selectedTroopId} />
      </div>
    );
  }

  const names = assignedTroopIds
    .map((id) => troops.find((troop) => troop.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="border-b border-line px-3 py-3">
      <p className="truncate text-[12px] font-medium text-ink-secondary">
        {names.length > 0 ? names.join(", ") : "No troop assigned"}
      </p>
    </div>
  );
}

/** Nav body shared by the desktop rail and the mobile drawer. */
function SidebarContent({
  collapsed,
  counts,
  troops,
  selectedTroopId,
  onNavigate,
}: {
  collapsed: boolean;
  counts: NavCounts;
  troops: NavTroops;
  selectedTroopId: SelectedTroop;
  onNavigate?: () => void;
}) {
  // Only the sections this role can actually open are rendered.
  const { role, assignedTroopIds } = useSession();
  const sections = visibleSections(role);
  const secondary = visibleSecondaryItems(role);

  // An administrator's own troop switcher right above already says which
  // troop is in view, so this item stays a stable "Members" for them rather
  // than doubling that up - and it sidesteps "Scouts" reading as if it only
  // ever meant the troop of that name. A leader has no switcher, so their
  // reading is different: "Scouts" becomes their own troop's name whenever
  // they are looking at exactly one (their single assignment); with more
  // than one assigned, no single name would be honest, so it stays generic.
  const scoutsLabel =
    role === "administrator"
      ? "Members"
      : assignedTroopIds.length === 1
        ? (troops.find((troop) => troop.id === assignedTroopIds[0])?.name ?? null)
        : null;

  return (
    <>
      {!collapsed && <TroopContext troops={troops} selectedTroopId={selectedTroopId} />}

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
                  item={
                    item.key === "scouts" && scoutsLabel
                      ? { ...item, title: scoutsLabel }
                      : item
                  }
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
export function DesktopSidebar({
  counts,
  troops,
  selectedTroopId,
}: {
  counts: NavCounts;
  troops: NavTroops;
  selectedTroopId: SelectedTroop;
}) {
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

      <SidebarContent
        collapsed={collapsed}
        counts={counts}
        troops={troops}
        selectedTroopId={selectedTroopId}
      />
    </aside>
  );
}

/** Off-canvas drawer below `lg`. */
export function MobileSidebar({
  counts,
  troops,
  selectedTroopId,
}: {
  counts: NavCounts;
  troops: NavTroops;
  selectedTroopId: SelectedTroop;
}) {
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

        <SidebarContent
          collapsed={false}
          counts={counts}
          troops={troops}
          selectedTroopId={selectedTroopId}
          onNavigate={closeMobile}
        />
      </div>
    </div>
  );
}
