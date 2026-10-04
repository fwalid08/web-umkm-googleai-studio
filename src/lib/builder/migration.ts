import type { Template, TemplateSectionInstance, HeaderVariant, FooterVariant } from './template-types';
import { BUILT_IN_CATALOG } from './templates/catalog';
import type { Section, SectionType } from './types';

function generateId(): string {
  return crypto.randomUUID();
}

const SECTION_TYPE_MAP: Record<string, string> = {
  hero: 'hero',
  features: 'features',
  product_grid: 'product_grid',
  testimonials: 'testimonials',
  faq: 'faq',
  cta: 'cta',
  contact: 'contact',
  booking: 'booking',
  about: 'about',
  gallery: 'gallery',
  video: 'video',
  team: 'team',
  pricing: 'pricing',
  newsletter: 'newsletter',
  divider: 'divider',
  marquee: 'marquee',
  menu_board: 'menu_board',
  steps: 'steps',
  location: 'location',
};

const VARIANT_MAP: Record<string, Record<string, string>> = {
  hero: {
    'hero-full': 'hero-full',
    'hero-left': 'hero-split',
    'hero-right': 'hero-split',
    'hero-bg-image': 'hero-full',
  },
  features: {
    'features-3col': 'features-3col',
    'features-2col': 'features-list',
    'features-list': 'features-list',
  },
  product_grid: {
    'product-4col': 'product-4col',
    'product-3col': 'product-3col',
    'product-2col': 'product-2col',
  },
  testimonials: {
    'testimonials-grid': 'testimonials-grid',
    'testimonials-carousel': 'testimonials-carousel',
    'testimonials-single': 'testimonials-single',
  },
  faq: {
    'faq-accordion': 'faq-accordion',
    'faq-list': 'faq-list',
    'faq-grid': 'faq-grid',
  },
  cta: {
    'cta-banner': 'cta-banner',
    'cta-card': 'cta-card',
    'cta-split': 'cta-split',
  },
  contact: {
    'contact-form': 'contact-form',
    'contact-form-map': 'contact-form-map',
    'contact-split': 'contact-split',
  },
  booking: {
    'booking-single': 'booking-single',
    'booking-split': 'booking-split',
  },
  about: {
    'about-left': 'about-left',
    'about-right': 'about-right',
    'about-centered': 'about-centered',
  },
  gallery: {
    'gallery-grid': 'gallery-grid',
    'gallery-masonry': 'gallery-masonry',
    'gallery-carousel': 'gallery-carousel',
  },
  video: {
    'video-full': 'video-full',
    'video-centered': 'video-centered',
    'video-bg': 'video-full',
  },
  team: {
    'team-grid': 'team-grid',
    'team-list': 'team-list',
    'team-carousel': 'team-grid',
  },
  pricing: {
    'pricing-3tier': 'pricing-3tier',
    'pricing-2tier': 'pricing-2tier',
    'pricing-single': 'pricing-3tier',
  },
  newsletter: {
    'newsletter-inline': 'newsletter-inline',
    'newsletter-card': 'newsletter-card',
    'newsletter-split': 'newsletter-inline',
  },
  divider: {
    'divider-line': 'divider-line',
    'divider-spacer': 'divider-spacer',
    'divider-image': 'divider-line',
  },
  marquee: {
    'marquee-band': 'marquee-band',
  },
  menu_board: {
    'menu-tabs': 'menu-tabs',
    'menu-list': 'menu-list',
  },
  steps: {
    'steps-3col': 'steps-3col',
  },
  location: {
    'location-hours': 'location-hours',
  },
};

