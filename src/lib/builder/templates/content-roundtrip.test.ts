import { describe, expect, it } from "vitest";
import { getCatalogTemplate } from "./catalog";
import { seedTemplateSections } from "../migration";
import { instanceToBuilderSection, mergeConfigWithVariantDefaults } from "../migration";
import { renderVariantHtml } from "../behaviour-script";

/**
 * Guard "konten tersimpan bersama template" (kasus nyata: live site tampil
 * kerangka tanpa isi setelah ganti template).
 *
 * Rantai yang dikunci: seed `data.sections[].config` -> instance store ->
 * payload PUT (`instanceToBuilderSection`) -> merge live
 * (`mergeConfigWithVariantDefaults`) -> render tanpa placeholder kosong.
 */
describe("konten template tersimpan & ter-render penuh", () => {
  const t = getCatalogTemplate("laundry-emerald");
  if (!t) throw new Error("template laundry-emerald tidak ada di katalog");

  it("seed config utuh sampai ke instance store", () => {
    const instances = seedTemplateSections(t, (t.data.sections ?? []) as never);
    expect(instances.length).toBe((t.data.sections ?? []).length);
    for (const seed of t.data.sections ?? []) {
      const inst = instances.find(
        (i) => i.type === seed.type && i.variantId === seed.variant,
      );
      expect(inst, `seed ${seed.type}/${seed.variant} hilang`).toBeDefined();
      for (const [k, v] of Object.entries(seed.config ?? {})) {
        expect(
          JSON.stringify((inst!.config as Record<string, unknown>)[k]),
          `${seed.type}/${seed.variant}: key "${k}" tidak terbawa ke instance`,
        ).toBe(JSON.stringify(v));
      }
    }
  });

  it("instance -> payload PUT mempertahankan config", () => {
    const instances = seedTemplateSections(t, (t.data.sections ?? []) as never);
    for (const inst of instances) {
      const payload = instanceToBuilderSection(inst);
      expect(payload.variant).toBe(inst.variantId);
      expect(payload.config).toEqual(inst.config);
    }
  });

  it("config lama milik template lain tidak membuat placeholder kosong", () => {
    // Simulasi: config tersimpan milik template kuliner dirender dengan
    // varian emerald (terjadi saat ganti template) — merge default di bawah.
    const heroDef = t.sections.find((s) => s.type === "hero");
    const heroVariant = heroDef!.variants[0] as {
      html: string;
      defaultConfig: Record<string, unknown>;
    };
    const oldFoodConfig = {
      headline: "Rasa Rumahan",
      subheadline: "Masakan autentik",
      cta_text: "Lihat Menu",
      cta_link: "#menu",
    };
    const merged = mergeConfigWithVariantDefaults(heroVariant.defaultConfig, oldFoodConfig);
    // Default emerald tetap ada (badge, image, rating_text, ...).
    for (const k of ["badge", "headline", "image", "rating_text", "phone", "cta_text"]) {
      expect(merged[k], `key "${k}" kosong setelah merge`).toBeTruthy();
    }
    // Nilai lama yang kuncinya sama tetap menang.
    expect(merged["headline"]).toBe("Rasa Rumahan");
    const out = renderVariantHtml(heroVariant.html, merged);
    expect(out).not.toContain("[object Object]");
    expect(out.length).toBeGreaterThan(500);
  });
});
