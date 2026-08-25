import { SessionProvider } from "@/components/auth/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import type { NavCounts } from "@/components/layout/sidebar";
import { requireUser } from "@/lib/auth/current-user";
import { can } from "@/lib/auth/permissions";
import { countCurrentScouts } from "@/lib/scouts/service";

/**
 * Wraps every in-app route in the sidebar + top bar chrome.
 *
 * `requireUser` is the second gate: the proxy has already turned away requests
 * with no valid session, and this reload of the user record is what the shell
 * and every page below it read.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  // Only counts the role is allowed to see - no point badging a hidden item.
  const navCounts: NavCounts = {};
  if (can(user.role, "scouts.view")) navCounts.scouts = await countCurrentScouts();

  return (
    <SessionProvider user={user}>
      <AppShell navCounts={navCounts}>{children}</AppShell>
    </SessionProvider>
  );
}
