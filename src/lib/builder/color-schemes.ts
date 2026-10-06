import { getContrastRatio, getOnColor, MIN_CONTRAST_NORMAL_TEXT } from './design-styles';
import {
  normalizePaletteForContract,
  validateContrastContract,
  type ContrastContract,
} from './contrast-contract';
import type { DesignStylePalette } from './types';

/**
 * Palet skema warna.
 *
 * `secondary` opsional dengan sengaja: data skema di bawah sudah ditulis
 * sebelum token `secondary` masuk ke palet template. Caller meneruskan
 * `base` (palet template) agar gap itu terisi — tanpa itu, menerapkan skema
 * akan membuat pasangan `secondary` ikut hilang dari `palette_override`.
 */
export type ColorSchemePalette = {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  textMuted: string;
  border: string;
  secondary?: string;
};

export interface ColorScheme {
  id: string;
  name: string;
  category: 'light' | 'dark';
  palette: ColorSchemePalette;
  headingFont?: string;
  bodyFont?: string;
  accentFont?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.min(255, rgb.r + amount));
  const g = Math.max(0, Math.min(255, rgb.g + amount));
  const b = Math.max(0, Math.min(255, rgb.b + amount));
  return rgbToHex(r, g, b);
}

function luminanceOf(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
}

function fixTextColor(bg: string, preferred: string, minRatio: number = MIN_CONTRAST_NORMAL_TEXT): string {
  let color = preferred;
  let ratio = getContrastRatio(color, bg);
  // Arah perbaikan ditentukan dari latar: di atas latar terang teks harus
  // digelapkan, di atas latar gelap teks harus diterangkan. Men menjauhi
  // latar selalu menaikkan kontras (arah lama berdasarkan kecerahan teks
  // sendiri bisa berjalan mundur dan tidak pernah konvergen).
  const bgLum = luminanceOf(bg) ?? 255;
  const step = bgLum > 128 ? -20 : 20;
  let attempts = 0;
  let best = color;
  let bestRatio = ratio;
  while (ratio < minRatio && attempts < 50) {
    color = adjustBrightness(color, step);
    ratio = getContrastRatio(color, bg);
    if (ratio > bestRatio) {
      best = color;
      bestRatio = ratio;
    }
    attempts++;
  }
  return bestRatio >= minRatio ? best : preferred;
}

function fixPrimaryForContrast(bg: string, preferred: string): string {
  let color = preferred;
  let onColor = getOnColor(color);
  let ratio = getContrastRatio(onColor, color);
  // Teks di atas primary memakai getOnColor: bila teksnya putih, primary
  // harus digelapkan; bila hitam, primary harus diterangkan.
  let attempts = 0;
  let best = color;
  let bestRatio = ratio;
  while (ratio < MIN_CONTRAST_NORMAL_TEXT && attempts < 50) {
    onColor = getOnColor(color);
    const step = onColor.toLowerCase() === '#ffffff' ? -15 : 15;
    color = adjustBrightness(color, step);
    const newOnColor = getOnColor(color);
    ratio = getContrastRatio(newOnColor, color);
    if (ratio > bestRatio) {
      best = color;
      bestRatio = ratio;
    }
    attempts++;
  }
  return bestRatio >= MIN_CONTRAST_NORMAL_TEXT ? best : preferred;
}

/**
 * Gabungkan palet skema dengan palet template sebagai dasar.
 *
 * Skema hanya menyimpan 7 token; `secondary` (dan apa pun yang menambah
 * token baru di masa depan) diambil dari `base` bila tidak ada di skema.
 * Tanpa ini, cek kontrak akan diam-diam melewati setiap pasangan yang
 * involve `secondary`.
 */
export function mergeSchemePalette(
  scheme: ColorScheme,
  base?: DesignStylePalette | null,
): DesignStylePalette {
  const p = scheme.palette;
  const fallbackSecondary = base?.secondary ?? p.secondary ?? p.primary;
  return {
    primary: p.primary,
    secondary: p.secondary ?? fallbackSecondary,
    accent: p.accent,
    background: p.background,
    surface: p.surface,
    text: p.text,
    textMuted: p.textMuted,
    border: p.border,
  };
}

/**
 * Validasi skema warna.
 *
 * Tanpa `contract`, hanya 4 pasangan generik yang dicek (perilaku lama).
 * Dengan `contract`, SELURUH pasangan yang dideklarasikan template ikut
 * diperiksa — inilah yang membuat skema tidak bisa dianggap "lolos" padahal
 * membuat teks di bagian template tertentu tak terbaca.
 *
 * `base` (palet template) mengisi token yang tidak ada di skema, terutama
 * `secondary`.
 */
