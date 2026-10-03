/**
 * Membangun objek `Template` dari baris `templates_library` (hasil import ZIP).
 *
 * MASALAH YANG DIPERBAIKI: preview & apply dulu meminjam blueprint
 * (`BUILTIN_TEMPLATES[0]` = pangkas-rapi) untuk SELURUH katalog — akibatnya
 * template import tampil seperti template bawaan: font Bebas Neue, radius 0,
 * tombol outline, varian & defaultStyle pangkas-rapi, dan `customCss` milik
 * template bahkan tidak diteruskan ke preview. Hanya palet + teks seed yang
 * selamat.
 *
 * Prinsip baru: **template library adalah sumber kebenaran untuk dirinya
 * sendiri**. Theme (palet, tipografi, komponen, efek), katalog headers /
 * footers / sections, `activeSections`, `designType`, aset, animasi,
 * behaviour, dan `customCss` semuanya dibaca dari `template_data` hasil
 * import. Blueprint bawaan HANYA jadi fallback per-bagian bila kunci hilang
 * atau tidak valid (agar template lama/v2 yang minim tetap bisa tampil).
 */
// No blueprint fallback - template library is standalone
import type {
  AnimationConfig,
  AssetMetadata,
  BehaviourConfig,
  BusinessCategory,
  ConfigField,
  DesignType,
  FooterVariant,
  HeaderVariant,
  SectionTypeDefinition,
  SectionVariant,
  Template,
} from './template-types';
import type { DesignStyleComponents, DesignStyleEffects, DesignStylePalette, DesignStyleTypography } from './types';

export interface LibraryTemplateData {
  name?: unknown;
  description?: unknown;
  category?: unknown;
  designType?: unknown;
  theme?: unknown;
  headers?: unknown;
  footers?: unknown;
  sections?: unknown;
  activeSections?: unknown;
  data?: unknown;
  animations?: unknown;
  behaviours?: unknown;
  assets?: unknown;
  customCss?: unknown;
  /** Bentuk applyable lama: override palet di root (lihat synthesize). */
  paletteOverride?: unknown;
  palette_override?: unknown;
}

