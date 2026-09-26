import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { TIER_WEBSITE_FALLBACK } from "@/lib/billing/pricing";
import { getDemoWebsiteLimit, isDemoUserId } from "@/lib/mock/store";

/**
 * Sprint 03 US-02/US-05 — Limit jumlah website per plan (live dari DB).
 * Fallback tier jika plan_id null (sinkron seed 006).
 */

export function resolveMaxWebsites(
  tier: string | null | undefined,
  planMax: number | null | undefined
): number {
  if (typeof planMax === "number" && planMax > 0) return planMax;
  return TIER_WEBSITE_FALLBACK[tier ?? "free"] ?? 1;
}

/**
 * P0-2 Trial enforcement — expired jika tier free + trial_ends_at terisi + sudah lewat.
 * Tier berbayar tidak pernah expired; trial_ends_at null = free murni (bukan expired).
 */
export function isTrialExpired(
  trialEndsAt: string | null | undefined,
  tier: string | null | undefined
): boolean {
  if (tier !== "free") return false;
  if (trialEndsAt == null) return false;
  const ends = new Date(trialEndsAt).getTime();
  if (Number.isNaN(ends)) return false;
  return Date.now() > ends;
}

/** Satu sumber kebenaran pesan blokir trial (dipakai trial-response.ts → NextResponse 402). */
export function trialBlockMessage(reason: "edit" | "create"): string {
  return reason === "edit"
    ? "Masa trial habis. Upgrade untuk melanjutkan mengedit website."
    : "Masa trial habis. Upgrade untuk membuat website baru.";
}

export async function checkWebsiteLimit(userId: string): Promise<{
  ok: boolean;
  count: number;
  max: number;
}> {
  if (isDemoUserId(userId)) {
    return getDemoWebsiteLimit(userId);
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data: user } = await supabase
      .from("users")
      .select("tier, plan_id, plans!users_plan_id_fkey(max_websites)")
      .eq("id", userId)
      .maybeSingle();
    const u = user as { tier?: string; plans?: { max_websites?: number } | null } | null;
    const max = resolveMaxWebsites(u?.tier, u?.plans?.max_websites ?? null);
    const { count } = await supabase
      .from("websites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const n = count ?? 0;
    return { ok: n < max, count: n, max };
  } catch {
    // Fail-closed: saat DB error, tolak pembuatan baru agar tidak over-limit
    return { ok: false, count: 0, max: 1 };
  }
}
