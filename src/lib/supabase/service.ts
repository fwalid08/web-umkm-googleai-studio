import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client - BYPASSES RLS
 * HANYA pakai di server-side untuk operasi admin:
 * - createUser / admin.listUsers
 * - insert ke public.users saat registrasi
 * - cron verify domain
 * JANGAN expose ke client!
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
