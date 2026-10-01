import type { DesignStyle, DesignStylePalette } from './types';

export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'White space luas, warna netral, tipografi bersih',
    palette: {
      primary: '#333333',
      secondary: '#666666',
      accent: '#333333',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#333333',
      textMuted: '#666666',
      border: '#e5e5e5',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 4,
      buttonStyle: 'solid',
      shadowStyle: 'sm',
      navStyle: 'solid',
      footerStyle: 'simple',
    },
    effects: {},
    thumbnailUrl: '',
  },
  {
    id: 'flat',
    name: 'Flat Design',
    description: '2D simpel, warna cerah, tanpa shadow',
    palette: {
      primary: '#3498db',
      secondary: '#2ecc71',
      accent: '#e74c3c',
      background: '#ffffff',
      surface: '#ecf0f1',
      text: '#2c3e50',
      // #7f8c8d hanya 3.48:1 di atas putih (teks kecil butuh ≥4.5) → digelapkan
      textMuted: '#5d6d7e',
      border: '#bdc3c7',
    },
    typography: {
      headingFont: 'Roboto',
      bodyFont: 'Roboto',
      baseSize: 16,
      scaleRatio: 1.3,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 2,
      buttonStyle: 'solid',
      shadowStyle: 'none',
      navStyle: 'solid',
      footerStyle: 'columns',
    },
    effects: { borderWidth: 0 },
    thumbnailUrl: '',
  },
  {
    id: 'neo-brutalism',
    name: 'Neo-Brutalism',
    description: 'Border hitam tebal, warna kontras, layout berani',
    palette: {
      primary: '#ff0054',
      secondary: '#00f5d4',
      accent: '#fee440',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textMuted: '#333333',
      border: '#000000',
    },
    typography: {
      headingFont: 'Space Grotesk',
      bodyFont: 'Space Grotesk',
      baseSize: 16,
      scaleRatio: 1.4,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 0,
      buttonStyle: 'solid',
      shadowStyle: 'lg',
      navStyle: 'bordered',
      footerStyle: 'centered',
    },
    effects: { borderWidth: 3, uppercaseHeadings: true },
    thumbnailUrl: '',
  },
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Transparansi frosted glass, gradient lembut',
    palette: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      // Gradient digelapkan dari #667eea/#764ba2 agar teks putih lolos WCAG (6.9:1)
      background: 'linear-gradient(135deg, #4653a3 0%, #553c9a 100%)',
      surface: 'rgba(255,255,255,0.1)',
      text: '#ffffff',
      // 0.7 hanya ~2.6:1 efektif di atas ungu → naik ke 0.9 agar deskripsi tetap terbaca
      textMuted: 'rgba(255,255,255,0.9)',
      border: 'rgba(255,255,255,0.2)',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 600,
      bodyWeight: 300,
    },
    components: {
      borderRadius: 16,
      buttonStyle: 'gradient',
      shadowStyle: 'lg',
      navStyle: 'glass',
      footerStyle: 'centered',
    },
    effects: { glassmorphism: true },
    thumbnailUrl: '',
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Latar gelap, aksen terang',
    palette: {
      primary: '#e94560',
      secondary: '#0f3460',
      accent: '#e94560',
      background: '#0f0f0f',
      surface: '#1a1a2e',
      text: '#eeeeee',
      textMuted: '#a0a0a0',
      border: '#333333',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 8,
      buttonStyle: 'solid',
      shadowStyle: 'md',
      navStyle: 'solid',
      footerStyle: 'columns',
    },
    effects: {},
    thumbnailUrl: '',
  },
  {
    id: 'parallax',
    name: 'Parallax Scrolling',
    description: 'Layered depth, gradient backgrounds',
    palette: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      // Gradient digelapkan dari #667eea/#764ba2 agar teks putih lolos WCAG (8.1:1)
      background: 'linear-gradient(180deg, #3d3a8c 0%, #6b46c1 100%)',
      surface: 'rgba(255,255,255,0.1)',
      text: '#ffffff',
      textMuted: 'rgba(255,255,255,0.9)',
      border: 'rgba(255,255,255,0.2)',
    },
    typography: {
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.3,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 12,
      buttonStyle: 'gradient',
      shadowStyle: 'xl',
      navStyle: 'transparent',
      footerStyle: 'centered',
    },
    effects: { gradientBackgrounds: true },
    thumbnailUrl: '',
  },
  {
    id: 'organic',
    name: 'Organic / Fluid',
    description: 'Bentuk melengkung, warna alam',
    palette: {
      primary: '#2d6a4f',
      secondary: '#40916c',
      accent: '#95d5b2',
      background: '#f8f9fa',
      surface: '#ffffff',
      text: '#1b4332',
      // #52b788 hanya 2.35:1 di atas bg (hampir secerah background) → digelapkan
      textMuted: '#2f7d4f',
      border: '#d8f3dc',
    },
    typography: {
      headingFont: 'Nunito',
      bodyFont: 'Nunito',
      baseSize: 16,
      scaleRatio: 1.2,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 24,
      buttonStyle: 'solid',
      shadowStyle: 'md',
      navStyle: 'solid',
      footerStyle: 'centered',
    },
    effects: {},
    thumbnailUrl: '',
  },
  {
    id: 'retro',
    name: 'Retro / Vintage',
    description: 'Estetika 80-90an, earth tone',
    palette: {
      primary: '#e07a5f',
      secondary: '#3d405b',
      accent: '#81b29a',
      background: '#f4f1de',
      surface: '#f2cc8f',
      text: '#3d405b',
      // #81b29a hanya 2.11:1 di atas bg / 1.57:1 di atas surface (nyaris sama) → digelapkan
      textMuted: '#4a5d4e',
      border: '#e07a5f',
    },
    typography: {
      headingFont: 'DM Serif Display',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 400,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 0,
      buttonStyle: 'outline',
      shadowStyle: 'sm',
      navStyle: 'bordered',
      footerStyle: 'simple',
    },
    effects: {},
    thumbnailUrl: '',
  },
  {
    id: 'typography',
    name: 'Typography-Driven',
    description: 'Teks besar sebagai visual utama',
    palette: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#ff6b6b',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textMuted: '#666666',
      border: '#000000',
    },
    typography: {
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
      baseSize: 18,
      scaleRatio: 1.5,
      headingWeight: 400,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 0,
      buttonStyle: 'outline',
      shadowStyle: 'none',
      navStyle: 'bordered',
      footerStyle: 'minimal',
    },
    effects: { uppercaseHeadings: true },
    thumbnailUrl: '',
  },
  {
    id: '3d-immersive',
    name: '3D & Immersive',
    description: 'Depth, gradient, modern',
    palette: {
      primary: '#e94560',
      secondary: '#0f3460',
      accent: '#533483',
      background: '#1a1a2e',
      surface: '#16213e',
      text: '#ffffff',
      textMuted: '#a0a0a0',
      border: '#0f3460',
    },
    typography: {
      headingFont: 'Space Grotesk',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.3,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 12,
      buttonStyle: 'gradient',
      shadowStyle: 'xl',
      navStyle: 'glass',
      footerStyle: 'columns',
    },
    effects: { gradientBackgrounds: true },
    thumbnailUrl: '',
  },
];

