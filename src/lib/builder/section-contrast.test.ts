import { describe, expect, it } from 'vitest';
import { getContrastRatio } from './design-styles';
import { SECTION_REGISTRY } from './sections/registry';
import {
  autoFixMutedColor,
  autoFixTextColor,
  fgForBg,
  getSectionEffectiveBackground,
  MIN_CONTRAST_LARGE_TEXT,
  MIN_CONTRAST_NORMAL_FALLBACK,
  resolveButtonColors,
  resolvePrimaryOnSectionBg,
  textBackgroundFor,
  validateSectionContrast,
} from './section-contrast';
import { BUILT_IN_CATALOG } from './templates/catalog';
import type { DesignStylePalette } from './types';

/**
 * Korpus palet untuk uji kontras.
 *
 * Sebelumnya diambil dari `DESIGN_STYLES`; katalog itu dihapus di migrasi 046.
 * Sekarang memakai palet yang benar-benar dijangkau user: 20 skema warna
 * `COLOR_SCHEMES` (tab "Warna Tema" di StyleSelector) plus palet bawaan tiap
 * template katalog. Plus palet netral sebagai kontrol.
 */
const NEUTRAL_PALETTE: DesignStylePalette = {
  primary: '#333333',
  secondary: '#666666',
  accent: '#333333',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#333333',
  textMuted: '#666666',
  border: '#e5e5e5',
};

/** Skema warna tidak punya `secondary`; palet lengkap mewajibkannya. */
function withSecondary(p: Record<string, string>): DesignStylePalette {
  return { ...NEUTRAL_PALETTE, ...p, secondary: p.secondary ?? p.primary };
}

const PALETTES: Array<readonly [string, DesignStylePalette]> = [
  ['neutral', NEUTRAL_PALETTE],
  ...BUILT_IN_CATALOG.flatMap((t) => [
    ...(t.colorSchemes ?? []).map((s) => [s.id, withSecondary(s.palette)] as const),
    [t.id, withSecondary({ ...t.theme.palette })] as const,
  ]),
];

const SCENARIOS = [
  { name: 'transparent', style: { background: 'transparent' as const } },
  { name: 'theme:primary', style: { background: 'color' as const, backgroundColor: 'theme:primary' } },
  { name: 'theme:surface', style: { background: 'color' as const, backgroundColor: 'theme:surface' } },
  {
    name: 'gradient-primary-accent',
    style: { background: 'gradient' as const, backgroundGradient: 'theme:primary, theme:accent' },
  },
  {
    name: 'image-tanpa-overlay',
    style: { background: 'image' as const, backgroundImage: 'https://example.com/foto.jpg' },
  },
];

