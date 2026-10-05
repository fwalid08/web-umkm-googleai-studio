/**
 * Skema template v3.0 — fondasi template AI-friendly.
 *
 * v3.0 menambahkan (dibanding v2.0):
 * - `html` di SectionVariant / HeaderVariant / FooterVariant (ekspresi HTML
 *   section-level — desain kreatif template tidak terbatas layout bawaan).
 * - `ConfigField.type = 'html'` (ekspresi HTML field-level — konten kaya
 *   di dalam section existing tanpa tipe section baru).
 * - `activeSections` di Template & FullTemplateData (template menentukan
 *   section mana yang AKTIF untuk niche-nya, tapi WAJIB mendefinisikan
 *   SEMUA 18 tipe predefined agar mendukung section builder).
 * - Aturan "tidak ada konten hardcoded": tiap key di `defaultConfig`
 *   wajib punya form field (sudah ada di catalog.test.ts, ditegaskan di sini).
 * - v3.4: tipe section KUSTOM diizinkan (di luar 18 predefined) dengan syarat
 *   tiap variannya punya `html` — renderer bawaan tidak punya branch untuk
 *   tipe asing sehingga html adalah satu-satunya jalur tampil.
 *
 * AI eksternal HANYA perlu dokumen `docs/AI_TEMPLATE_PROMPT.md` + skema ini
 * untuk menghasilkan ZIP yang kompatibel — tanpa mengenal codebase.
 */

import type {
  BusinessCategory,
  ConfigField,
  Template,
} from './template-types';
import type { SectionType } from './types';

/** 18 tipe section predefined builder — WAJIB tersedia di tiap template. */
export const ALL_SECTION_TYPES_V3: readonly SectionType[] = [
  'hero',
  'features',
  'product_grid',
  'testimonials',
  'faq',
  'cta',
  'contact',
  'about',
  'gallery',
  'video',
  'team',
  'pricing',
  'newsletter',
  'divider',
  'marquee',
  'menu_board',
  'steps',
  'location',
] as const;

export const MIN_HEADER_VARIANTS_V3 = 5;
export const MIN_FOOTER_VARIANTS_V3 = 5;
export const MIN_SECTION_VARIANTS_V3 = 3;

/** Tipe yang renderer-nya single-DOM — dikecualikan dari aturan 3 varian. */
export const SINGLE_DOM_TYPES_V3: ReadonlySet<string> = new Set([
  'marquee',
]);

export const VALID_CONFIG_FIELD_TYPES: ReadonlySet<string> = new Set([
  'text',
  'textarea',
  'number',
  'select',
  'image',
  'list',
  'color',
  'background',
  'gallery',
  'switch',
  'html',
]);

export const VALID_CATEGORIES: readonly BusinessCategory[] = [
  'food',
  'fashion',
  'retail',
  'handicraft',
  'services',
];

/** Set 18 tipe bawaan untuk pengecekan cepat. */
const BUILTIN_TYPE_SET: ReadonlySet<string> = new Set(ALL_SECTION_TYPES_V3);

/**
 * Layout header bawaan builder (punya branch di `site-header-shared.tsx`).
 * Varian dengan layout di luar daftar ini HANYA bisa tampil lewat `html`.
 */
export const BUILTIN_HEADER_LAYOUTS: ReadonlySet<string> = new Set([
  'standard',
  'floating',
  'hero-overlay',
  'split-nav',
  'with-topbar',
  'glass',
  'minimal',
]);

/**
 * Layout footer bawaan builder (punya branch di `site-footer-shared.tsx`).
 * Varian dengan layout di luar daftar ini HANYA bisa tampil lewat `html`.
 */
export const BUILTIN_FOOTER_LAYOUTS: ReadonlySet<string> = new Set([
  'simple',
  'columns',
  'centered',
  'minimal',
  'newsletter',
  'social',
  'cta-overlap',
]);

/** True bila tipe adalah salah satu dari 18 predefined builder. */
export function isBuiltinSectionType(type: string): boolean {
  return BUILTIN_TYPE_SET.has(type);
}

/** ID tipe kustom: kebab-case, maks 40 karakter. */
const CUSTOM_TYPE_ID_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;

