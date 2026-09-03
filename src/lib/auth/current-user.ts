import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { can, type Permission } from "@/lib/auth/permissions";
import { getUser } from "@/lib/auth/service";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

/**
 * Reading the signed-in user in Server Components.
 *
 * The user is loaded fresh from the store on every request - the cookie only
 * proves identity - so a role change applies immediately. `cache` keeps that to
 * one read per request no matter how many components ask.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const payload = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  return getUser(payload.sub);
});

/** Redirects to the login page when there is no valid session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects signed-in users away from the login and register pages. */
export async function requireGuest(): Promise<void> {
  const user = await getCurrentUser();
  if (user) redirect("/");
}

/**
 * Returns the user only when they hold `permission`; otherwise null, so the
 * caller can render an access-denied state rather than bouncing the request.
 */
export async function userWithPermission(
  permission: Permission,
): Promise<SessionUser | null> {
  const user = await requireUser();
  return can(user.role, permission) ? user : null;
}