export function migrateOldConfig(oldConfig: Record<string, unknown>): Record<string, unknown> {
  const oldSections = Array.isArray(oldConfig.sections) ? oldConfig.sections : [];

  const newSections: TemplateSectionInstance[] = oldSections.map((oldSection: Record<string, unknown>) => {
    const oldType = oldSection.type as string;
    const oldVariant = oldSection.variant as string;
    const newType = SECTION_TYPE_MAP[oldType] || 'hero';
    const newVariant = VARIANT_MAP[newType]?.[oldVariant] || 'hero-full';

    return {
      id: generateId(),
      type: newType,
      variantId: newVariant,
      config: { ...(oldSection.config as Record<string, unknown> ?? {}) },
      style: {
        padding: { top: 64, right: 24, bottom: 64, left: 24, ...(oldSection.style as Record<string, unknown>)?.padding as object },
        background: ((oldSection.style as Record<string, unknown>)?.background as 'color' | 'image' | 'gradient' | 'transparent') || 'transparent',
        backgroundColor: (oldSection.style as Record<string, unknown>)?.backgroundColor as string | undefined,
        backgroundImage: (oldSection.style as Record<string, unknown>)?.backgroundImage as string | undefined,
        backgroundGradient: (oldSection.style as Record<string, unknown>)?.backgroundGradient as string | undefined,
      },
      responsive: (oldSection.responsive as Record<string, boolean>) ?? {},
    };
  });

  return {
    template_id: 'food',
    header_variant_id: 'header-standard',
    footer_variant_id: 'footer-simple',
    sections: newSections,
  };
}

export function isOldConfig(config: Record<string, unknown>): boolean {
  return !config.template_id && !config.header_variant_id && !config.footer_variant_id;
}
// ---------------------------------------------------------------------------
// Store bridge: builder-store (Section, key `variant`) <-> template-store
// (TemplateSectionInstance, key `variantId`).
//
// BuilderShell/topbar/bottom-bar membaca/menulis `useBuilderStore`, sedangkan
// kanvas+sidebar mengedit `useTemplateStore`. Fungsi di bawah menyatukan
// keduanya tanpa mengubah struktur state maupun tampilan: section id
// dipertahankan (undo, key React, dan public renderer tetap stabil) dan
// config/style milik user dipertahankan dengan merge ke default varian.
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPadding(value: unknown): TemplateSectionInstance['style']['padding'] {
  const padding = { top: 64, right: 24, bottom: 64, left: 24 };
  if (!isRecord(value)) return padding;
  for (const key of ['top', 'right', 'bottom', 'left'] as const) {
    const num = Number((value as Record<string, unknown>)[key]);
    if (Number.isFinite(num)) padding[key] = num;
  }
  return padding;
}

function toResponsive(value: unknown): TemplateSectionInstance['responsive'] {
  if (!isRecord(value)) return {};
  const out: TemplateSectionInstance['responsive'] = {};
  for (const key of ['hideOnMobile', 'hideOnTablet', 'hideOnDesktop'] as const) {
    if (typeof value[key] === 'boolean') out[key] = value[key];
  }
  return out;
}

/**
 * Konversi 1 section format builder-store -> template-store instance.
 * Tipe tak dikenal tidak dibuang: ditahan agar tidak hilang saat save,
 * lalu di-skip renderer publik bila varian tak dikenal (renderer sudah
 * `return null` untuk varian tak dikenal).
 */
