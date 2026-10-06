import { describe, it, expect } from 'vitest';
import { BUILT_IN_CATALOG } from './templates/catalog';
import { mergeSchemePalette } from './color-schemes';
import { buildThemeTokens } from './theme-tokens';
import { getContrastRatio } from './design-styles';
import {
  buildContrastMatrix,
  scanHtmlContrastPairs,
  ROOT_RENDER_COLOR,
} from './contrast-contract';

interface Hit { label: string }

/**
 * GUARD RENDER — ukur APA YANG BENAR-BENAR DIPASANG DI `<style>`, bukan palet.
 *
 * Regresi yang nyata terjadi dan TIDAK tertangkap guard yang sudah ada:
 * `findContrastViolations` membaca `buildContrastMatrix` + palet mentah, padahal
 * saat render `resolveContrastTokens` boleh MENIMPA `--color-<fg>` global.
 * Akibatnya audit melaporkan 0 pelanggaran sementara halaman tampil
 * putih-di-putih — 350 pasangan gagal pada 14 skema, semua guard tetap hijau.
 *
 * Dua hal yang dibedakan pemeriksaan ini dari guard lama:
 *
 *  1. Nilai fg diambil dari `buildThemeTokens`, sumber kebenaran yang sama
 *     dengan yang dipasang renderer.
 *  2. `scanHtmlContrastPairs` memadukan token dasar dan turunan
 *     (`var(--color-text-on-primary)` → fg `text`, bg `primary`), sehingga
 *     informasi "HTML memakai yang mana" hilang di hasilnya. Di sini itu
 *     direkonstruksi dari HTML: token turunan diukur dari matriks, token dasar
 *     dari `buildThemeTokens`.
 *
 * Audit juga dites ANTI-VAKUM. Sebuah guard yang tak bisa gagal lebih
 * berbahaya daripada tidak ada guard — lihat catatan guard icon di
 * `contrast-contract.test.ts`.
 */
