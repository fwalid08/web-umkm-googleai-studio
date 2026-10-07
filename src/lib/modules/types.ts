/** Shared types for module system */

export interface Feature {
  id: string;
  name: string;
  category: string;
  description: string;
  scope: "website" | "global";
  isPaid: boolean;
  siteTypes: string[] | null;
  requires: string[];
  conflicts: string[];
  isActive: boolean;
  pricing: {
    monthly: number;
    yearly: number;
    usageBased?: boolean;
    pricePerHit?: number;
    freeHitsPerMonth?: number;
  };
  configSchema: Record<string, {
    type: "text" | "textarea" | "number" | "select" | "boolean" | "json";
    options?: Array<{ label: string; value: string }>;
    default?: unknown;
    description?: string;
  }>;
}

export interface PackFeature {
  packId: string;
  featureId: string;
  quota: number | null;
  includedTiers: string[];
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
  status: "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired";
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
  status: "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired";
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
  status: "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired";
  billingCycle: "monthly" | "yearly" | "once";
  priceCharged: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  paidAt: Date | null;
}

export interface UsageRecord {
  id: string;
  userId: string;
  websiteId: string | null;
  featureId: string;
  qty: number;
  referenceId: string | null;
  createdAt: Date;
}

export interface CoreModule {
  name: string;
  description: string;
  tables: string[];
}

/** Module catalog types (generated) */
export interface ModuleCatalog {
  features: Feature[];
  coreModules: CoreModule[];
}