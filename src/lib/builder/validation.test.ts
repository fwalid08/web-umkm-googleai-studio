import { describe, expect, it } from "vitest";
import { countProductItems, mergeAndValidateSections } from "./validation";
import type { SectionConfig } from "@/types";

// Debt test Sprint 01: whitelist + required + limit Free.
const template: SectionConfig[] = [
  { id: "hero", type: "hero", label: "Hero", default_props: {}, required: true, order: 1 },
  { id: "catalog", type: "product_grid", label: "Katalog", default_props: { items: [] }, required: false, order: 2 },
];

describe("mergeAndValidateSections", () => {
  it("tolak section di luar whitelist", () => {
    const r = mergeAndValidateSections(template, [{ id: "ngawur" }]);
    expect(r.ok).toBe(false);
  });

  it("required tidak boleh dimatikan", () => {
    const r = mergeAndValidateSections(template, [{ id: "hero", enabled: false }]);
    expect(r.ok).toBe(false);
  });

  it("urutan ikut template", () => {
    const r = mergeAndValidateSections(template, [{ id: "catalog" }, { id: "hero" }]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sections.map((s) => s.id)).toEqual(["hero", "catalog"]);
  });
});

describe("countProductItems", () => {
  it("hitung item product_grid aktif", () => {
    const r = mergeAndValidateSections(template, [
      { id: "catalog", content: { items: [{}, {}, {}, {}, {}, {}] } },
    ]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(countProductItems(r.sections)).toBe(6);
  });
});
