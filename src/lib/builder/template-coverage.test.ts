/**
 * Warnings cakupan aset saat import: file tak dirujuk + field gambar kosong.
 *
 * Kasus nyata: template AI mengupload 9–12 file tapi hanya 1 URL dirujuk
 * config — sisanya filed kosong (preview kosong / kanvas diisi foto generik).
 * Import tetap sukses; warnings memberi tahu apa yang bermasalah.
 */
import { describe, expect, it } from 'vitest';
import { findAssetCoverageIssues } from './template-schema';

describe('findAssetCoverageIssues', () => {
  it('menandai aset tak dirujuk', () => {
    const w = findAssetCoverageIssues(
      { data: { sections: [] } },
      [
        { name: 'hero.jpg', url: 'https://cdn.example/hero.jpg' },
        { name: 'logo.png', url: 'https://cdn.example/logo.png' },
      ],
    );
    expect(w.some((x) => x.includes('hero.jpg'))).toBe(true);
    expect(w.some((x) => x.includes('logo.png'))).toBe(true);
  });

  it('diam bila semua aset dirujuk', () => {
    const w = findAssetCoverageIssues(
      { data: { sections: [{ config: { image: 'https://cdn.example/hero.jpg' } }] } },
      [{ name: 'hero.jpg', url: 'https://cdn.example/hero.jpg' }],
    );
    expect(w).toEqual([]);
  });

  it('menandai field gambar kosong di seed', () => {
    const w = findAssetCoverageIssues(
      {
        data: {
          sections: [
            { type: 'hero', variant: 'hero-full', config: { headline: 'Hai', image: '' } },
            { type: 'gallery', variant: 'gallery-grid', config: { images: [] } },
          ],
        },
      },
      [],
    );
    expect(w.some((x) => x.includes('hero/hero-full.image'))).toBe(true);
    expect(w.some((x) => x.includes('gallery/gallery-grid.images'))).toBe(true);
  });

  it('menandai varian kustom tanpa html dan tanpa customCss', () => {
    const w = findAssetCoverageIssues(
      {
        sections: [
          {
            type: 'hero',
            variants: [
              { id: 'hero-full', configFields: [], defaultConfig: {} },
              { id: 'hero-katering-full', configFields: [], defaultConfig: {} },
              {
                id: 'hero-panggung',
                configFields: [],
                defaultConfig: {},
                html: '<section><h1>{{headline}}</h1></section>',
              },
            ],
          },
        ],
        data: { sections: [] },
      },
      [],
    );
    expect(w.some((x) => x.includes('hero/hero-katering-full'))).toBe(true);
    expect(w.some((x) => x.includes('hero/hero-panggung'))).toBe(false);
    expect(w.some((x) => x.includes('hero/hero-full'))).toBe(false);
  });

  it('diam bila varian kustom disasar customCss', () => {
    const w = findAssetCoverageIssues(
      {
        customCss: '[data-tpl-variant="hero-katering-full"] { color: red; }',
        sections: [
          {
            type: 'hero',
            variants: [{ id: 'hero-katering-full', configFields: [], defaultConfig: {} }],
          },
        ],
        data: { sections: [] },
      },
      [],
    );
    expect(w.some((x) => x.includes('hero-katering-full'))).toBe(false);
  });

  it('membatasi jumlah warnings', () => {
    const sections = Array.from({ length: 20 }, (_, i) => ({
      type: 'hero',
      variant: `v${i}`,
      config: { image: '' },
    }));
    const w = findAssetCoverageIssues({ data: { sections } }, []);
    expect(w.length).toBeLessThanOrEqual(12);
    expect(w.some((x) => x.includes('lainnya'))).toBe(true);
  });
});
