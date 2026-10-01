import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  clampBlur,
  clampPercent,
  composeGradientCss,
  overlayCss,
  parseGradientSpec,
  OVERLAY_DEFAULT_OPACITY,
} from './design-styles';
import { SectionRenderer } from '@/components/builder/section-renderer';
import type { DesignStyle, Section, SectionStyle } from './types';

const palette = {
  primary: '#047857',
  secondary: '#065f46',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#111827',
  textMuted: '#4b5563',
  border: '#e2e8f0',
};

const designStyle: DesignStyle = {
  id: 'test',
  name: 'Test',
  description: 'Test',
  palette,
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
    shadowStyle: 'sm',
    navStyle: 'solid',
    footerStyle: 'simple',
  },
  effects: {},
  thumbnailUrl: '',
};

function render(style: Partial<SectionStyle>, config: Record<string, unknown> = {}): string {
  const section: Section = {
    id: 'sec-1',
    type: 'hero',
    variant: 'hero-centered',
    config: { headline: 'Judulneedle', ...config },
    style: {
      padding: { top: 40, right: 24, bottom: 40, left: 24 },
      background: 'transparent',
      ...style,
    },
    responsive: {},
  };
  return renderToStaticMarkup(createElement(SectionRenderer, { section, designStyle }));
}

describe('parseGradientSpec', () => {
  it('membaca format singkat: start, end, angle', () => {
    expect(parseGradientSpec('#047857, #065f46, 135deg', palette)).toEqual({
      stops: ['#047857', '#065f46'],
      angle: '135deg',
    });
  });

  it('membaca format singkat tanpa sudut', () => {
    expect(parseGradientSpec('#047857, #065f46', palette)).toEqual({
      stops: ['#047857', '#065f46'],
      angle: undefined,
    });
  });

  it('membaca CSS penuh dan mengambil stop hex-nya', () => {
    const spec = parseGradientSpec('linear-gradient(90deg, #8B5A2B 0%, #D4A574 100%)', palette);
    expect(spec.stops).toEqual(['#8B5A2B', '#D4A574']);
  });

  it('me-resolve token theme: ke palet aktif', () => {
    const spec = parseGradientSpec('theme:primary, theme:secondary, 90deg', palette);
    expect(spec.stops).toEqual(['#047857', '#065f46']);
    expect(spec.angle).toBe('90deg');
  });

  it('kosong / undefined menghasilkan tanpa stop', () => {
    expect(parseGradientSpec(undefined, palette).stops).toEqual([]);
    expect(parseGradientSpec('', palette).stops).toEqual([]);
  });
});

describe('composeGradientCss', () => {
  it('format singkat menjadi CSS linear-gradient yang valid', () => {
    expect(composeGradientCss('#047857, #065f46, 135deg', palette)).toBe(
      'linear-gradient(135deg, #047857, #065f46)',
    );
  });

  it('memakai sudut default 135deg bila format singkat tanpa sudut', () => {
    expect(composeGradientCss('#047857, #065f46', palette)).toBe(
      'linear-gradient(135deg, #047857, #065f46)',
    );
  });

  it('CSS penuh diteruskan tanpa diubah', () => {
    const css = 'linear-gradient(135deg, #8B5A2B 0%, #D4A574 100%)';
    expect(composeGradientCss(css, palette)).toBe(css);
  });

  it('me-resolve token theme: sebelum disusun', () => {
    expect(composeGradientCss('theme:primary, theme:secondary, 90deg', palette)).toBe(
      'linear-gradient(90deg, #047857, #065f46)',
    );
  });

  it('tanpa input menghasilkan undefined (bukan CSS rusak)', () => {
    expect(composeGradientCss(undefined, palette)).toBeUndefined();
    expect(composeGradientCss('', palette)).toBeUndefined();
  });

  it('memakai palet tema saat gradasi kosong tapi fallback diberikan', () => {
    expect(
      composeGradientCss('', palette, { primary: palette.primary, secondary: palette.secondary }),
    ).toBe('linear-gradient(135deg, #047857, #065f46)');
  });
});

describe('overlayCss & clamp', () => {
  it('overlay none tidak menghasilkan warna', () => {
    expect(overlayCss('none', palette, 50)).toBeUndefined();
  });

  it('menghormati opasitas slider', () => {
    expect(overlayCss('dark', palette, 25)).toBe('rgba(0, 0, 0, 0.250)');
    expect(overlayCss('light', palette, 80)).toBe('rgba(255, 255, 255, 0.800)');
  });

  it('memakai warna primer untuk overlay primary', () => {
    expect(overlayCss('primary', palette, 60)).toBe('rgba(4, 120, 87, 0.600)');
  });

  it('tanpa opasitas eksplisit memakai default per jenis', () => {
    expect(overlayCss('dark', palette)).toBe('rgba(0, 0, 0, 0.500)');
    expect(overlayCss('light', palette)).toBe('rgba(255, 255, 255, 0.300)');
    expect(OVERLAY_DEFAULT_OPACITY.primary).toBe(60);
  });

  it('clampBlur & clampPercent menjaga rentang aman', () => {
    expect(clampBlur(-5)).toBe(0);
    expect(clampBlur(999)).toBe(24);
    expect(clampBlur(undefined)).toBe(0);
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});

describe('SectionRenderer — pemisahan layer latar', () => {
  it('blur tidak lagi dipasang pada elemen pembungkus konten', () => {
    const html = render({
      background: 'image',
      backgroundImage: 'https://x.test/a.jpg',
      backgroundBlur: 8,
    });
    // Filter hanya boleh muncul pada layer gambar, bukan pada wrapper.
    const wrapperTag = html.slice(0, html.indexOf('>') + 1);
    expect(wrapperTag).not.toContain('blur(');
    expect(html).toContain('blur(8px)');
  });

  it('overlay digambar sebagai layer sendiri di atas gambar', () => {
    const html = render({
      background: 'image',
      backgroundImage: 'https://x.test/a.jpg',
      backgroundOverlay: 'dark',
      backgroundOverlayOpacity: 40,
    });
    expect(html).toContain('rgba(0, 0, 0, 0.400)');
    expect(html).toContain('url(https://x.test/a.jpg)');
  });

  it('wrapper mengisolasi stacking agar konten tetap di atas layer', () => {
    const html = render({ background: 'image', backgroundImage: 'https://x.test/a.jpg' });
    expect(html).toContain('isolation:isolate');
    expect(html).toContain('z-index:-10');
  });

  it('konten section tetap dirender utuh saat ada latar foto', () => {
    const html = render({
      background: 'image',
      backgroundImage: 'https://x.test/a.jpg',
      backgroundBlur: 12,
    });
    expect(html).toContain('Judulneedle');
  });

  it('gradasi dirender sebagai CSS valid', () => {
    const html = render({ background: 'gradient', backgroundGradient: '#047857, #065f46, 90deg' });
    expect(html).toContain('linear-gradient(90deg, #047857, #065f46)');
  });

  it('blur diabaikan bila tidak ada gambar latar', () => {
    const html = render({ background: 'color', backgroundColor: '#123456', backgroundBlur: 10 });
    expect(html).not.toContain('blur(');
  });
});

