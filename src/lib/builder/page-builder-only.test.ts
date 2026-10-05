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
    expect(src).not.toContain('.eq("is_homepage", true)');
    // `is_published` tak lagi dibaca di sini sama sekali — status tayang
    // hanya informatif di panel builder (lihat test di bawah).
    expect(src).not.toContain('stored?.is_published');
  });

  it('live site tidak lagi menolak render karena status tayang', () => {
    // Builder tidak punya konsep draft (lihat `save-dialog.tsx`): satu-satunya
    // aksi yang menyentuh website publik adalah tombol "Tampilkan". Gerbang
    // `is_published` sudah dihapus dari `buildSite` karena dulu membuat live
    // site 404 hanya karena satu klik "Simpan", dan statusnya nempel — harus
    // klik "Tayangkan" lagi untuk memulihkan.
    //
    // `stripComments` dipakai supaya kalimat ini sendiri tidak memenuhi
    // assertion di bawah.
    const src = stripComments(read('src', 'lib', 'builder', 'public.ts'));
    expect(src).not.toMatch(/if \(!isPublished\) return null;/);
    expect(src).not.toContain('is_published !== false');
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

/**
 * Guard regresi untuk bug "Simpan meng-unpublish website".
 *
 * Dulu jalur Simpan mengirim `is_published: <state React>` dan server
 * menghormatinya, sehingga satu klik Simpan mengubah website tayang jadi
 * draft → live site 404, dan statusnya nempel sampai diklik "Tayangan".
 * Builder sekarang tidak punya konsep draft: Simpan hanya menulis ke library,
 * jadi TIDAK BOLEH ada payload Simpan/SEO yang mengirim `is_published`.
 * Satu-satunya pengirim yang sah adalah aksi "Tayangkan".
 */
describe('hanya tombol Tayangkan yang menyentuh status tayang', () => {
  it('jalur Simpan di page-builder tidak mengirim is_published', () => {
    const src = stripComments(read('app', 'dashboard', 'web-design', 'customize', 'page.tsx'));
    // Object `custom_config` yang dikirim ke PUT tidak boleh memuat flag status.
    // Blok publish memakai `is_published: true` di luar `custom_config`, jadi
    // assertion ini tidak ikut menyentuhnya.
    expect(src, 'payload custom_config tidak boleh mengirim is_published').not.toMatch(
      /custom_config:\s*\{[^}]*is_published/,
    );
    // State React `publishState` sudah dihapus — itu biang bugnya.
    expect(src).not.toContain('publishState');
    // Aksi publish tetap satu-satunya yang menaikkan status.
    expect(src).toContain('is_published: true');
  });

  it('panel SEO tidak mengirim is_published', () => {
    const src = stripComments(read('app', 'dashboard', 'seo', 'page.tsx'));
    expect(src, 'panel SEO tidak boleh mengubah status tayang').not.toContain('is_published:');
  });

  it('dialog Simpan tidak lagi menawarkan opsi "simpan ke website"', () => {
    const src = stripComments(read('src', 'components', 'builder', 'save-dialog.tsx'));
    expect(src).not.toContain("SaveChoice");
    expect(src).not.toContain("'plain'");
    // Tetap ada input nama — itu inti dari "Simpan sebagai Template".
    expect(src).toContain('template-library-name');
  });

  it('tombol Tayangkan tetap aktif walau sudah pernah tayang', () => {
    // Menonaktifkannya saat `isPublished === true` membuat user tidak bisa
    // menimpa template aktif dari editor.
    const src = stripComments(read('src', 'components', 'builder', 'builder-topbar.tsx'));
    expect(src).not.toContain('isPublished === true');
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