/**
 * Validasi definisi tipe section KUSTOM (di luar 18 predefined).
 *
 * Renderer bawaan tidak punya branch untuk tipe asing — satu-satunya cara
 * tipe kustom tampil adalah `html` di tiap variannya (dirender
 * `VariantHtmlRenderer` oleh kanvas & live site). Tanpa html, tipe kustom
 * jatuh ke placeholder "Section: <type>" dan praktis mati.
 */
export function validateCustomSectionType(
  def: Record<string, unknown>,
  errors: string[],
  warnings: string[],
): void {
  const type = String(def.type ?? '');
  if (!CUSTOM_TYPE_ID_PATTERN.test(type)) {
    errors.push(
      `tipe section kustom "${type || '?'}" harus kebab-case (huruf kecil, angka, strip, maks 40 karakter, mis. "promo-gacor")`,
    );
    return;
  }
  if (!def.name || typeof def.name !== 'string' || !def.name.trim()) {
    errors.push(`tipe section kustom "${type}" wajib punya "name" (nama tampil di pemilih blok)`);
  }
  const variants = Array.isArray(def.variants) ? def.variants as Array<Record<string, unknown>> : [];
  if (variants.length === 0) {
    errors.push(`tipe section kustom "${type}" wajib punya ≥1 varian`);
    return;
  }
  for (const v of variants) {
    const id = String((v as Record<string, unknown>)?.id ?? '?');
    if (typeof (v as Record<string, unknown>)?.html !== 'string' || !((v as Record<string, unknown>).html as string).trim()) {
      errors.push(
        `tipe section kustom "${type}"/"${id}" wajib punya "html" non-kosong — renderer tidak punya branch untuk tipe ini`,
      );
    }
    if (typeof (v as Record<string, unknown>)?.mockup !== 'string' || !((v as Record<string, unknown>).mockup as string).trim()) {
      warnings.push(`tipe section kustom "${type}"/"${id}" disarankan punya "mockup" agar tampil di galeri/kartu`);
    }
  }
}

/**
 * Validasi chrome (header/footer) milik template.
 *
 * Syarat agar template terapan TIDAK memakai chrome bawaan builder:
 * - Layout KUSTOM (di luar daftar bawaan) tanpa `html` non-kosong → ERROR,
 *   karena renderer tidak punya branch untuknya (desain hilang diam-diam).
 * - Layout BAWAAN tanpa `html` → WARNING: tampil persis seperti bawaan
 *   builder (benar secara teknis, tapi bukan desain milik template).
 *
 * Dipakai `validateTemplateV3` dan dipakai langsung oleh route import
 * sebagai gerbang keras (hanya errors yang menggagalkan import).
 */
export function validateChromeHtml(t: {
  headers: Array<Record<string, unknown>>;
  footers: Array<Record<string, unknown>>;
}): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const h of t.headers) {
    if (!h || typeof h !== 'object') continue;
    const id = String(h.id ?? '?');
    const layout = String(h.layout ?? '');
    const hasHtml = typeof h.html === 'string' && h.html.trim().length > 0;
    if (!BUILTIN_HEADER_LAYOUTS.has(layout)) {
      if (!hasHtml) {
        errors.push(
          `header "${id}" memakai layout kustom "${layout || '?'}" tanpa "html" — renderer tidak punya branch untuknya, desain hilang. Tambahkan variant.html.`,
        );
      }
    } else if (!hasHtml) {
      warnings.push(
        `header "${id}" tanpa "html" tampil sama dengan header bawaan builder (layout "${layout}"). Tambahkan variant.html agar menjadi desain milik template.`,
      );
    }
  }
  for (const f of t.footers) {
    if (!f || typeof f !== 'object') continue;
    const id = String(f.id ?? '?');
    const layout = String(f.layout ?? '');
    const hasHtml = typeof f.html === 'string' && f.html.trim().length > 0;
    if (!BUILTIN_FOOTER_LAYOUTS.has(layout)) {
      if (!hasHtml) {
        errors.push(
          `footer "${id}" memakai layout kustom "${layout || '?'}" tanpa "html" — renderer tidak punya branch untuknya, desain hilang. Tambahkan variant.html.`,
        );
      }
    } else if (!hasHtml) {
      warnings.push(
        `footer "${id}" tanpa "html" tampil sama dengan footer bawaan builder (layout "${layout}"). Tambahkan variant.html agar menjadi desain milik template.`,
      );
    }
  }
  return { errors, warnings };
}

