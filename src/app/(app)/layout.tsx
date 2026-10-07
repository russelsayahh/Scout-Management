import { SessionProvider } from "@/components/auth/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import type { NavCounts } from "@/components/layout/sidebar";
import { countUpcomingActivities } from "@/lib/activities/service";
import { countOutstandingRegisters } from "@/lib/attendance/service";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { resolveTroopScope } from "@/lib/auth/troop-scope";
import { countUpcomingCamps } from "@/lib/camps/service";
import { countOverdueLoans } from "@/lib/equipment/service";
import { listLeaders } from "@/lib/leaders/service";
import { countActivePatrols } from "@/lib/patrols/service";
import { countCurrentScouts } from "@/lib/scouts/service";
import { listTroops } from "@/lib/troops/service";

/**
 * Wraps every in-app route in the sidebar + top bar chrome.
 *
 * `requireUser` is the second gate: the proxy has already turned away requests
 * with no valid session, and this reload of the user record is what the shell
 * and every page below it read.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const scope = await resolveTroopScope(user);

  // Only counts the role is allowed to see - no point badging a hidden item.
  const navCounts: NavCounts = {};
  if (can(user.role, "scouts.view")) navCounts.scouts = await countCurrentScouts(scope);
  if (can(user.role, "leaders.view")) navCounts.leaders = (await listLeaders(scope)).length;
  if (can(user.role, "patrols.view")) navCounts.patrols = await countActivePatrols(scope);
  if (can(user.role, "activities.view")) {
    navCounts.activities = await countUpcomingActivities(scope, new Date());
  }
  if (can(user.role, "camps.view")) navCounts.camps = await countUpcomingCamps(scope, new Date());
  // Registers still to take, because that is the number worth chasing. Unlike
  // the other counts it is left off entirely at zero: nothing outstanding is
  // good news, and a "0" chip would read as something needing attention.
  if (can(user.role, "attendance.view")) {
    const outstanding = await countOutstandingRegisters(scope, new Date());
    if (outstanding > 0) navCounts.attendance = outstanding;
  }
  // Kit that is late back, for the same reason: a zero here is good news.
  if (can(user.role, "equipment.view")) {
    const overdue = await countOverdueLoans(scope, new Date());
    if (overdue > 0) navCounts.equipment = overdue;
  }

  // The switcher always offers all six, regardless of which one is selected.
  const troops = (await listTroops()).map((troop) => ({ id: troop.id, name: troop.name }));
  const selectedTroopId = scope === "all" ? "all" : (scope[0] ?? "all");

  return (
    <SessionProvider user={user}>
      <AppShell navCounts={navCounts} troops={troops} selectedTroopId={selectedTroopId}>
        {children}
      </AppShell>
    </SessionProvider>
  );
}
