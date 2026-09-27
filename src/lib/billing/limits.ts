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
      upgradeUrl: "/dashboard/billing",
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
    upgradeUrl: currentCount >= maxLimit ? "/dashboard/billing" : undefined,
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

// ---------------------------------------------------------------------------
// Tier limits & custom domain gate (Sprint 2 checkout, Sprint 4 enforcement).
// Nilai sinkron dengan migrasi 015 tier_limits + 012 plans.
// DB tier_limits diutamakan (dynamic update), fallback ke konstanta di bawah.
// ---------------------------------------------------------------------------

export interface TierLimits {
  maxWebsites: number;
  maxProducts: number;
  maxOrdersMonthly: number; // -1 = unlimited
  allowCustomDomain: boolean;
  includedDomains: number;
  allowAnalyticsExport: boolean;
  allowCustomerList: boolean;
  allowStockTracking: boolean;
  maxPages: number; // 0 = unlimited
}

export const TIER_LIMITS_DEFAULTS: Record<string, TierLimits> = {
  free: { maxWebsites: 1, maxProducts: 5, maxOrdersMonthly: 50, allowCustomDomain: false, includedDomains: 0, allowAnalyticsExport: false, allowCustomerList: false, allowStockTracking: false, maxPages: 0 },
  starter: { maxWebsites: 3, maxProducts: 50, maxOrdersMonthly: -1, allowCustomDomain: true, includedDomains: 1, allowAnalyticsExport: true, allowCustomerList: true, allowStockTracking: true, maxPages: 5 },
  growth: { maxWebsites: 10, maxProducts: 200, maxOrdersMonthly: -1, allowCustomDomain: true, includedDomains: 3, allowAnalyticsExport: true, allowCustomerList: true, allowStockTracking: true, maxPages: 0 },
  enterprise: { maxWebsites: 999, maxProducts: 9999, maxOrdersMonthly: -1, allowCustomDomain: true, includedDomains: 10, allowAnalyticsExport: true, allowCustomerList: true, allowStockTracking: true, maxPages: 0 },
};

/** Ambil limit tier: DB tier_limits dulu, fallback konstanta (display-safe, tidak throw). */
export async function getTierLimits(tier: string): Promise<TierLimits> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data } = await supabase.from("tier_limits").select("*").eq("tier", tier).maybeSingle();
    if (data) {
      const row = data as Record<string, unknown>;
      const num = (v: unknown, fb: number): number =>
        typeof v === "number" && Number.isFinite(v) ? v : fb;
      const bool = (v: unknown, fb: boolean): boolean =>
        typeof v === "boolean" ? v : fb;
      const fb = TIER_LIMITS_DEFAULTS[tier] ?? TIER_LIMITS_DEFAULTS.free;
      return {
        maxWebsites: num(row.max_websites, fb.maxWebsites),
        maxProducts: num(row.max_products, fb.maxProducts),
        maxOrdersMonthly: num(row.max_orders_monthly, fb.maxOrdersMonthly),
        allowCustomDomain: bool(row.allow_custom_domain, fb.allowCustomDomain),
        includedDomains: num(row.included_domains, fb.includedDomains),
        allowAnalyticsExport: bool(row.allow_analytics_export, fb.allowAnalyticsExport),
        allowCustomerList: bool(row.allow_customer_list, fb.allowCustomerList),
        allowStockTracking: bool(row.allow_stock_tracking, fb.allowStockTracking),
        maxPages: num(row.max_pages, fb.maxPages),
      };
    }
  } catch (err) {
    console.error("getTierLimits error:", err);
  }
  return TIER_LIMITS_DEFAULTS[tier] ?? TIER_LIMITS_DEFAULTS.free;
}

export interface DomainLimitCheckResult {
  ok: boolean;
  current: number;
  max: number;
  message?: string;
  upgradeUrl?: string;
}

/**
 * Gate checkout/renew domain: Free tidak boleh; tier berbayar dibatasi kuota
 * includedDomains (dihitung dari websites terverifikasi + domain_orders aktif).
 * Fail-closed saat DB error (tolak pembelian agar tidak over-limit).
 */
export async function checkCustomDomainLimit(userId: string, tier: string): Promise<DomainLimitCheckResult> {
  const upgradeUrl = "/dashboard/billing";
  const limits = await getTierLimits(tier);
  if (!limits.allowCustomDomain) {
    return {
      ok: false,
      current: 0,
      max: 0,
      message: "Custom domain tidak tersedia di paket Free. Upgrade ke Starter untuk domain profesional.",
      upgradeUrl,
    };
  }
  try {
    const supabase = createServiceSupabaseClient();
    const [{ count: verifiedSites }, { count: activeOrders }] = await Promise.all([
      supabase.from("websites").select("id", { count: "exact", head: true })
        .eq("user_id", userId).not("custom_domain", "is", null).eq("custom_domain_verified", true),
      supabase.from("domain_orders").select("id", { count: "exact", head: true })
        .eq("user_id", userId).eq("status", "active"),
    ]);
    const current = Math.max(verifiedSites ?? 0, activeOrders ?? 0);
    if (current >= limits.includedDomains) {
      return {
        ok: true, // boleh beli tambahan (bayar per domain), tapi flag kuota habis untuk upsell
        current,
        max: limits.includedDomains,
        message: `Kuota domain termasuk paket habis (${current}/${limits.includedDomains}). Domain tambahan ditagih per tahun.`,
        upgradeUrl,
      };
    }
    return { ok: true, current, max: limits.includedDomains };
  } catch (err) {
    console.error("checkCustomDomainLimit error:", err);
    return { ok: false, current: 0, max: limits.includedDomains, message: "Gagal memeriksa kuota domain.", upgradeUrl };
  }
}