export interface LibraryTemplateMeta {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

const VALID_DESIGN_TYPES: ReadonlySet<string> = new Set([
  'editorial',
  'brutalist',
  'organic',
  'luxury',
  'tech',
]);

const VALID_CATEGORIES: ReadonlySet<string> = new Set([
  'food',
  'fashion',
  'retail',
  'handicraft',
  'services',
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Ambil `template_data` dari baris DB (mendukung bungkus `{data}` legacy). */
export function unwrapLibraryData(row: Record<string, unknown>): LibraryTemplateData {
  const td = (row.template_data ?? {}) as Record<string, unknown>;
  return td as LibraryTemplateData;
}

function normalizePalette(theme: unknown, fallback: DesignStylePalette): DesignStylePalette {
  const p = (isRecord(theme) ? theme.palette : undefined) as Record<string, unknown> | undefined;
  const pick = (key: keyof DesignStylePalette): string => {
    const v = p?.[key];
    return typeof v === 'string' && v.trim() ? v : fallback[key];
  };
  return {
    primary: pick('primary'),
    secondary: pick('secondary'),
    accent: pick('accent'),
    background: pick('background'),
    surface: pick('surface'),
    text: pick('text'),
    textMuted: pick('textMuted'),
    border: pick('border'),
  };
}

function normalizeTypography(theme: unknown, fallback: DesignStyleTypography): DesignStyleTypography {
  const t = (isRecord(theme) ? theme.typography : undefined) as Record<string, unknown> | undefined;
  const str = (key: keyof DesignStyleTypography, fb: string): string =>
    typeof t?.[key] === 'string' && (t[key] as string).trim() ? (t[key] as string) : fb;
  const num = (key: 'baseSize' | 'scaleRatio' | 'headingWeight' | 'bodyWeight', fb: number): number =>
    typeof t?.[key] === 'number' && Number.isFinite(t[key]) ? (t[key] as number) : fb;
  return {
    headingFont: str('headingFont', fallback.headingFont),
    bodyFont: str('bodyFont', fallback.bodyFont),
    baseSize: num('baseSize', fallback.baseSize),
    scaleRatio: num('scaleRatio', fallback.scaleRatio),
    headingWeight: num('headingWeight', fallback.headingWeight),
    bodyWeight: num('bodyWeight', fallback.bodyWeight),
  };
}

function normalizeComponents(theme: unknown, fallback: DesignStyleComponents): DesignStyleComponents {
  const c = (isRecord(theme) ? theme.components : undefined) as Record<string, unknown> | undefined;
  const oneOf = <T extends string>(key: string, allowed: readonly T[], fb: T): T => {
    const v = c?.[key];
    return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fb;
  };
  return {
    borderRadius:
      typeof c?.borderRadius === 'number' && Number.isFinite(c.borderRadius)
        ? Math.max(0, Math.min(48, c.borderRadius as number))
        : fallback.borderRadius,
    buttonStyle: oneOf('buttonStyle', ['solid', 'outline', 'ghost', 'gradient'] as const, fallback.buttonStyle),
    shadowStyle: oneOf('shadowStyle', ['none', 'sm', 'md', 'lg', 'xl'] as const, fallback.shadowStyle),
    navStyle: oneOf('navStyle', ['solid', 'transparent', 'glass', 'bordered'] as const, fallback.navStyle),
    footerStyle: oneOf('footerStyle', ['simple', 'columns', 'centered', 'minimal'] as const, fallback.footerStyle),
  };
}

function normalizeEffects(theme: unknown, fallback: DesignStyleEffects): DesignStyleEffects {
  const e = (isRecord(theme) ? theme.effects : undefined) as Record<string, unknown> | undefined;
  if (!e) return { ...fallback };
  return {
    ...(typeof e.glassmorphism === 'boolean' ? { glassmorphism: e.glassmorphism } : {}),
    ...(typeof e.gradientBackgrounds === 'boolean' ? { gradientBackgrounds: e.gradientBackgrounds } : {}),
    ...(typeof e.borderWidth === 'number' ? { borderWidth: e.borderWidth } : {}),
    ...(typeof e.uppercaseHeadings === 'boolean' ? { uppercaseHeadings: e.uppercaseHeadings } : {}),
  };
}

function normalizeConfigFields(fields: unknown): ConfigField[] {
  if (!Array.isArray(fields)) return [];
  return fields.filter(isRecord).map((f) => {
    const field: ConfigField = {
      key: asString(f.key, 'field'),
      label: asString(f.label, asString(f.key, 'Field')),
      type: (typeof f.type === 'string' ? f.type : 'text') as ConfigField['type'],
    };
    if (Array.isArray(f.options)) {
      field.options = f.options.filter(isRecord).map((o) => ({
        label: asString(o.label),
        value: asString(o.value),
      }));
    }
    if (Array.isArray(f.itemFields)) field.itemFields = normalizeConfigFields(f.itemFields);
    if (typeof f.placeholder === 'string') field.placeholder = f.placeholder;
    if (f.defaultValue !== undefined) field.defaultValue = f.defaultValue as ConfigField['defaultValue'];
    if (typeof f.maxItems === 'number') field.maxItems = f.maxItems;
    if (typeof f.rows === 'number') field.rows = f.rows;
    return field;
  });
}

function normalizeSectionVariant(v: unknown): SectionVariant | null {
  if (!isRecord(v) || !asString(v.id)) return null;
  return {
    id: asString(v.id),
    name: asString(v.name, asString(v.id)),
    description: asString(v.description, ''),
    layout: asString(v.layout, asString(v.id)),
    configFields: normalizeConfigFields(v.configFields),
    defaultConfig: isRecord(v.defaultConfig) ? (v.defaultConfig as Record<string, unknown>) : {},
    ...(isRecord(v.defaultStyle) ? { defaultStyle: v.defaultStyle as SectionVariant['defaultStyle'] } : {}),
    mockup: asString(v.mockup, asString(v.id)),
    ...(typeof v.html === 'string' && v.html ? { html: v.html } : {}),
  };
}

function normalizeHeader(h: unknown): HeaderVariant | null {
  if (!isRecord(h) || !asString(h.id)) return null;
  return {
    id: asString(h.id),
    name: asString(h.name, asString(h.id)),
    description: asString(h.description, ''),
    layout: asString(h.layout, 'standard'),
    configFields: normalizeConfigFields(h.configFields),
    defaultConfig: isRecord(h.defaultConfig) ? (h.defaultConfig as Record<string, unknown>) : {},
    mockup: asString(h.mockup, 'header-standard'),
    ...(typeof h.maxNavDepth === 'number' && (h.maxNavDepth === 1 || h.maxNavDepth === 2)
      ? { maxNavDepth: h.maxNavDepth as 1 | 2 }
      : {}),
    ...(typeof h.html === 'string' && h.html ? { html: h.html } : {}),
  };
}

function normalizeFooter(f: unknown): FooterVariant | null {
  if (!isRecord(f) || !asString(f.id)) return null;
  return {
    id: asString(f.id),
    name: asString(f.name, asString(f.id)),
    description: asString(f.description, ''),
    layout: asString(f.layout, 'simple'),
    configFields: normalizeConfigFields(f.configFields),
    defaultConfig: isRecord(f.defaultConfig) ? (f.defaultConfig as Record<string, unknown>) : {},
    mockup: asString(f.mockup, 'footer-simple'),
    ...(typeof f.html === 'string' && f.html ? { html: f.html } : {}),
  };
}

/**
 * Bangun `Template` penuh dari `template_data` library.
 *
 * Template library adalah standalone - tidak ada blueprint fallback.
 * Semua data dibaca dari `template_data` hasil import ZIP.
 */
export function buildLibraryTemplate(
  rawData: LibraryTemplateData | Record<string, unknown>,
  meta: LibraryTemplateMeta,
): Template & { data: Record<string, unknown> } {
  const td = (rawData ?? {}) as LibraryTemplateData;
  const data = (isRecord(td.data) ? td.data : {}) as Record<string, unknown>;

  const category =
    (typeof td.category === 'string' && VALID_CATEGORIES.has(td.category)
      ? td.category
      : typeof meta.category === 'string' && VALID_CATEGORIES.has(meta.category)
        ? meta.category
        : 'services') as BusinessCategory;

  const designType =
    (typeof td.designType === 'string' && VALID_DESIGN_TYPES.has(td.designType)
      ? td.designType
      : 'editorial') as DesignType;

  // Katalog milik template dulu; tidak ada fallback blueprint.
  const headers = (Array.isArray(td.headers) ? td.headers : [])
    .map(normalizeHeader)
    .filter((h): h is HeaderVariant => !!h);
  const footers = (Array.isArray(td.footers) ? td.footers : [])
    .map(normalizeFooter)
    .filter((f): f is FooterVariant => !!f);
  const sections = (Array.isArray(td.sections) ? td.sections : [])
    .map((s) => {
      if (!isRecord(s) || !asString(s.type)) return null;
      const variants = (Array.isArray(s.variants) ? s.variants : [])
        .map(normalizeSectionVariant)
        .filter((v): v is SectionVariant => !!v);
      if (variants.length === 0) return null;
      const def: SectionTypeDefinition = {
        type: asString(s.type),
        name: asString(s.name, asString(s.type)),
        icon: asString(s.icon, 'Layout'),
        variants,
      };
      return def;
    })
    .filter((d): d is SectionTypeDefinition => !!d);

  const ownActive = asStringArray(td.activeSections);
  const dataActive = asStringArray(data.activeSections);
  const activeSections = ownActive.length > 0 ? ownActive : dataActive.length > 0 ? dataActive : undefined;

  const animations = (Array.isArray(td.animations) ? td.animations : []).filter(isRecord) as unknown as AnimationConfig[];
  const behaviours = (Array.isArray(td.behaviours) ? td.behaviours : []).filter(isRecord) as unknown as BehaviourConfig[];
  const assets = (Array.isArray(td.assets) ? td.assets : []).filter(isRecord) as unknown as AssetMetadata[];
  const customCss = typeof td.customCss === 'string' ? td.customCss : asString(data.customCss);

  // Override palet level seed menang atas theme. Dua bentuk didukung:
  // - `data.paletteOverride` (bentuk DB: template_data.data.*)
  // - root `paletteOverride` (bentuk applyable lama / synthesize langsung)
  const seedPalette =
    (isRecord(data.paletteOverride) ? data.paletteOverride : undefined) ??
    (isRecord(data.palette_override) ? data.palette_override : undefined) ??
    (isRecord(td.paletteOverride) ? td.paletteOverride as Record<string, unknown> : undefined) ??
    (isRecord(td.palette_override) ? td.palette_override as Record<string, unknown> : undefined);
  const themeWithSeedOverride = isRecord(seedPalette)
    ? { ...(isRecord(td.theme) ? td.theme : {}), palette: { ...((isRecord(td.theme) ? td.theme.palette : {}) as Record<string, unknown>), ...seedPalette } }
    : td.theme;

  const template: Template & { data: Record<string, unknown> } = {
    id: meta.id,
    name: meta.name,
    description: meta.description ?? asString(td.description),
    category,
    designType,
    theme: {
      palette: normalizePalette(themeWithSeedOverride, {
        primary: '#333333',
        secondary: '#666666',
        accent: '#333333',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#333333',
        textMuted: '#666666',
        border: '#e5e5e5',
      }),
      typography: normalizeTypography(td.theme, {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseSize: 16,
        scaleRatio: 1.25,
        headingWeight: 700,
        bodyWeight: 400,
      }),
      components: normalizeComponents(td.theme, {
        borderRadius: 4,
        buttonStyle: 'solid',
        shadowStyle: 'sm',
        navStyle: 'solid',
        footerStyle: 'simple',
      }),
      effects: normalizeEffects(td.theme, {}),
    },
    headers: headers.length > 0 ? headers : [],
    footers: footers.length > 0 ? footers : [],
    sections: sections.length > 0 ? sections : [],
    ...(animations.length > 0 ? { animations } : {}),
    ...(behaviours.length > 0 ? { behaviours } : {}),
    ...(assets.length > 0 ? { assets } : {}),
    ...(activeSections ? { activeSections } : {}),
    ...(customCss ? { customCss } : {}),
    data: { ...data },
  };
  return template;
}

/** Cari varian header: cocokkan id dulu, lalu layout, lalu pertama. */
export function pickLibraryHeaderVariant(template: Template, want?: unknown): HeaderVariant {
  const w = asString(want);
  return (
    template.headers.find((h) => h.id === w) ??
    template.headers.find((h) => h.layout === w) ??
    template.headers[0]
  );
}

/** Cari varian footer: cocokkan id dulu, lalu layout/style, lalu pertama. */
export function pickLibraryFooterVariant(template: Template, want?: unknown): FooterVariant {
  const w = asString(want);
  return (
    template.footers.find((f) => f.id === w) ??
    template.footers.find((f) => f.layout === w) ??
    template.footers[0]
  );
}
