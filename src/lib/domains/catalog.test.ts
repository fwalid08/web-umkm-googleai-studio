import { describe, expect, it } from "vitest";
import { normalizeSearch, simulateAvailability, TLD_CATALOG } from "./catalog";

describe("domain catalog", () => {
  it("katalog: .com bisa dibeli, .id/.co.id butuh dokumen", () => {
    expect(TLD_CATALOG.find((t) => t.tld === "com")?.buyable).toBe(true);
    expect(TLD_CATALOG.find((t) => t.tld === "id")?.requirement).toMatch(/KTP/);
  });

  it("normalisasi input berantakan", () => {
    expect(normalizeSearch("  Warung-BuToni ", "com")).toBe("warung-butoni.com");
    expect(normalizeSearch("https://www.tokoku.com/x", "com")).toBe("tokoku.com");
    expect(normalizeSearch("ab", "com")).toBeNull();
  });

  it("simulasi deterministik + nama umum diambil", () => {
    expect(simulateAvailability("toko.com")).toBe(false);
    expect(simulateAvailability("ab.com")).toBe(false);
    const a = simulateAvailability("warung-bu-toni-unik.com");
    expect(simulateAvailability("warung-bu-toni-unik.com")).toBe(a);
  });
});
