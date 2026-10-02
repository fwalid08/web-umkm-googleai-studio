import type { BuiltInTemplate, FullTemplateData } from "../types";
import type { Tier } from "@/types";
import type { Template } from "../template-types";
import { PANGKAS_RAPI_TEMPLATE } from "./pangkas-rapi";
import { BENGKEL_TEMPLATE } from "./bengkel";
import { WARUNG_MAKAN_TEMPLATE } from "./warung-makan";
import { BUTIK_HIJAB_TEMPLATE } from "./butik-hijab";
import { TOKO_KELONTONG_TEMPLATE } from "./toko-kelontong";
import { KERAJINAN_TANGAN_TEMPLATE } from "./kerajinan-tangan";

export type BusinessCategory = "food" | "fashion" | "retail" | "handicraft" | "services";

/**
 * Catalog template untuk galeri - menggunakan BuiltInTemplate dengan data property
 * yang berisi FullTemplateData untuk kompatibilitas dengan customize components
 * Juga menyertakan root-level Template properties (headers, footers, sections, theme)
 * untuk kompatibilitas dengan V3 renderer.
 */
export interface CatalogTemplate extends Template {
  // Template sudah punya: headers, footers, sections, theme, id, name, description, category, tiers
  // BuiltInTemplate sudah punya data: FullTemplateData
  // Tambahkan properti root-level untuk kompatibilitas dengan API & customize components
  // category: BusinessCategory;  // already in Template
  // tiers?: Tier[];  // already in Template
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

export const BUILT_IN_CATALOG: CatalogTemplate[] = [
  PANGKAS_RAPI_TEMPLATE as CatalogTemplate,
  BENGKEL_TEMPLATE as CatalogTemplate,
  WARUNG_MAKAN_TEMPLATE as CatalogTemplate,
  BUTIK_HIJAB_TEMPLATE as CatalogTemplate,
  TOKO_KELONTONG_TEMPLATE as CatalogTemplate,
  KERAJINAN_TANGAN_TEMPLATE as CatalogTemplate,
];

/** Semua tier yang dikenal — untuk validasi kontrak katalog. */
export const ALL_TIERS = ["free", "starter", "growth", "enterprise"] as const;

/**
 * Apakah template katalog boleh dipakai tier ini?
 * `tiers` kosong/undefined = semua tier boleh (default terbuka).
 * Tier tak dikenal (null/undefined) = fail-open untuk tampilan;
 * penegakan sesungguhnya tetap di API (PUT) yang punya tier asli user.
 */
export function isCatalogTemplateAllowedForTier(
  tiers: readonly string[] | undefined,
  tier: string | null | undefined
): boolean {
  if (!tiers || tiers.length === 0) return true;
  if (!tier) return true;
  return tiers.includes(tier);
}

/** Saring katalog builtin sesuai tier user (untuk galeri). */
export function filterCatalogByTier<T extends { tiers?: readonly string[] }>(
  catalog: readonly T[],
  tier: string | null | undefined
): T[] {
  return catalog.filter((t) => isCatalogTemplateAllowedForTier(t.tiers, tier));
}

/** Ambil template per kategori usaha (tetap ada untuk kompatibilitas galeri). */
export function getCatalogByCategory(category: BusinessCategory | "all"): CatalogTemplate[] {
  if (category === "all") return BUILT_IN_CATALOG;
  return BUILT_IN_CATALOG.filter((t) => t.category === category);
}

/** Map category (API template_name) -> template store ID (slug). */
export function getTemplateIdByCategory(category: BusinessCategory): string | null {
  const template = BUILT_IN_CATALOG.find((t) => t.category === category);
  return template?.id ?? null;
}
