/**
 * Pricing terunifikasi — sumber kebenaran bisnis terbaru (UI billing-panel.tsx).
 * Sinkron dengan supabase/migrations/012_pricing_unify.sql:
 *   free 0/0/1, starter 99000/79000/3, growth 249000/199000/10, enterprise 599000/479000/999.
 * DB `plans` (price_monthly, price_yearly_monthly) diutamakan saat checkout;
 * konstanta di sini hanya fallback bila DB tidak terjangkau / kolom belum migrasi.
 */

export const TIER_PRICE_FALLBACK = {
  free: { monthly: 0, yearly_monthly: 0 },
  starter: { monthly: 99000, yearly_monthly: 79000 },
  growth: { monthly: 249000, yearly_monthly: 199000 },
  enterprise: { monthly: 599000, yearly_monthly: 479000 },
} as const;

export type BillingTier = keyof typeof TIER_PRICE_FALLBACK;
export type PaidTier = Exclude<BillingTier, "free">;
export type BillingCycle = "monthly" | "yearly";

/** Gross amount dalam IDR. Yearly = harga/bulan tahunan x 12 (hemat 20%). */
export function calcGross(tier: BillingTier, cycle: BillingCycle): number {
  const p = TIER_PRICE_FALLBACK[tier];
  if (!p) throw new Error(`Unknown tier: ${tier}`);
  return cycle === "yearly" ? p.yearly_monthly * 12 : p.monthly;
}

/** Alias kompatibilitas (nama lama di route checkout). */
export const calcGrossAmount = calcGross;

export const TIER_WEBSITE_LIMIT: Record<BillingTier, number> = {
  free: 1,
  starter: 3,
  growth: 10,
  enterprise: 999,
};