export interface ValidateTemplateResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** Validasi ringan struktur template JSON (dipakai import ZIP + tool AI). */
export function validateTemplateV3(data: unknown): ValidateTemplateResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, errors: ['Template harus berupa objek JSON'], warnings };
  }
  const t = (data as { template?: unknown }).template &&
    typeof (data as { template?: unknown }).template === 'object'
    ? ((data as { template: Record<string, unknown> }).template as Record<string, unknown>)
    : (data as Record<string, unknown>);

  // --- identitas ---
  if (typeof t.name !== 'string' || !t.name.trim()) errors.push('name wajib diisi');
  if (t.category !== undefined && !VALID_CATEGORIES.includes(t.category as BusinessCategory)) {
    errors.push(`category "${String(t.category)}" tak dikenal`);
  }

  // --- theme ---
  if (!t.theme || typeof t.theme !== 'object') {
    errors.push('theme wajib ada dan berupa object');
  } else {
    const theme = t.theme as Record<string, unknown>;
    if (!theme.palette || typeof theme.palette !== 'object') {
      errors.push('theme.palette wajib ada');
    }
  }

  // --- headers / footers ---
  const headers = Array.isArray(t.headers) ? t.headers as Array<Record<string, unknown>> : [];
  const footers = Array.isArray(t.footers) ? t.footers as Array<Record<string, unknown>> : [];
  if (t.headers !== undefined && !Array.isArray(t.headers)) errors.push('headers harus berupa array');
  if (t.footers !== undefined && !Array.isArray(t.footers)) errors.push('footers harus berupa array');
  if (headers.length > 0 && headers.length < MIN_HEADER_VARIANTS_V3) {
    warnings.push(`headers hanya ${headers.length} varian (disarankan ≥${MIN_HEADER_VARIANTS_V3})`);
  }
  if (footers.length > 0 && footers.length < MIN_FOOTER_VARIANTS_V3) {
    warnings.push(`footers hanya ${footers.length} varian (disarankan ≥${MIN_FOOTER_VARIANTS_V3})`);
  }
  const chrome = validateChromeHtml({ headers, footers });
  errors.push(...chrome.errors);
  warnings.push(...chrome.warnings);
  for (const h of headers) {
    if (typeof h.html === 'string') {
      if (h.html.length > 50_000) {
        errors.push(`header ${(h.id as string) ?? '?'}: html melebihi 50.000 karakter`);
      }
      validateHtmlSafety(h.html, `header ${(h.id as string) ?? '?'}`, warnings);
    }
    validateConfigFields(h.configFields, `header ${(h.id as string) ?? '?'}`, errors);
  }
  for (const f of footers) {
    if (typeof f.html === 'string') {
      if (f.html.length > 50_000) {
        errors.push(`footer ${(f.id as string) ?? '?'}: html melebihi 50.000 karakter`);
      }
      validateHtmlSafety(f.html, `footer ${(f.id as string) ?? '?'}`, warnings);
    }
    validateConfigFields(f.configFields, `footer ${(f.id as string) ?? '?'}`, errors);
  }

  // --- sections: SEMUA 18 tipe wajib tersedia + tipe kustom diizinkan ---
  //
  // AI boleh menambah tipe section BARU di luar 18 predefined (mis.
  // `promo-gacor`, `jadwal-sholat`). Syarat tipe kustom: id kebab-case yang
  // tidak menabrak 19 bawaan, ≥1 varian, dan SETIAP varian wajib punya `html`
  // non-kosong — renderer bawaan tidak punya branch untuk tipe asing,
  // sehingga tanpa html tipe itu tidak bisa tampil.
  const available = new Set<string>();
  if (!Array.isArray(t.sections) || (t.sections as unknown[]).length === 0) {
    errors.push('sections wajib non-kosong');
  } else {
    const defs = t.sections as Array<Record<string, unknown>>;
    for (const d of defs) {
      if (d && typeof d === 'object' && typeof d.type === 'string' && d.type) {
        available.add(d.type);
      }
    }
    for (const required of ALL_SECTION_TYPES_V3) {
      if (!available.has(required)) {
        errors.push(`tipe section "${required}" tidak tersedia (template wajib mendukung semua 18 tipe predefined)`);
      }
    }
    for (const d of defs) {
      const type = String((d as Record<string, unknown>)?.type ?? '?');
      const variants = Array.isArray((d as Record<string, unknown>)?.variants)
        ? (d as Record<string, unknown>).variants as Array<Record<string, unknown>>
        : [];
      if (isBuiltinSectionType(type)) {
        if (!SINGLE_DOM_TYPES_V3.has(type) && variants.length < MIN_SECTION_VARIANTS_V3) {
          warnings.push(`${type}: hanya ${variants.length} varian (disarankan ≥${MIN_SECTION_VARIANTS_V3})`);
        }
      } else {
        validateCustomSectionType(d as Record<string, unknown>, errors, warnings);
      }
      for (const v of variants) {
        if (typeof v.html === 'string') {
          if (v.html.length > 50_000) {
            errors.push(`${type}/${String(v.id ?? '?')}: html melebihi 50.000 karakter`);
          }
          validateHtmlSafety(v.html, `${type}/${String(v.id ?? '?')}`, warnings);
        }
        validateConfigFields(v.configFields, `${type}/${String(v.id ?? '?')}`, errors);
      }
    }
  }

  // --- data.activeSections: subset katalog (18 predefined + kustom milik template) ---
  const dataBlock = t.data as Record<string, unknown> | undefined;
  const activeSections =
    (t.activeSections as unknown) ?? dataBlock?.activeSections;
  if (activeSections !== undefined) {
    if (!Array.isArray(activeSections)) {
      errors.push('activeSections harus berupa array');
    } else {
      for (const s of activeSections as unknown[]) {
        if (!available.has(String(s))) {
          errors.push(`activeSections "${String(s)}" tidak terdefinisi di katalog sections template`);
        }
      }
    }
  }

  // --- customCss safety check ---
  const customCss = (dataBlock?.customCss as string) ?? (t.customCss as string);
  if (typeof customCss === 'string' && customCss.trim()) {
    validateCssSafety(customCss, 'template.customCss', warnings);
  }

  return { ok: errors.length === 0, errors, warnings };
}

