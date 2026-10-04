import { describe, expect, it } from 'vitest';
import { sanitizeAnchor, uniqueAnchorId } from './migration';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SectionRenderer } from '@/components/builder/section-renderer';
import type { DesignStyle, Section } from './types';

describe('sanitizeAnchor', () => {
  it('menjaga slug yang sudah valid', () => {
    expect(sanitizeAnchor('tarif')).toBe('tarif');
    expect(sanitizeAnchor('daftar-harga')).toBe('daftar-harga');
    expect(sanitizeAnchor('faq_v2')).toBe('faq_v2');
  });

  it('mengubah huruf besar dan spasi', () => {
    expect(sanitizeAnchor('Daftar Harga')).toBe('daftar-harga');
    expect(sanitizeAnchor('  KONTAK  ')).toBe('kontak');
  });

  it('membuang tanda # yang ikut tersalin', () => {
    expect(sanitizeAnchor('#tarif')).toBe('tarif');
    expect(sanitizeAnchor('##tarif')).toBe('tarif');
  });

  it('membuang karakter yang tidak valid untuk ID HTML', () => {
    expect(sanitizeAnchor('promo!!')).toBe('promo');
    expect(sanitizeAnchor('a/b\\c')).toBe('abc');
    expect(sanitizeAnchor('harga<>&')).toBe('harga');
  });

  it('ID tidak boleh diawali angka → digit depan dibuang', () => {
    expect(sanitizeAnchor('123abc')).toBe('abc');
    expect(sanitizeAnchor('2')).toBeUndefined();
    expect(sanitizeAnchor('123')).toBeUndefined();
  });

  it('koshi / tidak dikenal → undefined (section tetap tanpa anchor)', () => {
    expect(sanitizeAnchor('')).toBeUndefined();
    expect(sanitizeAnchor('   ')).toBeUndefined();
    expect(sanitizeAnchor(undefined)).toBeUndefined();
    expect(sanitizeAnchor(null)).toBeUndefined();
  });

  it('menekan hyphen berulang dan tepi', () => {
    expect(sanitizeAnchor('--a--b--')).toBe('a-b');
    expect(sanitizeAnchor('a  b')).toBe('a-b');
  });
});

describe('uniqueAnchorId (dipakai updateSectionAnchor)', () => {
  it('anchor kembar mendapat sufiks angka', () => {
    const used = new Set<string>();
    expect(uniqueAnchorId('tarif', used)).toBe('tarif');
    expect(uniqueAnchorId('tarif', used)).toBe('tarif-2');
    expect(uniqueAnchorId('tarif', used)).toBe('tarif-3');
  });

  it('anchor berbeda tidak salingmemo', () => {
    const used = new Set<string>();
    expect(uniqueAnchorId('a', used)).toBe('a');
    expect(uniqueAnchorId('b', used)).toBe('b');
  });
});

describe('anchor → atribut id di DOM', () => {
  const designStyle: DesignStyle = {
    id: 'test',
    name: 'Test',
    description: 'Test',
    palette: {
      primary: '#047857',
      secondary: '#065f46',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#111827',
      textMuted: '#4b5563',
      border: '#e2e8f0',
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
      shadowStyle: 'sm',
      navStyle: 'solid',
      footerStyle: 'simple',
    },
    effects: {},
    thumbnailUrl: '',
  };

  it('anchor yang diketik user muncul sebagai id di markup', () => {
    const section: Section = {
      id: 'internal-uuid-1234',
      type: 'hero',
      variant: 'hero-centered',
      config: { headline: 'Judul' },
      style: { padding: { top: 40, right: 24, bottom: 40, left: 24 }, background: 'transparent' },
      responsive: {},
    };
    const html = renderToStaticMarkup(
      createElement(SectionRenderer, { section, designStyle, anchorId: 'daftar-harga' }),
    );
    // Inilah nilai yang dipakai link menu (#daftar-harga).
    expect(html).toContain('id="daftar-harga"');
    // UUID internal TIDAK boleh jadi id DOM target anchor.
    expect(html).not.toContain('id="internal-uuid-1234"');
  });

  it('tanpa anchor tidak menghasilkan id kosong', () => {
    const section: Section = {
      id: 'no-anchor',
      type: 'hero',
      variant: 'hero-centered',
      config: { headline: 'Judul' },
      style: { padding: { top: 40, right: 24, bottom: 40, left: 24 }, background: 'transparent' },
      responsive: {},
    };
    const html = renderToStaticMarkup(createElement(SectionRenderer, { section, designStyle }));
    expect(html).not.toContain('id=""');
  });
});
