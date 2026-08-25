"use client";

import { createContext, useContext } from "react";

import { can, type Permission } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/types";

/**
 * Makes the signed-in user available to Client Components.
 *
 * The value is resolved on the server in the app layout and handed down, so
 * there is no loading state and no client-side fetch - the user is present from
 * the first render.
 */
const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/** The signed-in user. Only valid inside the authenticated app shell. */
export function useSession(): SessionUser {
  const user = useContext(SessionContext);
  if (!user) throw new Error("useSession must be used inside <SessionProvider>");
  return user;
}

/** True when the signed-in user holds `permission`. */
export function usePermission(permission: Permission): boolean {
  const user = useSession();
  return can(user.role, permission);
}
