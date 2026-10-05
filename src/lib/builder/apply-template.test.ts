import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  applyTemplateToWebsite,
  buildTemplateCustomConfig,
  deleteSavedTemplate,
  isLibraryTemplate,
  resolveStoreTemplate,
  resolveTemplateId,
  resolveTemplateSections,
  type ApplyableTemplate,
} from './apply-template';

function repoFile(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), 'utf-8');
}

/**
 * Buang komentar baris sebelum pemeriksaan statis.
 *
 * Tanpa ini guard ikut triggered oleh penjelasan di komentar (mis. catatan
 * "versi lama memakai `BUILT_IN_CATALOG.find`") — bukan oleh kode nyata.
 * `//` hanya dianggap komentar bila di awal baris atau didahului spasi, dan
 * tidak didahului `:` supaya `https://` tetap utuh.
 */
function repoFileCode(...parts: string[]): string {
  return repoFile(...parts).replace(/^(\s*|\s+)\/\/.*$/gm, '');
}

/** Template library bentuk minimum (hasil unwrap `template_data`). */
function libraryTemplate(overrides: Partial<ApplyableTemplate['data']> = {}): ApplyableTemplate {
  return {
    id: 'be6e2957-1d0f-4ef2-89ba-1a85347ef44f',
    name: 'Bengkel ZIP',
    description: 'Template hasil import',
    source: 'saved',
    category: 'services',
    data: {
      paletteOverride: { primary: '#f97316', background: '#0b1220' },
      customCss: '[data-tpl-type="hero"] { clip-path: ellipse(78% 88% at 50% 0%); }',
      animations: [
        { id: 'a1', name: 'A', type: 'slide', duration: 700, delay: 0, easing: 'ease-out', trigger: 'onLoad', target: '#beranda' },
      ],
      behaviours: [
        { id: 'b1', name: 'B', script: '/* noop */', trigger: 'onLoad', target: 'body', type: 'custom' },
      ],
      sections: [
        { type: 'hero', variant: 'hero-split', anchorId: 'beranda', config: { headline: 'Halo' } },
      ],
      header: {
        variant: 'standard',
        siteTitle: 'Bengkel',
        navItems: [{ id: 'n1', label: 'Layanan', url: '#beranda', isExternal: false, enabled: true }],
      },
      footer: { style: 'columns', text: '© {year} Bengkel' },
      seo: { title: 'Bengkel', description: 'Servis motor' },
      core: {},
      ...overrides,
    },
  };
}

describe('apply-template: kontrak payload', () => {
  it('menghasilkan custom_config lengkap — creative layer ikut', () => {
    const cfg = buildTemplateCustomConfig(libraryTemplate());
    expect(cfg.palette_override).toEqual({ primary: '#f97316', background: '#0b1220' });
    // Tiga hal ini yang dulu hilang kalau call site apply tidak menambahkannya.
    expect(String(cfg.customCss)).toContain('clip-path');
    expect(Array.isArray(cfg.animations)).toBe(true);
    expect(Array.isArray(cfg.behaviours)).toBe(true);
    expect((cfg.sections as unknown[]).length).toBe(1);
  });

  it('section hasil resolve membawa anchorId dan variant tetap utuh', () => {
    const sections = resolveTemplateSections(libraryTemplate().data, 'services');
    // Nav template library harus tetap punya tujuan.
    expect(sections.map((s) => s.anchorId)).toEqual(['beranda']);
    // Varian tidak boleh jatuh ke varian pertama.
    expect(sections.map((s) => s.variant)).toEqual(['hero-split']);
  });

  it('template tanpa data sama sekali tidak melempar error', () => {
    const cfg = buildTemplateCustomConfig({ id: 'builtin-kosong', data: {} });
    expect(cfg.sections).toEqual([]);
    expect(cfg.customCss).toBe('');
  });
});

