import { describe, expect, it } from "vitest";
import { DESIGN_STYLES, validateStyleContrast } from "../design-styles";
import { builderSectionToInstance } from "../migration";
import { ALL_TIERS, isCatalogTemplateAllowedForTier } from "./catalog";
import { isKnownHeaderVariant, isKnownFooterVariant } from "../chrome";
import { BUILT_IN_CATALOG } from "./catalog";
import { resolvePalette } from "../design-styles";
import { ALL_DESIGN_TYPES, type ConfigField } from "../template-types";
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

/**
 * Kontrak "template punya karakter desain sendiri".
 *
 * Ini menangkap masalah nyata: dulu 5 dari 6 template cukup `...PANGKAS_RAPI`
 * lalu override palet, sehingga semua render dengan DOM identik dan cuma beda
 * warna. Test di bawah memaksa tiap template benar-benar punya:
 * variannya sendiri, config-nya sendiri, dan `designType`.
 *
 * Syarat penuh hanya ditegakkan pada template yang sudah dimigrasi
 * (lihat `MIGRATED_TEMPLATES`) supaya suite hijau selama migrasi berjalan.
 * Tambahkan nama template ke sana setiap kali satu template selesai diotomi.
 */
const MIGRATED_TEMPLATES = new Set(["bengkel"]);

const MIN_HEADER_VARIANTS = 5;
const MIN_FOOTER_VARIANTS = 5;
const MIN_SECTION_VARIANTS = 3;

/**
 * Semua tipe section yang WAJIB tersedia di tiap template, meski tidak dipakai
 * di seed default-nya — syarat "mendukung section predefined builder".
 */
const ALL_SECTION_TYPES = [
  "hero", "features", "product_grid", "testimonials", "faq", "cta", "contact",
  "booking", "about", "gallery", "video", "team", "pricing", "newsletter",
  "divider", "marquee", "menu_board", "steps", "location",
] as const;

/**
 * Key config yang boleh ada di `defaultConfig` tanpa form field.
 *
 * - `showCta`/`showNav`/`showSocial`/`contentWidth`: sakelar chrome.
 * - `id`/`isExternal`/`enabled`: struktural item nav, bukan konten — form
 *   memang tidak menyediakannya (user tidak perlu mengubahnya per item).
 */
const IMPLICIT_CONFIG_KEYS = new Set([
  "showCta", "showNav", "showSocial", "contentWidth",
  "isExternal", "enabled", "key",
]);

/** Kunci config yang punya form field — termasuk isi `itemFields` (nested list). */
function collectFieldKeys(fields: ConfigField[]): Set<string> {
  const keys = new Set<string>();
  for (const f of fields) {
    keys.add(f.key);
    if (Array.isArray(f.itemFields)) {
      for (const k of collectFieldKeys(f.itemFields)) keys.add(k);
    }
  }
  return keys;
}

/** Kunci di seluruh value (skip `id` — pengenal internal, bukan konten). */
function collectConfigKeys(value: unknown, depth = 0): string[] {
  if (depth > 4 || value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((v) => collectConfigKeys(v, depth + 1));
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) => {
    if (k === "id") return [];
    if (v && typeof v === "object") return [k, ...collectConfigKeys(v, depth + 1)];
    return [k];
  });
}

