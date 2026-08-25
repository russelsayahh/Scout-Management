/**
 * Session token: a signed, base64url-encoded payload.
 *
 * Written against Web Crypto only, with no Node APIs, so the middleware can
 * verify a session in the Edge runtime. The payload carries just the user id
 * and an expiry - role and profile are always re-read from the store, so a
 * change to someone's role takes effect on their next request rather than
 * waiting for the cookie to be reissued.
 */

export const SESSION_COOKIE = "trailhead_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const DEV_SECRET = "trailhead-development-secret-do-not-use-in-production";

export interface SessionPayload {
  /** User id. */
  sub: string;
  /** Issued at, seconds since epoch. */
  iat: number;
  /** Expires at, seconds since epoch. */
  exp: number;
}

function secret(): string {
  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= 16) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET must be set to at least 16 characters in production. See .env.example.",
    );
  }
  return DEV_SECRET;
}

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let keyPromise: Promise<CryptoKey> | null = null;

function signingKey(): Promise<CryptoKey> {
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return keyPromise;
}

/** Signs a session for `userId`, valid for `SESSION_MAX_AGE_SECONDS`. */
export async function createSessionToken(userId: string): Promise<string> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + SESSION_MAX_AGE_SECONDS,
  };

  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(body));

  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/**
 * Verifies signature and expiry. Returns null for anything that does not check
 * out - a tampered payload, an unknown format, or an expired session.
 */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      base64UrlDecode(signature),
      encoder.encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as SessionPayload;
    if (typeof payload.sub !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
