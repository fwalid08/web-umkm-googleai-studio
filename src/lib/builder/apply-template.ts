/**
 * Alur "terapkan template" — SATU implementasi untuk semua konsumen.
 *
 * Kenapa modul ini ada: `TemplateGallery` punya DUA konsumen —
 * `customize/templates-tab.tsx` dan `builder/builder-sidebar.tsx` — dan
 * logikanya pernah diduplikasi di keduanya. Akibatnya satu call site sempat
 * tertinggal: template hasil import ZIP gagal diterapkan di page-builder dengan
 * `Template not found in catalog: <uuid>` karena hanya call site itu yang masih
 * `BUILT_IN_CATALOG.find(...)`.
 *
 * Duplikasi = bug yang pasti terlewat. Modul ini jadi satu-satunya tempat
 * yang tahu bentuk payload apply, sehingga tidak bisa lagi meleset.
 */
import { getSectionVariant } from './sections/registry';
import { applySectionAssets } from './template-assets';
import { getTemplate } from './template-store';
import type { Template } from './template-types';
import type { SectionType } from './types';

/** Bentuk `data` yang dipakai apply — longgar agar cocok dengan hasil unwrap. */
export interface TemplateDataLike {
  designStyleId?: string;
  paletteOverride?: Record<string, string>;
  customCss?: string;
  animations?: unknown[];
  behaviours?: unknown[];
  sections?: Array<{
    type: string;
    variant: string;
    anchorId?: string;
    config?: Record<string, unknown>;
    style?: Record<string, unknown>;
  }>;
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  core?: Record<string, unknown>;
}

/** Bentuk template yang dipakai `TemplateGallery` (`UnifiedTemplate`). */
export interface ApplyableTemplate {
  id: string;
  name?: string;
  description?: string;
  /** `saved` = hasil import ZIP; `builtin` = template bawaan. */
  source?: 'builtin' | 'saved';
  category?: string;
  data: TemplateDataLike;
}

/** Buang prefix asal galeri bila ada. Galeri saat ini tidak lagi menambah
 *  prefix (ID = UUID asli), tapi nilai lama `system-<uuid>` / `builtin-<uuid>`
 *  mungkin sudah tersimpan sebagai template_id website — tetap didukung. */
export function resolveTemplateId(id: string): string {
  return id.replace(/^(system|builtin)-/, "");
}

export function isLibraryTemplate(template: { source?: string }): boolean {
  return template.source === 'saved';
}

/** Katalog varian milik template (dipakai sebelum registry statis). */
export interface SectionCatalogLike {
  type: string;
  variants: Array<{
    id: string;
    defaultConfig?: Record<string, unknown>;
    defaultStyle?: Record<string, unknown>;
  }>;
}

function findCatalogVariant(
  catalog: SectionCatalogLike[] | undefined,
  type: string,
  variantId: string,
): { defaultConfig: Record<string, unknown>; defaultStyle: Record<string, unknown> } | null {
  if (!Array.isArray(catalog)) return null;
  const def = catalog.find((d) => d?.type === type);
  const v = def?.variants?.find((x) => x?.id === variantId);
  if (!v) return null;
  return {
    defaultConfig: (v.defaultConfig ?? {}) as Record<string, unknown>,
    defaultStyle: (v.defaultStyle ?? {}) as Record<string, unknown>,
  };
}

/**
 * Ubah seed `data.sections` jadi format yang disimpan di `custom_config`.
 * Sama persis dengan yang dipakai seed kanvas, supaya hasil apply = hasil
 * pratinjau (termasuk foto bawaan per-niche).
 *
 * `catalog` = katalog sections milik template (template library v3).
 * Dipakai DULU sebelum registry statis, supaya `defaultConfig`/`defaultStyle`
 * varian milik template sendiri yang dipakai — bukan milik blueprint.
 */
export function resolveTemplateSections(
  data: TemplateDataLike,
  category?: string,
  catalog?: SectionCatalogLike[],
): Array<Record<string, unknown>> {
  return (data.sections ?? []).map((s) => {
    const own = findCatalogVariant(catalog, s.type, s.variant);
    const variant = own ? null : getSectionVariant(s.type as SectionType, s.variant);
    const base = own?.defaultConfig ?? variant?.defaultConfig ?? {};
    const override = (s.config ?? {}) as Record<string, unknown>;
    const styleBase = own?.defaultStyle ?? variant?.defaultStyle ?? {};
    const styleOverride = (s.style ?? {}) as Record<string, unknown>;

    const merged = applySectionAssets(
      { ...base, ...override } as Record<string, unknown>,
      category,
    );

    return {
      id: crypto.randomUUID(),
      type: s.type,
      variant: s.variant,
      config: JSON.parse(JSON.stringify(merged)),
      style: {
        padding: { top: 64, right: 24, bottom: 64, left: 24 },
        background: 'transparent' as const,
        ...JSON.parse(JSON.stringify(styleBase)),
        ...JSON.parse(JSON.stringify(styleOverride)),
      },
      responsive: {},
      // Anchor ikut dibawa supaya nav template library tetap punya tujuan.
      ...(s.anchorId ? { anchorId: s.anchorId } : {}),
    };
  });
}

