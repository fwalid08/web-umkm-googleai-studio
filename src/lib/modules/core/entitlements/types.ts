/** Entitlement types for feature access control. */

export type FeatureScope = "website" | "global";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired";

export interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  scope: FeatureScope;
  isPaid: boolean;
  siteTypes: string[] | null; // null = all site types
  requires: string[];
  conflicts: string[];
  isActive: boolean;
}

export interface PackFeature {
  packId: string;
  featureId: string;
  quota: number | null;        // null = boolean ON, number = quota
  includedTiers: string[];     // tiers that get this feature free
}

export interface SitePrice {
  siteType: string;
  tier: "free" | "starter" | "growth" | "enterprise";
  cycle: "monthly" | "yearly";
  price: number;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: "free" | "starter" | "growth" | "enterprise";
  status: SubscriptionStatus;
  siteType: string;
  packId: string | null;
  billingCycle: "monthly" | "yearly";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paidAt: Date | null;
}

export interface SubAddon {
  id: string;
  subscriptionId: string;
  websiteId: string;
  featureId: string;
  status: SubscriptionStatus;
  billingCycle: "monthly" | "yearly" | "once";
  priceCharged: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  paidAt: Date | null;
}

export interface GlobalSub {
  id: string;
  userId: string;
  featureId: string;
  status: SubscriptionStatus;
  billingCycle: "monthly" | "yearly" | "once";
  priceCharged: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  paidAt: Date | null;
}

export interface EntitlementContext {
  userId: string;
  websiteId?: string;
  subscription?: Subscription;
  subAddons: SubAddon[];
  globalSubs: GlobalSub[];
  userTier: "free" | "starter" | "growth" | "enterprise";
  siteType: string;
  packFeatures: PackFeature[];
  sitePrices: SitePrice[];
}

/** Result of entitlement check. */
export interface EntitlementResult {
  allowed: boolean;
  reason?: string;
  source?: "pack" | "addon" | "global" | "legacy" | "none";
  expiresAt?: Date;
  quota?: number | null;
}