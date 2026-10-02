/**
 * Auto-map aset upload ke field gambar kosong (jaring pengaman import).
 *
 * Kasus nyata: template AI mengupload 9–12 file tapi hanya ~1 dirujuk —
 * field lain kosong. Tanpa auto-map, preview kosong & kanvas diisi foto
 * generik. Auto-map mengisi yang kosong berdasarkan konvensi nama file.
 */
import { describe, expect, it } from 'vitest';
import { autoMapAssets, sniffImageContent } from './asset-automap';

const enc = (s: string) => new TextEncoder().encode(s);

const URL = (n: string) => `https://cdn.example/${n}`;

describe('autoMapAssets', () => {
  it('mengisi logoUrl dari file logo', () => {
    const r = autoMapAssets(
      { data: { header: { logoUrl: '' }, sections: [] } },
      [{ name: 'logo.svg', url: URL('logo.svg') }],
    );
    const data = r.templateData.data as Record<string, Record<string, unknown>>;
    expect(data.header.logoUrl).toBe(URL('logo.svg'));
    expect(r.filled.some((f) => f.includes('logoUrl') && f.includes('logo.svg'))).toBe(true);
  });

  it('mengisi image hero dan array gallery', () => {
    const r = autoMapAssets(
      {
        data: {
          sections: [
            { type: 'hero', variant: 'hero-split', config: { headline: 'Hai', image: '' } },
            { type: 'gallery', variant: 'gallery-grid', config: { title: 'G', images: [] } },
          ],
        },
      },
      [
        { name: 'hero.svg', url: URL('hero.svg') },
        { name: 'gallery-01.svg', url: URL('gallery-01.svg') },
        { name: 'gallery-02.svg', url: URL('gallery-02.svg') },
      ],
    );
    const sections = (r.templateData.data as Record<string, Array<{ config: Record<string, unknown> }>>).sections;
    expect(sections[0].config.image).toBe(URL('hero.svg'));
    expect(sections[1].config.images).toEqual([URL('gallery-01.svg'), URL('gallery-02.svg')]);
  });

  it('tidak menimpa nilai terisi & tidak memakai file terpakai dua kali', () => {
    const r = autoMapAssets(
      {
        data: {
          sections: [
            { type: 'hero', variant: 'v1', config: { image: 'https://saya.com/a.jpg' } },
            { type: 'about', variant: 'v2', config: { image: '' } },
          ],
        },
      },
      [{ name: 'hero.svg', url: URL('hero.svg') }],
    );
    const sections = (r.templateData.data as Record<string, Array<{ config: Record<string, unknown> }>>).sections;
    expect(sections[0].config.image).toBe('https://saya.com/a.jpg');
    // hero.svg cocok untuk about.image generik (fallback file tersisa).
    expect(sections[1].config.image).toBe(URL('hero.svg'));
  });

  it('tidak mengubah apa pun bila pool kosong / semua terisi', () => {
    const input = { data: { sections: [{ config: { image: 'https://saya.com/a.jpg' } }] } };
    const r = autoMapAssets(input, []);
    expect(r.filled).toEqual([]);
    expect(r.templateData).toEqual(input);
  });

  it('mengisi katalog defaults agar ganti varian tetap membawa gambar', () => {
    const r = autoMapAssets(
      {
        sections: [
          {
            type: 'hero',
            variants: [{ id: 'hero-split', configFields: [], defaultConfig: { image: '' } }],
          },
        ],
        data: { sections: [] },
      },
      [{ name: 'hero.jpg', url: URL('hero.jpg') }],
    );
    const catalog = (r.templateData.sections as Array<{ variants: Array<{ defaultConfig: Record<string, unknown> }> }>)[0];
    expect(catalog.variants[0].defaultConfig.image).toBe(URL('hero.jpg'));
  });
});

describe('sniffImageContent', () => {
  it('mendeteksi SVG berekstensi .jpg (kasus catering: 1KB <svg bernama .jpg)', () => {
    const fake = enc('<svg xmlns="http://www.w3.org/2000/svg"><rect width="100"/></svg>');
    const w = sniffImageContent('hero-catering.jpg', fake);
    expect(w).not.toBeNull();
    expect(w!).toMatch(/SVG/i);
  });

  it('mendeteksi foto raster kecil sebagai kemungkinan placeholder', () => {
    const tiny = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(500).fill(0)]);
    const w = sniffImageContent('galeri.jpg', tiny);
    expect(w).not.toBeNull();
    expect(w!).toMatch(/kecil|placeholder/i);
  });

  it('mendeteksi magic tak cocok (teks berekstensi .png)', () => {
    // Besar agar lolos batas ukuran minimum, tapi isinya teks biasa.
    const big = enc('hello world '.repeat(2000));
    const w = sniffImageContent('foto.png', big);
    expect(w).not.toBeNull();
  });

  it('diam untuk JPEG asli yang wajar', () => {
    const head = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1]);
    const buf = new Uint8Array(200 * 1024);
    buf.set(head);
    expect(sniffImageContent('hero.jpg', buf)).toBeNull();
  });

  it('diam untuk PNG asli yang wajar', () => {
    const head = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const buf = new Uint8Array(200 * 1024);
    buf.set(head);
    expect(sniffImageContent('logo.png', buf)).toBeNull();
  });

  it('diam untuk SVG jujur berekstensi .svg', () => {
    expect(sniffImageContent('hero.svg', enc('<svg xmlns="x"><rect/></svg>'))).toBeNull();
  });

  it('menandai SVG berekstensi .svg yang isinya bukan SVG', () => {
    const w = sniffImageContent('hero.svg', enc('not svg at all, just text here...'));
    expect(w).not.toBeNull();
  });
});
