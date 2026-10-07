import { cookies } from "next/headers";

import type { SessionUser } from "@/lib/auth/types";
import { isTroopId } from "@/lib/troops/store";

/**
 * Troop-level authorization, on top of the role permissions in `permissions.ts`.
 *
 * A permission string says which *actions* a role may take; a `TroopScope`
 * says which *records* a request may see or change. Every list/query in the
 * app takes one of these and filters by it before anything else runs, and
 * every create/edit action re-derives it from the session rather than trusting
 * a troop id submitted in the request - that is what makes it impossible for a
 * leader to widen their own access by editing a URL or a hidden field.
 */

export const SELECTED_TROOP_COOKIE = "selected_troop";

/** `"all"` only ever applies to an administrator viewing every troop at once. */
export type TroopScope = "all" | string[];

/**
 * The troop scope for `user`.
 *
 * A leader's scope is always their own `assignedTroopIds` - nothing about it
 * comes from the request. An administrator's scope comes from the troop they
 * have chosen to view (the `selected_troop` cookie); anything other than a
 * real troop id, including no cookie at all, means every troop.
 */
export async function resolveTroopScope(user: SessionUser): Promise<TroopScope> {
  if (user.role !== "administrator") return user.assignedTroopIds;

  const jar = await cookies();
  const selected = jar.get(SELECTED_TROOP_COOKIE)?.value;
  if (!selected || selected === "all") return "all";

  return (await isTroopId(selected)) ? [selected] : "all";
}

/** True when `troopId` falls inside `scope`. */
export function inScope(scope: TroopScope, troopId: string): boolean {
  return scope === "all" || scope.includes(troopId);
}

/** `scope` narrowed to real ids, for building a filter set or an options list. */
export function scopeTroopIds(scope: TroopScope, allTroopIds: string[]): string[] {
  return scope === "all" ? allTroopIds : allTroopIds.filter((id) => scope.includes(id));
}