describe('kontras per section & varian', () => {
  it('traverse parent: transparent mengikuti latar halaman', () => {
    const palette = NEUTRAL_PALETTE;
    const bg = getSectionEffectiveBackground(
      { background: 'transparent' },
      palette,
      '#123456',
    );
    expect(bg).toEqual({ kind: 'solid', hex: '#123456' });
  });

  it('traverse parent: ancestor non-transparan pertama menang', () => {
    const palette = NEUTRAL_PALETTE;
    const bg = getSectionEffectiveBackground(
      { background: 'transparent' },
      palette,
      '#ffffff',
      [{ background: 'transparent' }, { background: 'color', backgroundColor: 'theme:primary' }],
    );
    expect(bg).toEqual({ kind: 'solid', hex: palette.primary.toLowerCase() });
  });

  it('background foto tanpa overlay dilaporkan agar overlay gelap dipaksa', () => {
    const palette = NEUTRAL_PALETTE;
    const bg = getSectionEffectiveBackground(
      { background: 'image', backgroundImage: 'https://x/y.jpg' },
      palette,
      palette.background,
    );
    expect(bg.kind).toBe('image-unmeasurable');
    // Teks hasil autofix untuk foto = terang (pasangan overlay gelap otomatis).
    expect(autoFixTextColor(palette.text, bg, true)).toBe('#ffffff');
  });

  it.each(PALETTES)(
    'palet %s: autofix heading (3:1) & body/muted (4.5) lolos di semua skenario latar',
    (_id, palette) => {
      for (const sc of SCENARIOS) {
        const style = { ...sc.style } as Parameters<
          typeof getSectionEffectiveBackground
        >[0];
        const raw = getSectionEffectiveBackground(style, palette, palette.background);
        const bg = textBackgroundFor(raw);
        const fixedHeading = autoFixTextColor(palette.text, raw, true);
        const fixedBody = autoFixTextColor(palette.text, raw, false);
        const fixedMuted = autoFixMutedColor(palette.textMuted, raw);
        const bgs = bg.kind === 'solid' ? [bg.hex] : (bg as { stops: string[] }).stops;
        const worstOf = (fg: string, min: number) => {
          let worst = Infinity;
          for (const b of bgs) {
            // rgba di-blend per stop seperti di modul (bukan rasio mentah).
            const eff = fgForBg(fg, palette, b) ?? fg;
            worst = Math.min(worst, getContrastRatio(eff, b));
          }
          return { worst, min };
        };
        // Kontrak autofix: tak pernah lebih buruk dari warna asli; untuk
        // latar solid (kasus riil: transparent/theme/foto) harus lolos penuh.
        // Gradasi ekstrem bisa tak punya satu warna yang lolos di semua stop
        // (mis. primer mid-tone + aksen terang) → cukup tak-regresi.
        const isGradient = sc.name.startsWith('gradient');
        for (const [fgOrig, fgFixed, min, role] of [
          [palette.text, fixedHeading, MIN_CONTRAST_LARGE_TEXT, 'heading'],
          [palette.text, fixedBody, MIN_CONTRAST_NORMAL_FALLBACK, 'body'],
          [palette.textMuted, fixedMuted, MIN_CONTRAST_NORMAL_FALLBACK, 'muted'],
        ] as const) {
          let origWorst = Infinity;
          for (const b of bgs) {
            const eff = fgForBg(fgOrig, palette, b) ?? fgFixed;
            origWorst = Math.min(origWorst, getContrastRatio(eff, b));
          }
          const fixedWorst = worstOf(fgFixed, min).worst;
          expect(
            fixedWorst,
            `${role} ${_id}/${sc.name} tak boleh lebih buruk (${origWorst.toFixed(2)} → ${fixedWorst.toFixed(2)})`,
          ).toBeGreaterThanOrEqual(origWorst - 0.01);
          if (!isGradient) {
            expect(
              fixedWorst,
              `${role} ${_id}/${sc.name} harus ≥ ${min}`,
            ).toBeGreaterThanOrEqual(min);
          }
        }
      }
    },
  );

  it('setiap varian registry: validate + fix tersedia untuk latar theme:primary', () => {
    const checked: string[] = [];
    for (const [, palette] of PALETTES) {
      for (const def of Object.values(SECTION_REGISTRY)) {
        for (const v of def.variants) {
          const res = validateSectionContrast(
            { id: `t-${v.id}`, type: def.type, variant: v.id },
            {
              padding: { top: 64, right: 24, bottom: 64, left: 24 },
              background: 'color',
              backgroundColor: 'theme:primary',
            },
            palette,
            palette.background,
          );
          // Setiap issue wajib membawa warna fix yang lolos ambangnya.
          for (const issue of res.issues) {
            const ratio = getContrastRatio(issue.fixed, issue.bg);
            expect(ratio, `${def.type}/${v.id} role ${issue.role}`).toBeGreaterThanOrEqual(
              issue.minRatio,
            );
          }
          checked.push(`${def.type}/${v.id}`);
        }
      }
    }
    expect(checked.length).toBeGreaterThan(0);
  });

  it('setiap template katalog: hero dengan background theme:primary tetap terbaca', () => {
    for (const t of BUILT_IN_CATALOG) {
      const palette = t.theme.palette;
      const bg = textBackgroundFor(
        getSectionEffectiveBackground(
          { background: 'color', backgroundColor: 'theme:primary' },
          palette,
          palette.background,
        ),
      );
      const bgs = bg.kind === 'solid' ? [bg.hex] : (bg as { stops: string[] }).stops;
      for (const b of bgs) {
        expect(getContrastRatio(autoFixTextColor(palette.text, bg, true), b)).toBeGreaterThanOrEqual(
          MIN_CONTRAST_LARGE_TEXT,
        );
      }
    }
  });
});