export function builderSectionToInstance(
  section: Partial<Section> & { id?: string; type?: string; variant?: string },
  template: Template,
): TemplateSectionInstance {
  const rawType = typeof section.type === 'string' ? section.type : '';
  const typeDef = template.sections.find((s) => s.type === rawType);
  const type = typeDef ? rawType : 'hero';
  const typeDefResolved = typeDef ?? template.sections.find((s) => s.type === 'hero');
  const variantId =
    (typeof section.variant === 'string' && typeDefResolved?.variants.some((v) => v.id === section.variant)
      ? section.variant
      : undefined) ?? typeDefResolved?.variants[0]?.id ?? 'hero-full';
  const variant = typeDefResolved?.variants.find((v) => v.id === variantId);
  const rawStyle = isRecord(section.style) ? (section.style as Record<string, unknown>) : {};
  const background = rawStyle.background;
  return {
    id: typeof section.id === 'string' && section.id.length > 0 ? section.id : generateId(),
    type,
    variantId,
    config: { ...(variant?.defaultConfig ?? {}), ...(isRecord(section.config) ? section.config : {}) },
    style: {
      padding: toPadding(rawStyle.padding),
      background:
        background === 'color' || background === 'image' || background === 'gradient' || background === 'transparent'
          ? background
          : 'transparent',
      ...(typeof rawStyle.backgroundColor === 'string' ? { backgroundColor: rawStyle.backgroundColor } : {}),
      ...(typeof rawStyle.backgroundImage === 'string' ? { backgroundImage: rawStyle.backgroundImage } : {}),
      ...(typeof rawStyle.backgroundGradient === 'string' ? { backgroundGradient: rawStyle.backgroundGradient } : {}),
      ...(typeof rawStyle.backgroundBlur === 'number' ? { backgroundBlur: rawStyle.backgroundBlur } : {}),
      ...(rawStyle.backgroundSize === 'cover' || rawStyle.backgroundSize === 'contain' || rawStyle.backgroundSize === 'auto'
        ? { backgroundSize: rawStyle.backgroundSize }
        : {}),
      ...(rawStyle.backgroundOverlay === 'none' || rawStyle.backgroundOverlay === 'light' || rawStyle.backgroundOverlay === 'dark' || rawStyle.backgroundOverlay === 'primary'
        ? { backgroundOverlay: rawStyle.backgroundOverlay }
        : {}),
      ...(typeof rawStyle.backgroundOverlayOpacity === 'number'
        ? { backgroundOverlayOpacity: rawStyle.backgroundOverlayOpacity }
        : {}),
    },
    responsive: toResponsive(section.responsive),
    anchorId: typeof section.anchorId === 'string' ? section.anchorId : undefined,
  };
}

/** Konversi balik 1 instance template-store -> section format builder-store/API. */
export function instanceToBuilderSection(instance: TemplateSectionInstance): Section {
  return {
    id: instance.id,
    type: (instance.type ?? 'hero') as SectionType,
    variant: instance.variantId,
    config: { ...(instance.config ?? {}) },
    style: {
      padding: { ...instance.style.padding },
      background: instance.style.background,
      ...(instance.style.backgroundColor ? { backgroundColor: instance.style.backgroundColor } : {}),
      ...(instance.style.backgroundImage ? { backgroundImage: instance.style.backgroundImage } : {}),
      ...(instance.style.backgroundGradient ? { backgroundGradient: instance.style.backgroundGradient } : {}),
      ...(typeof instance.style.backgroundBlur === 'number' ? { backgroundBlur: instance.style.backgroundBlur } : {}),
      ...(instance.style.backgroundSize ? { backgroundSize: instance.style.backgroundSize } : {}),
      ...(instance.style.backgroundOverlay ? { backgroundOverlay: instance.style.backgroundOverlay } : {}),
      ...(typeof instance.style.backgroundOverlayOpacity === 'number'
        ? { backgroundOverlayOpacity: instance.style.backgroundOverlayOpacity }
        : {}),
    },
    responsive: { ...(instance.responsive ?? {}) },
    anchorId: instance.anchorId,
  };
}

function pickChromeVariant(
  template: Template,
  stored: Record<string, unknown> | undefined,
  kind: 'header' | 'footer',
): HeaderVariant | FooterVariant {
  const variants = kind === 'header' ? template.headers : template.footers;
  const wanted =
    typeof stored?.variant === 'string'
      ? stored.variant
      : kind === 'footer' && typeof stored?.style === 'string'
        ? stored.style
        : undefined;
  return variants.find((v) => v.id === wanted) ?? variants[0];
}

/**
 * Bangun config header/footer efektif: default varian + override tersimpan.
 * Dipakai kanvas & publik agar hasil edit user benar-benar tampil.
 */
export function resolveChromeConfig(
  template: Template,
  stored: Record<string, unknown> | undefined,
  kind: 'header' | 'footer',
): { variantId: string; layout: string; config: Record<string, unknown> } {
  const variant = pickChromeVariant(template, stored, kind);
  return {
    variantId: variant.id,
    layout: variant.layout,
    config: { ...(variant.defaultConfig ?? {}), ...(stored ?? {}) },
  };
}

/**
 * Bangun custom_config untuk API website dari state kedua store.
 * Sections selalu diambil dari instance template-store (sumber edit kanvas).
 */
