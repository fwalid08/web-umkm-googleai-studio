import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Website } from "@/types";
import { getDemoActiveWebsite, getDemoOwnedWebsite, isDemoUserId } from "@/lib/mock/store";

/**
 * Sprint 03 — Website aktif user.
 * SERVER-ONLY, uses SECURITY DEFINER functions for access control.
 * Called from API routes that have user session via cookies.
 */

export async function getActiveWebsite(userId: string): Promise<Website | null> {
  if (isDemoUserId(userId)) {
    return (getDemoActiveWebsite(userId) as unknown as Website) ?? null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .rpc('get_active_website', { p_user_id: userId });
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0] as Website;
  } catch {
    return null;
  }
}

export async function getOwnedWebsite(userId: string, websiteId: string): Promise<Website | null> {
  if (isDemoUserId(userId)) {
    return (getDemoOwnedWebsite(userId, websiteId) as unknown as Website) ?? null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .rpc('get_website_by_id', { p_website_id: websiteId, p_user_id: userId });
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0] as Website;
  } catch {
    return null;
  }
}
