/**
 * Bentuk `custom_config` website — SATU definisi untuk dua arah.
 *
 * Kenapa modul ini ada
 * -------------------
 * `PUT /api/websites/[id]/website` menulis `user_templates.custom_config`
 * memakai whitelist, tapi `GET` membacanya memakai whitelist KEDUA yang lebih
 * sempit. Akibatnya `palette_override`, `animations`, `behaviours`,
 * `customCss`, dan `assets` yang tersimpan tidak pernah sampai ke builder.
 *
 * Gejalanya persis seperti laporan user: "simpan template sebagai template
 * baru -> terapkan template lain -> terapkan kembali, templatenya tidak
 * berubah dengan template yang tersimpan". Setelah reload, kanvas memakai
 * `palette` bawaan template katalog, bukan warna yang disimpan, sehingga
 * template tersimpan tampak "tidak berubah" sama sekali.
 *
 * Dua whitelist yang berbeda = bug yang pasti terlewat. Modul ini jadi
 * satu-satunya tempat yang tahu bentuk config website, sehingga GET dan PUT
 * tidak bisa lagi melenceng satu sama lain.
 *
 * Murni & bebas React supaya bisa diuji tanpa DOM — `vitest.config.ts`
 * memakai `environment: "node"`.
 */

import { ensureSectionIdentities } from './migration';
import { sanitizePaletteOverride } from './validation';