export function buildWebsiteCustomConfig(input: {
  base?: Record<string, unknown>;
  sections: TemplateSectionInstance[];
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
  designStyleId: string;
  paletteOverride: Record<string, string>;
  typographyOverride?: Record<string, string>;
  animations?: unknown[];
  behaviours?: unknown[];
  assets?: unknown[];
  /**
   * CSS template efektif (dari store). Bila diisi, menimpa bawaan base —
   * tanpa ini customCss template hilang saat save pertama dari kanvas
   * (base masih kosong) dan tak pernah kembali. Bila undefined, bawaan
   * base dipertahankan apa adanya.
   */
  customCss?: string;
  seo: { title: string; description: string };
  core: Record<string, unknown>;
}): Record<string, unknown> {
  const baseTheme = (input.base?.theme ?? {}) as Record<string, unknown>;
  const baseTypography = (baseTheme.typography ?? {}) as Record<string, unknown>;
  return {
    ...(input.base ?? {}),
    ...(input.customCss !== undefined ? { customCss: input.customCss } : {}),
    design_style_id: input.designStyleId,
    palette_override: { ...(input.paletteOverride ?? {}) },
    theme: {
      ...baseTheme,
      typography: { ...baseTypography, ...(input.typographyOverride ?? {}) },
    },
    ...(input.animations !== undefined ? { animations: input.animations } : {}),
    ...(input.behaviours !== undefined ? { behaviours: input.behaviours } : {}),
    ...(input.assets !== undefined ? { assets: input.assets } : {}),
    header: { ...input.header },
    footer: { ...input.footer },
    seo: { title: input.seo?.title ?? '', description: input.seo?.description ?? '' },
    sections: input.sections.map(instanceToBuilderSection),
    core: { ...(input.core ?? {}) },
  };
}

/**
 * Normalisasi identitas sections mentah (format builder: {type, variant, …})
 * sebelum disimpan: variant hilang/tak dikenal diisi varian pertama tipenya,
 * anchorId hilang diisi default template (dedup). Menyelamatkan baris lama
 * maupun client lama yang menyimpan tanpa variant — aturan SAMA dengan
 * seed kanvas & render publik sehingga ketiganya selalu sepakat.
 */
export function ensureSectionIdentities(
  sections: unknown,
  templateId?: string | null,
): Array<Record<string, unknown>> {
  if (!Array.isArray(sections)) return [];
  const used = new Set<string>();
  return sections.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }
    const s = { ...(raw as Record<string, unknown>) };
    const type =
      (typeof s.type === "string" && s.type.length > 0 && s.type) ||
      // Klien lama (onboarding/themes) mengirim sections berbentuk [{id}]
      // tanpa `type` — id seed sama dengan tipe section.
      (typeof s.id === "string" && SECTION_TYPE_MAP[s.id] ? s.id : "") ||
      "hero";
    s.type = type;
    // No catalog available, use first variant from registry
    s.variant = s.variant || 'hero-full';
    const anchor =
      typeof s.anchorId === 'string' && s.anchorId.length > 0
        ? uniqueAnchorId(s.anchorId, used)
        : uniqueAnchorId(defaultAnchorId(templateId ?? null, type, s.variant as string), used);
    if (anchor) s.anchorId = anchor;
    else delete s.anchorId;
    return s;
  });
}

/**
 * Tentukan template-store id dari `template_name` API (nama DB = kategori).
 * Mengembalikan null bila tak dikenal agar pemanggil bisa fallback aman.
 */
export function templateIdForApiName(
  templateName: unknown,
  catalog: Array<{ id: string; category: string }>,
): string | null {
  if (typeof templateName !== 'string' || templateName.length === 0) return null;
  return (
    catalog.find((t) => t.category === templateName)?.id ??
    catalog.find((t) => t.id === templateName)?.id ??
    null
  );
}

/**
 * AnchorId bawaan dari data template katalog: cocok persis (type+variant)
 * dulu, lalu fallback entri pertama dengan type yang sama. Dipakai agar
 * link anchor nav (`#tarif`, …) tetap hidup walau section tersimpan (mis.
 * baris lama) tidak membawa anchorId.
 */
