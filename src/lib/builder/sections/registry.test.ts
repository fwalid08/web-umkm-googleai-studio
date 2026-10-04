import { describe, expect, it } from "vitest";
import { SECTION_REGISTRY, getSectionVariant } from "./registry";

/** Guard: setiap tipe section terdaftar lengkap agar picker, canvas, dan live site konsisten. */
describe("SECTION_REGISTRY", () => {
  it("memuat 18 tipe section", () => {
    const keys = Object.keys(SECTION_REGISTRY);
    for (const t of ["hero", "marquee", "menu_board", "steps", "location", "about", "testimonials", "contact"]) {
      expect(keys, `tipe ${t} hilang`).toContain(t);
    }
    expect(keys.length).toBeGreaterThanOrEqual(18);
  });

  it("setiap tipe punya ≥1 varian dengan defaultConfig objek", () => {
    for (const def of Object.values(SECTION_REGISTRY)) {
      expect(def.variants.length, def.type).toBeGreaterThan(0);
      for (const v of def.variants) {
        expect(v.id.length, def.type).toBeGreaterThan(0);
        expect(v.name.length, `${def.type}/${v.id}`).toBeGreaterThan(0);
        expect(typeof v.defaultConfig, `${def.type}/${v.id}`).toBe("object");
      }
    }
  });

  it("padding default ritme konsisten (64/24 vertikal, 24 gutter)", () => {
    // Varian konten memakai padding wrapper 64/24 agar ritme antar-section seragam.
    // Marquee pengecualian (0) karena pita full-bleed.
    for (const def of Object.values(SECTION_REGISTRY)) {
      for (const v of def.variants) {
        const pad = v.defaultStyle?.padding;
        if (def.type === "marquee") {
          expect(pad?.top, `${def.type}/${v.id}`).toBe(0);
          continue;
        }
        if (pad) {
          expect(pad.top, `${def.type}/${v.id}`).toBe(64);
          expect(pad.left, `${def.type}/${v.id}`).toBe(24);
        }
      }
    }
  });

  it("menu_board membawa grup + item contoh", () => {
    const menu = getSectionVariant("menu_board", "menu-tabs");
    const groups = menu?.defaultConfig.groups as Array<{ items: Array<{ name: string; price: string }> }>;
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].items.length).toBeGreaterThan(0);
    expect(groups[0].items[0].price).toMatch(/Rp/);

    const loc = getSectionVariant("location", "location-hours");
    expect((loc?.defaultConfig.hours as unknown[]).length).toBeGreaterThan(0);
    expect(String(loc?.defaultConfig.button_link)).toMatch(/wa\.me/);

    const steps = getSectionVariant("steps", "steps-3col");
    expect((steps?.defaultConfig.items as unknown[]).length).toBe(3);

    const marquee = getSectionVariant("marquee", "marquee-band");
    expect((marquee?.defaultConfig.items as unknown[]).length).toBeGreaterThan(0);
  });
});