describe('tombol anti-tumpang-tindih vs latar section', () => {
  const basePalette = {
    primary: '#111111',
    secondary: '#222222',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#111111',
    textMuted: '#6b7280',
    border: '#e5e7eb',
  };

  it('primary tabrakan → fallback ke secondary', () => {
    const btn = resolveButtonColors(
      { kind: 'solid', hex: '#111111' },
      { ...basePalette, secondary: '#2a4d69' },
    );
    expect(btn.bg).toBe('#2a4d69');
    expect(btn.fg).toBeTruthy();
  });

  it('primary+secondary tabrakan → fallback ke accent', () => {
    const btn = resolveButtonColors(
      { kind: 'solid', hex: '#111111' },
      { ...basePalette, secondary: '#111111' },
    );
    expect(btn.bg).toBe('#f59e0b');
  });

  it('semua tabrakan → fallback surface', () => {
    const mono = {
      primary: '#111111',
      secondary: '#111111',
      accent: '#111111',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#111111',
      textMuted: '#6b7280',
      border: '#e5e7eb',
    };
    const btn = resolveButtonColors({ kind: 'solid', hex: '#111111' }, mono);
    expect(btn.bg).toBe('#f5f5f5');
  });

  it('latar gradient: primary cocok salah satu stop → fallback', () => {
    const btn = resolveButtonColors(
      { kind: 'gradient', stops: ['#111111', '#ffffff'] },
      { ...basePalette, secondary: '#2a4d69' },
    );
    expect(btn.bg).toBe('#2a4d69');
  });

  it('latar foto → primary dipertahankan (overlay gelap dipaksa)', () => {
    const btn = resolveButtonColors({ kind: 'image-unmeasurable', overlay: 'dark' }, basePalette);
    expect(btn.bg).toBe('#111111');
  });

  it('teks tombol selalu terbaca di atas bg tombol', () => {
    const btn = resolveButtonColors({ kind: 'solid', hex: '#111111' }, basePalette);
    expect(getContrastRatio(btn.fg, btn.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('primer sebagai teks di atas latar section', () => {
  const pal = {
    primary: '#047857',
    secondary: '#065f46',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#ecfdf5',
    text: '#111827',
    textMuted: '#4b5563',
    border: '#a7f3d0',
  };

  it('primary lolos → dipakai apa adanya', () => {
    expect(resolvePrimaryOnSectionBg({ kind: 'solid', hex: '#ffffff' }, pal)).toBe('#047857');
  });

  it('primary nabrak latar → di-autofix hingga terbaca', () => {
    const fixed = resolvePrimaryOnSectionBg({ kind: 'solid', hex: '#047857' }, pal);
    expect(fixed).not.toBe('#047857');
    expect(getContrastRatio(fixed, '#047857')).toBeGreaterThanOrEqual(4.5);
  });

  it('gradient: aman terhadap stop terburuk', () => {
    const stops = ['#ffffff', '#f5f5f5'];
    const fixed = resolvePrimaryOnSectionBg({ kind: 'gradient', stops }, pal);
    for (const stop of stops) {
      expect(getContrastRatio(fixed, stop)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('gradient mustahil (terang+gelap): tak pernah lebih buruk dari input', () => {
    const stops = ['#ffffff', '#047857'];
    const fixed = resolvePrimaryOnSectionBg({ kind: 'gradient', stops }, pal);
    const worst = (c: string) => Math.min(...stops.map((s) => getContrastRatio(c, s)));
    expect(worst(fixed)).toBeGreaterThanOrEqual(worst(pal.primary));
  });

  it('foto: tetap terbaca di atas overlay representatif', () => {
    const fixed = resolvePrimaryOnSectionBg({ kind: 'image-unmeasurable', overlay: 'dark' }, pal);
    expect(getContrastRatio(fixed, '#131313')).toBeGreaterThanOrEqual(4.5);
  });
});
