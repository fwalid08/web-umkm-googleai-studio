import type {
  Feature,
  PackFeature,
  Subscription,
  SubAddon,
  GlobalSub,
  EntitlementContext,
  EntitlementResult,
  FeatureScope,
} from "./types";

const TIER_RANK = {
  free: 0,
  starter: 1,
  growth: 2,
  enterprise: 3,
} as const;

type Tier = keyof typeof TIER_RANK;

/** Check if tier A >= tier B. */
function tierMeets(tierA: Tier, tierB: Tier): boolean {
  return TIER_RANK[tierA] >= TIER_RANK[tierB];
}

/** Check if subscription is currently active (including grace period). */
function isSubscriptionActive(sub: Subscription | undefined, now: Date = new Date()): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.cancelAtPeriodEnd && sub.currentPeriodEnd < now) return false;
  return sub.currentPeriodEnd >= now;
}

/** Check if sub-addon is currently active. */
function isAddonActive(addon: SubAddon, now: Date = new Date()): boolean {
  if (addon.status !== "active") return false;
  if (addon.cancelAtPeriodEnd && addon.currentPeriodEnd < now) return false;
  return addon.currentPeriodEnd >= now;
}

/** Check if global sub is currently active. */
function isGlobalSubActive(globalSub: GlobalSub, now: Date = new Date()): boolean {
  if (globalSub.status !== "active") return false;
  return globalSub.currentPeriodEnd >= now;
}

/** Check if feature is included in pack for given tier. */
function packIncludesFeature(
  packFeatures: PackFeature[],
  featureId: string,
  tier: Tier
): { included: boolean; quota: number | null } | null {
  const pf = packFeatures.find((p) => p.featureId === featureId);
  if (!pf) return null;

  const included = pf.includedTiers.some((t) => tierMeets(tier, t as Tier));
  return { included, quota: pf.quota };
}

/** Check if addon is active for website. */
function addonActiveForWebsite(
  subAddons: SubAddon[],
  websiteId: string,
  featureId: string,
  now: Date = new Date()
): { active: boolean; expiresAt?: Date; quota?: number | null } {
  const addon = subAddons.find(
    (a) => a.websiteId === websiteId && a.featureId === featureId && isAddonActive(a, now)
  );
  if (!addon) return { active: false };
  return { active: true, expiresAt: addon.currentPeriodEnd, quota: null };
}

/** Check if global module is active for user. */
function globalModuleActive(
  globalSubs: GlobalSub[],
  featureId: string,
  now: Date = new Date()
): { active: boolean; expiresAt?: Date } {
  const sub = globalSubs.find((g) => g.featureId === featureId && isGlobalSubActive(g, now));
  if (!sub) return { active: false };
  return { active: true, expiresAt: sub.currentPeriodEnd };
}

/** Main entitlement check - single enforcement gate. */
export function hasFeature(
  context: EntitlementContext,
  featureId: string,
  now: Date = new Date()
): EntitlementResult {
  const { subscription, subAddons, globalSubs, userTier, siteType, packFeatures } = context;

  // 1. Find feature definition
  const feature = context.packFeatures.find((pf) => pf.featureId === featureId);
  // Note: In real implementation, feature would come from mod_features table
  // For now, we check via packFeatures and addons

  // 2. Website-scoped features
  if (context.websiteId) {
    // Check pack inclusion (tier-based)
    if (subscription && subscription.siteType === siteType) {
      const packCheck = packIncludesFeature(packFeatures, featureId, userTier);
      if (packCheck?.included) {
        return {
          allowed: true,
          source: "pack",
          quota: packCheck.quota,
        };
      }
    }

    // Check addon (website-scoped)
    const addonCheck = addonActiveForWebsite(subAddons, context.websiteId, featureId, now);
    if (addonCheck.active) {
      return {
        allowed: true,
        source: "addon",
        expiresAt: addonCheck.expiresAt,
        quota: addonCheck.quota,
      };
    }
  }

  // 3. Global-scoped features
  const globalCheck = globalModuleActive(globalSubs, featureId, now);
  if (globalCheck.active) {
    return {
      allowed: true,
      source: "global",
      expiresAt: globalCheck.expiresAt,
    };
  }

  // 4. Pack bonus for global features (e.g., analytics_export in Growth+)
  if (subscription && subscription.siteType === siteType) {
    const packCheck = packIncludesFeature(packFeatures, featureId, userTier);
    if (packCheck?.included) {
      return {
        allowed: true,
        source: "pack",
        quota: packCheck.quota,
      };
    }
  }

  // 5. Legacy fallback (during migration)
  const legacyCheck = checkLegacyFallback(featureId, userTier, context.websiteId);
  if (legacyCheck.allowed) {
    return { ...legacyCheck, source: "legacy" };
  }

  // 6. No access
  return {
    allowed: false,
    reason: `Feature "${featureId}" not enabled. Upgrade tier or purchase add-on.`,
    source: "none",
  };
}

