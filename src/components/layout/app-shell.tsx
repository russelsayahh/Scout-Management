import {
  DesktopSidebar,
  MobileSidebar,
  type NavCounts,
  type NavTroops,
  type SelectedTroop,
} from "@/components/layout/sidebar";
import { SidebarProvider } from "@/components/layout/sidebar-provider";
import { Topbar } from "@/components/layout/topbar";

/**
 * Application chrome: persistent rail from `lg` up, off-canvas drawer below it,
 * a sticky top bar, and a single scroll region for page content.
 *
 * `children` are server-rendered pages passed straight through.
 */
export function AppShell({
  children,
  navCounts,
  troops,
  selectedTroopId,
}: {
  children: React.ReactNode;
  /** Live nav badge counts, resolved by the layout. */
  navCounts: NavCounts;
  /** The six troops, for the administrator's switcher and for resolving a leader's own troop name(s). */
  troops: NavTroops;
  /** `"all"` or the one troop id an administrator currently has selected. */
  selectedTroopId: SelectedTroop;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh overflow-hidden bg-page">
        <DesktopSidebar counts={navCounts} troops={troops} selectedTroopId={selectedTroopId} />
        <MobileSidebar counts={navCounts} troops={troops} selectedTroopId={selectedTroopId} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />

          <main
            id="main-content"
            className="scrollbar-slim flex-1 overflow-y-auto focus-visible:outline-none"
          >
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
