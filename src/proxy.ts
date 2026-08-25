import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/**
 * Route protection (the Next.js 16 `proxy` convention, formerly `middleware`).
 *
 * This is the optimistic check the framework recommends here: is the request
 * carrying a validly signed, unexpired session? It never reads the user store.
 *
 * Authorisation - what a role may actually see - is decided in the app layout
 * and in each page, where the user record is loaded fresh, so a role change
 * takes effect immediately instead of waiting for a new cookie.
 *
 * Only `session.ts` is imported here, which is Web Crypto based and therefore
 * safe in the Edge runtime.
 */

/** Reachable without a session. */
const PUBLIC_PATHS = ["/login", "/register"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  // Signed in, but heading for the login or register page.
  if (session && isPublic(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!session && !isPublic(pathname)) {
    const loginUrl = new URL("/login", request.url);
    // Remember where they were going, so signing in resumes the journey.
    if (pathname !== "/") loginUrl.searchParams.set("from", `${pathname}${search}`);

    const response = NextResponse.redirect(loginUrl);
    // Clear a cookie that failed verification so it cannot loop.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the favicon and static files - matching
     * on a path without a file extension.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
