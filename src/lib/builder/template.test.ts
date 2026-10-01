import { describe, it, expect, afterEach } from 'vitest';
import { PANGKAS_RAPI_TEMPLATE } from './templates/pangkas-rapi';
import { getTemplate, getSectionType, getSectionVariant, getHeaderVariant, getFooterVariant } from './template-store';
import { migrateOldConfig, isOldConfig } from './migration';
import { HEADER_VARIANTS, isKnownHeaderVariant } from './chrome';
import { useTemplateStore } from './template-store';
import { BUILT_IN_CATALOG } from './templates/catalog';
import { applySectionAssets, assetsFor } from './template-assets';

describe('Template System', () => {
  it('should have Pangkas Rapi template', () => {
    expect(PANGKAS_RAPI_TEMPLATE.id).toBe('pangkas-rapi');
    expect(PANGKAS_RAPI_TEMPLATE.name).toContain('Pangkas Rapi');
  });

  it('should have 7 header variants (≥4 minimum)', () => {
    // Setiap template mewarisi set header yang sama dari PANGKAS_RAPI_TEMPLATE,
    // jadi 7 varian ini otomatis tersedia di kelima template.
    expect(PANGKAS_RAPI_TEMPLATE.headers.length).toBeGreaterThanOrEqual(4);
    expect(PANGKAS_RAPI_TEMPLATE.headers).toHaveLength(7);
    expect(PANGKAS_RAPI_TEMPLATE.headers.map((h) => h.id)).toEqual([
      'header-klasik',
      'header-melayang',
      'header-minimal',
      'header-hero',
      'header-split',
      'header-topbar',
      'header-kaca',
    ]);
  });

  it('semua layout header terdaftar di chrome registry & punya mockup', () => {
    for (const h of PANGKAS_RAPI_TEMPLATE.headers) {
      expect(isKnownHeaderVariant(h.layout), `layout "${h.layout}" tak terdaftar di chrome.ts`).toBe(true);
      expect(h.mockup, `${h.id}: mockup wajib diisi`).toMatch(/^header-/);
      // configFields minimal satu + defaultConfig harus punya isi.
      expect(h.configFields.length, `${h.id}: minimal 1 configField`).toBeGreaterThan(0);
      expect(Object.keys(h.defaultConfig).length, `${h.id}: defaultConfig tidak boleh kosong`).toBeGreaterThan(0);
    }
  });

  it('tujuh layout header yang diimplementasikan renderer', () => {
    // Guard agar renderer (site-header-shared.tsx) tidak tertinggal: daftar
    // layout di chrome registry harus persis 7 dan cocok dengan yang dirender.
    expect(HEADER_VARIANTS.map((v) => v.id).sort()).toEqual(
      ['floating', 'glass', 'hero-overlay', 'minimal', 'split-nav', 'standard', 'with-topbar'].sort(),
    );
  });

  /**
   * Kedalaman menu (1 atau 2 tingkat) diputuskan TEMPLATE, bukan renderer.
   *
   * Guard ini menjaga `maxNavDepth` tetap valid dan konsisten antar varian
   * header — kalau ada varian tanpa nilai (=1) bercampur dengan 2, sidebar
   * akan menampilkan form submenu yang tidak konsisten antar gaya header.
   */
  it('setiap varian header punya maxNavDepth valid (1 atau 2)', () => {
    for (const t of BUILT_IN_CATALOG) {
      for (const h of t.headers) {
        expect(
          h.maxNavDepth === 1 || h.maxNavDepth === 2,
          `${t.id}/${h.id}: maxNavDepth harus 1 atau 2 (dapat ${String(h.maxNavDepth)})`,
        ).toBe(true);
      }
      // Semua varian dalam satu template konsisten (campur 1 & 2 bikin
      // form berubah-ubah saat user ganti gaya header).
      const depths = new Set(t.headers.map((h) => h.maxNavDepth ?? 1));
      expect(depths.size, `${t.id}: maxNavDepth tidak konsisten antar varian header`).toBe(1);
    }
  });

  it('template declares maxNavDepth 2 hanya bila memang mendukung submenu', () => {
    // Pangkas Rapi & Warung Makan = usaha tunggal/service → 1 tingkat.
    for (const id of ['pangkas-rapi', 'warung-makan']) {
      const t = BUILT_IN_CATALOG.find((x) => x.id === id)!;
      expect(t.headers[0].maxNavDepth, `${id} seharusnya 1 tingkat`).toBe(1);
    }
    // Template katalog/retail → 2 tingkat.
    for (const id of ['butik-hijab', 'toko-kelontong', 'kerajinan-tangan']) {
      const t = BUILT_IN_CATALOG.find((x) => x.id === id)!;
      expect(t.headers[0].maxNavDepth, `${id} seharusnya 2 tingkat`).toBe(2);
    }
  });

  it('should have 6 footer variants', () => {
    expect(PANGKAS_RAPI_TEMPLATE.footers).toHaveLength(6);
    expect(PANGKAS_RAPI_TEMPLATE.footers.map((f) => f.id)).toEqual([
      'footer-satu-baris',
      'footer-kolom-aksen',
      'footer-brand-tengah',
      'footer-mini',
      'footer-newsletter',
      'footer-social',
    ]);
  });

  it('should have 18 section types', () => {
    expect(PANGKAS_RAPI_TEMPLATE.sections).toHaveLength(18);
  });

  it('should have at least 2 variants per section type', () => {
    for (const section of PANGKAS_RAPI_TEMPLATE.sections) {
      expect(section.variants.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have configFields for every variant', () => {
    for (const section of PANGKAS_RAPI_TEMPLATE.sections) {
      for (const variant of section.variants) {
        expect(variant.configFields).toBeDefined();
        expect(variant.configFields.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have mockup for every variant', () => {
    for (const section of PANGKAS_RAPI_TEMPLATE.sections) {
      for (const variant of section.variants) {
        expect(variant.mockup).toBeDefined();
        expect(variant.mockup.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have defaultConfig for every variant', () => {
    for (const section of PANGKAS_RAPI_TEMPLATE.sections) {
      for (const variant of section.variants) {
        expect(variant.defaultConfig).toBeDefined();
        expect(typeof variant.defaultConfig).toBe('object');
      }
    }
  });

  it('should have valid theme', () => {
    const { theme } = PANGKAS_RAPI_TEMPLATE;
    expect(theme.palette.primary).toBeDefined();
    expect(theme.palette.secondary).toBeDefined();
    expect(theme.palette.background).toBeDefined();
    expect(theme.typography.headingFont).toBeDefined();
    expect(theme.typography.bodyFont).toBeDefined();
    expect(theme.components.borderRadius).toBeDefined();
  });
});

describe('Template Store Helpers', () => {
  it('should get template by id', () => {
    const template = getTemplate('pangkas-rapi');
    expect(template).toBeDefined();
    expect(template?.id).toBe('pangkas-rapi');
  });

  it('should return undefined for unknown template', () => {
    const template = getTemplate('unknown');
    expect(template).toBeUndefined();
  });

  it('should get section type from template', () => {
    const sectionType = getSectionType(PANGKAS_RAPI_TEMPLATE, 'hero');
    expect(sectionType).toBeDefined();
    expect(sectionType?.type).toBe('hero');
  });

  it('should get section variant from template', () => {
    const variant = getSectionVariant(PANGKAS_RAPI_TEMPLATE, 'hero', 'hero-full');
    expect(variant).toBeDefined();
    expect(variant?.id).toBe('hero-full');
  });

  it('should get header variant with fallback', () => {
    const variant = getHeaderVariant(PANGKAS_RAPI_TEMPLATE, 'header-klasik');
    expect(variant).toBeDefined();
    expect(variant.id).toBe('header-klasik');

    const fallback = getHeaderVariant(PANGKAS_RAPI_TEMPLATE, 'unknown');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(PANGKAS_RAPI_TEMPLATE.headers[0].id);
  });

  it('should get footer variant with fallback', () => {
    const variant = getFooterVariant(PANGKAS_RAPI_TEMPLATE, 'footer-satu-baris');
    expect(variant).toBeDefined();
    expect(variant.id).toBe('footer-satu-baris');

    const fallback = getFooterVariant(PANGKAS_RAPI_TEMPLATE, 'unknown');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(PANGKAS_RAPI_TEMPLATE.footers[0].id);
  });
});

describe('Migration', () => {
  it('should detect old config', () => {
    const oldConfig = {
      design_style_id: 'minimalist',
      sections: [],
    };
    expect(isOldConfig(oldConfig)).toBe(true);
  });

  it('should detect new config', () => {
    const newConfig = {
      template_id: 'pangkas-rapi',
      header_variant_id: 'header-klasik',
      footer_variant_id: 'footer-satu-baris',
      sections: [],
    };
    expect(isOldConfig(newConfig)).toBe(false);
  });

  it('should migrate old config to new format', () => {
    const oldConfig = {
      design_style_id: 'minimalist',
      sections: [
        {
          id: 'old-1',
          type: 'hero',
          variant: 'hero-full',
          config: { headline: 'Test' },
          style: { padding: { top: 64, right: 24, bottom: 64, left: 24 }, background: 'transparent' },
          responsive: {},
        },
      ],
    };

    const migrated = migrateOldConfig(oldConfig) as { template_id: string; header_variant_id: string; footer_variant_id: string; sections: Array<{ type: string; variantId: string; config: Record<string, unknown> }> };
    expect(migrated.template_id).toBe('pangkas-rapi');
    expect(migrated.header_variant_id).toBeDefined();
    expect(migrated.footer_variant_id).toBeDefined();
    expect(Array.isArray(migrated.sections)).toBe(true);
    expect(migrated.sections).toHaveLength(1);
    expect(migrated.sections[0].type).toBe('hero');
    expect(migrated.sections[0].variantId).toBe('hero-full');
    expect(migrated.sections[0].config.headline).toBe('Test');
  });

  it('should handle empty sections in old config', () => {
    const oldConfig = {
      design_style_id: 'minimalist',
      sections: [],
    };

    const migrated = migrateOldConfig(oldConfig) as { sections: unknown[] };
    expect(migrated.sections).toEqual([]);
  });

  it('should map unknown section types to hero', () => {
    const oldConfig = {
      sections: [
        {
          id: 'old-1',
          type: 'unknown_type',
          variant: 'unknown-variant',
          config: {},
          style: {},
          responsive: {},
        },
      ],
    };

    const migrated = migrateOldConfig(oldConfig) as { sections: Array<{ type: string }> };
    expect(migrated.sections[0].type).toBe('hero');
  });
});

/**
 * Regression: "ganti template" dulu mengosongkan kanvas (setTemplate → sections
 * = []), jadi user kehilangan semua section. applyTemplate() harus mengisi
 * section bawaan + aset foto per-bisnis, dan bisa di-undo.
 */
describe('applyTemplate — isi konten bawaan template', () => {
  const original = useTemplateStore.getState();

  afterEach(() => {
    // Kembalikan state store agar test tidak saling memengaruhi.
    useTemplateStore.setState({ ...original, past: [], future: [] });
  });

  it('setTemplate tetap mengosongkan (dipakai saat load/seed halaman)', () => {
    useTemplateStore.getState().setTemplate('warung-makan');
    expect(useTemplateStore.getState().sections).toHaveLength(0);
  });

  it('applyTemplate mengisi kanvas dengan section bawaan template', () => {
    for (const t of BUILT_IN_CATALOG) {
      useTemplateStore.getState().applyTemplate(t.id);
      const state = useTemplateStore.getState();
      expect(state.template.id, `${t.id}: template tidak berganti`).toBe(t.id);
      expect(state.sections.length, `${t.id}: kanvas kosong setelah apply`).toBeGreaterThan(0);
      // Tiap section punya id unik supaya React key & DOM valid.
      expect(new Set(state.sections.map((s) => s.id)).size).toBe(state.sections.length);
      // Tandai belum tersimpan supaya user prompted menyimpan.
      expect(state.saved).toBe(false);
    }
  });

  it('applyTemplate menyuntikkan foto per-niche ke config section', () => {
    useTemplateStore.getState().applyTemplate('warung-makan');
    const sections = useTemplateStore.getState().sections;
    const withImage = sections.filter((s) => {
      const c = s.config as Record<string, unknown>;
      return typeof c.image === 'string' && c.image.startsWith('https://');
    });
    expect(withImage.length, 'tidak ada section yang dapat foto').toBeGreaterThan(0);
  });

  it('applyTemplate bisa di-undo (historyStores section lama)', () => {
    useTemplateStore.getState().setTemplate('pangkas-rapi');
    useTemplateStore.getState().addSection('hero', 'hero-full');
    const before = useTemplateStore.getState().sections.length;

    useTemplateStore.getState().applyTemplate('warung-makan');
    expect(useTemplateStore.getState().past.length).toBeGreaterThan(0);

    useTemplateStore.getState().undo();
    expect(useTemplateStore.getState().sections.length).toBe(before);
  });

  it('applySectionAssets tidak menimpa gambar yang sudah ada', () => {
    const custom = { image: 'https://cdn.toko-saya.com/foto.jpg' };
    const out = applySectionAssets(custom, 'food');
    expect(out.image).toBe('https://cdn.toko-saya.com/foto.jpg');
  });

  it('applySectionAssets mengisi items[] galeri tanpa menimpa yang terisi', () => {
    const out = applySectionAssets(
      { items: [{ title: 'A' }, { title: 'B', image: 'https://saya.com/b.jpg' }] },
      'food',
    );
    const items = out.items as Array<{ title: string; image?: string }>;
    expect(items[0].image).toMatch(/^https:\/\//);
    expect(items[1].image).toBe('https://saya.com/b.jpg');
  });

  it('assetsFor menolak niche tak dikenal (tidak crash)', () => {
    expect(assetsFor('toko-mobil')).toBeNull();
    expect(assetsFor(undefined)).toBeNull();
    expect(applySectionAssets({ title: 'x' }, 'toko-mobil')).toEqual({ title: 'x' });
  });
});
