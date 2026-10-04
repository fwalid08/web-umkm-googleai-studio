import type { BuiltInTemplate, FullTemplateData } from "../types";
import type { Tier } from "@/types";
import type { Template } from "../template-types";
import { FOOD_TEMPLATE } from "./food";

export type BusinessCategory = "food" | "fashion" | "retail" | "handicraft" | "services";

export interface CatalogTemplate extends Template {
  designStyleId?: string;
  data: FullTemplateData;
}

export const CATEGORY_LABELS: Record<BusinessCategory | "all", string> = {
  all: "Semua",
  food: "Kuliner & Minuman",
  fashion: "Fashion & Hijab",
  retail: "Retail & Kelontong",
  handicraft: "Kerajinan Tangan",
  services: "Jasa & Servis",
};

export const BUILT_IN_CATALOG: CatalogTemplate[] = [FOOD_TEMPLATE];

export const ALL_TIERS = ["free", "starter", "growth", "enterprise"] as const;

/**
 * Rank paket — fondasi SEMUA tier gating template (client + server).
 * Aturan kumulatif: paket atas bisa memakai semua yang bisa dipakai paket
 * bawahnya. free(0) < starter(1) < growth(2) < enterprise(3).
 */
export const TIER_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  enterprise: 3,
};

/** Rank tier, atau undefined bila tier tak dikenal. */
export function tierRank(tier: string | null | undefined): number | undefined {
  if (typeof tier !== "string" || !tier) return undefined;
  return TIER_RANK[tier];
}

export function isCatalogTemplateAllowedForTier(
  tiers: readonly string[] | undefined,
  tier: string | null | undefined
): boolean {
  // Syarat kosong / tak dikenal = terbuka (template lama tanpa tier_requirement).
  const known = (tiers ?? []).filter(
    (t): t is string => typeof t === "string" && t in TIER_RANK
  );
  if (known.length === 0) return true;
  // Tier user belum diketahui (mis. masih loading) = terbuka sementara;
  // gating final tetap di server.
  if (!tier) return true;
  const userRank = TIER_RANK[tier];
  // Tier asing = tolak (fail-closed, sama seperti perilaku exact-match lama).
  if (userRank === undefined) return false;
  // Kumulatif: boleh bila rank user >= syarat minimum template.
  const minRequired = Math.min(...known.map((t) => TIER_RANK[t]));
  return userRank >= minRequired;
}

export function filterCatalogByTier<T extends { tiers?: readonly string[] }>(
  catalog: readonly T[],
  tier: string | null | undefined
): T[] {
  return catalog.filter((t) => isCatalogTemplateAllowedForTier(t.tiers, tier));
}

export function getCatalogByCategory(category: BusinessCategory | "all"): CatalogTemplate[] {
  if (category === "all") return [...BUILT_IN_CATALOG];
  return BUILT_IN_CATALOG.filter((t) => t.category === category);
}

export function getTemplateIdByCategory(category: BusinessCategory): string | null {
  return getCatalogByCategory(category)[0]?.id ?? BUILT_IN_CATALOG[0]?.id ?? null;
}

export function getCatalogTemplate(id: string): CatalogTemplate | undefined {
  return BUILT_IN_CATALOG.find((t) => t.id === id);
}