function validateConfigFields(
  fields: unknown,
  label: string,
  errors: string[],
): void {
  if (fields === undefined) return;
  if (!Array.isArray(fields)) {
    errors.push(`${label}: configFields harus berupa array`);
    return;
  }
  const walk = (list: unknown[], prefix: string) => {
    for (const f of list) {
      if (!f || typeof f !== 'object') {
        errors.push(`${prefix}: field tidak valid`);
        continue;
      }
      const field = f as Record<string, unknown>;
      if (typeof field.key !== 'string' || !field.key) {
        errors.push(`${prefix}: field tanpa key`);
      }
      if (!VALID_CONFIG_FIELD_TYPES.has(String(field.type))) {
        errors.push(`${prefix}/${String(field.key ?? '?')}: tipe field "${String(field.type)}" tak dikenal`);
      }
      if (Array.isArray(field.itemFields)) walk(field.itemFields as unknown[], `${prefix}/${String(field.key)}`);
    }
  };
  walk(fields as unknown[], label);
}

/** Validasi keamanan HTML kustom — cek pola berisiko yang bisa keluar dari kanvas. */
function validateHtmlSafety(html: string, label: string, warnings: string[]): void {
  const riskyPatterns: Array<{ pattern: RegExp; msg: string }> = [
    { pattern: /position\s*:\s*fixed/gi, msg: 'position:fixed relative ke viewport, tidak ke kanvas (akan dikontain via transform pada kanvas)' },
    { pattern: /z-index\s*:\s*(?:[1-9]\d{3,}|\d{5,})/gi, msg: 'z-index sangat tinggi (>9999) dapat menutupi UI builder' },
    { pattern: /overflow\s*:\s*visible/gi, msg: 'overflow:visible dapat keluar dari kontainer kanvas' },
    { pattern: /<\s*style/gi, msg: 'tag <style> diblokir saat render (pakai customCss di template.json)' },
  ];
  for (const { pattern, msg } of riskyPatterns) {
    if (pattern.test(html)) {
      warnings.push(`${label}: ${msg}`);
    }
  }
}

