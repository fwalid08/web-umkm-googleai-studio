import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { Website } from "@/types";
import { getDemoActiveWebsite, getDemoOwnedWebsite, isDemoUserId } from "@/lib/mock/store";

/**
 * Sprint 03 — Website aktif user.
 * SERVER-ONLY, service-role: session NextAuth sudah terautentikasi,
 * jadi aman. Dipakai semua API website-scoped (agar Google user
 * yang tak punya Supabase Auth session tetap jalan).
 */

export async function getActiveWebsite(userId: string): Promise<Website | null> {
  if (isDemoUserId(userId)) {
    return (getDemoActiveWebsite(userId) as unknown as Website) ?? null;
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data: user } = await supabase
      .from("users")
      .select("active_website_id")
      .eq("id", userId)
      .maybeSingle();
    const activeId = (user as { active_website_id?: string } | null)?.active_website_id;

    if (activeId) {
      const { data } = await supabase
        .from("websites")
        .select("*")
        .eq("id", activeId)
        .eq("user_id", userId)
        .maybeSingle();
      if (data) return data as Website;
    }

    const { data: fallback } = await supabase
      .from("websites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (fallback) {
      await supabase.from("users").update({ active_website_id: (fallback as Website).id }).eq("id", userId);
    }
    return (fallback as Website | null) ?? null;
  } catch {
    return null;
  }
}

export async function getOwnedWebsite(userId: string, websiteId: string): Promise<Website | null> {
  if (isDemoUserId(userId)) {
    return (getDemoOwnedWebsite(userId, websiteId) as unknown as Website) ?? null;
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from("websites")
      .select("*")
      .eq("id", websiteId)
      .eq("user_id", userId)
      .maybeSingle();
    return (data as Website | null) ?? null;
  } catch {
    return null;
  }
}