export function validateColorScheme(
  scheme: ColorScheme,
  contract?: ContrastContract | null,
  base?: DesignStylePalette | null,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const palette = mergeSchemePalette(scheme, base);

  if (contract) {
    for (const issue of validateContrastContract(palette, contract)) {
      issues.push(
        `${issue.fg} on ${issue.bg}: ${issue.ratio.toFixed(2)}:1 → ${issue.fixedRatio.toFixed(2)}:1 (min ${issue.minRatio}:1)`,
      );
    }
  }

  const textOnBg = getContrastRatio(palette.text, palette.background);
  if (textOnBg < MIN_CONTRAST_NORMAL_TEXT) {
    issues.push(`Text on background: ${textOnBg.toFixed(2)}:1 (min ${MIN_CONTRAST_NORMAL_TEXT}:1)`);
  }

  const textOnSurface = getContrastRatio(palette.text, palette.surface);
  if (textOnSurface < MIN_CONTRAST_NORMAL_TEXT) {
    issues.push(`Text on surface: ${textOnSurface.toFixed(2)}:1 (min ${MIN_CONTRAST_NORMAL_TEXT}:1)`);
  }

  const mutedOnBg = getContrastRatio(palette.textMuted, palette.background);
  if (mutedOnBg < MIN_CONTRAST_NORMAL_TEXT) {
    issues.push(`TextMuted on background: ${mutedOnBg.toFixed(2)}:1 (min ${MIN_CONTRAST_NORMAL_TEXT}:1)`);
  }

  const onPrimary = getOnColor(palette.primary);
  const textOnPrimary = getContrastRatio(onPrimary, palette.primary);
  if (textOnPrimary < MIN_CONTRAST_NORMAL_TEXT) {
    issues.push(`Text on primary: ${textOnPrimary.toFixed(2)}:1 (min ${MIN_CONTRAST_NORMAL_TEXT}:1)`);
  }

  return { valid: issues.length === 0, issues };
}

export function getContrastIssue(
  fg: string,
  bg: string,
): { hasIssue: boolean; ratio: number; minRatio: number } {
  const ratio = getContrastRatio(fg, bg);
  return {
    hasIssue: ratio < MIN_CONTRAST_NORMAL_TEXT,
    ratio,
    minRatio: MIN_CONTRAST_NORMAL_TEXT,
  };
}

export function getHeaderContrastIssues(palette: {
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
}): Array<{ element: string; ratio: number; minRatio: number }> {
  const issues: Array<{ element: string; ratio: number; minRatio: number }> = [];

  const textOnSurface = getContrastRatio(palette.text, palette.surface);
  if (textOnSurface < MIN_CONTRAST_NORMAL_TEXT) {
    issues.push({ element: 'text', ratio: textOnSurface, minRatio: MIN_CONTRAST_NORMAL_TEXT });
  }

  const mutedOnSurface = getContrastRatio(palette.textMuted, palette.surface);
  if (mutedOnSurface < MIN_CONTRAST_NORMAL_TEXT) {
    issues.push({ element: 'textMuted', ratio: mutedOnSurface, minRatio: MIN_CONTRAST_NORMAL_TEXT });
  }

  const onPrimary = getOnColor(palette.primary);
  const onPrimaryRatio = getContrastRatio(onPrimary, palette.primary);
  if (onPrimaryRatio < MIN_CONTRAST_NORMAL_TEXT) {
    issues.push({ element: 'primary', ratio: onPrimaryRatio, minRatio: MIN_CONTRAST_NORMAL_TEXT });
  }

  return issues;
}

/**
 * Normalisasi skema agar layak disimpan sebagai `palette_override`.
 *
 * Dipanggil saat user MEMILIH skema di Style Selector — bukan saat modul
 * di-import. Versi lama memutasikan `scheme.palette` di top-level module,
 * yang berarti efek samping berjalan di setiap server render dan tidak
 * pernah tahu template mana yang sedang diedit.
 *
 * Dengan kontrak, koreksi hanya menyentuh token fg-only (`text`,
 * `textMuted`); sisanya ditangani sebagai token turunan saat render.
 */
export function normalizeColorScheme(
  scheme: ColorScheme,
  contract?: ContrastContract | null,
  base?: DesignStylePalette | null,
): { palette: Record<string, string>; issues: string[] } {
  const merged = mergeSchemePalette(scheme, base);
  // Autofix lama (4 pasangan generik) dulu, lalu kontrak template.
  const genericFixed: DesignStylePalette = {
    ...merged,
    text: fixTextColor(merged.background, merged.text),
    textMuted: fixTextColor(merged.background, merged.textMuted),
    primary: fixPrimaryForContrast(merged.surface, merged.primary),
  };
  // `text` juga harus aman di atas surface, bukan hanya background.
  genericFixed.text = fixTextColor(genericFixed.surface, genericFixed.text);
  genericFixed.textMuted = fixTextColor(genericFixed.surface, genericFixed.textMuted);

  const safe = contract ? normalizePaletteForContract(genericFixed, contract) : genericFixed;
  return {
    palette: safe as unknown as Record<string, string>,
    issues: validateColorScheme({ ...scheme, palette: safe }, contract, base).issues,
  };
}
