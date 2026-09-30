import { describe, expect, it, afterEach } from "vitest";
import {
  calcDomainPrice,
  formatIdr,
  retailPriceForProvider,
  wholesaleUsdToIdr,
} from "./pricing";

const ENV_KEYS = ["USD_TO_IDR_RATE", "DOMAIN_PRICE_MARGIN_PERCENT", "DOMAIN_GATEWAY_FEE_FLAT"] as const;
const saved: Record<string, string | undefined> = {};

function setEnv(patch: Record<string, string | undefined>) {
  for (const k of ENV_KEYS) {
    if (!(k in saved)) saved[k] = process.env[k];
    if (patch[k] === undefined) delete process.env[k];
    else process.env[k] = patch[k];
  }
}

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("domain pricing (Sprint 2)", () => {
  it("wholesale USD -> IDR pakai kurs env (default 15500)", () => {
    setEnv({ USD_TO_IDR_RATE: undefined, DOMAIN_PRICE_MARGIN_PERCENT: undefined, DOMAIN_GATEWAY_FEE_FLAT: undefined });
    // 11.31 USD (reseller .com) x 15500 = 175.305
    expect(wholesaleUsdToIdr(11.31)).toBe(175305);
  });

  it("calcDomainPrice = wholesale + margin 20% + fee, bulat ke 500", () => {
    setEnv({ USD_TO_IDR_RATE: "15500", DOMAIN_PRICE_MARGIN_PERCENT: "20", DOMAIN_GATEWAY_FEE_FLAT: "4000" });
    const p = calcDomainPrice(11.31);
    expect(p.wholesaleIdr).toBe(175305);
    expect(p.marginIdr).toBe(Math.round(175305 * 0.2)); // 35061
    expect(p.feeIdr).toBe(4000);
    const raw = 175305 + 35061 + 4000; // 214366
    expect(p.total).toBe(Math.ceil(raw / 500) * 500); // 214500
    expect(p.total % 500).toBe(0);
  });

  it("input negatif/NaN -> 0 (fail-safe, tidak throw)", () => {
    setEnv({ USD_TO_IDR_RATE: undefined, DOMAIN_PRICE_MARGIN_PERCENT: undefined, DOMAIN_GATEWAY_FEE_FLAT: undefined });
    expect(wholesaleUsdToIdr(-5)).toBe(0);
    expect(wholesaleUsdToIdr(NaN)).toBe(0);
    expect(calcDomainPrice(-5).total % 500).toBe(0);
  });

  it("env invalid -> fallback default", () => {
    setEnv({ USD_TO_IDR_RATE: "abc", DOMAIN_PRICE_MARGIN_PERCENT: "-1", DOMAIN_GATEWAY_FEE_FLAT: "" });
    expect(wholesaleUsdToIdr(1)).toBe(15500);
  });

  it("formatIdr id-ID", () => {
    expect(formatIdr(199000)).toBe("Rp199.000");
  });

  it("retailPriceForProvider: mock = katalog apa adanya", () => {
    setEnv({ USD_TO_IDR_RATE: "15500", DOMAIN_PRICE_MARGIN_PERCENT: "20", DOMAIN_GATEWAY_FEE_FLAT: "4000" });
    expect(retailPriceForProvider("mock", 199000)).toBe(199000);
  });

  it("retailPriceForProvider: real = grosir IDR + margin + fee (bulat 500)", () => {
    setEnv({ USD_TO_IDR_RATE: "15500", DOMAIN_PRICE_MARGIN_PERCENT: "20", DOMAIN_GATEWAY_FEE_FLAT: "4000" });
    const wholesaleIdr = wholesaleUsdToIdr(11.31); // 175305
    // Sama dengan calcDomainPrice(11.31).total = 214500
    expect(retailPriceForProvider("porkbun", wholesaleIdr)).toBe(calcDomainPrice(11.31).total);
  });

  it("retailPriceForProvider: fail-closed (0/negatif/NaN/provider asing -> 0)", () => {
    setEnv({ USD_TO_IDR_RATE: "15500", DOMAIN_PRICE_MARGIN_PERCENT: "20", DOMAIN_GATEWAY_FEE_FLAT: "4000" });
    expect(retailPriceForProvider("porkbun", 0)).toBe(0);
    expect(retailPriceForProvider("porkbun", -1)).toBe(0);
    expect(retailPriceForProvider("porkbun", NaN)).toBe(0);
  });
});
