/**
 * Hidrasi kanvas (builder-store + template-store) dari `custom_config`.
 *
 * Kenapa modul ini ada: logika ini sebelumnya hanya hidup di efek load
 * `app/dashboard/web-design/customize/page.tsx`. Ketika "Terapkan template"
 * berubah menjadi staging-kanvas (TIDAK mengirim PUT ke server — keputusan
 * tayang milik tombol "Tayangkan"), galeri builder butuh logika YANG SAMA
 * untuk menuliskan config library ke store. Menduplikasikannya pasti membuat
 * hasil load-vs-apply lama-lama melenceng — pola yang sama yang melahirkan
 * modul `apply-template.ts`.
 *
 * Dua konsumen:
 *   1. Efek load halaman customize (`saved: true` — kanvas bersih);
 *   2. "Terapkan template" galeri builder (`saved: false` — kanvas kotor,
 *      badge "Belum disimpan" + peringatan leave-guard ikut menyala).
 *
 * Murni (tanpa JSX/DOM) supaya bisa diuji di environment node vitest.
 */
import { BUILT_IN_CATALOG } from './templates/catalog';
import { resolveChromeConfig, seedTemplateSections } from './migration';
import { useBuilderStore } from './store';
import { getTemplate, useTemplateStore } from './template-store';
import type { Template } from './template-types';

export interface HydrateCanvasOptions {
  /** `custom_config` — dari server (GET website) atau baris library (Template Saya). */
  config: Record<string, unknown>;
  /**
   * Slug katalog yang menentukan template kanvas (sudah dinormalisasi oleh
   * pemanggil; string kosong = template tak diketelah → seed dilewati,
   * perilaku sama dengan load lama saat `template_id` tidak bisa di-resolve).
   */
  templateId: string;
  /**
   * `true` = kanvas bersih (load dari server); `false` = staging apply —
   * kanvas ditandai kotor di KEDUA store supaya topbar menampilkan editan
   * belum disimpan dan navigasi diperingatkan.
   */
  saved: boolean;
}

/**
 * Tulis `custom_config` ke kedua store kanvas. Mengembalikan template yang
 * dipakai (bila resolve berhasil) agar pemanggil bisa mengeset ref meta
 * (mis. `libMetaRef` di halaman customize).
 */
