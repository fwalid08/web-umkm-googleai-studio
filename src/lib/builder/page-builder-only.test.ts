import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guard decommission Builder Global: page-builder jadi satu-satunya sumber
 * kebenaran homepage. Fokus: tidak ada lagi percabangan homepage_type yang
 * menentukan sumber render, dan homepage selalu baris is_homepage.
 */
const read = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8');

describe('homepage_type tidak lagi menentukan sumber render', () => {
  it('public.ts tidak memakai homepage_type sebagai sumber logika', () => {
    const src = read('src', 'lib', 'builder', 'public.ts');
    // Hanya boleh muncul di komentar; tidak boleh di kode.
    const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(code).not.toContain('homepage_type');
    expect(code).not.toContain('homepage_page_id');
    expect(code).not.toContain('homepageType');
  });

  it('public.ts membaca homepage via is_homepage', () => {
    const src = read('src', 'lib', 'builder', 'public.ts');
    expect(src).toContain('.eq("is_homepage", true)');
  });

  it('public.ts tidak jatuh ke custom_config.sections sebagai sumber', () => {
    const src = read('src', 'lib', 'builder', 'public.ts');
    //-sectionsToRender HARUS hanya dari baris page-builder.
    expect(src).toContain('const sectionsToRender = pageSections;');
    expect(src).not.toMatch(/sectionsToRender = pageSections \?\?/);
  });

  it('API tidak lagi me-reset homepage_type saat menyimpan', () => {
    const src = read('app', 'api', 'websites', '[websiteId]', 'website', 'route.ts');
    const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(code).not.toContain('homepage_type');
  });

  it('route builder lama sudah dihapus', () => {
    expect(() => readFileSync(join(process.cwd(), 'app/dashboard/builder/page.tsx'))).toThrow();
  });

  it('tidak ada entry point UI yang menuju /dashboard/builder', () => {
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

describe('halaman kosong tetap dapat kanvas berisi', () => {
  it('page-builder tidak lagi mewarisi custom_config.sections', () => {
    const src = read('app', 'dashboard', 'websites', 'page-builder', '[pageId]', 'page.tsx');
    // Seed dari template, bukan sections global.
    expect(src).toContain('templateSections');
    expect(src).not.toContain(': (config.sections ?? [])');
  });
});
