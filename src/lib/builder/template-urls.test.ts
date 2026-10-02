/**
 * Refresh signed URL aset template (bom waktu 7 hari).
 *
 * URL diuji murni tanpa network: parsing + deteksi kedaluwarsa + penggantian
 * string memakai signer palsu.
 */
import { describe, expect, it } from 'vitest';
import {
  parseSupabaseSignUrl,
  readJwtExp,
  refreshTemplateUrls,
  signUrlNeedsRefresh,
} from './template-urls';

function fakeJwt(exp: number): string {
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64({ alg: 'HS256' })}.${b64({ exp })}.${b64('sig')}`;
}

const PATH = 'template-assets/u/f/hero.jpg';
const freshUrl = 'https://cdn.example/fresh/hero.jpg';
const signUrl = (exp: number) =>
  `https://wlzelzhzqxfstzadlxfj.supabase.co/storage/v1/object/sign/product-images/${PATH}?token=${fakeJwt(exp)}`;

describe('parseSupabaseSignUrl', () => {
  it('mengurai bucket + path + token', () => {
    const p = parseSupabaseSignUrl(signUrl(9999999999));
    expect(p?.bucket).toBe('product-images');
    expect(p?.path).toBe(PATH);
    expect(p?.token).toContain('.');
  });

  it('menolak URL biasa', () => {
    expect(parseSupabaseSignUrl('https://images.unsplash.com/x.jpg')).toBeNull();
    expect(parseSupabaseSignUrl('assets/hero.jpg')).toBeNull();
    expect(parseSupabaseSignUrl('')).toBeNull();
  });
});

describe('signUrlNeedsRefresh', () => {
  it('true bila kedaluwarsa < 24 jam', () => {
    const soon = Math.floor(Date.now() / 1000) + 3600;
    expect(signUrlNeedsRefresh(signUrl(soon))).toBe(true);
  });

  it('false bila masih lama', () => {
    const later = Math.floor(Date.now() / 1000) + 6 * 24 * 3600;
    expect(signUrlNeedsRefresh(signUrl(later))).toBe(false);
  });

  it('false untuk URL non-sign', () => {
    expect(signUrlNeedsRefresh('https://images.unsplash.com/x.jpg')).toBe(false);
  });
});

describe('refreshTemplateUrls', () => {
  it('mengganti URL kedaluwarsa di thumbnail, assets, dan template_data', async () => {
    const old = signUrl(Math.floor(Date.now() / 1000) + 100);
    const row = {
      thumbnail_url: old,
      assets: [{ id: 'a', name: 'hero.jpg', url: old }],
      template_data: { data: { sections: [{ config: { image: old } }] } },
    };
    const r = await refreshTemplateUrls(row, async () => freshUrl);
    expect(r.changed).toBe(true);
    expect(r.refreshed).toBe(1);
    expect(r.row.thumbnail_url).toBe(freshUrl);
    expect((r.row.assets as Array<{ url: string }>)[0].url).toBe(freshUrl);
    expect(
      (
        ((r.row.template_data as Record<string, unknown>).data as Record<string, unknown>)
          .sections as Array<{ config: { image: string } }>
      )[0].config.image,
    ).toBe(freshUrl);
  });

  it('tidak mengubah bila semua URL masih lama', async () => {
    const url = signUrl(Math.floor(Date.now() / 1000) + 6 * 24 * 3600);
    let calls = 0;
    const r = await refreshTemplateUrls({ thumbnail_url: url }, async () => {
      calls += 1;
      return freshUrl;
    });
    expect(r.changed).toBe(false);
    expect(calls).toBe(0);
  });

  it('fail-soft bila signer gagal', async () => {
    const old = signUrl(Math.floor(Date.now() / 1000) + 100);
    const r = await refreshTemplateUrls({ thumbnail_url: old }, async () => null);
    expect(r.changed).toBe(false);
    expect(r.row.thumbnail_url).toBe(old);
  });
});

describe('readJwtExp', () => {
  it('membaca exp', () => {
    expect(readJwtExp(fakeJwt(12345))).toBe(12345);
  });

  it('null untuk token rusak', () => {
    expect(readJwtExp('bukan-jwt')).toBeNull();
    expect(readJwtExp('')).toBeNull();
  });
});