describe('apply-template: template library', () => {
  it('mengenali asal template dan membuang prefix builtin-', () => {
    expect(isLibraryTemplate({ source: 'saved' })).toBe(true);
    expect(isLibraryTemplate({ source: 'builtin' })).toBe(false);
    expect(resolveTemplateId('builtin-food')).toBe('food');
    expect(resolveTemplateId('be6e2957-1d0f-4ef2-89ba-1a85347ef44f')).toBe(
      'be6e2957-1d0f-4ef2-89ba-1a85347ef44f',
    );
  });

  it('applyTemplateToWebsite mengirim template_source: saved', async () => {
    const seen: Array<{ url: string; body: Record<string, unknown> }> = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      seen.push({ url: String(url), body: JSON.parse(String(init?.body ?? '{}')) });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }) as typeof fetch;

    try {
      const res = await applyTemplateToWebsite({ websiteId: 'w1', template: libraryTemplate() });
      expect(res.ok).toBe(true);
      expect(seen).toHaveLength(1);
      expect(seen[0].url).toBe('/api/websites/w1/website');
      // Tanpa penanda ini server lookup ke tabel `templates` → 404.
      expect(seen[0].body.template_source).toBe('saved');
      expect(seen[0].body.template_id).toBe('be6e2957-1d0f-4ef2-89ba-1a85347ef44f');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('applyTemplateToWebsite melaporkan error alih-alih diam-diam', async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: false, error: 'Template tidak ditemukan' }), {
        status: 404,
      })) as typeof fetch;
    try {
      const res = await applyTemplateToWebsite({ websiteId: 'w1', template: libraryTemplate() });
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Template tidak ditemukan');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

describe('deleteSavedTemplate: hapus template library', () => {
  const LIB = 'saved-3f2504e0-4f89-41d3-9a0c-0305e82c3301';

  it('menolak slug katalog sebelum menyentuh jaringan', async () => {
    // Slug katalog ('food') milik template AKTIF website. Kalau lolos ke
    // server tanpa validasi, user bisa menghapus desain yang sedang dipakai.
    const origFetch = globalThis.fetch;
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }) as typeof fetch;
    try {
      for (const bad of ['food', '', 'builtin-food', 'system-food', 'savedx']) {
        const res = await deleteSavedTemplate({ libraryId: bad });
        expect(res.ok, `"${bad}" harus ditolak`).toBe(false);
        expect(res.error).toBe('Template tidak valid');
      }
      expect(called, 'validasi harus terjadi sebelum fetch').toBe(false);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('mengirim DELETE ke /api/templates dengan libraryId ter-encode', async () => {
    const seen: Array<{ url: string; method: string }> = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      seen.push({ url: String(url), method: String(init?.method ?? 'GET') });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }) as typeof fetch;
    try {
      const res = await deleteSavedTemplate({ libraryId: LIB });
      expect(res.ok).toBe(true);
      expect(seen).toHaveLength(1);
      expect(seen[0].method).toBe('DELETE');
      expect(seen[0].url).toBe(`/api/templates?libraryId=${LIB}`);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('meneruskan pesan error server (mis. 404 "Template tidak ditemukan")', async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: false, error: 'Template tidak ditemukan' }), {
        status: 404,
      })) as typeof fetch;
    try {
      const res = await deleteSavedTemplate({ libraryId: LIB });
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Template tidak ditemukan');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('menangkap error jaringan alih-alih melempar ke UI', async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error('Network down');
    }) as typeof fetch;
    try {
      const res = await deleteSavedTemplate({ libraryId: LIB });
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Network down');
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});

describe('REGRESI: endpoint DELETE /api/templates wajib aman', () => {
  /** RLS dimatikan di 026 — seluruh scoping hanya bisa rely pada filter query. */
  const route = () => repoFile('app', 'api', 'templates', 'route.ts');

  it('hanya boleh menghapus baris is_library milik user sendiri', () => {
    const src = route();
    expect(src).toContain('export async function DELETE');
    // Prefix `saved-` = aset library; tanpa filter ini template aktif bisa
    // ikut terhapus dan website kehilangan config-nya.
    expect(src).toContain('isLibrarySlug(libraryId)');
    expect(src).toContain('.eq("user_id", userId)');
    expect(src).toContain('.eq("is_library", true)');
  });

  it('tidak memakai service-role untuk hapus (harus ikut sesi user)', () => {
    const block = route().slice(route().indexOf('export async function DELETE'));
    expect(block).not.toContain('createServiceSupabaseClient');
    expect(block).toContain('createServerSupabaseClient');
  });

  it('kedua tempat menampilkan library punya aksi hapus', () => {
    // Tanpa tombol di kedua tempat, user tidak bisa menghapus template yang
    // baru saja ia simpan — persis keluhan yang dilaporkan.
    //
    // Bentuk implementasinya berbeda dan itu disengaja:
    //   - builder-sidebar menyimpan logic (pakai deleteSavedTemplate),
    //   - template-picker memanggil helper itu langsung (halaman /web-design
    //     tidak lewat builder, jadi tidak ada sidebar di antaranya).
    const sidebar = repoFile('src', 'components', 'builder', 'builder-sidebar.tsx');
    expect(sidebar, 'sidebar harus memanggil deleteSavedTemplate').toContain('deleteSavedTemplate');
    expect(sidebar).toContain('onDeleteSaved');

    for (const parts of [
      ['src', 'components', 'builder', 'template-gallery.tsx'],
      ['src', 'components', 'customize', 'template-picker.tsx'],
    ]) {
      const src = repoFile(...parts);
      expect(src, `${parts.join('/')} harus punya tombol hapus`).toContain('Trash2');
      expect(src, `${parts.join('/')} harus konfirmasi sebelum hapus`).toContain('Hapus template tersimpan?');
    }
  });

  it('template bawaan (katalog) tidak punya tombol hapus', () => {
    // Tombol hanya dirender kalau `template.saved` ada; template katalog
    // tidak pernah punya entri itu sehingga tidak bisa dihapus dari UI.
    const gallery = repoFile('src', 'components', 'builder', 'template-gallery.tsx');
    expect(gallery).toContain('template.saved &&');
    // Server juga menolak: `isLibrarySlug('food')` = false.
    expect(route()).toContain('isLibrarySlug(libraryId)');
  });
});

