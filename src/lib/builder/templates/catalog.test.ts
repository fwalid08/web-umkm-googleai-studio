import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { builderSectionToInstance } from "../migration";
import { ALL_TIERS, isCatalogTemplateAllowedForTier } from "./catalog";
import { isKnownHeaderVariant, isKnownFooterVariant } from "../chrome";
import { BUILT_IN_CATALOG } from "./catalog";
import { GENERATED_CATALOG, GENERATED_TEMPLATE_FOLDERS } from "./catalog.generated";
import { resolvePalette } from "../design-styles";
import { validateColorScheme } from "../color-schemes";
import { FONT_CATEGORIES } from "../font-categories";
import { type ConfigField } from "../template-types";

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
      // Palet + tipografi kini hidup di `theme` (design style dihapus di 046).
      expect(t.theme.palette.primary).toBeTruthy();
      expect(t.theme.typography.headingFont).toBeTruthy();
      expect(t.theme.typography.bodyFont).toBeTruthy();
    }
  });

  it("font template terdaftar di FONT_CATEGORIES yang dipakai StyleSelector", () => {
    const known = new Set(FONT_CATEGORIES.flatMap((c) => c.fonts));
    for (const t of BUILT_IN_CATALOG) {
      for (const font of [t.theme.typography.headingFont, t.theme.typography.bodyFont]) {
        expect(known.has(font), `${t.id}: font "${font}" tak ada di FONT_CATEGORIES`).toBe(true);
      }
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

  it("helper tier: kumulatif — paket atas bisa memakai milik paket bawahnya", () => {
    // free terlihat oleh semua
    for (const tier of ALL_TIERS) {
      expect(isCatalogTemplateAllowedForTier(["free"], tier), `free harus terbuka untuk ${tier}`).toBe(true);
    }
    // starter terlihat oleh starter ke atas
    expect(isCatalogTemplateAllowedForTier(["starter"], "free")).toBe(false);
    expect(isCatalogTemplateAllowedForTier(["starter"], "starter")).toBe(true);
    expect(isCatalogTemplateAllowedForTier(["starter"], "growth")).toBe(true);
    expect(isCatalogTemplateAllowedForTier(["starter"], "enterprise")).toBe(true);
    // growth terlihat oleh growth ke atas
    expect(isCatalogTemplateAllowedForTier(["growth"], "starter")).toBe(false);
    expect(isCatalogTemplateAllowedForTier(["growth"], "growth")).toBe(true);
    expect(isCatalogTemplateAllowedForTier(["growth"], "enterprise")).toBe(true);
    // enterprise hanya untuk enterprise
    expect(isCatalogTemplateAllowedForTier(["enterprise"], "growth")).toBe(false);
    expect(isCatalogTemplateAllowedForTier(["enterprise"], "enterprise")).toBe(true);
    // syarat null/undefined = terbuka (template lama tanpa tier_requirement)
    expect(isCatalogTemplateAllowedForTier([null] as unknown as string[], "free")).toBe(true);
    expect(isCatalogTemplateAllowedForTier([undefined] as unknown as string[], "starter")).toBe(true);
    // tier user asing = tolak (fail-closed); tier belum diketahui = terbuka
    expect(isCatalogTemplateAllowedForTier(["free"], "pro")).toBe(false);
    expect(isCatalogTemplateAllowedForTier(["starter"], null)).toBe(true);
    expect(isCatalogTemplateAllowedForTier(["starter"], undefined)).toBe(true);
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
      // Palet efektif = palet bawaan template + override miliknya.
      const effective = resolvePalette(
        {
          ...t.theme,
          id: t.id,
          name: t.name,
          description: t.description,
          effects: t.theme.effects ?? {},
          thumbnailUrl: '',
        },
        (t.data.paletteOverride ?? t.data.palette_override ?? {}) as Record<string, string>,
      );
      const result = validateColorScheme({
        id: t.id,
        name: t.name,
        category: 'light',
        palette: effective,
      });
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
 * variannya sendiri, config-nya sendiri, serta palet & tipografi lengkap.
 *
 * Syarat penuh hanya ditegakkan pada template yang sudah dimigrasi
 * (lihat `MIGRATED_TEMPLATES`) supaya suite hijau selama migrasi berjalan.
 * Tambahkan nama template ke sana setiap kali satu template selesai diotomi.
 */
/**
 * Template yang sudah diotomi (varian milik sendiri, bukan registry).
 * Fase-1: kosong — `food` berbagi katalog registry. Tambahkan id ke sini
 * setiap kali satu template selesai diotomi; guard di bawah otomatis menjaganya.
 */
const MIGRATED_TEMPLATES = new Set<string>([]);

const MIN_HEADER_VARIANTS = 5;
const MIN_FOOTER_VARIANTS = 5;
const MIN_SECTION_VARIANTS = 3;

/**
 * Semua tipe section yang WAJIB tersedia di tiap template, meski tidak dipakai
 * di seed default-nya — syarat "mendukung section predefined builder".
 */
const ALL_SECTION_TYPES = [
  "hero", "features", "product_grid", "testimonials", "faq", "cta", "contact",
  "about", "gallery", "video", "team", "pricing", "newsletter",
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

  it("belum ada template bermigrasi (fase-1 berbagi registry)", () => {
    expect(migrated.length).toBe(0);
  });

  it("setiap template punya palet & tipografi lengkap", () => {
    // `designType` dihapus (migrasi 046): pembeda "karakter desain" kini
    // datang dari palet + tipografi + varian milik template itu sendiri.
    for (const t of BUILT_IN_CATALOG) {
      for (const k of ["primary", "secondary", "accent", "background", "surface", "text", "textMuted", "border"] as const) {
        expect(t.theme.palette[k], `${t.id}: palet.${k} kosong`).toBeTruthy();
      }
      expect(t.theme.typography.headingFont, `${t.id}: headingFont kosong`).toBeTruthy();
      expect(t.theme.typography.bodyFont, `${t.id}: bodyFont kosong`).toBeTruthy();
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
   * `MarqueeSection` di `section-renderer.tsx` tidak pernah
   * membaca `section.variant` sama sekali — declare 3 varian di situ hanya akan
   * menghasilkan 3 nama untuk 1 tampilan yang sama persis, yaitu masalah yang
   * justru sedang kita perbaiki.
   *
   * Kalau nanti salah satu dapat branch baru di renderer, HAPUS dari daftar ini
   * supaya ikut aturan 3 varian.
   */
  const SINGLE_DOM_TYPES = new Set(['marquee']);

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
    'about-centered', 'contact-form-map', 'contact-split',
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
    'about-left', 'about-right', 'gallery-grid', 'video-full',
    'team-grid', 'pricing-3tier', 'pricing-2tier', 'newsletter-inline',
    'divider-line', 'marquee-band', 'menu-tabs', 'menu-list', 'steps-3col',
    'location-hours',
    // Branch yang ditambahkan saat migrasi bengkel (lihat section-renderer.tsx).
    'steps-horizontal', 'location-hours-wide', 'menu-grid', 'steps-numbered', 'location-card',
    // Varian unik template laundry-emerald — semua punya html sendiri (§18).
    'laundry-emerald:hero-arch', 'laundry-emerald:welcome-dividers',
    'laundry-emerald:luxury-split', 'laundry-emerald:process-arch',
    'laundry-emerald:service-cards', 'laundry-emerald:comfort-band',
    'laundry-emerald:faq-emerald', 'laundry-emerald:testimoni-bg',
    'laundry-emerald:booking-band', 'laundry-emerald:gallery-luxe',
    'laundry-emerald:artikel-grid', 'laundry-emerald:location-panel',
    'laundry-emerald:contact-cards',
    'marketplace-hybrid:hdr-search',
    'marketplace-hybrid:hdr-compact',
    'marketplace-hybrid:hdr-categories',
    'marketplace-hybrid:hdr-glass',
    'marketplace-hybrid:hdr-minimal',
    'marketplace-hybrid:ftr-columns',
    'marketplace-hybrid:ftr-newsletter',
    'marketplace-hybrid:ftr-minimal',
    'marketplace-hybrid:ftr-cta',
    'marketplace-hybrid:ftr-contact',
    'marketplace-hybrid:hdr-search',
    'marketplace-hybrid:hdr-compact',
    'marketplace-hybrid:hdr-categories',
    'marketplace-hybrid:hdr-glass',
    'marketplace-hybrid:hdr-minimal',
    'marketplace-hybrid:ftr-columns',
    'marketplace-hybrid:ftr-newsletter',
    'marketplace-hybrid:ftr-minimal',
    'marketplace-hybrid:ftr-cta',
    'marketplace-hybrid:ftr-contact',
    'marketplace-hybrid:hero-hybrid',
    'marketplace-hybrid:hero-big-image',
    'marketplace-hybrid:hero-compact-band',
    'marketplace-hybrid:features-cards',
    'marketplace-hybrid:features-cards-2',
    'marketplace-hybrid:features-cards-3',
    'marketplace-hybrid:product-feed',
    'marketplace-hybrid:product-feed-2',
    'marketplace-hybrid:product-feed-3',
    'marketplace-hybrid:pricing-cards',
    'marketplace-hybrid:pricing-cards-2',
    'marketplace-hybrid:pricing-cards-3',
    'marketplace-hybrid:testi-wall',
    'marketplace-hybrid:testi-wall-2',
    'marketplace-hybrid:testi-wall-3',
    'marketplace-hybrid:gallery-tile',
    'marketplace-hybrid:gallery-tile-2',
    'marketplace-hybrid:gallery-tile-3',
    'marketplace-hybrid:location-info',
    'marketplace-hybrid:location-info-2',
    'marketplace-hybrid:location-info-3',
    'marketplace-hybrid:faq-toggle',
    'marketplace-hybrid:faq-toggle-2',
    'marketplace-hybrid:faq-toggle-3',
    'marketplace-hybrid:contact-info',
    'marketplace-hybrid:contact-info-2',
    'marketplace-hybrid:contact-info-3',
    'marketplace-hybrid:about-split',
    'marketplace-hybrid:about-split-2',
    'marketplace-hybrid:about-split-3',
    'marketplace-hybrid:video-embed',
    'marketplace-hybrid:video-embed-2',
    'marketplace-hybrid:video-embed-3',
    'marketplace-hybrid:team-panel',
    'marketplace-hybrid:team-panel-2',
    'marketplace-hybrid:team-panel-3',
    'marketplace-hybrid:newsletter-form',
    'marketplace-hybrid:newsletter-form-2',
    'marketplace-hybrid:newsletter-form-3',
    'marketplace-hybrid:divider-line',
    'marketplace-hybrid:divider-line-2',
    'marketplace-hybrid:divider-line-3',
    'marketplace-hybrid:marquee-band',
    'marketplace-hybrid:marquee-band-2',
    'marketplace-hybrid:marquee-band-3',
    'marketplace-hybrid:menu-index',
    'marketplace-hybrid:menu-index-2',
    'marketplace-hybrid:menu-index-3',
    'marketplace-hybrid:steps-timeline',
    'marketplace-hybrid:steps-timeline-2',
    'marketplace-hybrid:steps-timeline-3',
    'marketplace-hybrid:cta-wave',
    'marketplace-hybrid:cta-wave-2',
    'marketplace-hybrid:cta-wave-3',,
    'marketplace-hybrid:hero-hybrid',
    'marketplace-hybrid:hero-split',
    'marketplace-hybrid:hero-minimal',
    'marketplace-hybrid:hero-hybrid-2',
    'marketplace-hybrid:hero-hybrid-3',
    'marketplace-hybrid:features-cards',
    'marketplace-hybrid:features-cards-2',
    'marketplace-hybrid:features-cards-3',
    'marketplace-hybrid:product-feed',
    'marketplace-hybrid:product-feed-2',
    'marketplace-hybrid:product-feed-3',
    'marketplace-hybrid:pricing-cards',
    'marketplace-hybrid:pricing-cards-2',
    'marketplace-hybrid:pricing-cards-3',
    'marketplace-hybrid:testi-wall',
    'marketplace-hybrid:testi-wall-2',
    'marketplace-hybrid:testi-wall-3',
    'marketplace-hybrid:gallery-grid',
    'marketplace-hybrid:gallery-grid-2',
    'marketplace-hybrid:gallery-grid-3',
    'marketplace-hybrid:location-info',
    'marketplace-hybrid:location-info-2',
    'marketplace-hybrid:location-info-3',
    'marketplace-hybrid:faq-list',
    'marketplace-hybrid:faq-list-2',
    'marketplace-hybrid:faq-list-3',
    'marketplace-hybrid:contact-info',
    'marketplace-hybrid:contact-info-2',
    'marketplace-hybrid:contact-info-3',
    'marketplace-hybrid:about-split',
    'marketplace-hybrid:about-split-2',
    'marketplace-hybrid:about-split-3',
    'marketplace-hybrid:video-embed',
    'marketplace-hybrid:video-embed-2',
    'marketplace-hybrid:video-embed-3',
    'marketplace-hybrid:team-grid',
    'marketplace-hybrid:team-grid-2',
    'marketplace-hybrid:team-grid-3',
    'marketplace-hybrid:newsletter-form',
    'marketplace-hybrid:newsletter-form-2',
    'marketplace-hybrid:newsletter-form-3',
    'marketplace-hybrid:divider-line',
    'marketplace-hybrid:divider-line-2',
    'marketplace-hybrid:divider-line-3',
    'marketplace-hybrid:marquee-band',
    'marketplace-hybrid:marquee-band-2',
    'marketplace-hybrid:marquee-band-3',
    'marketplace-hybrid:menu-list',
    'marketplace-hybrid:menu-list-2',
    'marketplace-hybrid:menu-list-3',
    'marketplace-hybrid:steps-timeline',
    'marketplace-hybrid:steps-timeline-2',
    'marketplace-hybrid:steps-timeline-3',
    'marketplace-hybrid:cta-banner',
    'marketplace-hybrid:cta-banner-2',
    'marketplace-hybrid:cta-banner-3',,
  ]);

  it("id varian section harus yang DI-RENDER (bukan id karangan)", () => {
    for (const t of BUILT_IN_CATALOG) {
      for (const s of t.sections) {
        for (const v of s.variants) {
          const hasCustomHtml = typeof v.html === "string" && v.html.trim().length > 0;
          if (hasCustomHtml) {
            expect(
              v.id.startsWith(`${t.id}:`),
              `${t.id}/${s.type}: varian HTML kustom "${v.id}" harus memakai namespace template`,
            ).toBe(true);
          } else {
            expect(
              RENDERED_VARIANTS.has(v.id),
              `${t.id}/${s.type}: id varian "${v.id}" tidak ada di section-renderer.tsx → diam-diam jatuh ke branch default (semua varian jadi sama)`,
            ).toBe(true);
          }
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

  /**
   * Guard regresi turunan template lama dihapus bersama katalog lama
   * (pangkas-rapi/bengkel). Dipasang kembali saat otomi pertama selesai:
   * varian header/footer template otomi tidak boleh identik dengan template lain.
   */

  /**
   * v3.0 — `activeSections`: template menentukan section mana yang AKTIF
   * untuk niche-nya (subset 19 tipe predefined). Katalog `sections` tetap
   * memuat SEMUA tipe (diuji di atas); yang di sini adalah seed aktif.
   *
   * Template TS lama belum punya field ini — diambil dari tipe seed
   * (`data.sections`) sebagai fallback. Template yang sudah mengisi
   * `activeSections` eksplisit wajib subset valid + memuat 9 inti.
   */
  it("activeSections valid (subset predefined + memuat 9 inti)", () => {
    const KNOWN = new Set(ALL_SECTION_TYPES as readonly string[]);
    for (const t of migrated) {
      const explicit = (t as { activeSections?: unknown }).activeSections;
      const seedTypes = new Set((t.data.sections ?? []).map((s) => s.type));
      const active = Array.isArray(explicit) ? (explicit as string[]) : [...seedTypes];
      for (const s of active) {
        expect(KNOWN.has(s), `${t.id}: activeSections "${s}" bukan tipe predefined`).toBe(true);
      }
      for (const core of CORE_TYPES) {
        expect(
          active.includes(core),
          `${t.id}: activeSections wajib memuat section inti "${core}"`,
        ).toBe(true);
      }
    }
  });

  /**
   * v3.0 — `html` varian & field `html` harus lolos sanitizer.
   *
   * Template yang memakai ekspresi HTML tidak boleh mengandung pola yang
   * pasti diblokir saat import/render (script/style/iframe/form/on*),
   * karena hasilnya akan tampil sebagai `<!-- BLOCKED` di halaman.
   */
  it("setiap varian header punya tombol hamburger in-flow sejajar brand", () => {
    // Regresi: hamburger absolute `top:50%` terhadap blok header meleset
    // di varian multi-baris & saat konten wrap (bahkan menimpa CTA).
    // Setiap header WAJIB memuat placeholder `[data-hdr-burger]` in-flow
    // di baris brand — kliknya didelegasikan ke MobileDrawer. Brand
    // (mark + judul + tagline) WAJIB bermarker agar mengecil di HP dan
    // hamburger tidak terdorong ke bawah.
    for (const t of BUILT_IN_CATALOG) {
      for (const h of t.headers) {
        const html = (h as { html?: unknown }).html;
        if (typeof html !== 'string' || !html) continue;
        expect(
          html.includes('data-hdr-burger'),
          `${t.id}/${h.id}: header tanpa [data-hdr-burger] — hamburger tidak sejajar brand di HP`,
        ).toBe(true);
        expect(
          html.includes('data-hdr-title'),
          `${t.id}/${h.id}: judul brand tanpa [data-hdr-title] — tidak mengecil di HP`,
        ).toBe(true);
        // Mark hanya wajib bila varian me-render logo (brandBlock) —
        // mis. brand-tengah hanya teks sehingga tidak punya mark.
        if (html.includes('siteTitleInitial') || html.includes('logoUrl')) {
          expect(
            html.includes('data-hdr-mark'),
            `${t.id}/${h.id}: logo brand tanpa [data-hdr-mark] — tidak mengecil di HP`,
          ).toBe(true);
        }
      }
    }
  });

  it("setiap template katalog punya file thumbnail untuk kartu galeri", () => {
    // Kartu galeri (builder + /web-design) menampilkan
    // `/thumbnails/<id>.jpg` — tanpa file-nya kartu jatuh ke gradien.
    // Regenerasi: `bun /tmp/opencode/shot2.mjs` (butuh dev server :3000).
    const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
    for (const t of BUILT_IN_CATALOG) {
      const thumb = join(root, "public", "thumbnails", `${t.id}.jpg`);
      expect(existsSync(thumb), `${t.id}: public/thumbnails/${t.id}.jpg tidak ada`).toBe(true);
    }
  });

  it("html kustom bebas pola terblokir", () => {
    const BLOCKED = [/<\s*script[\s>]/i, /<\s*\/\s*script/i, /<\s*iframe[\s>]/i, /<\s*form[\s>]/i, /\bon\w+\s*=/i];
    for (const t of BUILT_IN_CATALOG) {
      const checkHtml = (label: string, html?: unknown) => {
        if (typeof html !== 'string' || !html) return;
        for (const p of BLOCKED) {
          expect(p.test(html), `${t.id}/${label}: html mengandung pola terblokir ${p}`).toBe(false);
        }
      };
      for (const h of t.headers) checkHtml(h.id, (h as { html?: unknown }).html);
      for (const f of t.footers) checkHtml(f.id, (f as { html?: unknown }).html);
      for (const s of t.sections) {
        for (const v of s.variants) checkHtml(`${s.type}/${v.id}`, (v as { html?: unknown }).html);
      }
    }
  });
});

describe("kontrak folder template", () => {
  const templatesDir = dirname(fileURLToPath(import.meta.url));

  it("setiap folder ber-index.ts terdaftar, dan id template === nama folder", () => {
    const folders = readdirSync(templatesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
      .map((d) => d.name)
      .filter((name) => existsSync(join(templatesDir, name, "index.ts")))
      .sort((a, b) => a.localeCompare(b));

    expect(
      [...GENERATED_TEMPLATE_FOLDERS],
      "catalog.generated.ts kedaluwarsa — jalankan `node scripts/gen-template-catalog.mjs`",
    ).toEqual(folders);

    GENERATED_CATALOG.forEach((t, i) => {
      expect(
        t.id,
        `folder "${GENERATED_TEMPLATE_FOLDERS[i]}" berisi template id "${t.id}" — id wajib sama dengan nama folder`,
      ).toBe(GENERATED_TEMPLATE_FOLDERS[i]);
    });
  });
});
