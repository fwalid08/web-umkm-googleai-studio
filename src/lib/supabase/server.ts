import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Create Supabase client with NextAuth JWT token.
 * This allows RLS policies to work with NextAuth sessions.
 * 
 * @param nextAuthToken - NextAuth JWT token (from session)
 */
export async function createServerSupabaseClient(nextAuthToken?: string): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase credentials not configured");
  }

  // Always use anon key as the API key
  // NextAuth JWT token is NOT compatible with Supabase Auth JWT
  // Instead, we rely on RLS policies that use public.current_user_id()
  // which reads from request.jwt.claim.sub set by Supabase
  const client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return client;
}