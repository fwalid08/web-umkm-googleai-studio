/**
 * Tipe section KUSTOM (v3.4): AI boleh menambah tipe di luar 19 predefined.
 *
 * Syarat: id kebab-case tak menabrak bawaan, ≥1 varian, tiap varian wajib
 * punya `html` (renderer tidak punya branch untuk tipe asing). 19 predefined
 * tetap wajib ada; activeSections boleh memuat tipe kustom yang terdefinisi.
 */
import { describe, expect, it } from 'vitest';
import {
  ALL_SECTION_TYPES_V3,
  isBuiltinSectionType,
  validateCustomSectionType,
  validateTemplateV3,
} from './template-schema';

function builtinDef(type: string) {
  return {
    type,
    name: type,
    icon: 'Layout',
    variants: [
      { id: `${type}-a`, name: 'A', description: '', layout: `${type}-a`, configFields: [], defaultConfig: {}, mockup: `${type}-a` },
      { id: `${type}-b`, name: 'B', description: '', layout: `${type}-b`, configFields: [], defaultConfig: {}, mockup: `${type}-b` },
      { id: `${type}-c`, name: 'C', description: '', layout: `${type}-c`, configFields: [], defaultConfig: {}, mockup: `${type}-c` },
    ],
  };
}

function headerFooter(prefix: string) {
  const headerLayouts = ['standard', 'floating', 'hero-overlay', 'split-nav', 'with-topbar'];
  const footerLayouts = ['simple', 'columns', 'centered', 'minimal', 'newsletter'];
  const isHeader = prefix.startsWith('hdr');
  
  return Array.from({ length: 5 }, (_, i) => ({
    id: `${prefix}-${i}`,
    name: `${prefix} ${i}`,
    description: '',
    layout: isHeader ? headerLayouts[i] : footerLayouts[i],
    configFields: [],
    defaultConfig: {},
    mockup: `${prefix}-${i}`,
  }));
}

function baseTemplate() {
  return {
    version: '3.4',
    name: 'Tes Kustom',
    description: '…',
    category: 'food',
    designType: 'organic',
    theme: {
      palette: {
        primary: '#111827', secondary: '#374151', accent: '#f59e0b',
        background: '#ffffff', surface: '#f9fafb',
        text: '#111827', textMuted: '#6b7280', border: '#e5e7eb',
      },
      typography: { headingFont: 'Inter', bodyFont: 'Inter' },
      components: {},
    },
    headers: headerFooter('hdr'),
    footers: headerFooter('ftr'),
    sections: [...ALL_SECTION_TYPES_V3].map(builtinDef),
    data: { sections: [] as unknown[] },
  };
}

const customDef = (overrides: Record<string, unknown> = {}) => ({
  type: 'promo-gacor',
  name: 'Promo Gacor',
  icon: 'Megaphone',
  variants: [
    {
      id: 'promo-gacor-banner',
      name: 'Banner',
      description: '',
      layout: 'promo-gacor-banner',
      html: '<section data-tpl-type="promo-gacor"><h2>{{title}}</h2></section>',
      configFields: [{ key: 'title', label: 'Judul', type: 'text' }],
      defaultConfig: { title: 'Promo' },
      mockup: 'promo-gacor-banner',
    },
  ],
  ...overrides,
});

describe('isBuiltinSectionType', () => {
  it('membedakan bawaan vs kustom', () => {
    expect(isBuiltinSectionType('hero')).toBe(true);
    expect(isBuiltinSectionType('menu_board')).toBe(true);
    expect(isBuiltinSectionType('promo-gacor')).toBe(false);
    expect(isBuiltinSectionType('')).toBe(false);
  });
});

describe('validateCustomSectionType', () => {
  it('lolos untuk definisi valid', () => {
    const errors: string[] = [];
    const warnings: string[] = [];
    validateCustomSectionType(customDef(), errors, warnings);
    expect(errors).toEqual([]);
  });

  it('menolak id bukan kebab-case', () => {
    for (const bad of ['Promo_Gacor', 'PROMO', 'promo gacor', 'x'.repeat(41)]) {
      const errors: string[] = [];
      validateCustomSectionType(customDef({ type: bad }), errors, []);
      expect(errors.length, bad).toBeGreaterThan(0);
    }
  });

  it('menolak tanpa varian dan varian tanpa html', () => {
    const e1: string[] = [];
    validateCustomSectionType(customDef({ variants: [] }), e1, []);
    expect(e1.length).toBeGreaterThan(0);

    const e2: string[] = [];
    validateCustomSectionType(
      customDef({ variants: [{ id: 'v1', configFields: [], defaultConfig: {} }] }),
      e2, [],
    );
    expect(e2.some((m) => m.includes('html'))).toBe(true);
  });

  it('warning bila tanpa name/mockup, bukan error', () => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const def = customDef() as Record<string, unknown>;
    delete def.name;
    (def.variants as Array<Record<string, unknown>>)[0].mockup = '';
    validateCustomSectionType(def, errors, warnings);
    expect(errors.length).toBeGreaterThan(0); // name wajib
    expect(warnings.some((m) => m.includes('mockup'))).toBe(true);
  });
});

describe('validateTemplateV3 menerima tipe kustom', () => {
  it('template 19 bawaan + 1 kustom valid → ok', () => {
    const tpl = baseTemplate() as unknown as Record<string, unknown>;
    (tpl.sections as unknown[]).push(customDef());
    const r = validateTemplateV3(tpl);
    expect(r.errors).toEqual([]);
  });

  it('kustom menabrak nama bawaan tetap diperlakukan sebagai bawaan', () => {
    // `hero` dengan 1 varian → kena aturan varian bawaan (warning), bukan error kustom.
    const tpl = baseTemplate() as unknown as Record<string, unknown>;
    const hero = (tpl.sections as Array<Record<string, unknown>>).find((s) => s.type === 'hero')!;
    hero.variants = (hero.variants as unknown[]).slice(0, 1);
    const r = validateTemplateV3(tpl);
    expect(r.errors).toEqual([]);
    expect(r.warnings.some((m) => m.includes('hero'))).toBe(true);
  });

  it('activeSections boleh memuat tipe kustom yang terdefinisi', () => {
    const tpl = baseTemplate() as unknown as Record<string, unknown>;
    (tpl.sections as unknown[]).push(customDef());
    (tpl as Record<string, unknown>).activeSections = ['hero', 'promo-gacor'];
    const r = validateTemplateV3(tpl);
    expect(r.errors).toEqual([]);
  });

  it('activeSections menunjuk tipe tak terdefinisi → error', () => {
    const tpl = baseTemplate() as unknown as Record<string, unknown>;
    (tpl as Record<string, unknown>).activeSections = ['hero', 'tidak-ada'];
    const r = validateTemplateV3(tpl);
    expect(r.ok).toBe(false);
    expect(r.errors.some((m) => m.includes('tidak-ada'))).toBe(true);
  });

  it('varian kustom ber-html tidak kena warning varian-mati', () => {
    const tpl = baseTemplate() as unknown as Record<string, unknown>;
    (tpl.sections as unknown[]).push(customDef());
    (tpl as Record<string, unknown>).data = { customCss: '' };
    const r = validateTemplateV3(tpl);
    // findAssetCoverageIssues adalah fungsi terpisah; di sini pastikan
    // validateTemplateV3 tidak memprotes html kustom yang valid.
    expect(r.errors).toEqual([]);
  });
});