/** Legacy fallback using old TIER_LIMITS_DEFAULTS. */
function checkLegacyFallback(
  featureId: string,
  tier: Tier,
  websiteId?: string
): EntitlementResult {
  // Map legacy allowX to feature IDs
  const legacyMap: Record<string, string[]> = {
    allowCustomDomain: ["custom_domain"],
    allowAnalyticsExport: ["analytics_export"],
    allowCustomerList: ["customer_list"],
    allowStockTracking: ["stock_tracking"],
  };

  for (const [legacyKey, features] of Object.entries(legacyMap)) {
    if (features.includes(featureId)) {
      // This would check TIER_LIMITS_DEFAULTS[tier][legacyKey]
      // For now, return denied to force migration
      return { allowed: false, reason: "Legacy fallback disabled - migrate to new system" };
    }
  }

  return { allowed: false };
}

/** Check feature with quota (for metered features). */
export function hasFeatureWithQuota(
  context: EntitlementContext,
  featureId: string,
  quantity: number = 1,
  now: Date = new Date()
): EntitlementResult & { remainingQuota?: number } {
  const result = hasFeature(context, featureId, now);

  if (!result.allowed || result.quota === null) {
    return result;
  }

  // In real implementation, would check mod_usage for current period usage
  // For now, assume unlimited if quota not tracked
  return { ...result, remainingQuota: result.quota };
}

/** Get all active features for a website. */
export function getActiveFeaturesForWebsite(
  context: EntitlementContext,
  now: Date = new Date()
): string[] {
  const features = new Set<string>();

  // Pack features
  if (context.subscription && context.subscription.siteType === context.siteType) {
    for (const pf of context.packFeatures) {
      if (pf.includedTiers.some((t) => tierMeets(context.userTier, t as Tier))) {
        features.add(pf.featureId);
      }
    }
  }

  // Addon features
  for (const addon of context.subAddons) {
    if (addon.websiteId === context.websiteId && isAddonActive(addon, now)) {
      features.add(addon.featureId);
    }
  }

  // Global features (bonus from pack)
  for (const globalSub of context.globalSubs) {
    if (isGlobalSubActive(globalSub, now)) {
      features.add(globalSub.featureId);
    }
  }

  return [...features];
}

/** Check if user can enable addon (dependencies met). */
export function canEnableAddon(
  context: EntitlementContext,
  featureId: string,
  allFeatures: Feature[],
  now: Date = new Date()
): { allowed: boolean; missingDeps: string[]; reason?: string } {
  const feature = allFeatures.find((f) => f.id === featureId);
  if (!feature) return { allowed: false, missingDeps: [], reason: "Feature not found" };

  if (feature.scope !== "website") {
    return { allowed: false, missingDeps: [], reason: "Not a website-scoped addon" };
  }

  const missingDeps: string[] = [];
  for (const depId of feature.requires) {
    const depResult = hasFeature(context, depId, now);
    if (!depResult.allowed) {
      missingDeps.push(depId);
    }
  }

  if (missingDeps.length > 0) {
    return { allowed: false, missingDeps, reason: `Missing required features: ${missingDeps.join(", ")}` };
  }

  return { allowed: true, missingDeps: [] };
}

/** Check if user can disable addon (no dependents active). */
export function canDisableAddon(
  context: EntitlementContext,
  featureId: string,
  allFeatures: Feature[],
  now: Date = new Date()
): { allowed: boolean; blockedBy: string[]; reason?: string } {
  const activeFeatures = getActiveFeaturesForWebsite(context, now);
  const blockedBy: string[] = [];

  for (const activeId of activeFeatures) {
    const activeFeature = allFeatures.find((f) => f.id === activeId);
    if (activeFeature?.requires.includes(featureId)) {
      blockedBy.push(activeId);
    }
  }

  if (blockedBy.length > 0) {
    return { allowed: false, blockedBy, reason: `Required by active features: ${blockedBy.join(", ")}` };
  }

  return { allowed: true, blockedBy: [] };
}