/** Config website yang dikirim ke builder (dan jadi sumber live site). */
export interface ActiveCustomConfig {
  /**
   * Skema warna pilihan user (StyleSelector -> "Warna Tema").
   * WAJIB ada di respons: ini yang bikin template tersimpan tetap terlihat
   * seperti yang disimpan, bukan seperti bawaan template katalog.
   */
  palette_override: Record<string, string>;
  sections: unknown[];
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
  theme: Record<string, unknown>;
  core: Record<string, unknown>;
  seo: Record<string, unknown>;
  /** Creative layer template — dijalankan `BehaviourRuntime`. */
  animations: unknown[];
  behaviours: unknown[];
  customCss: string;
  assets: unknown[];
  /** Slug katalog yang jadi basis config ini (dipakai seed sections). */
  catalog_template_id: string | null;
  /** Single-page (044): status tayang + meta halaman. */
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function asMetaString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Apakah ada config tersimpan yang bisa dipakai builder?
 *
 * Syaratnya SAMA dengan versi lama (`stored && storedConfig.design_style_id`)
 * supaya baris tanpa config tidak dianggap "sudah customized".
 *
 * `design_style_id` tidak lagi jadi penanda tunggal: konsep design style
 * dihapus (migrasi 046) dan key itu dihapus dari JSON pada baris yang punya
 * `catalog_template_id`. Kalau key itu tetap jadi syarat WAJIB, semua baris
 * tersebut akan terbaca "default" dan kanvas user ter-reset.
 *
 * Jadi sekarang dianggap tersimpan bila salah satu sinyal ini ada:
 *   - `design_style_id` — baris legacy, key lama masih utuh (backward compat).
 *   - `catalog_template_id` — penanda baru yang selalu ditulis server saat
 *     menyimpan, mis. "food".
 *   - `sections` non-kosong — config benar-benar berisi hasil editing.
 *
 * Sinyal `sections` sengaja paling akhir: baris template yang baru ter-apply
 * pun punya sections, jadi ini-catching untuk config hasil "Simpan Template".
 */
export function hasStoredCustomConfig(stored: unknown, storedConfig: unknown): boolean {
  if (!stored || !isRecord(storedConfig)) return false;
  if (typeof storedConfig.design_style_id === 'string' && storedConfig.design_style_id.length > 0) {
    return true;
  }
  if (
    typeof storedConfig.catalog_template_id === 'string' &&
    storedConfig.catalog_template_id.length > 0
  ) {
    return true;
  }
  return Array.isArray(storedConfig.sections) && storedConfig.sections.length > 0;
}

/**
 * Bentuk config yang dikirim ke builder dari baris `user_templates` tersimpan.
 *
 * INI versi lengkap — semua field yang ditulis `buildStoredCustomConfig`
 * harus ikut dikembalikan, kalau tidak config yang disimpan tidak pernah
 * kembali ke builder dan hasilnya "template tidak berubah".
 */
export function buildActiveCustomConfig(storedConfig: unknown): ActiveCustomConfig {
  const cfg = asRecord(storedConfig);
  return {
    palette_override: sanitizePaletteOverride(cfg.palette_override),
    sections: asArray(cfg.sections),
    header: asRecord(cfg.header),
    footer: asRecord(cfg.footer),
    theme: asRecord(cfg.theme),
    core: asRecord(cfg.core),
    seo: asRecord(cfg.seo),
    animations: asArray(cfg.animations),
    behaviours: asArray(cfg.behaviours),
    customCss: typeof cfg.customCss === 'string' ? cfg.customCss : '',
    assets: asArray(cfg.assets),
    catalog_template_id:
      typeof cfg.catalog_template_id === 'string' ? cfg.catalog_template_id : null,
    // `!== false` (bukan `=== true`): baris lama tanpa field ini dianggap
    // tayang, sama seperti aturan `buildSite` di `public.ts`.
    is_published: cfg.is_published !== false,
    meta_title: asMetaString(cfg.meta_title),
    meta_description: asMetaString(cfg.meta_description),
    og_image_url: asMetaString(cfg.og_image_url),
  };
}

/**
 * Config default untuk website yang belum pernah disimpan.
 *
 * `is_published: true` sengaja: website baru harus tetap bisa dibuka publik
 * (lihat `buildSite`) walau builder belum pernah menyalin apa pun.
 */
export function buildDefaultCustomConfig(): ActiveCustomConfig {
  return {
    palette_override: {},
    sections: [],
    header: {},
    footer: {},
    theme: {},
    core: {},
    seo: {},
    animations: [],
    behaviours: [],
    customCss: '',
    assets: [],
    catalog_template_id: null,
    is_published: true,
    meta_title: null,
    meta_description: null,
    og_image_url: null,
  };
}

/**
 * Config yang disimpan website (PUT) — whitelist server.
 *
 * Dipakai kedua branch PUT supaya tidak ada lagi dua versi yang lama-lama
 * pasti melenceng: branch "format baru" dulu menyimpan `palette_override`
 * mentah, branch legacy menyimpannya lewat `sanitizePaletteOverride` dan
 * membuang `assets` — sekarang keduanya identik.
 *
 * `is_published` sengaja TIDAK diisi di sini, supaya `PUT` bisa membedakan
 * "payload tidak menyebut status tayang" (jalur terapkan template) dari
 * "payload benar-benar bilang draft". Lihat `resolveNextIsPublished`.
 */
export function buildStoredCustomConfig(
  customConfig: unknown,
  catalogTemplateId: string,
): Record<string, unknown> {
  const cfg = asRecord(customConfig);
  return {
    // Jangan buang skema warna user: tanpanya live site selalu kembali ke
    // warna bawaan template walau kanvas sudah diganti.
    palette_override: sanitizePaletteOverride(cfg.palette_override),
    // Normalisasi identitas sections di server: client lama / baris lama bisa
    // menyimpan tanpa variant+anchorId sehingga section hilang di live. Aturan
    // sama dengan seed kanvas & render publik -> ketiganya sepakat.
    sections: ensureSectionIdentities(cfg.sections ?? [], catalogTemplateId),
    header: asRecord(cfg.header),
    footer: asRecord(cfg.footer),
    theme: asRecord(cfg.theme),
    core: asRecord(cfg.core),
    seo: asRecord(cfg.seo),
    // Animasi/behaviour template ikut tersimpan agar `BehaviourRuntime` bisa
    // menjalankannya di live site. Template tanpa animasi -> array kosong,
    // bukan undefined, supaya template lama yang disimpan ulang bersih.
    animations: Array.isArray(cfg.animations) ? cfg.animations : [],
    behaviours: Array.isArray(cfg.behaviours) ? cfg.behaviours : [],
    // CSS kustom template ikut tersimpan agar `BehaviourRuntime` bisa
    // menampilkannya di live site.
    customCss: typeof cfg.customCss === 'string' ? cfg.customCss : '',
    // Aset section (foto produk/hero) — frontend sudah membacanya, jadi
    // tidak boleh dibuang di server.
    assets: Array.isArray(cfg.assets) ? cfg.assets : [],
    catalog_template_id: catalogTemplateId,
    meta_title: asMetaString(cfg.meta_title),
    meta_description: asMetaString(cfg.meta_description),
    og_image_url: asMetaString(cfg.og_image_url),
  };
}

/**
 * Status tayang berikutnya untuk `custom_config` hasil `buildStoredCustomConfig`.
 *
 * Aturan:
 *   - payload mengirim boolean  -> dihormati apa adanya (tombol Simpan /
 *     Tayangkan dan panel SEO selalu mengirimnya).
 *   - payload TIDAK mengirimnya -> status milik website dipertahankan.
 *
 * Kenapa bukan `=== true` lagi: `applyTemplateToWebsite` (katalog) dan
 * `applySavedTemplate` (library) sengaja tidak mengirim `is_published`,
 * karena status tayang milik website — bukan milik template. Dengan
 * `=== true`, `undefined` menjadi `false` sehingga **menerapkan template
 * diam-diam mengubah website jadi Draft** dan live site (`buildSite`)
 * ikut 404.
 *
 * Tanpa config tersimpan sama sekali, default tetap Draft — sesuai aturan
 * lama "default yang benar = draft".
 */
export function resolveNextIsPublished(
  incoming: unknown,
  existingStoredConfig: unknown,
): boolean {
  if (typeof incoming === 'boolean') return incoming;
  return asRecord(existingStoredConfig).is_published === true;
}

/**
 * Paksa badge "Powered by" di footer untuk tier non-Enterprise.
 *
 * Badge hanya bisa dimatikan paket tertinggi (enterprise). Server yang
 * memaksa — bukan client — supaya toggle sidebar tidak bisa menipu: walau
 * client mengirim `showPowered: false`, tier < enterprise tetap dikembalikan
 * `true` + URL dikunci ke domain SaaS (anti pengalihan badge ke URL lain).
 *
 * Dipakai di PUT `/api/websites/[id]/website` (termasuk jalur demo).
 */
export const POWERED_BY_URL = 'https://rabasha.web.id';

export function enforcePoweredBy(
  customConfig: Record<string, unknown>,
  tier: string | null | undefined,
): Record<string, unknown> {
  const out = { ...customConfig };
  const footer = asRecord(out.footer);
  if (tier === 'enterprise') {
    out.footer = footer;
    return out;
  }
  out.footer = {
    ...footer,
    showPowered: true,
    poweredUrl: POWERED_BY_URL,
  };
  return out;
}