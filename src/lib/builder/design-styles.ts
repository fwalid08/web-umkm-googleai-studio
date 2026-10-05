/**
 * Utilitas warna & gradient untuk builder.
 *
 * Cakupan modul ini (migrasi 046): katalog `DESIGN_STYLES` (10 preset
 * "minimalist / organic / glassmorphism / ...") beserta endpoint
 * `/api/design-styles` dan tabel `design_styles` sudah dihapus. Yang
 * menggantikannya sudah ada di kode dan tetap dipakai `StyleSelector`:
 *
 *   - skema warna -> `COLOR_SCHEMES` di `./color-schemes`
 *   - font        -> `FONT_CATEGORIES` di `./font-categories`
 *   - palet dasar -> `theme.palette` milik template katalog
 *
 * Jadi file ini sekarang hanya menyisakan utilitas warna: kontras WCAG,
 * pemilihan warna teks, gradient, dan editoran palet.
 */

import type {
  DesignStyle,
  DesignStyleComponents,
  DesignStylePalette,
  DesignStyleTypography,
} from './types';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

function parseRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  const m = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)/i.exec(color.trim());
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
}

function toHexChannel(v: number): string {
  return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
}

/** Campurkan warna depan (rgba) di atas warna belakang (hex) → hex efektif. */
export function blendOnTop(fg: string, bgHex: string): string | null {
  const bg = hexToRgb(bgHex);
  if (!bg) return null;
  if (hexToRgb(fg)) return fg.startsWith('#') ? fg : `#${fg}`;
  const rgba = parseRgba(fg);
  if (!rgba) return null;
  const r = rgba.r * rgba.a + bg.r * (1 - rgba.a);
  const g = rgba.g * rgba.a + bg.g * (1 - rgba.a);
  const b = rgba.b * rgba.a + bg.b * (1 - rgba.a);
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

/** Ambil semua stop warna hex dari string gradient CSS. */
export function extractGradientStops(css: string): string[] {
  const matches = css.match(/#[a-f\d]{6}|#[a-f\d]{3}/gi);
  return matches ?? [];
}

const GRADIENT_CSS_RE = /^\s*(linear|radial|conic)-gradient\s*\(/i;
const ANGLE_RE = /^-?[\d.]+(deg|grad|rad|turn)$/i;

/** Pecah string ber-koma tanpa memotong nilai di dalam tanda kurung. */
function splitTopLevel(value: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of value) {
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out.filter((p) => p.length > 0);
}

export interface GradientSpec {
  /** Warna stopgradasi, sudah di-resolve dari token `theme:*`. */
  stops: string[];
  /** Sudut (CSS penuh) atau arah yang dipakai penyusun gradasi. */
  angle?: string;
}

/**
 * Baca `backgroundGradient` dalam dua format yang ada di data template:
 * 1. Singkat — `"#047857, #065f46, 135deg"` (format yang dipakai panel
 *    Gaya Blok dan `docs/TEMPLATE_GUIDE.md`).
 * 2. CSS penuh — `"linear-gradient(135deg, #8B5A2B 0%, #D4A574 100%)"`
 *    (format yang boleh dipakai template hasil AI).
 *
 * Keduanya dinormalkan ke bentuk yang sama supaya renderer dan panel selalu
 * sepakat. Nilai `theme:*` di-resolve ke palet aktif lebih dulu agar gradasi
 * ikut berubah saat user mengganti skema warna.
 */
export function parseGradientSpec(
  value: string | undefined | null,
  palette: DesignStylePalette,
): GradientSpec {
  const raw = resolveThemeTokensInString(value, palette);
  if (!raw) return { stops: [] };

  // Format CSS penuh: teruskan apa adanya (sudah valid untuk `background`).
  if (GRADIENT_CSS_RE.test(raw)) {
    return { stops: extractGradientStops(raw) };
  }

  const parts = splitTopLevel(raw);
  const stops: string[] = [];
  let angle: string | undefined;
  for (const part of parts) {
    if (ANGLE_RE.test(part)) {
      angle ??= part;
      continue;
    }
    stops.push(part);
  }
  return { stops, angle };
}

/**
 * Susun nilai CSS `background` yang valid dari `backgroundGradient`.
 * Mengembalikan `undefined` bila tidak ada warna yang bisa dipakai — pemanggil
 * lalu membiarkan latar section apa adanya, bukan menulis CSS rusak.
 */
export function composeGradientCss(
  value: string | undefined | null,
  palette: DesignStylePalette,
  fallback?: { primary: string; secondary: string; angle?: string },
): string | undefined {
  const raw = resolveThemeTokensInString(value, palette) ?? '';
  // Sudah CSS penuh → pakai langsung.
  if (GRADIENT_CSS_RE.test(raw)) return raw;

  const { stops, angle } = parseGradientSpec(raw, palette);
  // Tanpa stop warna, andalkan palet tema bila tersedia supaya memilih
  // "Gradasi" di panel selalu menampilkan sesuatu (bukan latar kosong).
  if (stops.length === 0) {
    if (!fallback) return undefined;
    return `linear-gradient(${fallback.angle ?? '135deg'}, ${fallback.primary}, ${fallback.secondary})`;
  }
  return `linear-gradient(${angle ?? '135deg'}, ${stops.join(', ')})`;
}

/** Opasitas default tiap jenis overlay, mengikuti nilai lama yang hardcoded. */
export const OVERLAY_DEFAULT_OPACITY: Record<OverlayKind, number> = {
  none: 0,
  light: 30,
  dark: 50,
  primary: 60,
};

export type OverlayKind = 'none' | 'light' | 'dark' | 'primary';

/**
 * Warna overlay + opasitas → CSS `rgba()`.
 *
 * Nilai alpha dipasang eksplisit (bukan relying on 8-digit hex) supaya slider
 * opasitas bisa mengendalikannya dan warnanya tetap bisa di-blend oleh
 * `blendOnTop` saat menghitung kontras.
 */
export function overlayCss(
  kind: OverlayKind,
  palette: DesignStylePalette,
  opacityPercent?: number,
): string | undefined {
  if (kind === 'none') return undefined;
  const base = kind === 'light' ? '#ffffff' : kind === 'dark' ? '#000000' : palette.primary;
  const rgb = hexToRgb(base);
  if (!rgb) return undefined;
  const pct = clampPercent(opacityPercent ?? OVERLAY_DEFAULT_OPACITY[kind]);
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${(pct / 100).toFixed(3)})`;
}

/** Kunci nilai 0-100 agar slider/JSON rusak tidak menghasilkan CSS tak valid. */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Kunci nilai blur ke rentang px yang dipakai panel. */
export function clampBlur(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(24, Math.max(0, value));
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const ON_DARK_BG = '#ffffff';
const ON_LIGHT_BG = '#111111';

/**
 * Pilih warna teks (putih / hitam lembut) yang paling terbaca di atas
 * warna latar `bgHex`. Dipakai untuk tombol & blok berwarna agar teks
 * tidak "tenggelam" (mis. teks putih di atas primary terang).
 * Mengembalikan fallback gelap bila input bukan hex solid.
 */
export function getOnColor(bgHex: string): string {
  if (!hexToRgb(bgHex)) return ON_LIGHT_BG;
  const whiteRatio = getContrastRatio(ON_DARK_BG, bgHex);
  const darkRatio = getContrastRatio(ON_LIGHT_BG, bgHex);
  return whiteRatio >= darkRatio ? ON_DARK_BG : ON_LIGHT_BG;
}

/**
 * Resolve warna teks efektif untuk validasi: dukung hex, rgba() (di-blend
 * ke atas `bgFallback`), dan gradient (pakai stop terburuk).
 * Mengembalikan daftar pasangan [label, hexEfektif] untuk diuji.
 */
export const MIN_CONTRAST_NORMAL_TEXT = 4.5;

/** Override warna per-website (disimpan di custom_config.palette_override). */
export type PaletteOverride = Partial<DesignStylePalette>;

/**
 * Gabungkan palet bawaan style dengan override user. Nilai kosong
 * diabaikan sehingga menghapus override = kembali ke bawaan.
 */
export function resolvePalette(
  style: DesignStyle,
  override?: PaletteOverride | null,
): DesignStylePalette {
  if (!override) return style.palette;
  const out = { ...style.palette };
  (Object.keys(override) as (keyof DesignStylePalette)[]).forEach((k) => {
    const v = override[k];
    if (typeof v === 'string' && v.trim().length > 0) out[k] = v.trim();
  });
  return out;
}

/**
 * Resolve satu nilai warna yang boleh berupa token tema (`theme:primary`,
 * `theme:surface`, dst) menjadi hex efektif dari palet. Hex / nilai lain
 * (gradient, url, dsb) dilewatkan apa adanya; `undefined`/kosong → `undefined`.
 * Dipakai kanvas, preview, dan live-site agar varian baru yang menyimpan
 * `theme:*` selalu mengikuti warna bawaan template.
 */
export function resolveThemeColor(
  value: string | undefined | null,
  palette: DesignStylePalette,
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (v.length === 0) return undefined;
  if (!v.startsWith('theme:')) return v;
  const key = v.slice('theme:'.length) as keyof DesignStylePalette;
  const resolved = (palette as unknown as Record<string, string>)[key];
  return typeof resolved === 'string' && resolved.trim().length > 0 ? resolved.trim() : undefined;
}

/**
 * Resolve semua kemunculan token `theme:*` di dalam string bebas
 * (mis. gradient `theme:primary, theme:secondary`). Token tak dikenal
 * dibiarkan apa adanya agar tidak merusak CSS kustom.
 */
export function resolveThemeTokensInString(
  value: string | undefined | null,
  palette: DesignStylePalette,
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (v.length === 0) return undefined;
  if (!v.includes('theme:')) return v;
  return v.replace(/theme:([A-Za-z]+)/g, (m, k) => {
    const resolved = (palette as unknown as Record<string, string>)[k];
    return typeof resolved === 'string' && resolved.trim().length > 0 ? resolved.trim() : m;
  });
}

/** Daftar field warna untuk editor tema (label Indonesia). */
export const PALETTE_FIELDS: Array<{ key: keyof DesignStylePalette; label: string; hint: string }> = [
  { key: 'primary', label: 'Primer (tombol)', hint: 'Warna tombol & aksen utama' },
  { key: 'secondary', label: 'Sekunder', hint: 'Warna pendamping' },
  { key: 'accent', label: 'Aksen', hint: 'Sorotan kecil' },
  { key: 'background', label: 'Latar', hint: 'Latar halaman (hex)' },
  { key: 'surface', label: 'Permukaan', hint: 'Latar kartu/header/footer' },
  { key: 'text', label: 'Teks', hint: 'Warna tulisan utama' },
  { key: 'textMuted', label: 'Teks redup', hint: 'Deskripsi & info sekunder' },
  { key: 'border', label: 'Garis', hint: 'Warna pembatas' },
];

/**
 * Tipografi & komponen cadangan untuk template yang tidak menetapkannya.
 *
 * Sebelumnya peran ini diisi preset `DESIGN_STYLES`; sekarang katalog itu
 * dihapus (migrasi 046) dan pilihan tipografi datang dari
 * `FONT_CATEGORIES` di `./font-categories`. Nilai di sini hanya jaring
 * pengaman supaya renderer tidak menerima `undefined`.
 */
export const DEFAULT_TYPOGRAPHY: DesignStyleTypography = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  baseSize: 16,
  scaleRatio: 1.25,
  headingWeight: 700,
  bodyWeight: 400,
};

export const DEFAULT_COMPONENTS: DesignStyleComponents = {
  borderRadius: 8,
  buttonStyle: 'solid',
  shadowStyle: 'md',
  navStyle: 'solid',
  footerStyle: 'simple',
};
