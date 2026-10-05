import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard model single-page (lihat 044_single_page_user_templates.sql).
 *
 * Semula `store_pages` yang menjadi satu-satunya sumber kebenaran homepage.
 * Sekarang tabel itu dihapus: isi halaman (sections + status tayang + meta)
 * lived di `user_templates.custom_config`. Test ini mengunci invarian baru:
 * tidak boleh ada satu pun sisa `store_pages` di kode.
 */
const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8');
/** Buang komentar baris (//) maupun blok agar assertion tidak salah
 *  positive dari dokumentasi yang menyebut nama tabel yang dihapus. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

const SOURCE_FILES = [
  ['src', 'lib', 'builder', 'public.ts'],
  ['app', 'api', 'websites', 'route.ts'],
  ['app', 'api', 'websites', '[websiteId]', 'website', 'route.ts'],
  ['app', '[...slug]', 'page.tsx'],
  ['app', 'dashboard', 'web-design', 'customize', 'page.tsx'],
] as const;

describe('store_pages dihapus total', () => {
  it('tidak ada kode yang masih query store_pages', () => {
    for (const f of SOURCE_FILES) {
      const code = stripComments(read(...f));
      expect(code, `${f.join('/')} masih menyebut store_pages`).not.toContain('store_pages');
    }
  });

  it('route API pages tidak lagi ada', () => {
    for (const p of [
      ['app', 'api', 'websites', '[websiteId]', 'pages', 'route.ts'],
      ['app', 'api', 'websites', '[websiteId]', 'pages', '[pageId]', 'route.ts'],
    ]) {
      expect(() => readFileSync(join(process.cwd(), ...p))).toThrow();
    }
  });

  it('lib/pages/slug (multi-page) sudah dihapus', () => {
    expect(() => readFileSync(join(process.cwd(), 'src', 'lib', 'pages', 'slug.ts'))).toThrow();
  });

  it('halaman selain "/" selalu 404', () => {
    const src = read('app', '[...slug]', 'page.tsx');
    expect(src).toContain('notFound()');
    // Tidak boleh lagi render storefront per-slug.
    expect(src).not.toContain('PublicWebsite');
  });
});

describe('isi halaman kini dari user_templates.custom_config', () => {
  it('public.ts membaca sections dari custom_config, bukan tabel terpisah', () => {
    const src = read('src', 'lib', 'builder', 'public.ts');
    expect(src).toContain('stored?.sections');
    expect(src).toContain('stored?.is_published');
    expect(src).not.toContain('.eq("is_homepage", true)');
  });

  it('publish=false menghasilkan 404 (bukan fallback konten basi)', () => {
    const src = read('src', 'lib', 'builder', 'public.ts');
    expect(src).toMatch(/if \(!isPublished\) return null;/);
  });

  it('API menyimpan is_published + meta ke custom_config', () => {
    // Whitelist config pindah ke `website-config.ts` (satu-satunya definisi,
    // dipakai kedua branch PUT). Route tetap yang memanggilnya.
    const route = read('app', 'api', 'websites', '[websiteId]', 'website', 'route.ts');
    expect(route).toContain('is_published:');
    expect(route).toContain('buildStoredCustomConfig(');
    const config = read('src', 'lib', 'builder', 'website-config.ts');
    expect(config).toContain('is_published:');
    expect(config).toContain('meta_title:');
    expect(config).toContain('meta_description:');
    expect(config).toContain('og_image_url:');
  });
});

describe('builder memakai satu endpoint (tanpa pageId)', () => {
  it('route lama page-builder dihapus', () => {
    expect(() => readFileSync(join(process.cwd(), 'app/dashboard/websites/page-builder/page.tsx'))).toThrow();
  });

  it('editor tidak lagi mengambil pageId dari URL', () => {
    const src = read('app', 'dashboard', 'web-design', 'customize', 'page.tsx');
    expect(src).not.toContain('useParams');
    expect(src).not.toContain('/pages/');
  });

  it('editor men-seed kanvas dari template saat config kosong', () => {
    const src = read('app', 'dashboard', 'web-design', 'customize', 'page.tsx');
    // Seed dari sections TEMPLATE, bukan sections global yang bisa basi.
    expect(src).toContain('templateSections');
    expect(src).toContain('savedPageSections.length > 0 ? savedPageSections : templateSections');
  });

  it('tidak ada entry point UI menuju /dashboard/builder', () => {
    const files = [
      ['app', 'onboarding', 'page.tsx'],
      ['app', 'dashboard', 'layout.tsx'],
      ['src', 'components', 'websites', 'panel-menu.tsx'],
      ['src', 'components', 'navigation', 'mobile-bottom-nav.tsx'],
    ] as const;
    for (const f of files) {
      const src = read(...f);
      expect(src, `${f.join('/')} masih menunjuk /dashboard/builder`).not.toContain('"/dashboard/builder"');
      expect(src, `${f.join('/')} masih menunjuk /dashboard/builder`).not.toContain("'/dashboard/builder'");
      expect(src, `${f.join('/')} masih menunjuk /dashboard/builder`).not.toContain('`/dashboard/builder`');
    }
  });

  it('store.save / store.publish sudah tidak ada', () => {
    const src = read('src', 'lib', 'builder', 'store.ts');
    expect(src).not.toContain('save: async');
    expect(src).not.toContain('publish: async');
  });
});
