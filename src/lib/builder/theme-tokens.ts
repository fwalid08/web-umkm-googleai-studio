import { getOnColor } from './design-styles';
import {
  buildOnColorTokens,
  resolveContrastTokens,
  type ContrastContract,
} from './contrast-contract';
import type { DesignStylePalette, DesignStyleTypography } from './types';

/**
 * Token CSS tema — SATU sumber untuk kanvas builder & live site (§18.4).
 *
 * Kenapa modul ini ada: `renderer-v3` (live) mendefinisikan `--color-*` /
 * `--font-*` di div root, tapi kanvas builder tidak — sehingga seluruh
 * `variant.html` yang bertoken tampil rusak di kanvas sementara sempurna
 * di live. Dengan helper bersama, kedua permukaan mustahil meleset lagi.
 *
 * Kontrak kontras template (§19) diterapkan DI SINI, bukan di tiap renderer,
 * supaya token turunan tersedia di kedua permukaan dengan perhitungan sama.
 */

export interface ThemeTokenOptions {
  /**
   * Kontrak kontras template. Bila diisi, pasangan yang rasionya di bawah
   * ambang menghasilkan token turunan (`--color-<fg>-on-<bg>`).
   *
   * Opsional supaya template lama (tanpa kontrak) tetap dirender persis seperti
   * sebelumnya — kontrak bersifat tambahan, bukan syarat.
   */
  contrast?: ContrastContract | null;
  /**
   * Token `--color-on-<key>` untuk tiap warna solid di palet.
   *
   * Default `true`: inilah yang membuat lencana di dalam tombol ikut mengikuti
   * warna latar tombolnya. Opt-out lewat `false` bila perlu determinisme penuh.
   */
  onColorTokens?: boolean;
}

export function buildThemeTokens(
  palette: DesignStylePalette,
  typography: DesignStyleTypography,
  radius: number,
  options: ThemeTokenOptions = {},
): Record<string, string> {
  const tokens: Record<string, string> = {
    '--color-primary': palette.primary,
    '--color-secondary': palette.secondary,
    '--color-accent': palette.accent,
    '--color-background': palette.background,
    '--color-surface': palette.surface,
    '--color-text': palette.text,
    '--color-text-muted': palette.textMuted,
    '--color-border': palette.border,
    '--color-on-primary': getOnColor(palette.primary),
    '--font-heading': typography.headingFont,
    '--font-body': typography.bodyFont,
    '--font-accent': typography.accentFont || typography.headingFont,
    '--radius': `${radius}px`,
  };

  // Token turunan ditulis SETELAH base supaya koreksi fg-only (mis.
  // `--color-text`) menimpa nilai palet — bukan sebaliknya.
  if (options.onColorTokens !== false) {
    Object.assign(tokens, buildOnColorTokens(palette));
  }
  Object.assign(tokens, resolveContrastTokens(palette, options.contrast).tokens);

  return tokens;
}

/** Daftar semua `var(--x)` yang dipakai sebuah string HTML/CSS. */
export function extractUsedCssVars(source: string): string[] {
  const found = new Set<string>();
  const re = /var\(\s*(--[\w-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source ?? '')) !== null) {
    found.add(m[1]);
  }
  return [...found];
}
