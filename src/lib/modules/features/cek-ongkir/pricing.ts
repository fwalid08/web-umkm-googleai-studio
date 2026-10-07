/** Cek Ongkir pricing logic */

import type { CekOngkirConfig } from "./types";

export interface PricingResult {
  monthlyPrice: number;
  yearlyPrice: number;
  usagePricePerHit: number;
  freeHitsPerMonth: number;
}

/** Get pricing for cek_ongkir addon */
export function getCekOngkirPricing(): PricingResult {
  return {
    monthlyPrice: 25000,
    yearlyPrice: 250000, // ~17% discount
    usagePricePerHit: 50, // Rp 50 per API call after free quota
    freeHitsPerMonth: 1000,
  };
}

/** Calculate prorated price for mid-cycle enable */
export function calculateProratedPrice(
  monthlyPrice: number,
  daysRemaining: number,
  daysInPeriod: number
): number {
  const dailyRate = monthlyPrice / daysInPeriod;
  return Math.ceil(dailyRate * daysRemaining);
}

/** Calculate usage cost for current period */
export function calculateUsageCost(hitsUsed: number, freeHits: number, pricePerHit: number): number {
  const billableHits = Math.max(0, hitsUsed - freeHits);
  return billableHits * pricePerHit;
}

/** Check if usage exceeds fair use limit */
export function checkFairUse(hitsUsed: number, maxHitsPerMonth: number = 100000): { allowed: boolean; remaining: number } {
  return {
    allowed: hitsUsed < maxHitsPerMonth,
    remaining: Math.max(0, maxHitsPerMonth - hitsUsed),
  };
}

/** Get billing cycle dates */
export function getBillingCycleDates(cycleStart: Date, cycle: "monthly" | "yearly"): { start: Date; end: Date } {
  const start = new Date(cycleStart);
  const end = new Date(start);
  if (cycle === "monthly") {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return { start, end };
}

/** Format price for display */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}