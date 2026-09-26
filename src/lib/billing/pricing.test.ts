import { describe, expect, it } from "vitest";
import {
  TIER_PRICE_FALLBACK,
  TIER_WEBSITE_LIMIT,
  calcGross,
} from "./pricing";

// P2-1: pricing terunifikasi = kebenaran bisnis terbaru (billing-panel.tsx PLANS)
// + 012_pricing_unify.sql. Yearly = harga/bulan tahunan x 12 (hemat 20%).

describe("pricing unify (012)", () => {
  it("fallback monthly/yearly_monthly per tier sinkron dengan 012", () => {
    expect(TIER_PRICE_FALLBACK.free).toEqual({ monthly: 0, yearly_monthly: 0 });
    expect(TIER_PRICE_FALLBACK.starter).toEqual({ monthly: 99000, yearly_monthly: 79000 });
    expect(TIER_PRICE_FALLBACK.growth).toEqual({ monthly: 249000, yearly_monthly: 199000 });
    expect(TIER_PRICE_FALLBACK.enterprise).toEqual({
      monthly: 599000,
      yearly_monthly: 479000,
    });
  });

  it("calcGross monthly = harga bulanan", () => {
    expect(calcGross("free", "monthly")).toBe(0);
    expect(calcGross("starter", "monthly")).toBe(99000);
    expect(calcGross("growth", "monthly")).toBe(249000);
    expect(calcGross("enterprise", "monthly")).toBe(599000);
  });

  it("calcGross yearly = yearly_monthly x 12", () => {
    expect(calcGross("free", "yearly")).toBe(0);
    expect(calcGross("starter", "yearly")).toBe(79000 * 12);
    expect(calcGross("growth", "yearly")).toBe(199000 * 12);
    expect(calcGross("enterprise", "yearly")).toBe(479000 * 12);
  });

  it("yearly hemat 20% vs 12x monthly (tier berbayar)", () => {
    for (const tier of ["starter", "growth", "enterprise"] as const) {
      const full = TIER_PRICE_FALLBACK[tier].monthly * 12;
      expect(calcGross(tier, "yearly")).toBeLessThan(full);
      expect(calcGross(tier, "yearly") / full).toBeCloseTo(0.8, 2);
    }
  });

  it("limit website sinkron dengan 012 (free1 starter3 growth10 enterprise999)", () => {
    expect(TIER_WEBSITE_LIMIT).toEqual({ free: 1, starter: 3, growth: 10, enterprise: 999 });
  });
});
