/** Legacy fallback for TIER_LIMITS_DEFAULTS during migration. */

import type { EntitlementResult } from "./types";

/** Legacy tier limits from existing system. */
export const LEGACY_TIER_LIMITS = {
  free: {
    maxWebsites: 1,
    maxProducts: 5,
    maxOrdersMonthly: 100,
    allowCustomDomain: false,
    includedDomains: 0,
    allowAnalyticsExport: false,
    allowCustomerList: false,
    allowStockTracking: false,
    maxPages: 3,
  },
  starter: {
    maxWebsites: 3,
    maxProducts: 50,
    maxOrdersMonthly: 1000,
    allowCustomDomain: true,
    includedDomains: 1,
    allowAnalyticsExport: false,
    allowCustomerList: true,
    allowStockTracking: true,
    maxPages: 10,
  },
  growth: {
    maxWebsites: 10,
    maxProducts: 500,
    maxOrdersMonthly: 10000,
    allowCustomDomain: true,
    includedDomains: 3,
    allowAnalyticsExport: true,
    allowCustomerList: true,
    allowStockTracking: true,
    maxPages: 50,
  },
  enterprise: {
    maxWebsites: 999,
    maxProducts: 9999,
    maxOrdersMonthly: 999999,
    allowCustomDomain: true,
    includedDomains: 10,
    allowAnalyticsExport: true,
    allowCustomerList: true,
    allowStockTracking: true,
    maxPages: 999,
  },
} as const;

export type LegacyTier = keyof typeof LEGACY_TIER_LIMITS;

/** Check legacy limit for a feature. */
export function checkLegacyLimit(
  featureId: string,
  tier: LegacyTier,
  websiteId?: string
): EntitlementResult {
  const limits = LEGACY_TIER_LIMITS[tier];

  // Map feature IDs to legacy limit keys
  const featureToLimit: Record<string, keyof typeof limits> = {
    custom_domain: "allowCustomDomain",
    analytics_export: "allowAnalyticsExport",
    customer_list: "allowCustomerList",
    stock_tracking: "allowStockTracking",
    // Quota-based limits
    max_products: "maxProducts",
    max_orders_monthly: "maxOrdersMonthly",
    max_pages: "maxPages",
  };

  const limitKey = featureToLimit[featureId];
  if (!limitKey) return { allowed: false, source: "legacy" };

  const value = limits[limitKey];
  if (typeof value === "boolean") {
    return { allowed: value, source: "legacy" };
  }

  // For quota limits, return allowed with quota
  return { allowed: true, quota: value as number, source: "legacy" };
}

/** Check product limit (legacy). */
export function checkProductLimit(tier: LegacyTier, currentCount: number): EntitlementResult {
  const limit = LEGACY_TIER_LIMITS[tier].maxProducts;
  return {
    allowed: currentCount < limit,
    quota: limit,
    source: "legacy",
    reason: currentCount >= limit ? `Product limit reached (${limit})` : undefined,
  };
}

/** Check order limit (legacy). */
export function checkOrderLimit(tier: LegacyTier, currentMonthCount: number): EntitlementResult {
  const limit = LEGACY_TIER_LIMITS[tier].maxOrdersMonthly;
  return {
    allowed: currentMonthCount < limit,
    quota: limit,
    source: "legacy",
    reason: currentMonthCount >= limit ? `Monthly order limit reached (${limit})` : undefined,
  };
}

/** Check page limit (legacy). */
export function checkPageLimit(tier: LegacyTier, currentCount: number): EntitlementResult {
  const limit = LEGACY_TIER_LIMITS[tier].maxPages;
  return {
    allowed: currentCount < limit,
    quota: limit,
    source: "legacy",
    reason: currentCount >= limit ? `Page limit reached (${limit})` : undefined,
  };
}

/** Get legacy tier limits for display. */
export function getLegacyTierLimits(tier: LegacyTier) {
  return LEGACY_TIER_LIMITS[tier];
}