export function hydrateCanvasFromConfig(opts: HydrateCanvasOptions): Template | undefined {
  const { config, templateId, saved } = opts;

  // Kanvas kosong (mis. website baru) tidak punya sections tersimpan.
  // Seed dari sections TEMPLATE, bukan config.sections global yang bisa
  // jadi snapshot basi.
  const savedPageSections = (Array.isArray(config.sections) ? config.sections : []) as unknown[];
  // `catalog_template_id` ada DI DALAM custom_config (hasil PUT whitelist),
  // bukan di `data` tingkat atas — membacanya dari `cfgJson.data` selalu
  // undefined sehingga seed sections template tidak pernah kepakai.
  const catalogTemplateId =
    typeof config.catalog_template_id === 'string' ? config.catalog_template_id : null;
  const templateSections =
    (BUILT_IN_CATALOG.find((t) => t.id === catalogTemplateId)?.data?.sections ??
      config.template_sections ??
      []) as unknown[];
  const pageSections =
    savedPageSections.length > 0 ? savedPageSections : templateSections;

  useBuilderStore.getState().loadConfig({
    core: config.core as Record<string, unknown> | undefined,
    palette_override: config.palette_override as Record<string, string> | undefined,
    sections: pageSections as never,
    header: config.header as never,
    footer: config.footer as never,
    theme: config.theme as Record<string, unknown> | undefined,
  });

  // PENTING (fix store ganda): seed kanvas/template-store dari sections
  // tersimpan. Urutan: setTemplate dulu (reset), lalu seed sections —
  // tanpa ini kanvas selalu kosong karena template-store tak pernah
  // menerima data load, dan sebaliknya edit kanvas tidak pernah ke-save.
  const templateStore = useTemplateStore.getState();
  if (templateId) templateStore.setTemplate(templateId);
  const seedTemplate = templateId ? getTemplate(templateId) : undefined;
  if (seedTemplate) {
    const storedHeader = config.header as Record<string, unknown> | undefined;
    const storedFooter = config.footer as Record<string, unknown> | undefined;
    const headerVariantId =
      seedTemplate.headers.find((h) => h.id === storedHeader?.variant)?.id ??
      seedTemplate.headers[0]?.id ??
      '';
    const footerVariantId =
      seedTemplate.footers.find(
        (f) => f.id === storedFooter?.variant || f.id === storedFooter?.style,
      )?.id ??
      seedTemplate.footers[0]?.id ??
      '';
    useTemplateStore.setState({
      template: seedTemplate,
      headerVariantId,
      footerVariantId,
      // Warna tema tersimpan hanya hidup di `palette_override`
      // (builder-store). Tanpa mirror ke `themeOverride` di sini, kanvas
      // masih benar karena `paletteOverride` ikut di-merge, TAPI
      // StyleSelector menghitung "N diubah" dari `themeOverride` — jadi
      // panel Tema tampak kosong padahal warnanya sudah tersimpan.
      themeOverride: (config.palette_override ?? {}) as Record<string, string>,
      ...(typeof config.customCss !== 'string' || !config.customCss
        ? { customCss: (seedTemplate as { customCss?: string }).customCss ?? '' }
        : {}),
      ...(!Array.isArray(config.animations) || config.animations.length === 0
        ? { animations: seedTemplate.animations ?? [] }
        : {}),
      ...(!Array.isArray(config.behaviours) || config.behaviours.length === 0
        ? { behaviours: seedTemplate.behaviours ?? [] }
        : {}),
      ...(!Array.isArray(config.assets) || config.assets.length === 0
        ? { assets: seedTemplate.assets ?? [] }
        : {}),
      // Staging apply: tandai kotor SEJAK AWAL — blok chrome di bawah
      // hanya menulis `saved` bila chrome template layak pakai.
      ...(saved ? {} : { saved: false }),
    });
  }
  // Seed hanya bila template punya headers+footers (resolveChromeConfig
  // membaca .id varian pertama; array kosong = crash). Kanvas tetap
  // dimuat dari sections halaman tersimpan walau seed dilewati.
  const hasUsableChrome =
    !!seedTemplate &&
    Array.isArray(seedTemplate.headers) &&
    seedTemplate.headers.length > 0 &&
    Array.isArray(seedTemplate.footers) &&
    seedTemplate.footers.length > 0;
  if (seedTemplate && hasUsableChrome) {
    templateStore.replaceSections(seedTemplateSections(seedTemplate, pageSections as never));
    // Seed konten header/footer efektif (default varian + tersimpan)
    // agar form sidebar & kanvas menampilkan nilai sebenarnya, bukan
    // sekadar default template.
    const effHeader = resolveChromeConfig(seedTemplate, config.header as Record<string, unknown> | undefined, 'header');
    const effFooter = resolveChromeConfig(seedTemplate, config.footer as Record<string, unknown> | undefined, 'footer');
    useTemplateStore.setState({
      headerConfig: effHeader.config,
      footerConfig: effFooter.config,
      headerVariantId: effHeader.variantId,
      footerVariantId: effFooter.variantId,
      animations: Array.isArray(config.animations) ? (config.animations as never) : [],
      behaviours: Array.isArray(config.behaviours) ? (config.behaviours as never) : [],
      assets: Array.isArray(config.assets) ? (config.assets as never) : [],
      saved,
    });
  }
  // `loadConfig` selalu menandai builder-store bersih; staging apply wajib
  // mengembalikannya ke kotor supaya indikator "belum disimpan" & guard
  // leave tetap akurat walau chrome template tidak layak pakai.
  if (!saved) {
    useBuilderStore.setState({ saved: false });
  }
  return seedTemplate;
}

