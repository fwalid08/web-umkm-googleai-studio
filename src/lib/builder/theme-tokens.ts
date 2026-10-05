import { getOnColor } from './design-styles';
import type { DesignStylePalette, DesignStyleTypography } from './types';

/**
 * Token CSS tema — SATU sumber untuk kanvas builder & live site (§18.4).
 *
 * Kenapa modul ini ada: `renderer-v3` (live) mendefinisikan `--color-*` /
 * `--font-*` di div root, tapi kanvas builder tidak — sehingga seluruh
 * `variant.html` yang bertoken tampil rusak di kanvas sementara sempurna
 * di live. Dengan helper bersama, kedua permukaan mustahil meleset lagi.
 */
export function buildThemeTokens(
  palette: DesignStylePalette,
  typography: DesignStyleTypography,
  radius: number,
): Record<string, string> {
  return {
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