export function defaultAnchorId(
  templateId: string | null | undefined,
  type: string,
  variant?: string | null,
): string | undefined {
  return undefined;
}

/**
 * Normalisasi anchor id yang diketik user di panel Section Config.
 *
 * Aturan ID HTML: hanya huruf/angka/hyphen/underscore, dan TIDAK BOLEH mulai
 * dengan angka (anchor `#123abc` tidak ter-resolve browser). Spasi diubah jadi
 * hyphen, huruf dikecilkan, sisanya dibuang.
 */
export function sanitizeAnchor(raw: string | undefined | null): string | undefined {
  if (typeof raw !== 'string') return undefined;
  let v = raw.trim().toLowerCase();
  // Hilangkan satu '#' di depan bila user menyalin format "#tarif".
  v = v.replace(/^#+/, '');
  // Karakter valid Aside dari itu dibuang (termasuk spasi → hyphen dulu).
  v = v.replace(/\s+/g, '-').replace(/[^a-z0-9_-]+/g, '').replace(/-+/g, '-');
  // Buang spasi/garis di tepi.
  v = v.replace(/^[-_]+/, '').replace(/[-_]+$/, '');
  // ID tidak boleh diawali angka → buang semua digit di depan.
  v = v.replace(/^[0-9]+/, '');
  v = v.replace(/^-+/, '');
  return v.length > 0 ? v : undefined;
}

/**
 * Jaga keunikan anchorId dalam satu halaman (id HTML duplikat tidak valid):
 * duplikat mendapat akhiran -2, -3, … Deterministik agar kanvas dan live
 * site selalu sepakat pada id yang sama untuk urutan sections yang sama.
 */
export function uniqueAnchorId(wanted: string | undefined, used: Set<string>): string | undefined {
  if (!wanted) return undefined;
  if (!used.has(wanted)) {
    used.add(wanted);
    return wanted;
  }
  let i = 2;
  while (used.has(`${wanted}-${i}`)) i++;
  const id = `${wanted}-${i}`;
  used.add(id);
  return id;
}

/**
 * Seed template-store dari sections tersimpan (builder format).
 * Duplikat id diperbaiki agar key React & undo tetap stabil.
 * anchorId yang hilang diisi dari default template (dedup) agar link
 * anchor nav tetap bekerja setelah reload — aturan yang sama dipakai
 * render publik sehingga kanvas dan live selalu sepakat.
 *
 * Guard: entri berbentuk DEFINISI katalog (`{ type, variants: [...] }`
 * tanpa `variant`) dilewati — itu katalog, bukan seed. Tanpa guard ini,
 * template library lama yang menyimpan katalog di `data.sections` meledak
 * menjadi 19 section varian-pertama di kanvas (kasus nyata: kanvas
 * berantakan sementara preview benar, karena preview membaca seed yang
 * benar dari `data.data.sections`).
 */
export function seedTemplateSections(
  template: Template,
  sections: Array<Partial<Section> & { id?: string; type?: string; variant?: string }> | undefined,
): TemplateSectionInstance[] {
  if (!Array.isArray(sections) || sections.length === 0) return [];
  const seen = new Set<string>();
  const usedAnchors = new Set<string>();
  const isCatalogDef = (s: unknown): boolean =>
    !!s &&
    typeof s === 'object' &&
    Array.isArray((s as Record<string, unknown>).variants) &&
    typeof (s as Record<string, unknown>).variant !== 'string';
  return sections.filter((s) => !isCatalogDef(s)).map((s) => {
    const instance = builderSectionToInstance(s ?? {}, template);
    if (seen.has(instance.id)) instance.id = generateId();
    seen.add(instance.id);
    if (!instance.anchorId) {
      instance.anchorId = uniqueAnchorId(
        defaultAnchorId(template.id, instance.type, instance.variantId),
        usedAnchors,
      );
    } else {
      uniqueAnchorId(instance.anchorId, usedAnchors);
    }
    return instance;
  });
}

