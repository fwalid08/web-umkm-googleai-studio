/**
 * Product Tier Limits Helper
 * Sprint 1 — Products Management
 * Enforces product limits per tier at API level
 */

import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { TIER_WEBSITE_FALLBACK } from "@/lib/billing/pricing";
import { isDemoUserId } from "@/lib/mock/store";
import { PRODUCT_TIER_LIMITS, type ProductTierLimits } from "@/types/products";

// Re-export single source (F3-1) agar import lama "@/lib/billing/limits" tetap jalan.
export { PRODUCT_TIER_LIMITS };

export interface ProductLimitCheckResult {
  ok: boolean;
  currentCount: number;
  maxLimit: number;
  tier: string;
  upgradeUrl?: string;
}

export interface ImageLimitCheckResult {
  ok: boolean;
  currentCount: number;
  maxLimit: number;
}

/**
 * Info limit produk untuk ditampilkan di UI (F3-3).
 * Dipakai GET /api/user/products supaya client tidak menghitung ulang batas tier.
 */
export interface ProductLimitInfo extends ProductLimitCheckResult {
  maxImagesPerProduct: number;
  maxFileSizeMb: number;
}

/**
 * Get product tier limits for a tier
 */
export function getProductTierLimits(tier: string): ProductTierLimits {
  return PRODUCT_TIER_LIMITS[tier] || PRODUCT_TIER_LIMITS.free;
}

/**
 * Check product count limit for a website
 */
export async function checkProductLimit(
  userId: string,
  websiteId: string
): Promise<ProductLimitCheckResult> {
  // Demo users: use mock store
  if (isDemoUserId(userId)) {
    const { getDemoProducts } = await import("@/lib/mock/store");
    return getProductLimitInfo(userId, getDemoProducts(websiteId).length, "free");
  }

  try {
    const supabase = createServiceSupabaseClient();

    // Count current products for website
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("website_id", websiteId);

    return getProductLimitInfo(userId, count ?? 0);
  } catch (err) {
    console.error("checkProductLimit error:", err);
    // Fail-closed: deny if DB error
    return {
      ok: false,
      currentCount: 0,
      maxLimit: 1,
      tier: "free",
      upgradeUrl: "/dashboard/settings/billing",
    };
  }
}

/**
 * Resolve tier + limit efektif untuk `currentCount` yang sudah diketahui.
 * Tidak melakukan count query tambahan (F3-3) — endpoint list produk sudah punya
 * `count`, jadi client cukup mengonsumsi hasilnya tanpa menghitung ulang batas tier.
 *
 * @param forcedTier dipakai untuk demo user (mock store selalu dianggap free tier).
 */
export async function getProductLimitInfo(
  userId: string,
  currentCount: number,
  forcedTier?: string
): Promise<ProductLimitInfo> {
  let tier = forcedTier || "free";
  let planMax: number | null = null;

  if (!forcedTier) {
    try {
      const supabase = createServiceSupabaseClient();

      // Get user tier and plan
      const { data: user } = await supabase
        .from("users")
        .select("tier, plan_id, plans!users_plan_id_fkey(max_products)")
        .eq("id", userId)
        .maybeSingle();

      const u = user as { tier?: string; plans?: { max_products?: number } | null } | null;
      tier = u?.tier || "free";
      planMax = u?.plans?.max_products ?? null;
    } catch (err) {
      // Info display only — degradasi ke free tier, jangan fail-closed.
      console.error("getProductLimitInfo error:", err);
    }
  }

  const limits = getProductTierLimits(tier);
  const maxLimit = planMax && planMax > 0 ? planMax : limits.maxProducts;

  return {
    ok: currentCount < maxLimit,
    currentCount,
    maxLimit,
    maxImagesPerProduct: limits.maxImagesPerProduct,
    maxFileSizeMb: limits.maxFileSizeMb,
    tier,
    upgradeUrl: currentCount >= maxLimit ? "/dashboard/settings/billing" : undefined,
  };
}

/**
 * Check image count limit for a product
 */
export async function checkProductImageLimit(
  userId: string,
  productId: string,
  additionalImages: number
): Promise<ImageLimitCheckResult> {
  if (isDemoUserId(userId)) {
    // Demo users: no image limit enforcement in mock
    return { ok: true, currentCount: 0, maxLimit: 3 };
  }

  try {
    const supabase = createServiceSupabaseClient();

    // Get user tier
    const { data: user } = await supabase
      .from("users")
      .select("tier")
      .eq("id", userId)
      .maybeSingle();

    const tier = (user as { tier?: string } | null)?.tier || "free";
    const limits = getProductTierLimits(tier);

    // Count current images for product
    const { count } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    const currentCount = count ?? 0;

    return {
      ok: currentCount + additionalImages <= limits.maxImagesPerProduct,
      currentCount,
      maxLimit: limits.maxImagesPerProduct,
    };
  } catch (err) {
    console.error("checkProductImageLimit error:", err);
    return { ok: false, currentCount: 0, maxLimit: 0 };
  }
}

/**
 * Check variant count limit for a product
 */
export async function checkProductVariantLimit(
  userId: string,
  productId: string
): Promise<ImageLimitCheckResult> {
  if (isDemoUserId(userId)) {
    return { ok: false, currentCount: 0, maxLimit: 0 }; // Free tier no variants
  }

  try {
    const supabase = createServiceSupabaseClient();

    const { data: user } = await supabase
      .from("users")
      .select("tier")
      .eq("id", userId)
      .maybeSingle();

    const tier = (user as { tier?: string } | null)?.tier || "free";
    const limits = getProductTierLimits(tier);

    if (limits.maxVariantsPerProduct === 0) {
      return { ok: false, currentCount: 0, maxLimit: 0 };
    }

    const { count } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    const currentCount = count ?? 0;

    return {
      ok: currentCount < limits.maxVariantsPerProduct,
      currentCount,
      maxLimit: limits.maxVariantsPerProduct,
    };
  } catch (err) {
    console.error("checkProductVariantLimit error:", err);
    return { ok: false, currentCount: 0, maxLimit: 0 };
  }
}

/**
 * Get file size limit for tier
 */
export function getFileSizeLimit(tier: string): number {
  return getProductTierLimits(tier).maxFileSizeMb * 1024 * 1024; // bytes
}

/**
 * Format limit error message
 */
export function formatLimitError(limitType: "products" | "images" | "variants" | "fileSize", current: number, max: number): string {
  const messages: Record<string, string> = {
    products: `Batas produk tercapai (${current}/${max}). Upgrade paket untuk menambah lebih banyak.`,
    images: `Batas gambar per produk tercapai (${current}/${max}).`,
    variants: `Variasi produk tidak tersedia untuk paket ini.`,
    fileSize: `Ukuran file melebihi batas ${Math.round(max / 1024 / 1024)}MB.`,
  };
  return messages[limitType] || "Batas tercapai";
}