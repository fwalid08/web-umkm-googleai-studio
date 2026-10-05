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
 * Preset warna dalam bentuk ASLI (apa yang ditulis author).
 *
 * Dipisah dari `COLOR_SCHEMES` supaya autofix tidak pernah memutasikan data
 * yang diimpor — sebelumnya `forEach` di top-level mengubah `scheme.palette`
 * saat modul di-load, yang membuat modul ini punya efek samping dan
 * menulis ke console di setiap server render.
 */
const AUTHORED_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    category: 'light',
    palette: { background: '#F0F9FF', surface: '#FFFFFF', primary: '#0284C7', accent: '#06B6D4', text: '#0F172A', textMuted: '#475569', border: '#BAE6FD' },
  },
  {
    id: 'emerald-fresh',
    name: 'Emerald Fresh',
    category: 'light',
    palette: { background: '#F0FDF4', surface: '#FFFFFF', primary: '#10B981', accent: '#34D399', text: '#064E3B', textMuted: '#4B5563', border: '#A7F3D0' },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    category: 'light',
    palette: { background: '#F1F5F2', surface: '#FFFFFF', primary: '#166534', accent: '#22C55E', text: '#172A1F', textMuted: '#4B5563', border: '#BBF7D0' },
  },
  {
    id: 'sage-minimal',
    name: 'Sage Minimal',
    category: 'light',
    palette: { background: '#F6F7F2', surface: '#FFFFFF', primary: '#6B7D6A', accent: '#A3B18A', text: '#263328', textMuted: '#66745F', border: '#D1D5DB' },
  },
  {
    id: 'lime-modern',
    name: 'Lime Modern',
    category: 'light',
    palette: { background: '#F7FEE7', surface: '#FFFFFF', primary: '#65A30D', accent: '#A3E635', text: '#1A2E05', textMuted: '#4B5563', border: '#D9F99D' },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    category: 'light',
    palette: { background: '#FAF5FF', surface: '#FFFFFF', primary: '#7C3AED', accent: '#A855F7', text: '#2E1065', textMuted: '#6B7280', border: '#DDD6FE' },
  },
  {
    id: 'warm-orange',
    name: 'Warm Orange',
    category: 'light',
    palette: { background: '#FFF7ED', surface: '#FFFFFF', primary: '#EA580C', accent: '#FB923C', text: '#431407', textMuted: '#78716C', border: '#FED7AA' },
  },
  {
    id: 'coral-modern',
    name: 'Coral Modern',
    category: 'light',
    palette: { background: '#FFF5F3', surface: '#FFFFFF', primary: '#F43F5E', accent: '#FB7185', text: '#3F0A15', textMuted: '#78716C', border: '#FECDD3' },
  },
  {
    id: 'coffee-mocha',
    name: 'Coffee Mocha',
    category: 'light',
    palette: { background: '#FAF7F2', surface: '#FFFFFF', primary: '#795548', accent: '#A1887F', text: '#29211D', textMuted: '#78716C', border: '#D7CCC8' },
  },
  {
    id: 'sky-white',
    name: 'Sky & White',
    category: 'light',
    palette: { background: '#F0F9FF', surface: '#FFFFFF', primary: '#0EA5E9', accent: '#7DD3FC', text: '#0C4A6E', textMuted: '#475569', border: '#BAE6FD' },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    category: 'dark',
    palette: { background: '#0F172A', surface: '#1E293B', primary: '#3B82F6', accent: '#38BDF8', text: '#F8FAFC', textMuted: '#94A3B8', border: '#334155' },
  },
  {
    id: 'violet-neon',
    name: 'Violet Neon',
    category: 'dark',
    palette: { background: '#0F0A1F', surface: '#1E1633', primary: '#8B5CF6', accent: '#D946EF', text: '#FAF5FF', textMuted: '#A78BFA', border: '#3B0764' },
  },
  {
    id: 'cyber-blue',
    name: 'Cyber Blue',
    category: 'dark',
    palette: { background: '#050B14', surface: '#0F172A', primary: '#00A3FF', accent: '#00E5FF', text: '#E0F2FE', textMuted: '#7DD3FC', border: '#1E293B' },
  },
  {
    id: 'cyber-green',
    name: 'Cyber Green',
    category: 'dark',
    palette: { background: '#07110D', surface: '#0D1F17', primary: '#00C853', accent: '#00FF88', text: '#ECFDF5', textMuted: '#6EE7B7', border: '#1E293B' },
  },
  {
    id: 'black-gold',
    name: 'Black & Gold',
    category: 'dark',
    palette: { background: '#0A0A0A', surface: '#171717', primary: '#D4AF37', accent: '#F5D76E', text: '#FAFAFA', textMuted: '#A3A3A3', border: '#262626' },
  },
  {
    id: 'charcoal-orange',
    name: 'Charcoal Orange',
    category: 'dark',
    palette: { background: '#18181B', surface: '#27272A', primary: '#F97316', accent: '#FB923C', text: '#FAFAFA', textMuted: '#A1A1AA', border: '#3F3F46' },
  },
  {
    id: 'black-lime',
    name: 'Black & Lime',
    category: 'dark',
    palette: { background: '#09090B', surface: '#18181B', primary: '#84CC16', accent: '#BEF264', text: '#F4F4F5', textMuted: '#A1A1AA', border: '#27272A' },
  },
  {
    id: 'black-cyan',
    name: 'Black & Cyan',
    category: 'dark',
    palette: { background: '#09090B', surface: '#18181B', primary: '#06B6D4', accent: '#67E8F9', text: '#F4F4F5', textMuted: '#A1A1AA', border: '#27272A' },
  },
  {
    id: 'black-purple',
    name: 'Black & Purple',
    category: 'dark',
    palette: { background: '#09090B', surface: '#18181B', primary: '#8B5CF6', accent: '#C084FC', text: '#FAFAFA', textMuted: '#A1A1AA', border: '#27272A' },
  },
  {
    id: 'dark-monochrome',
    name: 'Dark Monochrome',
    category: 'dark',
    palette: { background: '#09090B', surface: '#18181B', primary: '#E4E4E7', accent: '#A1A1AA', text: '#FAFAFA', textMuted: '#A1A1AA', border: '#27272A' },
  },
];

/**
 * Preset siap pakai yang SUDAH dinormalisasi.
 *
 * Perbaikan rasio dilakukan sekali lewat fungsi murni (data aslinya tidak
 * disentuh) alih-alih `forEach` yang memutasikan data saat import.
 * Konsekuensinya: `console.warn` yang dulu muncul di setiap server render
 * hilang, tapi nilai palet yang dipakai UI tetap sama seperti sebelumnya —
 * penting karena `style-selector` menandai skema aktif dengan membandingkan
 * nilai ini dengan override user.
 */
export const COLOR_SCHEMES: ColorScheme[] = AUTHORED_COLOR_SCHEMES.map((scheme) => {
  const p = mergeSchemePalette(scheme, null);
  const fixed: DesignStylePalette = {
    ...p,
    text: fixTextColor(p.surface, fixTextColor(p.background, p.text)),
    textMuted: fixTextColor(p.surface, fixTextColor(p.background, p.textMuted)),
    primary: fixPrimaryForContrast(p.surface, p.primary),
  };
  return { ...scheme, palette: { ...fixed } };
});

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
