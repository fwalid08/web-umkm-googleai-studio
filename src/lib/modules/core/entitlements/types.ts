/** Entitlement types for feature access control. */

// Single source of truth lives in ../../types — re-exported here so existing
// `from "./types"` imports keep working without duplicate declarations.
import type {
  Feature,
  PackFeature,
  SitePrice,
  Subscription,
  SubAddon,
  GlobalSub,
} from "../../types";
export type {
  Feature,
  PackFeature,
  SitePrice,
  Subscription,
  SubAddon,
  GlobalSub,
};

export type FeatureScope = "website" | "global";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired";

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