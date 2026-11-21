import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client. Uses the service role key, which bypasses RLS, so this
 * module must never be imported from a client component.
 */
let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && secretKey(),
  );
}

/** Accepts the current secret key and the legacy service_role JWT. */
export function secretKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = secretKey();
  if (!url || !key) {
    throw new Error("Supabase env vars are missing");
  }
  cached ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
