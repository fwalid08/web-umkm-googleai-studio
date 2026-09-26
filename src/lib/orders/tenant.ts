import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isValidSubdomain } from "@/lib/tenant";

/**
 * Sprint 02 Sesi A — Resolve tenant untuk guest checkout.
 * SERVER-ONLY: service-role karena guest tanpa auth.uid (RLS anon INSERT diblok).
 * Mirror pola lib/builder/public.ts: hanya kolom public-safe yang di-SELECT.
 */

export interface TenantRef {
  userId: string;
  websiteId: string;
  subdomain: string;
}

function normalizeDomain(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Terima subdomain (tenant-xxx) ATAU custom domain (tokoku.com).
 * Return null jika tidak dikenal / custom belum verified.
 */
export async function resolveTenantId(subdomainOrDomain: string): Promise<TenantRef | null> {
  const key = normalizeDomain(subdomainOrDomain);
  if (!key || key.length > 255) return null;
  try {
    const supabase = createServiceSupabaseClient();

    // 1. Coba sebagai subdomain (format ketat + reserved, selaras public.ts)
    if (isValidSubdomain(key)) {
      const { data } = await supabase
        .from("websites")
        .select("id, user_id, subdomain")
        .eq("subdomain", key)
        .maybeSingle();
      if (data)
        return {
          userId: data.user_id as string,
          websiteId: data.id as string,
          subdomain: data.subdomain as string,
        };
    }

    // 2. Coba sebagai custom domain (harus verified)
    if (key.includes(".")) {
      const { data } = await supabase
        .from("websites")
        .select("id, user_id, subdomain")
        .eq("custom_domain", key)
        .eq("custom_domain_verified", true)
        .maybeSingle();
      if (data)
        return {
          userId: data.user_id as string,
          websiteId: data.id as string,
          subdomain: data.subdomain as string,
        };
    }
  } catch {
    return null;
  }

  return null;
}