describe('guard render: tidak ada teks di bawah 4.5:1 pada skema APAPUN', () => {
  const hits: Hit[] = [];
  let measured = 0;
  let textPairs = 0;

  for (const tpl of BUILT_IN_CATALOG) {
    const schemes = tpl.colorSchemes ?? [];
    for (const scheme of schemes) {
      const palette = mergeSchemePalette(scheme, tpl.theme.palette);
      const rendered = buildThemeTokens(
        palette, tpl.theme.typography, tpl.theme.components.borderRadius, { contrast: tpl.contrast },
      );
      const matrix = buildContrastMatrix(palette, tpl.contrast);

      const bgHexOf = (bg: string): string | undefined => {
        const r = rendered[`--color-${bg}`];
        if (r) return r;
        const raw = palette[bg as keyof typeof palette];
        return typeof raw === 'string' ? raw : undefined;
      };

      const parts: Array<{ label: string; html: string }> = [
        ...(tpl.headers ?? []).map((h) => ({ label: `header/${h.id}`, html: h.html ?? '' })),
        ...(tpl.footers ?? []).map((f) => ({ label: `footer/${f.id}`, html: f.html ?? '' })),
        ...(tpl.sections ?? []).flatMap((s) =>
          s.variants.map((v) => ({ label: `${s.type}/${v.id}`, html: (v as { html?: string }).html ?? '' }))),
      ];

      // Dipisah PER VARIAN: satu alur `bgFrames` untuk HTML gabungan membuat
      // tumpukan latar membocor antar varian dan melahirkan pasangan palsu.
      for (const part of parts) {
        for (const pair of scanHtmlContrastPairs(part.html, { color: ROOT_RENDER_COLOR })) {
          if (!pair.bg || pair.unresolved) continue;
          const bgHex = bgHexOf(pair.bg);
          if (!bgHex) continue;

          // Wajib properti `color:`. Substring `var(--color-X)` juga muncul di
          // `background:`/`border:` — menghitungnya sebagai foreground
          // menghasilkan 204 temuan palsu pada emerald laundry.
          const usesDerived = new RegExp(
            `(?:^|[";\\s])color\\s*:\\s*var\\(--color-${pair.fg}-on-${pair.bg}\\)`,
          ).test(part.html);
          const usesBase = new RegExp(
            `(?:^|[";\\s])color\\s*:\\s*var\\(--color-${pair.fg}\\)`,
          ).test(part.html);

          const record = (label: string, fgHex: string): void => {
            const ratio = getContrastRatio(fgHex, bgHex);
            measured++;
            if (pair.fg === 'text' || pair.fg === 'text-muted') textPairs++;
            if (ratio >= 4.5) return;
            hits.push({
              label: `${tpl.id} | ${scheme.name} | ${label} ${pair.fg}=${fgHex} di atas ` +
                `${pair.bg}=${bgHex} = ${ratio.toFixed(2)}:1 | ${part.label}`,
            });
          };

          if (usesDerived) {
            const d = matrix[`--color-${pair.fg}-on-${pair.bg}`];
            if (d) record('[turunan]', d);
          }
          // Token dasar dipakai bila HTML menyebutnya, atau bila pasangan datang
          // dari warisan root (tanpa deklarasi `color:` sendiri).
          if (usesBase || !usesDerived) {
            const b = rendered[`--color-${pair.fg}`] ?? matrix[`--color-${pair.fg}`];
            if (b) record('[dasar]', b);
          }
        }
      }
    }
  }

  const lines = [...new Set(hits.map((h) => h.label))];

  it('semua pasangan teks ≥ 4.5:1', () => {
    expect(
      lines.length ? lines.join('\n') : '',
      'ada teks yang tidak terbaca di atas latarnya',
    ).toBe('');
  });

  it('anti-vakum: pemeriksaan ini benar-benar mengukur sesuatu', () => {
    expect(measured, 'tak ada pasangan fg/bg yang terukur').toBeGreaterThan(0);
    expect(textPairs, 'pasangan text/text-muted tak pernah terukur').toBeGreaterThan(0);
  });
});

/**
 * GUARD TOKEN GLOBAL — `--color-text` tidak boleh tertimpa nilai yang
 * mengorbankan latar terang.
 *
 * Inti regresinya: `resolveContrastTokens` boleh menulis ulang `--color-<fg>`
 * in-place untuk SATU pasangan yang gagal, padahal token fg-only itu berlaku
 * di banyak latar sekaligus. Satu pasangan `text` di atas `primary` yang gelap
 * cukup untuk membuat seluruh halaman putih-di-putih. Perbaikannya
 * `globalFgCorrectionSafe` — guard ini menguncinya.
 */
describe('guard token: --color-text tetap terbaca di background & surface', () => {
  const bad: string[] = [];

  for (const tpl of BUILT_IN_CATALOG) {
    const schemes = tpl.colorSchemes ?? [];
    for (const scheme of schemes) {
      const palette = mergeSchemePalette(scheme, tpl.theme.palette);
      const tokens = buildThemeTokens(
        palette, tpl.theme.typography, tpl.theme.components.borderRadius, { contrast: tpl.contrast },
      );
      for (const fg of ['--color-text', '--color-text-muted'] as const) {
        for (const bg of ['--color-background', '--color-surface'] as const) {
          const ratio = getContrastRatio(tokens[fg], tokens[bg]);
          if (ratio < 4.5) {
            bad.push(
              `${tpl.id} | ${scheme.name} | ${fg}=${tokens[fg]} di atas ${bg}=${tokens[bg]} = ${ratio.toFixed(2)}:1`,
            );
          }
        }
      }
    }
  }

  it('token teks ≥ 4.5:1 di atas background dan surface', () => {
    expect(
      bad.length ? [...new Set(bad)].join('\n') : '',
      'koreksi kontras menimpa token global dengan nilai yang merusak latar lain',
    ).toBe('');
  });
});
