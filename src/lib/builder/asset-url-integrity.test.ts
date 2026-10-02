/**
 * Regresi InvalidJWT: gambar template mati dengan
 * 400 {"error":"InvalidJWT","message":"Invalid Compact JWS"}.
 *
 * Penyebab: `replaceAssetUrls` versi loop menempelkan signed URL kedua DI
 * DALAM URL yang baru disisipkan (nama file `hero.svg` cocok di dalam
 * `.../hero.svg?token=...`), sehingga token menjadi 5 segmen.
 *
 * Kontrak:
 * 1. Penggantian single-pass — URL hasil sisipan tidak pernah dipindai ulang.
 * 2. `repairDoubledSignUrl` menyelamatkan baris lama yang sudah rusak.
 * 3. `refreshTemplateUrls` memperbaiki URL rusak saat dibaca (self-heal).
 * 4. `seedTemplateSections` melewati definisi katalog yang nyasar sebagai seed.
 */
import { describe, expect, it } from 'vitest';
import {
  refreshTemplateUrls,
  repairDoubledSignUrl,
  replaceAssetUrls,
  signUrlNeedsRefresh,
} from './template-urls';
import { seedTemplateSections } from './migration';
import { PANGKAS_RAPI_TEMPLATE } from './templates/pangkas-rapi';

const HOST = 'https://wlzelzhzqxfstzadlxfj.supabase.co';
const PATH = 'template-assets/u/f/hero.svg';

function fakeJwt(exp: number): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ exp })}.${b64('sig')}`;
}

const goodUrl = (exp = 9999999999) =>
  `${HOST}/storage/v1/object/sign/product-images/${PATH}?token=${fakeJwt(exp)}`;

// Bentuk persis hasil bug lama: URL menempel di dalam URL.
const doubledUrl = (() => {
  const u = goodUrl();
  return u.replace('hero.svg', `${u}`);
})();

describe('replaceAssetUrls single-pass', () => {
  it('tidak menempelkan URL kedua di dalam URL pertama', () => {
    const url = goodUrl();
    const map = new Map([
      ['assets/hero.svg', url],
      ['hero.svg', url],
    ]);
    const out = replaceAssetUrls(
      { image: 'assets/hero.svg', gallery: ['assets/hero.svg'] },
      map,
    ) as Record<string, unknown>;
    expect(out.image).toBe(url);
    expect(out.gallery).toEqual([url]);
    // Token tetap 3 segmen, bukan 5.
    const token = String(out.image).split('token=')[1] ?? '';
    expect(token.split('.').length).toBe(3);
  });

  it('path terpanjang menang atas prefix pendek', () => {
    const map = new Map([
      ['assets/hero.svg', 'URL_PANJANG'],
      ['hero.svg', 'URL_PENDEK'],
    ]);
    const out = replaceAssetUrls({ a: 'assets/hero.svg', b: 'x/hero.svg' }, map) as Record<string, string>;
    expect(out.a).toBe('URL_PANJANG');
    expect(out.b).toBe('x/URL_PENDEK');
  });
});

describe('repairDoubledSignUrl', () => {
  it('menyelamatkan URL dalam yang valid', () => {
    const fixed = repairDoubledSignUrl(doubledUrl);
    expect(fixed).toBe(goodUrl());
  });

  it('null untuk URL sehat atau bukan sign URL', () => {
    expect(repairDoubledSignUrl(goodUrl())).toBeNull();
    expect(repairDoubledSignUrl('https://images.unsplash.com/x.jpg')).toBeNull();
    expect(repairDoubledSignUrl('')).toBeNull();
  });
});

describe('refreshTemplateUrls memperbaiki yang rusak', () => {
  it('URL 5-segmen diperbaiki tanpa perlu signer', async () => {
    let calls = 0;
    const r = await refreshTemplateUrls(
      { thumbnail_url: doubledUrl, template_data: { image: doubledUrl } },
      async () => {
        calls += 1;
        return 'https://cdn.example/fresh.jpg';
      },
    );
    expect(r.changed).toBe(true);
    expect(calls).toBe(0);
    expect(r.row.thumbnail_url).toBe(goodUrl());
    expect(
      (r.row.template_data as Record<string, unknown>).image,
    ).toBe(goodUrl());
  });

  it('URL sehat dan belum kedaluwarsa tidak disentuh', async () => {
    let calls = 0;
    const r = await refreshTemplateUrls({ thumbnail_url: goodUrl() }, async () => {
      calls += 1;
      return 'x';
    });
    expect(r.changed).toBe(false);
    expect(calls).toBe(0);
    expect(signUrlNeedsRefresh(goodUrl())).toBe(false);
  });
});

describe('seedTemplateSections melewati definisi katalog', () => {
  it('entri { type, variants[] } tanpa variant dilewati', () => {
    const catalogDef = {
      type: 'hero',
      name: 'Hero',
      icon: 'Layout',
      variants: [{ id: 'hero-full', defaultConfig: {} }],
    };
    const seed = [
      catalogDef,
      { type: 'hero', variant: 'hero-split', config: { headline: 'Hai' } },
    ];
    const out = seedTemplateSections(
      PANGKAS_RAPI_TEMPLATE,
      seed as Parameters<typeof seedTemplateSections>[1],
    );
    // Kasus nyata: 19 definisi katalog → 19 section varian-pertama di kanvas.
    expect(out).toHaveLength(1);
    expect(out[0].variantId).toBe('hero-split');
    expect((out[0].config as Record<string, unknown>).headline).toBe('Hai');
  });
});
