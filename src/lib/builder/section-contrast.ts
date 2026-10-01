import type { DesignStylePalette, Section } from './types';
import {
  blendOnTop,
  extractGradientStops,
  getContrastRatio,
  getOnColor,
  resolveThemeColor,
  resolveThemeTokensInString,
} from './design-styles';

/** Ambang WCAG penuh: teks normal ≥ 4.5, teks besar (heading) ≥ 3.0. */
export const MIN_CONTRAST_LARGE_TEXT = 3.0;
export const MIN_CONTRAST_NORMAL_FALLBACK = 4.5;

function isHex(value: string | undefined): value is string {
  return typeof value === 'string' && /^#?([a-f\d]{6}|[a-f\d]{3})$/i.test(value.trim());
}

function normHex(value: string): string {
  const v = value.trim();
  // Kembangkan #rgb → #rrggbb agar konsisten dengan getContrastRatio.
  const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(v);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  return v.startsWith('#') ? v.toLowerCase() : `#${v.toLowerCase()}`;
}

export type EffectiveBackground =
  | { kind: 'solid'; hex: string }
  | { kind: 'gradient'; stops: string[] }
  | { kind: 'image-unmeasurable'; overlay?: string };

/**
 * Latar foto tak bisa diukur pasti. Untuk keperluan autofix teks, petakan ke
 * representatif sesuai overlay: overlay terang → latar terang (teks gelap),
 * overlay gelap/primer/tanpa-overlay (dipaksa gelap di renderer) → latar
 * gelap (teks terang). Tanpa overlay yang dipaksa, teks terang selalu aman
 * karena overlay gelap otomatis menenggelamkan foto.
 */
export function textBackgroundFor(bg: EffectiveBackground): EffectiveBackground {
  if (bg.kind !== 'image-unmeasurable') return bg;
  if (bg.overlay === 'light') return { kind: 'solid', hex: '#f2f2f2' };
  return { kind: 'solid', hex: '#131313' };
}

/**
 * Latar efektif sebuah section: traverse dari style section sendiri,
 * lalu rantai parent (terdekat dulu), hingga latar halaman. Entri
 * `transparent`/kosong dilewati — parent non-transparan pertama menang.
 * Token `theme:*` di-resolve ke palet aktif.
 */
export function getSectionEffectiveBackground(
  style: Pick<Section['style'], 'background' | 'backgroundColor' | 'backgroundGradient' | 'backgroundImage' | 'backgroundOverlay'>,
  palette: DesignStylePalette,
  pageBackgroundHex: string,
  ancestors: Array<
    Pick<Section['style'], 'background' | 'backgroundColor' | 'backgroundGradient' | 'backgroundOverlay'>
  > = [],
): EffectiveBackground {
  const chain = [style, ...ancestors];
  for (const s of chain) {
    if (s.background === 'color') {
      const hex = resolveThemeColor(s.backgroundColor, palette);
      if (hex && isHex(hex)) return { kind: 'solid', hex: normHex(hex) };
      // backgroundColor kosong/invalid → anggap transparan, lanjut ke parent.
      continue;
    }
    if (s.background === 'gradient') {
      const raw = resolveThemeTokensInString(s.backgroundGradient, palette) ?? '';
      const stops = extractGradientStops(raw).map(normHex);
      if (stops.length > 0) return { kind: 'gradient', stops };
      continue;
    }
    if (s.background === 'image') {
      const overlay = ((s.backgroundOverlay ?? style.backgroundOverlay ?? 'none') as string) || 'none';
      return { kind: 'image-unmeasurable', overlay };
    }
    // 'transparent' / tak dikenal → lanjut ke parent.
  }
  // Latar halaman bisa gradient (gaya kaca/parallax) → kembalikan stop-nya
  // agar teks diukur terhadap warna terburuk, bukan tebakan.
  const pageRaw = resolveThemeTokensInString(pageBackgroundHex, palette) ?? pageBackgroundHex;
  if (isHex(pageRaw)) return { kind: 'solid', hex: normHex(pageRaw) };
  const pageStops = extractGradientStops(pageRaw).map(normHex);
  if (pageStops.length > 0) return { kind: 'gradient', stops: pageStops };
  const palRaw = resolveThemeTokensInString(palette.background, palette) ?? palette.background;
  if (isHex(palRaw)) return { kind: 'solid', hex: normHex(palRaw) };
  const palStops = extractGradientStops(palRaw).map(normHex);
  if (palStops.length > 0) return { kind: 'gradient', stops: palStops };
  return { kind: 'solid', hex: '#ffffff' };
}

/** Minta ambang berdasarkan ukuran teks (WCAG penuh). */
export function minRatioFor(isLarge: boolean): number {
  return isLarge ? MIN_CONTRAST_LARGE_TEXT : MIN_CONTRAST_NORMAL_FALLBACK;
}