describe("kontrak karakter desain per template", () => {
  const migrated = BUILT_IN_CATALOG.filter((t) => MIGRATED_TEMPLATES.has(t.id));

  it("hanya template bermigrasi yang diuji (sanity check)", () => {
    expect(migrated.length, "tambah template ke MIGRATED_TEMPLATES setelah diotomi").toBeGreaterThan(0);
  });

  it("setiap template punya designType yang valid", () => {
    for (const t of BUILT_IN_CATALOG) {
      expect(t.designType, `${t.id}: designType wajib diisi`).toBeTruthy();
      expect(ALL_DESIGN_TYPES, `${t.id}: designType "${t.designType}" tak dikenal`).toContain(t.designType);
    }
  });

  it("template bermigrasi punya >=5 varian header & >=5 varian footer", () => {
    for (const t of migrated) {
      expect(t.headers.length, `${t.id}: varian header`).toBeGreaterThanOrEqual(MIN_HEADER_VARIANTS);
      expect(t.footers.length, `${t.id}: varian footer`).toBeGreaterThanOrEqual(MIN_FOOTER_VARIANTS);
    }
  });

  /**
 * Tipe yang renderer-nya hanya punya SATU DOM, jadi tidak mungkin punya 3
 * varian yang benar-benar berbeda.
 *
 * `BookingSection` dan `MarqueeSection` di `section-renderer.tsx` tidak pernah
 * membaca `section.variant` sama sekali — declare 3 varian di situ hanya akan
 * menghasilkan 3 nama untuk 1 tampilan yang sama persis, yaitu masalah yang
 * justru sedang kita perbaiki.
 *
 * Kalau nanti salah satu dapat branch baru di renderer, HAPUS dari daftar ini
 * supaya ikut aturan 3 varian.
 */
const SINGLE_DOM_TYPES = new Set(['booking', 'marquee']);

it("template bermigrasi punya >=3 varian untuk SETIAP tipe section predefined", () => {
    for (const t of migrated) {
      for (const type of ALL_SECTION_TYPES) {
        const def = t.sections.find((s) => s.type === type);
        expect(def, `${t.id}: tipe section "${type}" tidak tersedia`).toBeDefined();
        if (SINGLE_DOM_TYPES.has(type)) continue;
        expect(def!.variants.length, `${t.id}/${type}: jumlah varian`).toBeGreaterThanOrEqual(MIN_SECTION_VARIANTS);
      }
    }
  });

  /**
   * `variant` BUKAN label bebas — nilainya adalah string yang diklik renderer
   * di `section-renderer.tsx` (`if (variant === 'hero-split')`). ID yang tidak
   * dikenali jatuh diam-diam ke branch default, jadi semua varian tampak sama
   * persis. Ini akar dari "template cuma beda warna".
   *
   * Daftar di bawah = ground truth dari `section-renderer.tsx`, DIAMAIKAN dengan
   * fallback yang disengaja.
   *
   * PENTING: `variant` tanpa branch eksplisit BUKAN otomatis bug — beberapa ID
   * sengaja jatuh ke blok default di akhir tiap komponen, dan itu didokumentasi
   * di sana (mis. hero: "Default: full-width terpusat (hero-full, hero-bg-image)").
   * Jadi daftar ini = { branch eksplisit } ∪ { id yang memang shared default }.
   *
   * Yang tidak boleh: id karangan yang jatuh diam-diam tanpa sengaja.
   */
  const RENDERED_VARIANTS = new Set([
    // Branch eksplisit di renderer.
    'about-centered', 'booking-split', 'contact-form-map', 'contact-split',
    'cta-card', 'cta-split', 'divider-image', 'divider-spacer', 'faq-accordion',
    'faq-grid', 'features-2col', 'features-list', 'features-masonry',
    'features-stacked', 'gallery-carousel', 'gallery-masonry', 'hero-card',
    'hero-left', 'hero-right', 'hero-split', 'hero-video', 'hero-video-bg',
    'newsletter-card', 'newsletter-split', 'pricing-single', 'product-carousel',
    'team-carousel', 'team-list', 'testimonials-carousel', 'testimonials-single',
    'video-bg', 'video-centered',
    // Sengaja jatuh ke blok default di akhir tiap komponen.
    'hero-full', 'hero-bg-image', 'features-3col', 'product-4col', 'product-3col',
    'product-2col', 'testimonials-grid', 'faq-list', 'cta-banner', 'contact-form',
    'booking-single', 'about-left', 'about-right', 'gallery-grid', 'video-full',
    'team-grid', 'pricing-3tier', 'pricing-2tier', 'newsletter-inline',
    'divider-line', 'marquee-band', 'menu-tabs', 'menu-list', 'steps-3col',
    'location-hours',
    // Branch yang ditambahkan saat migrasi bengkel (lihat section-renderer.tsx).
    'steps-horizontal', 'location-hours-wide', 'menu-grid', 'steps-numbered', 'location-card',
  ]);

  it("id varian section harus yang DI-RENDER (bukan id karangan)", () => {
    for (const t of BUILT_IN_CATALOG) {
      for (const s of t.sections) {
        for (const v of s.variants) {
          expect(
            RENDERED_VARIANTS.has(v.id),
            `${t.id}/${s.type}: id varian "${v.id}" tidak ada di section-renderer.tsx → diam-diam jatuh ke branch default (semua varian jadi sama)`,
          ).toBe(true);
        }
      }
    }
  });

  it("varian header/footer punya layout yang benar-benar dirender", () => {
    for (const t of migrated) {
      for (const h of t.headers) {
        expect(isKnownHeaderVariant(h.layout), `${t.id}/${h.id}: layout header "${h.layout}" tanpa branch`).toBe(true);
      }
      for (const f of t.footers) {
        expect(isKnownFooterVariant(f.layout), `${t.id}/${f.id}: layout footer "${f.layout}" tanpa branch`).toBe(true);
      }
    }
  });

  it("setiap varian punya mockup (preview galeri)", () => {
    for (const t of migrated) {
      for (const h of t.headers) expect(h.mockup, `${t.id}/${h.id}: mockup kosong`).toBeTruthy();
      for (const f of t.footers) expect(f.mockup, `${t.id}/${f.id}: mockup kosong`).toBeTruthy();
      for (const s of t.sections) {
        for (const v of s.variants) expect(v.mockup, `${t.id}/${s.type}/${v.id}: mockup kosong`).toBeTruthy();
      }
    }
  });

  /**
   * Syarat "tidak ada konten hardcoded": tiap key yang diisi di `defaultConfig`
   * harus punya form field, jadi user bisa mengubahnya dari sidebar.
   * Key tanpa form = konten mati yang tidak bisa diedit.
   */
  it("tiap key defaultConfig punya form field (tidak ada konten hardcoded)", () => {
    for (const t of migrated) {
      const check = (label: string, fields: ConfigField[], cfg: Record<string, unknown>) => {
        const editable = collectFieldKeys(fields);
        const orphans = [...new Set(collectConfigKeys(cfg))].filter(
          (k) => !editable.has(k) && !IMPLICIT_CONFIG_KEYS.has(k),
        );
        expect(orphans, `${t.id}/${label}: config tanpa form field`).toEqual([]);
      };
      for (const h of t.headers) check(h.id, h.configFields, h.defaultConfig);
      for (const f of t.footers) check(f.id, f.configFields, f.defaultConfig);
      for (const s of t.sections) {
        for (const v of s.variants) check(`${s.type}/${v.id}`, v.configFields, v.defaultConfig);
      }
    }
  });

  it("maxNavDepth seragam di seluruh varian header template", () => {
    for (const t of migrated) {
      const depths = new Set(t.headers.map((h) => h.maxNavDepth ?? 1));
      expect(depths.size, `${t.id}: maxNavDepth tidak seragam (${[...depths].join(", ")})`).toBe(1);
    }
  });

  it("template bermigrasi bukan turunan pangkas-rapi (guard regresi)", () => {
    const pangkas = BUILT_IN_CATALOG.find((t) => t.id === "pangkas-rapi")!;
    for (const t of migrated) {
      expect(
        t.headers.map((h) => h.id),
        `${t.id}: id varian header identik pangkas-rapi — belum diotomi`,
      ).not.toEqual(pangkas.headers.map((h) => h.id));
      expect(
        t.footers.map((f) => f.id),
        `${t.id}: id varian footer identik pangkas-rapi — belum diotomi`,
      ).not.toEqual(pangkas.footers.map((f) => f.id));
    }
  });
});
