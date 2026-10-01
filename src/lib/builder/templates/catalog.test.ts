import { describe, expect, it } from "vitest";
import { DESIGN_STYLES, validateStyleContrast } from "../design-styles";
import { builderSectionToInstance } from "../migration";
import { ALL_TIERS, isCatalogTemplateAllowedForTier } from "./catalog";
import { isKnownHeaderVariant, isKnownFooterVariant } from "../chrome";
import { BUILT_IN_CATALOG } from "./catalog";
import { resolvePalette } from "../design-styles";
import type { BookingService } from "../types";

/**
 * TEMPLATE CONTRACT — model baru:
 * - Source of truth = template terpilih (bukan registry global).
 * - Varian milik template; style diwarisi template.
 * - Setiap template wajib memenuhi kontrak section inti UMKM.
 *
 * Menambah template baru = tambah 1 entri + kontrak ini otomatis menjaganya.
 */
const CORE_TYPES = [
  "hero",
  "features",
  "pricing",
  "booking",
  "testimonials",
  "gallery",
  "location",
  "faq",
  "contact",
] as const;

describe("template contract", () => {
  it("katalog terisi minimal 1 template profesional", () => {
    expect(BUILT_IN_CATALOG.length).toBeGreaterThan(0);
    for (const t of BUILT_IN_CATALOG) {
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.data.designStyleId ?? t.data.design_style_id).toBeTruthy();
    }
  });

  it("semua designStyleId terdaftar & lolos kontras", () => {
    for (const t of BUILT_IN_CATALOG) {
      const styleId = t.data.designStyleId ?? t.data.design_style_id;
      const style = DESIGN_STYLES.find((s) => s.id === styleId);
      expect(style, `${t.id}: style ${styleId} tak terdaftar`).toBeDefined();
      expect(validateStyleContrast(style!).valid, `${t.id}: kontras gagal`).toBe(true);
    }
  });

  it("semua section menunjuk tipe + varian terdaftar", () => {
    for (const t of BUILT_IN_CATALOG) {
      for (const s of t.data.sections ?? []) {
        // WAJIB cek ke `t.sections` (varian yang benar-benar dipakai kanvas,
        // sidebar, dan renderer), bukan SECTION_REGISTRY — registry itu legacy
        // dan punya daftar varian berbeda, sehingga validasi di sana tidak
        // menangkap seed yang tidak cocok dengan template.
        const def = t.sections.find((d) => d.type === s.type);
        expect(def, `${t.id}: tipe ${s.type} tak terdaftar`).toBeDefined();
        expect(
          def!.variants.some((v) => v.id === s.variant),
          `${t.id}: varian ${s.variant} tak ada di template (dipakai builderSectionToInstance → diam-diam jatuh ke varian pertama)`,
        ).toBe(true);
      }
    }
  });

  /**
   * Regression: `builderSectionToInstance()` menormalkan varian tak dikenal
   * ke `variants[0]`. Kalau seed menunjuk varian yang tidak ada, section
   * tampil dengan varian lain tanpa error — sulit dilacak. Guard ini
   * memastikan seed = resolve tanpa fallback.
   */
  it("setiap section seed resolve ke varian yang sama (tidak fallback diam-diam)", () => {
    for (const t of BUILT_IN_CATALOG) {
      for (const s of t.data.sections ?? []) {
        const resolved = builderSectionToInstance(s as never, t);
        expect(
          resolved.variantId,
          `${t.id}: seed ${s.type}/${s.variant} resolve jadi ${resolved.variantId} (fallback)`,
        ).toBe(s.variant);
      }
    }
  });

  it("setiap template memenuhi kontrak section inti UMKM", () => {
    for (const t of BUILT_IN_CATALOG) {
      const types = new Set((t.data.sections ?? []).map((s) => s.type));
      for (const core of CORE_TYPES) {
        expect(types.has(core), `${t.id}: section inti "${core}" wajib ada`).toBe(true);
      }
    }
  });

  it("setiap template punya nav header + seo + footer {year}", () => {    for (const t of BUILT_IN_CATALOG) {
      expect(t.data.header?.navItems?.length ?? 0, `${t.id}: nav kosong`).toBeGreaterThan(0);
      expect(t.data.header?.ctaText, `${t.id}: CTA header kosong`).toBeTruthy();
      expect(t.data.seo?.title?.length ?? 0, `${t.id}: seo kosong`).toBeGreaterThan(0);
      expect(t.data.footer?.text ?? "", `${t.id}: footer kosong`).toContain("{year}");
    }
  });

  it("section booking membawa kontrak config standar", () => {    for (const t of BUILT_IN_CATALOG) {
      const booking = (t.data.sections ?? []).filter((s) => s.type === "booking");
      expect(booking.length, `${t.id}: section booking wajib ada`).toBeGreaterThan(0);
      for (const b of booking) {
        const cfg = (b.config ?? {}) as Record<string, unknown>;
        expect(typeof cfg.title, `${t.id}: booking.title`).toBe("string");
        const services = cfg.services as BookingService[];
        expect(Array.isArray(services) && services.length > 0, `${t.id}: booking.services minimal 1`).toBe(true);
        for (const s of services) {
          expect(s.name?.length ?? 0, `${t.id}: service tanpa nama`).toBeGreaterThan(0);
        }
        expect(typeof cfg.success_message, `${t.id}: booking.success_message`).toBe("string");
      }
    }
  });

  it("tiers valid & template pertama terbuka untuk semua tier", () => {
    for (const t of BUILT_IN_CATALOG) {
      for (const tier of t.tiers ?? []) {
        expect(ALL_TIERS, `${t.id}: tier "${tier}" tak dikenal`).toContain(tier);
      }
    }
    // Kontrak saat ini: semua template boleh dipakai semua tier.
    // Mengunci ke tier tertentu = ubah `tiers` di catalog + test ini tetap hijau.
    for (const t of BUILT_IN_CATALOG) {
      for (const tier of ALL_TIERS) {
        expect(isCatalogTemplateAllowedForTier(t.tiers, tier), `${t.id} harus terbuka untuk ${tier}`).toBe(true);
      }
    }
  });

  it("helper tier: undefined = terbuka, daftar = dibatasi", () => {
    expect(isCatalogTemplateAllowedForTier(undefined, "free")).toBe(true);
    expect(isCatalogTemplateAllowedForTier([], "free")).toBe(true);
    expect(isCatalogTemplateAllowedForTier(["starter", "growth"], "free")).toBe(false);
    expect(isCatalogTemplateAllowedForTier(["starter", "growth"], "growth")).toBe(true);
  });

  it("varian header & footer terdaftar di chrome registry", () => {
    for (const t of BUILT_IN_CATALOG) {
      const hv = (t.data.header as { variant?: string } | undefined)?.variant ?? "standard";
      expect(isKnownHeaderVariant(hv), `${t.id}: varian header "${hv}" tak terdaftar`).toBe(true);
      const fs = t.data.footer?.style ?? "simple";
      expect(isKnownFooterVariant(fs), `${t.id}: varian footer "${fs}" tak terdaftar`).toBe(true);
    }
  });

  it("skema warna template lolos kontras (ganti skema tidak merusak)", () => {
    for (const t of BUILT_IN_CATALOG) {
      const styleId = t.data.designStyleId ?? t.data.design_style_id;
      const style = DESIGN_STYLES.find((s) => s.id === styleId)!;
      const effective = {
        ...style,
        palette: resolvePalette(style, (t.data.paletteOverride ?? t.data.palette_override ?? {}) as Record<string, string>),
      };
      const result = validateStyleContrast(effective);
      expect(result.valid, `${t.id}: skema bermasalah — ${result.issues.join("; ")}`).toBe(true);
    }
  });
});
