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
import { BUILTIN_TEMPLATES } from './template-store';
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

/** Buang prefix `builtin-` yang dipakai untuk membedakan asal di galeri. */
export function resolveTemplateId(id: string): string {
  return id.startsWith('builtin-') ? id.slice(8) : id;
}

export function isLibraryTemplate(template: { source?: string }): boolean {
  return template.source === 'saved';
}

/**
 * Ubah seed `data.sections` jadi format yang disimpan di `custom_config`.
 * Sama persis dengan yang dipakai seed kanvas, supaya hasil apply = hasil
 * pratinjau (termasuk foto bawaan per-niche).
 */
export function resolveTemplateSections(
  data: TemplateDataLike,
  category?: string,
): Array<Record<string, unknown>> {
  return (data.sections ?? []).map((s) => {
    const variant = getSectionVariant(s.type as SectionType, s.variant);
    const base = variant?.defaultConfig ?? {};
    const override = (s.config ?? {}) as Record<string, unknown>;
    const styleBase = variant?.defaultStyle ?? {};
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
  return {
    design_style_id: data.designStyleId ?? 'minimalist',
    palette_override: data.paletteOverride ?? {},
    sections: resolveTemplateSections(data, template.category),
    header: data.header ?? {},
    footer: data.footer ?? {},
    layout: { rows: [] },
    core: data.core ?? {},
    seo: data.seo ?? {},
    theme: {},
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
 * `template_source: 'saved'` wajib ikut: template library punya id dari tabel
 * `templates_library`, bukan `templates`. Tanpa penanda itu server akan
 * mencarinya di tabel yang salah dan membalas 404 "Template tidak ditemukan".
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
 * Bentuk objek `Template` yang valid dari isi template library.
 *
 * Template library hanya menyimpan seed + config; katalog varian section TIDAK
 * ikut tersimpan. Jadi katalognya dipinjam dari blueprint (template bawaan
 * pertama) lalu palet diganti dengan milik library. Tanpa ini, id varian seperti
 * `booking-single` tidak ketemu dan section jatuh ke varian pertama.
 */
export function synthesizeLibraryTemplate(
  data: TemplateDataLike,
  meta: { id: string; name: string; description?: string; category?: string },
): Template & { data: TemplateDataLike } {
  const blueprint = BUILTIN_TEMPLATES[0];
  if (!blueprint) {
    throw new Error('Template bawaan tidak tersedia — tidak bisa menyusun template library.');
  }
  const palette = { ...blueprint.theme.palette, ...(data.paletteOverride ?? {}) };
  return {
    ...blueprint,
    id: meta.id,
    name: meta.name,
    description: meta.description ?? '',
    ...(meta.category ? { category: meta.category } : {}),
    // `designType` ikut dari blueprint. Template hasil import library tidak
    // punya designType sendiri, jadi blueprint yang dipakai sebagai acuan.
    // Kontraknya dijaga di `templates/catalog.test.ts`.
    theme: { ...blueprint.theme, palette },
    customCss: data.customCss ?? '',
    animations: (data.animations ?? []) as Template['animations'],
    behaviours: (data.behaviours ?? []) as Template['behaviours'],
    data,
  } as Template & { data: TemplateDataLike };
}