/**
 * Normalkan warna teks mentah (token tema / hex / rgba seperti kaca
 * `rgba(255,255,255,0.9)`) menjadi hex efektif di atas `bgHex`. Butuh blend
 * karena rasio kontras hanya terdefinisi untuk warna opaque.
 */
/** @internal diekspor untuk test. */
export function fgForBg(fgRaw: string, palette: DesignStylePalette, bgHex: string): string | null {
  const resolved = resolveThemeColor(fgRaw, palette) ?? fgRaw;
  if (isHex(resolved)) return normHex(resolved);
  const blended = blendOnTop(resolved, bgHex);
  return blended && isHex(blended) ? normHex(blended) : null;
}

/**
 * Rasio terburuk warna teks mentah (hex / rgba / token tema) di atas latar.
 * rgba di-blend per stop agar warna translusen (teks kaca) dinilai tepat —
 * bukan didekatkan ke satu warna opaque.
 */
function worstRatio(fgRaw: string, palette: DesignStylePalette, bg: EffectiveBackground): number {
  if (bg.kind === 'solid') {
    const eff = fgForBg(fgRaw, palette, bg.hex);
    return eff ? getContrastRatio(eff, bg.hex) : 0;
  }
  if (bg.kind === 'gradient') {
    let worst = Infinity;
    let seen = false;
    for (const stop of bg.stops) {
      const eff = fgForBg(fgRaw, palette, stop);
      if (!eff) continue;
      seen = true;
      worst = Math.min(worst, getContrastRatio(eff, stop));
    }
    return seen ? worst : 0;
  }
  return 0;
}

/**
 * Auto-fix: bila `fgHex` gagal kontras di atas latar efektif, ganti ke warna
 * paling terbaca (putih/hitam via getOnColor per stop terburuk). Tidak pernah
 * mengembalikan warna yang lebih buruk dari input.
 */
const EMPTY_PALETTE = {} as DesignStylePalette;

export function autoFixTextColor(
  fgHex: string,
  bg: EffectiveBackground,
  isLarge: boolean,
  palette: DesignStylePalette = EMPTY_PALETTE,
): string {
  const min = minRatioFor(isLarge);
  // NB: diukur terhadap latar representatif `m` (foto tak terukur dipetakan
  // ke solid representatif via textBackgroundFor).
  const m = textBackgroundFor(bg);
  // Kandidat asli dulu: warna translusen (rgba) dinilai apa adanya per stop.
  if (worstRatio(fgHex, palette, m) >= min) return fgHex;
  // Kandidat: on-color tiap stop/solid, pilih yang lolos dengan rasio terbaik.
  const probes: string[] = m.kind === 'solid' ? [m.hex] : (m as { stops: string[] }).stops;
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const probe of probes) {
    const cand = getOnColor(probe);
    const score = worstRatio(cand, palette, m);
    if (score >= min && score > bestScore) {
      best = cand;
      bestScore = score;
    }
  }
  if (best) return best;
  // Tidak ada yang lolos penuh (gradasi ekstrem) → kembalikan yang terbaik
  // di antara input dan kedua on-color, agar tak pernah lebih buruk.
  const cands = [fgHex, '#ffffff', '#111111'];
  let top = fgHex;
  let topScore = worstRatio(fgHex, palette, m);
  for (const c of cands) {
    const s = worstRatio(c, palette, m);
    if (s > topScore) {
      top = c;
      topScore = s;
    }
  }
  return top;
}

/**
 * Apakah dua warna "sama" secara visual: hex identik atau kontras di bawah
 * 1,5 (praktis tak terbedakan mata).
 */
function visuallySame(aHex: string, bHex: string): boolean {
  if (aHex.toLowerCase() === bHex.toLowerCase()) return true;
  try {
    return getContrastRatio(aHex, bHex) < 1.5;
  } catch {
    return false;
  }
}

function clashesWithBackground(hex: string, bg: EffectiveBackground): boolean {
  if (bg.kind === 'solid') return visuallySame(hex, bg.hex);
  if (bg.kind === 'gradient') {
    return bg.stops.some((stop) => visuallySame(hex, stop));
  }
  // Latar foto tak terukur: renderer memaksa overlay gelap sehingga tombol
  // primary tetap terbaca — jangan fallback.
  return false;
}

export interface ButtonColors {
  bg: string;
  fg: string;
}

/**
 * Warna tombol yang dijamin beda dari latar section induk (traverse hingga
 * section: solid → gradient → foto). Urutan fallback: secondary → accent →
 * surface → text. Teks tombol selalu via getOnColor agar terbaca.
 * Tidak pernah melempar: kandidat terakhir selalu surface.
 */
export function resolveButtonColors(
  sectionBg: EffectiveBackground,
  palette: DesignStylePalette,
): ButtonColors {
  const chain = [palette.primary, palette.secondary, palette.accent, palette.surface, palette.text];
  for (const raw of chain) {
    const resolved = resolveThemeColor(raw, palette) ?? raw;
    if (!isHex(resolved)) continue;
    const hex = normHex(resolved);
    if (clashesWithBackground(hex, sectionBg)) continue;
    return { bg: hex, fg: getOnColor(hex) };
  }
  const fallback = isHex(palette.surface) ? normHex(palette.surface) : '#ffffff';
  return { bg: fallback, fg: getOnColor(fallback) };
}

