import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The Postgres connection for the whole app, via Supabase.
 *
 * Server-only, and deliberately the service role key rather than the anon
 * key: nothing here ever runs in a browser (every domain is Server Components
 * and Server Actions), and the app's own role/troop authorization is the real
 * access control, the same way it was when storage was a local file nobody
 * outside the process could reach. Row Level Security is not the gate here -
 * `src/lib/auth/permissions.ts` and `src/lib/auth/troop-scope.ts` are.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill in your Supabase project's ` +
        `URL and service role key (Project Settings -> API).`,
    );
  }
  return value;
}

let client: SupabaseClient | null = null;

/** The shared Supabase client, created once and reused across requests. */
export function supabase(): SupabaseClient {
  client ??= createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
  return client;
}
