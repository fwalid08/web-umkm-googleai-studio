/**
 * Akses template public untuk tenant — cerminan intent RLS policy
 * "Templates library access" (migrasi 036_consolidate_templates_unified).
 *
 * Aturan kumulatif (satu sumber kebenaran: TIER_RANK di templates/catalog):
 * paket atas bisa memakai semua yang bisa dipakai paket bawahnya.
 * RLS di tabel templates_library saat ini DISABLED (migrasi 026), jadi
 * gating tier ditegakkan di API route memakai helper ini.
 */
import { ALL_TIERS, TIER_RANK } from "./templates/catalog";

/** Daftar tier_requirement yang boleh dilihat tier user. null = semua. */
export function allowedTierRequirements(tier: string | null | undefined): string[] | null {
  if (tier === "enterprise") return null;
  const rank = typeof tier === "string" ? TIER_RANK[tier] : undefined;
  if (rank === undefined) return ["free"];
  return ALL_TIERS.filter((t) => (TIER_RANK[t] ?? 0) <= rank);
}

export interface PublicTemplateRow {
  scope?: unknown;
  is_system_template?: unknown;
  tier_requirement?: unknown;
}

/** Cek satu baris public boleh dilihat tier user (dipakai untuk guard baca per-item). */
export function isPublicTemplateVisible(
  row: PublicTemplateRow,
  tier: string | null | undefined,
): boolean {
  if (row.scope !== "public") return false;
  const req = typeof row.tier_requirement === "string" ? row.tier_requirement : null;
  if (req === null) return true;
  const allowed = allowedTierRequirements(tier);
  if (allowed === null) return true;
  return allowed.includes(req);
}

/** Normalisasi tier dari session (fallback aman: free). */
export function sessionTier(session: unknown): string {
  const tier = (session as { user?: { tier?: unknown } } | null)?.user?.tier;
  return typeof tier === "string" && tier ? tier : "free";
}