/**
 * Warna primer yang aman dipakai sebagai TEKS langsung di atas latar
 * section (mis. harga menu). Bila primary lolos kontras normal (≥4.5)
 * terhadap latar efektif, dipakai apa adanya; bila nabrak, di-autofix ke
 * warna paling terbaca (tidak pernah lebih buruk dari input).
 */
export function resolvePrimaryOnSectionBg(
  bg: EffectiveBackground,
  palette: DesignStylePalette,
): string {
  const primary = palette.primary;
  if (!isHex(primary)) return autoFixTextColor(palette.text, bg, false, palette);
  return autoFixTextColor(normHex(primary), bg, false, palette);
}

/** Muted mengikuti aturan normal (4.5) di atas latar yang sama. */
export function autoFixMutedColor(
  fgHex: string,
  bg: EffectiveBackground,
  palette: DesignStylePalette = EMPTY_PALETTE,
): string {
  return autoFixTextColor(fgHex, bg, false, palette);
}

export interface SectionContrastIssue {
  sectionId: string;
  type: string;
  variant: string;
  role: string;
  fg: string;
  bg: string;
  ratio: number;
  minRatio: number;
  fixed: string;
}

/**
 * Validasi kontras satu section apa adanya (tanpa autofix): kembalikan issue
 * per peran teks (heading besar 3:1, body/muted normal 4.5). Latar foto tanpa
 * overlay dilaporkan sebagai issue agar overlay gelap dipaksa.
 */
export function validateSectionContrast(
  section: Pick<Section, 'id' | 'type' | 'variant'>,
  style: Section['style'],
  palette: DesignStylePalette,
  pageBackgroundHex: string,
): { valid: boolean; issues: SectionContrastIssue[] } {
  const issues: SectionContrastIssue[] = [];
  const bg = getSectionEffectiveBackground(style, palette, pageBackgroundHex);

  const pairs: Array<{ role: string; fgRaw: string | undefined; isLarge: boolean }> = [
    { role: 'heading', fgRaw: palette.text, isLarge: true },
    { role: 'body', fgRaw: palette.text, isLarge: false },
    { role: 'muted', fgRaw: palette.textMuted, isLarge: false },
  ];

  const bgLabel = (b: EffectiveBackground): string =>
    b.kind === 'solid' ? b.hex : b.kind === 'gradient' ? `gradient(${b.stops.join(', ')})` : 'image(foto)';

  if (bg.kind === 'image-unmeasurable' && bg.overlay !== 'light') {
    // Foto + overlay gelap/primer/tanpa-overlay: teks terang dipaksa di
    // renderer (overlay gelap otomatis) — catat sebagai temuan info dengan
    // fix yang diterapkan, agar editor tahu section ini dijaga otomatis.
    for (const p of pairs) {
      const fg = resolveThemeColor(p.fgRaw, palette) ?? p.fgRaw ?? '';
      issues.push({
        sectionId: section.id,
        type: section.type,
        variant: section.variant,
        role: p.role,
        fg,
        bg: bgLabel(bg),
        ratio: 0,
        minRatio: minRatioFor(p.isLarge),
        fixed: autoFixTextColor(fg, bg, p.isLarge),
      });
    }
    return { valid: false, issues };
  }
  const effectiveBg: EffectiveBackground =
    bg.kind === 'image-unmeasurable' ? textBackgroundFor(bg) : bg;

  const bgs: string[] =
    effectiveBg.kind === 'solid' ? [effectiveBg.hex] : (effectiveBg as { stops: string[] }).stops;
  for (const p of pairs) {
    const fgRaw = resolveThemeColor(p.fgRaw, palette) ?? p.fgRaw ?? '';
    const min = minRatioFor(p.isLarge);
    let worst = Infinity;
    let worstBg = bgs[0];
    let worstFg: string | null = null;
    for (const b of bgs) {
      // rgba (mis. teks kaca) di-blend ke tiap latar sebelum diukur.
      const fgEff = fgForBg(fgRaw, palette, b);
      if (!fgEff) continue;
      const r = getContrastRatio(fgEff, b);
      if (r < worst) {
        worst = r;
        worstBg = b;
        worstFg = fgEff;
      }
    }
    if (worstFg === null) continue;
    const fg = worstFg;
    if (worst < min) {
      issues.push({
        sectionId: section.id,
        type: section.type,
        variant: section.variant,
        role: p.role,
        fg,
        bg: worstBg,
        ratio: Math.round(worst * 100) / 100,
        minRatio: min,
        fixed: autoFixTextColor(fg, effectiveBg, p.isLarge, palette),
      });
    }
  }
  return { valid: issues.length === 0, issues };
}