export function getDesignStyle(id: string): DesignStyle | undefined {
  return DESIGN_STYLES.find((s) => s.id === id);
}

export function generateDesignTokens(style: DesignStyle): Record<string, string> {
  return {
    '--color-primary': style.palette.primary,
    '--color-secondary': style.palette.secondary,
    '--color-accent': style.palette.accent,
    '--color-background': style.palette.background,
    '--color-surface': style.palette.surface,
    '--color-text': style.palette.text,
    '--color-text-muted': style.palette.textMuted,
    '--color-border': style.palette.border,
    '--font-heading': style.typography.headingFont,
    '--font-body': style.typography.bodyFont,
    '--font-size-base': `${style.typography.baseSize}px`,
    '--radius': `${style.components.borderRadius}px`,
    '--shadow': getShadowValue(style.components.shadowStyle),
    '--border-width': `${style.effects.borderWidth ?? 1}px`,
  };
}

function getShadowValue(shadowStyle: string): string {
  switch (shadowStyle) {
    case 'none': return 'none';
    case 'sm': return '0 1px 2px rgba(0,0,0,0.05)';
    case 'md': return '0 4px 6px rgba(0,0,0,0.1)';
    case 'lg': return '0 10px 15px rgba(0,0,0,0.1)';
    case 'xl': return '0 20px 25px rgba(0,0,0,0.15)';
    default: return 'none';
  }
}

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
function resolveEffectiveColors(fg: string, bgFallbackHex: string): Array<{ label: string; hex: string }> {
  if (hexToRgb(fg)) return [{ label: fg, hex: fg.startsWith('#') ? fg : `#${fg}` }];
  const blended = blendOnTop(fg, bgFallbackHex);
  if (blended) return [{ label: fg, hex: blended }];
  const stops = extractGradientStops(fg);
  if (stops.length > 0) return stops.map((s) => ({ label: `${fg} → ${s}`, hex: s }));
  return [];
}

/** Ambil satu hex representatif dari background untuk blending (stop pertama gradient / bg itu sendiri). */
function representativeBgHex(bg: string): string | null {
  if (hexToRgb(bg)) return bg.startsWith('#') ? bg : `#${bg}`;
  const stops = extractGradientStops(bg);
  return stops[0] ?? null;
}

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

