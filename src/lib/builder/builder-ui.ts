/**
 * Konstanta & helper UI untuk Builder (single-page /web-design/customize).
 *
 * Sengaja dipisah dari komponen React supaya:
 *  1. label/titel sidebar punya SATU sumber kebenaran (dulu `'Sections'` /
 *     `'Section Config'` / `'Builder'` campur Inggris dengan teks Indonesia), dan
 *  2. logika murni (clamp lebar, checklist, mode viewport) bisa diuji tanpa
 *     DOM — `vitest.config.ts` memakai `environment: "node"`.
 */

/** Level navigasi sidebar. Cerminan `SidebarLevel` di builder-sidebar.tsx. */
export type SidebarLevel =
  | 'main'
  | 'sections'
  | 'section-config'
  | 'header'
  | 'footer'
  | 'style'
  | 'template-info';

/** Perubahan belum aman ditinggalkan jika salah satu store masih dirty. */
export function hasUnsavedBuilderChanges(builderSaved: boolean, templateSaved: boolean): boolean {
  return !builderSaved || !templateSaved;
}

/** Judul panel sidebar — semua Bahasa Indonesia. */
export const SIDEBAR_TITLES: Record<SidebarLevel, string> = {
  main: 'Editor Website',
  sections: 'Daftar Blok',
  'section-config': 'Edit Blok',
  header: 'Header',
  footer: 'Footer',
  style: 'Tema & Warna',
  'template-info': 'Detail Template',
};

/* ------------------------------------------------------------------ */
/* Lebar sidebar                                                        */
/* ------------------------------------------------------------------ */

export const SIDEBAR_MIN_WIDTH = 288;
export const SIDEBAR_MAX_WIDTH = 480;
export const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_WIDTH_KEY = 'builder:sidebar-width';

/** Clamp lebar sidebar ke rentang aman (juga memperbaiki nilai rusak). */
export function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH;
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

/**
 * Baca lebar sidebar tersimpan. Aman saat SSR (`typeof window` belum ada) dan
 * saat localStorage diblokir browser: selalu fallback ke default, tak pernah melempar.
 */
export function loadSidebarWidth(): number {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (raw === null) return SIDEBAR_DEFAULT_WIDTH;
    return clampSidebarWidth(Number.parseInt(raw, 10));
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
  }
}

/** Simpan lebar sidebar. Dibungkus try/catch (mode privat / storage penuh). */
export function persistSidebarWidth(width: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(clampSidebarWidth(width)));
  } catch {
    /* penyimpanan tidak tersedia — tetap jalan untuk sesi ini */
  }
}

/* ------------------------------------------------------------------ */
/* Mode viewport                                                        */
/* ------------------------------------------------------------------ */

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const VIEWPORT_WIDTHS: Record<ViewportMode, number> = {
  desktop: 1024,
  tablet: 768,
  mobile: 375,
};

/**
 * Mode viewport dari lebar kanal. Lebar di antara preset (mis. 900px)
 * dipetakan ke mode terdekat supaya tombol di bottom bar tidak pernah
 * "tidak ada yang aktif".
 */
export function viewportModeOf(width: number): ViewportMode {
  if (width <= VIEWPORT_WIDTHS.mobile) return 'mobile';
  if (width < VIEWPORT_WIDTHS.desktop) return 'tablet';
  return 'desktop';
}

/* ------------------------------------------------------------------ */
/* Ambang SEO                                                           */
/* ------------------------------------------------------------------ */

/** Panjang minimum meta title yang masih masuk akal di mesin pencari. */
export const MIN_SEO_TITLE = 10;

/* ------------------------------------------------------------------ */
/* Pintasan keyboard                                                    */
/* ------------------------------------------------------------------ */

export interface Shortcut {
  keys: string;
  label: string;
}

/** Satu sumber kebenaran untuk shortcut + teks bantuan di bottom bar/sidebar. */
export const BUILDER_SHORTCUTS: Shortcut[] = [
  { keys: 'Ctrl+S', label: 'Simpan' },
  { keys: 'Esc', label: 'Keluar preview / batal pilih' },
  { keys: 'Enter', label: 'Buka blok terpilih' },
];