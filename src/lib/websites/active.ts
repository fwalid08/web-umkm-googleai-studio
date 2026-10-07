import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { Website } from "@/types";
import { getDemoActiveWebsite, getDemoOwnedWebsite, isDemoUserId } from "@/lib/mock/store";

/**
 * Sprint 03 — Website aktif user.
 * SERVER-ONLY. Queries are scoped by the authenticated NextAuth user ID.
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
    if (user?.active_website_id) {
      const { data: active, error: activeError } = await supabase
        .from("ws_websites")
        .select("*")
        .eq("id", user.active_website_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!activeError && active) return active as Website;
    }

    const { data, error } = await supabase
      .from("ws_websites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data as Website;
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
    const { data, error } = await supabase
      .from("ws_websites")
      .select("*")
      .eq("id", websiteId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as Website;
  } catch {
    return null;
  }
}