/**
 * Skema warna siap pakai — kombinasi terkurasi yang sudah lolos kontras
 * WCAG AA (cek design-styles.test.ts). Satu klik menerapkan seluruh palet
 * sehingga ganti skema tidak merusak keterbacaan.
 */
export interface ColorScheme {
  id: string;
  name: string;
  description: string;
  palette: DesignStylePalette;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "hutan",
    name: "Hutan",
    description: "Hijau alami yang tenang",
    palette: {
      primary: "#166534",
      secondary: "#14532d",
      accent: "#f59e0b",
      background: "#ffffff",
      surface: "#f0fdf4",
      text: "#111827",
      textMuted: "#4b5563",
      border: "#bbf7d0",
    },
  },
  {
    id: "laut",
    name: "Laut",
    description: "Biru segar terpercaya",
    palette: {
      primary: "#0369a1",
      secondary: "#0c4a6e",
      accent: "#f59e0b",
      background: "#ffffff",
      surface: "#f0f9ff",
      text: "#0f172a",
      textMuted: "#475569",
      border: "#bae6fd",
    },
  },
  {
    id: "terakota",
    name: "Terakota",
    description: "Oranye hangat kuliner",
    palette: {
      primary: "#c2410c",
      secondary: "#9a3412",
      accent: "#f59e0b",
      background: "#fffbeb",
      surface: "#fef3c7",
      text: "#1c1917",
      textMuted: "#57534e",
      border: "#fde68a",
    },
  },
  {
    id: "anggur",
    name: "Anggur",
    description: "Plum elegan feminin",
    palette: {
      primary: "#9d174d",
      secondary: "#831843",
      accent: "#f59e0b",
      background: "#fff1f2",
      surface: "#ffe4e6",
      text: "#1c1917",
      textMuted: "#57534e",
      border: "#fecdd3",
    },
  },
  {
    id: "mono",
    name: "Mono",
    description: "Hitam-putih profesional",
    palette: {
      primary: "#18181b",
      secondary: "#3f3f46",
      accent: "#71717a",
      background: "#ffffff",
      surface: "#f4f4f5",
      text: "#18181b",
      textMuted: "#52525b",
      border: "#e4e4e7",
    },
  },
];

/** Daftar field warna untuk editor tema (label Indonesia). */export const PALETTE_FIELDS: Array<{ key: keyof DesignStylePalette; label: string; hint: string }> = [
  { key: 'primary', label: 'Primer (tombol)', hint: 'Warna tombol & aksen utama' },
  { key: 'secondary', label: 'Sekunder', hint: 'Warna pendamping' },
  { key: 'accent', label: 'Aksen', hint: 'Sorotan kecil' },
  { key: 'background', label: 'Latar', hint: 'Latar halaman (hex)' },
  { key: 'surface', label: 'Permukaan', hint: 'Latar kartu/header/footer' },
  { key: 'text', label: 'Teks', hint: 'Warna tulisan utama' },
  { key: 'textMuted', label: 'Teks redup', hint: 'Deskripsi & info sekunder' },
  { key: 'border', label: 'Garis', hint: 'Warna pembatas' },
];

export function validateStyleContrast(style: DesignStyle): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const { background: bg, surface, text, textMuted, primary } = style.palette;

  const checkPair = (fgLabel: string, fg: string, bgLabel: string, bgHex: string) => {
    const eff = resolveEffectiveColors(fg, bgHex);
    for (const e of eff) {
      const ratio = getContrastRatio(e.hex, bgHex);
      if (ratio < MIN_CONTRAST_NORMAL_TEXT) {
        issues.push(`${fgLabel} vs ${bgLabel} terlalu rendah: ${ratio.toFixed(2)}:1 (min ${MIN_CONTRAST_NORMAL_TEXT}:1)`);
      }
    }
  };

  const bgHex = representativeBgHex(bg);
  if (bgHex) {
    checkPair('Teks', text, 'background', bgHex);
    checkPair('Teks muted', textMuted, 'background', bgHex);
  }

  const surfaceHex = representativeBgHex(surface);
  if (surfaceHex) {
    checkPair('Teks', text, 'surface', surfaceHex);
    checkPair('Teks muted', textMuted, 'surface', surfaceHex);
  } else if (bgHex) {
    // Surface transparan (gaya kaca): teks kartu tampil di atas background
    checkPair('Teks', text, 'background (via surface transparan)', bgHex);
    checkPair('Teks muted', textMuted, 'background (via surface transparan)', bgHex);
  }

  if (hexToRgb(primary)) {
    const onPrimary = getOnColor(primary);
    const ratio = getContrastRatio(onPrimary, primary);
    if (ratio < MIN_CONTRAST_NORMAL_TEXT) {
      issues.push(`Teks tombol vs primary terlalu rendah: ${ratio.toFixed(2)}:1 (min ${MIN_CONTRAST_NORMAL_TEXT}:1)`);
    }
  }

  return { valid: issues.length === 0, issues };
}