/** Validasi keamanan customCss — cek pola berisiko. */
function validateCssSafety(css: string, label: string, warnings: string[]): void {
  const riskyPatterns: Array<{ pattern: RegExp; msg: string }> = [
    { pattern: /position\s*:\s*fixed/gi, msg: 'position:fixed relative ke viewport (akan dikontain via transform pada kanvas)' },
    { pattern: /z-index\s*:\s*(?:[1-9]\d{3,}|\d{5,})/gi, msg: 'z-index sangat tinggi (>9999) dapat menutupi UI builder' },
    { pattern: /overflow\s*:\s*visible/gi, msg: 'overflow:visible dapat keluar dari kontainer kanvas' },
    { pattern: /@import/gi, msg: '@import diblokir saat render' },
    { pattern: /url\(\s*(?!['"]?data:)/gi, msg: 'url() eksternal diblokir (pakai data: atau assets/)' },
  ];
  for (const { pattern, msg } of riskyPatterns) {
    if (pattern.test(css)) {
      warnings.push(`${label}: ${msg}`);
    }
  }
}

/** Helper: apakah template (TS) memenuhi kontrak v3 minimal. */
export function isV3Compliant(template: Template): boolean {
  if (template.headers.length < MIN_HEADER_VARIANTS_V3) return false;
  if (template.footers.length < MIN_FOOTER_VARIANTS_V3) return false;
  for (const required of ALL_SECTION_TYPES_V3) {
    const def = template.sections.find((s) => s.type === required);
    if (!def) return false;
    if (!SINGLE_DOM_TYPES_V3.has(required) && def.variants.length < MIN_SECTION_VARIANTS_V3) {
      return false;
    }
  }
  return true;
}

/**
 * Cakupan aset template (dipakai import ZIP → warnings, bukan error).
 *
 * Dua masalah nyata dari template AI:
 * 1. File diupload tapi tidak dirujuk config manapun (mubazir + gambar
 *    desain tidak tampil).
 * 2. Field gambar di seed kosong — preview tampil kosong, kanvas diisi foto
 *    Unsplash generik (bukan aset milik template).
 */
const IMAGE_LIKE_KEYS: ReadonlySet<string> = new Set([
  'image',
  'logoUrl',
  'logo_url',
  'backgroundImage',
  'background_image',
  'images',
  'gallery',
  'avatar',
  'photo',
  'banner',
  'thumbnail',
]);

function isEmptyImageValue(v: unknown): boolean {
  if (v === '' || v === null || v === undefined) return true;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function collectEmptyImageFields(config: unknown, prefix: string, out: string[]): void {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return;
  for (const [k, v] of Object.entries(config as Record<string, unknown>)) {
    if (IMAGE_LIKE_KEYS.has(k) && isEmptyImageValue(v)) {
      out.push(prefix ? `${prefix}.${k}` : k);
    }
  }
}

/**
 * ID varian yang dirender renderer bawaan (branch eksplisit + default yang
 * disengaja). Ground truth: `section-renderer.tsx`; daftar lengkap di
 * `templates/catalog.test.ts` (RENDERED_VARIANTS). Varian kustom di luar
 * daftar ini WAJIB punya `html` atau disasar `customCss` — kalau tidak,
 * ia jatuh diam-diam ke branch default (tampak sama dengan varian lain).
 */
const RENDERED_VARIANT_IDS: ReadonlySet<string> = new Set([
  'about-centered', 'contact-form-map', 'contact-split',
  'cta-card', 'cta-split', 'divider-image', 'divider-spacer', 'faq-accordion',
  'faq-grid', 'features-2col', 'features-list', 'features-masonry',
  'features-stacked', 'gallery-carousel', 'gallery-masonry', 'hero-card',
  'hero-left', 'hero-right', 'hero-split', 'hero-video', 'hero-video-bg',
  'newsletter-card', 'newsletter-split', 'pricing-single', 'product-carousel',
  'team-carousel', 'team-list', 'testimonials-carousel', 'testimonials-single',
  'video-bg', 'video-centered',
  'hero-full', 'hero-bg-image', 'features-3col', 'product-4col', 'product-3col',
  'product-2col', 'testimonials-grid', 'faq-list', 'cta-banner', 'contact-form',
  'about-left', 'about-right', 'gallery-grid', 'video-full',
  'team-grid', 'pricing-3tier', 'pricing-2tier', 'newsletter-inline',
  'divider-line', 'marquee-band', 'menu-tabs', 'menu-list', 'steps-3col',
  'location-hours',
  'steps-horizontal', 'location-hours-wide', 'menu-grid', 'steps-numbered', 'location-card',
  'hero-split-arch', 'pricing-spa-card',
]);

export interface AssetCoverageInput {
  name: string;
  url: string;
}

export function findAssetCoverageIssues(
  templateData: Record<string, unknown>,
  uploaded: AssetCoverageInput[],
): string[] {
  const warnings: string[] = [];
  let serialized = '';
  try {
    serialized = JSON.stringify(templateData);
  } catch {
    serialized = '';
  }

  // 1. File terupload tapi tidak dirujuk.
  for (const a of uploaded) {
    if (!a.url || !serialized.includes(a.url)) {
      warnings.push(`Aset "${a.name}" terupload tapi tidak dipakai config manapun — gambar desain tidak akan tampil.`);
    }
  }

  // 2. Field gambar kosong di seed (yang dirender preview/apply).
  const data = templateData as Record<string, unknown>;
  const inner = (data.data && typeof data.data === 'object' && !Array.isArray(data.data)
    ? (data.data as Record<string, unknown>)
    : data) as Record<string, unknown>;
  const seedSections = Array.isArray(inner.sections) ? inner.sections as Array<Record<string, unknown>> : [];
  const empty: string[] = [];
  for (const s of seedSections) {
    if (!s || typeof s !== 'object') continue;
    const label = `${String(s.type ?? '?')}/${String(s.variant ?? '?')}`;
    collectEmptyImageFields(s.config, label, empty);
  }
  // Batasi agar respons tidak membengkak; sisanya bisa dilihat di builder.
  for (const e of empty.slice(0, 10)) {
    warnings.push(`Field gambar kosong di seed "${e}" — preview tampil kosong, kanvas diisi foto generik.`);
  }
  if (empty.length > 10) {
    warnings.push(`…dan ${empty.length - 10} field gambar kosong lainnya.`);
  }

  // 3. Varian kustom tanpa html dan tanpa customCss = varian mati (jatuh ke
  // branch default renderer, tampak sama dengan varian lain).
  const css = [data.customCss, inner.customCss].filter((c) => typeof c === 'string').join('\n') as string;
  const catalog = Array.isArray(data.sections) ? data.sections as Array<Record<string, unknown>> : [];
  const dead: string[] = [];
  for (const d of catalog) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.variants)) continue;
    // Tipe kustom punya aturan keras sendiri (html wajib, error di atas) —
    // tidak ikut pemeriksaan varian-mati milik tipe predefined.
    if (!isBuiltinSectionType(String(d.type ?? ''))) continue;
    for (const v of d.variants as Array<Record<string, unknown>>) {
      if (!v || typeof v !== 'object') continue;
      const id = String(v.id ?? '');
      if (!id || RENDERED_VARIANT_IDS.has(id)) continue;
      if (typeof v.html === 'string' && v.html.trim()) continue;
      if (css.includes(id)) continue;
      dead.push(`${String(d.type ?? '?')}/${id}`);
    }
  }
  for (const label of dead.slice(0, 8)) {
    warnings.push(
      `Varian "${label}" tidak dikenal renderer dan tanpa html/customCss — tampil sama dengan varian default. Tambahkan variant.html atau sasar via customCss.`,
    );
  }
  if (dead.length > 8) {
    warnings.push(`…dan ${dead.length - 8} varian kustom tanpa html lainnya.`);
  }
  return warnings;
}

/** Kumpulkan key field bertipe html dari ConfigField[] (termasuk nested). */
export function collectHtmlKeys(fields: ConfigField[]): Set<string> {
  const keys = new Set<string>();
  const walk = (list: ConfigField[]) => {
    for (const f of list ?? []) {
      if (f.type === 'html') keys.add(f.key);
      if (Array.isArray(f.itemFields)) walk(f.itemFields);
    }
  };
  walk(fields);
  return keys;
}