describe('apply-template: resolve template statis', () => {
  it('id katalog food resolve ke template penuh dari kode', () => {
    const tpl = resolveStoreTemplate({
      id: 'food',
      name: 'Warung Makan',
      source: 'builtin',
      category: 'food',
      data: {},
    });
    expect(tpl?.id).toBe('food');
    expect(tpl!.sections.length).toBeGreaterThan(0);
    expect(tpl!.headers.length).toBeGreaterThan(0);
    expect(tpl!.footers.length).toBeGreaterThan(0);
  });

  it('prefix legacy builtin- dinormalisasi', () => {
    expect(resolveStoreTemplate({ id: 'builtin-food', data: {} })?.id).toBe('food');
  });

  it('id tak dikenal → undefined (bukan throw)', () => {
    expect(
      resolveStoreTemplate({ id: 'be6e2957-1d0f-4ef2-89ba-1a85347ef44f', data: {} }),
    ).toBeUndefined();
  });
});


describe('REGRESI: logika apply tidak boleh diduplikasi', () => {
  /**
   * Bug yang ditemukan: `TemplateGallery` punya 2 konsumen, logika apply-nya
   * diduplikasi, dan satu call site tertinggal (hanya `BUILT_IN_CATALOG.find`)
   * sehingga template library gagal dengan "Template not found in catalog".
   *
   * Guard ini supaya duplikasi tidak kembali diam-diam.
   */
  const callSites = [
    ['src', 'components', 'builder', 'builder-sidebar.tsx'],
    ['src', 'components', 'customize', 'template-picker.tsx'],
  ];

  it('kedua call site memakai applyTemplateToWebsite', () => {
    for (const parts of callSites) {
      const src = repoFile(...parts);
      expect(src, `${parts.join('/')} harus pakai applyTemplateToWebsite`).toContain(
        'applyTemplateToWebsite',
      );
    }
  });

  it('tidak ada call site yang menyusun payload PUT sendiri', () => {
    for (const parts of callSites) {
      const src = repoFileCode(...parts);
      // Pola payload lama = tanda duplikasi yang harus hilang.
      expect(src, `${parts.join('/')} jangan lagi bikin custom_config manual`).not.toContain(
        'palette_override:',
      );
      expect(src, `${parts.join('/')} jangan lagi hitung sections manual`).not.toContain(
        'applySectionAssets(',
      );
    }
  });

  it('tidak ada apply handler yang lookup template lewat BUILT_IN_CATALOG.find', () => {
    // Hanya pola yang JEBOK bug yang dilarang. `BUILT_IN_CATALOG.find` masih
    // sah dipakai untuk keperluan tampilan (menandai template yang sedang
    // aktif) — yang dilarang adalah memakainya untuk mencari template yang
    // akan di-apply, karena gagal untuk template library (id UUID).
    for (const parts of callSites) {
      const src = repoFileCode(...parts);
      expect(
        src,
        `${parts.join('/')} gagal untuk template library (UUID) bila apply lookup ke katalog`,
      ).not.toContain('BUILT_IN_CATALOG.find((t) => t.id === templateId)');
    }
  });

  it('template library tetap punya jalur ke store/kanvas di sidebar', () => {
    const src = repoFile('src', 'components', 'builder', 'builder-sidebar.tsx');
    // Tanpa ini, `applyTemplate()` diam-diam tidak berefek karena
    // `getTemplate()` hanya tahu template bawaan. Wajib lewat helper bersama
    // (berlaku untuk saved MAUPUN builtin — keduanya membawa template_data).
    expect(src).toContain('resolveStoreTemplate');
    expect(src).toContain('applyTemplate(result.templateId, storeTemplate)');
  });
});

describe('resolveStoreTemplate: lookup katalog statis', () => {
  it('id katalog + prefix legacy system- → template food', () => {
    const tpl = resolveStoreTemplate({
      ...libraryTemplate(),
      id: 'system-food',
      source: 'builtin',
    });
    expect(tpl).toBeDefined();
    expect(tpl!.id).toBe('food');
  });

  it('tanpa data + id tak dikenal → undefined (error UX lama preserved)', () => {
    expect(
      resolveStoreTemplate({ id: 'id-tak-dikenal', data: undefined as never }),
    ).toBeUndefined();
  });

  it('prefix legacy builtin- juga ter-strip', () => {
    const tpl = resolveStoreTemplate({
      ...libraryTemplate(),
      id: 'builtin-food',
      source: 'builtin',
    });
    expect(tpl?.id).toBe('food');
  });
});