/**
 * Susun `custom_config` untuk PUT. `customCss`/`animations`/`behaviours`
 * ikut di sini — tanpa itu creative layer hilang saat apply.
 */
export function buildTemplateCustomConfig(
  template: ApplyableTemplate,
): Record<string, unknown> {
  const data = template.data ?? {};
  // Template library membawa katalog sections-nya sendiri di level yang sama
  // (galeri menggabung template_data utuh ke `data`). Pakai itu dulu agar
  // default varian milik template yang dipakai saat apply.
  const raw = data as unknown as Record<string, unknown>;
  const maybeCatalog = Array.isArray(raw.sections) &&
    raw.sections.some((d) => !!d && typeof d === 'object' && Array.isArray((d as Record<string, unknown>).variants))
    ? (raw.sections as SectionCatalogLike[])
    : undefined;
  // Theme utuh milik template (tipografi/komponen/efek) ikut disimpan agar
  // live site tidak jatuh ke tema bawaan. Konsumen lama yang hanya membaca
  // `palette_override` tetap kompatibel.
  const theme = (raw.theme as Record<string, unknown> | undefined) ??
    (raw.data as Record<string, unknown> | undefined)?.theme;
  return {
    design_style_id: data.designStyleId ?? 'minimalist',
    palette_override: data.paletteOverride ?? {},
    sections: resolveTemplateSections(data, template.category, maybeCatalog),
    header: data.header ?? {},
    footer: data.footer ?? {},
    layout: { rows: [] },
    core: data.core ?? {},
    seo: data.seo ?? {},
    theme: theme ?? {},
    animations: data.animations ?? [],
    behaviours: data.behaviours ?? [],
    customCss: data.customCss ?? '',
  };
}

export interface ApplyTemplateResult {
  ok: boolean;
  error?: string;
  templateId: string;
}

/**
 * PUT template ke website. Satu-satunya implementasi apply.
 *
 * `template_id` adalah slug katalog statis (mis. 'food'). `template_source`
 * masih dikirim untuk kompatibilitas client lama, tetapi server
 * mengabaikannya (validasi hanya ke `BUILT_IN_CATALOG`).
 */
export async function applyTemplateToWebsite(opts: {
  websiteId: string;
  template: ApplyableTemplate;
}): Promise<ApplyTemplateResult> {
  const { websiteId, template } = opts;
  const templateId = resolveTemplateId(template.id);

  try {
    const res = await fetch(`/api/websites/${websiteId}/website`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        template_source: isLibraryTemplate(template) ? 'saved' : 'builtin',
        custom_config: buildTemplateCustomConfig(template),
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { success?: boolean; error?: string }
      | null;

    if (!res.ok || !json?.success) {
      return {
        ok: false,
        templateId,
        error: json?.error ?? `Gagal menerapkan template (HTTP ${res.status})`,
      };
    }
    return { ok: true, templateId };
  } catch (err) {
    return {
      ok: false,
      templateId,
      error: err instanceof Error ? err.message : 'Gagal menerapkan template',
    };
  }
}

/**
 * Resolve template untuk store/kanvas dari item galeri — SATU-SATUNYA tempat
 * yang tahu aturan ini (jangan diduplikasi di call site).
 *
 * Katalog statis adalah satu-satunya sumber: id slug (prefix legacy
 * `system-`/`builtin-` dinormalisasi) dicari di `BUILT_IN_CATALOG`.
 * Tidak pernah melempar; gagal → `undefined` (call site menampilkan error
 * "Template tidak ditemukan" seperti dulu).
 */
export function resolveStoreTemplate(
  applyable: Pick<ApplyableTemplate, 'id' | 'name' | 'description' | 'category' | 'source' | 'data'>,
): (Template & { data: TemplateDataLike }) | undefined {
  try {
    return getTemplate(resolveTemplateId(applyable.id)) as
      | (Template & { data: TemplateDataLike })
      | undefined;
  } catch {
    return undefined;
  }
}

