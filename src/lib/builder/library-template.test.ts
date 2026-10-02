/**
 * Regresi: template library tampil seperti template bawaan.
 *
 * Dulu preview & apply meminjam blueprint (`BUILTIN_TEMPLATES[0]`) untuk
 * SELURUH theme + katalog — font, radius, tombol, varian, defaultStyle, dan
 * customCss milik template import dibuang; hanya palet + teks yang selamat.
 * `buildLibraryTemplate` membaca semuanya dari `template_data` sendiri.
 */
import { describe, expect, it } from 'vitest';
import {
  buildLibraryTemplate,
  pickLibraryFooterVariant,
  pickLibraryHeaderVariant,
} from './library-template';
import { BUILTIN_TEMPLATES } from './template-store';

const blueprint = BUILTIN_TEMPLATES[0];

function mockRow() {
  return {
    id: 'uuid-1',
    name: 'Kilau Laundry',
    description: 'Template laundry',
    template_data: {
      version: '3.0',
      name: 'Kilau Laundry',
      category: 'services',
      designType: 'tech',
      theme: {
        palette: {
          primary: '#111111',
          secondary: '#222222',
          accent: '#333333',
          background: '#ffffff',
          surface: '#f5f5f5',
          text: '#111111',
          textMuted: '#666666',
          border: '#e5e5e5',
        },
        typography: {
          headingFont: 'Space Grotesk',
          bodyFont: 'DM Sans',
          baseSize: 16,
          scaleRatio: 1.25,
          headingWeight: 700,
          bodyWeight: 400,
        },
        components: {
          borderRadius: 14,
          buttonStyle: 'solid',
          shadowStyle: 'sm',
          navStyle: 'solid',
          footerStyle: 'columns',
        },
        effects: { borderWidth: 1 },
      },
      headers: [
        {
          id: 'kl-hdr-1',
          name: 'Satu',
          description: '',
          layout: 'standard',
          mockup: 'header-standard',
          configFields: [{ key: 'siteTitle', label: 'Nama', type: 'text' }],
          defaultConfig: { siteTitle: 'Kilau' },
        },
      ],
      footers: [
        {
          id: 'kl-ftr-1',
          name: 'Satu',
          description: '',
          layout: 'columns',
          mockup: 'footer-columns',
          configFields: [],
          defaultConfig: {},
        },
      ],
      sections: [
        {
          type: 'hero',
          name: 'Hero',
          icon: 'Layout',
          variants: [
            {
              id: 'hero-panggung',
              name: 'Panggung',
              description: '',
              layout: 'hero-full',
              mockup: 'hero-full',
              html: '<section><h1>{{headline}}</h1></section>',
              configFields: [{ key: 'headline', label: 'Judul', type: 'text' }],
              defaultConfig: { headline: 'Laundry' },
              defaultStyle: {
                padding: { top: 100, right: 24, bottom: 100, left: 24 },
                background: 'color',
                backgroundColor: 'theme:primary',
              },
            },
          ],
        },
      ],
      activeSections: ['hero'],
      data: {
        designStyleId: 'flat',
        paletteOverride: { primary: '#111111' },
        customCss: '.x{color:red}',
        sections: [{ type: 'hero', variant: 'hero-panggung', config: { headline: 'Hai' } }],
        header: { variant: 'kl-hdr-1' },
        footer: { style: 'columns' },
      },
      animations: [{ id: 'a1' }],
      behaviours: [],
      customCss: '.y{color:blue}',
    },
  };
}

describe('buildLibraryTemplate memakai milik template sendiri', () => {
  it('theme utuh (tipografi/komponen/efek) bukan milik blueprint', () => {
    const t = buildLibraryTemplate(
      (mockRow().template_data ?? {}) as Record<string, unknown>,
      { id: 'uuid-1', name: 'Kilau Laundry' },
    );
    expect(t.theme.typography.headingFont).toBe('Space Grotesk');
    expect(t.theme.typography.bodyFont).toBe('DM Sans');
    expect(t.theme.components.borderRadius).toBe(14);
    expect(t.theme.components.buttonStyle).toBe('solid');
    expect(t.designType).toBe('tech');
    // Blueprint pangkas-rapi memakai nilai berbeda — guard regresi.
    expect(t.theme.typography.headingFont).not.toBe(blueprint.theme.typography.headingFont);
  });

  it('katalog headers/footers/sections milik sendiri', () => {
    const t = buildLibraryTemplate(
      (mockRow().template_data ?? {}) as Record<string, unknown>,
      { id: 'uuid-1', name: 'Kilau Laundry' },
    );
    expect(t.headers.map((h) => h.id)).toEqual(['kl-hdr-1']);
    expect(t.footers.map((f) => f.id)).toEqual(['kl-ftr-1']);
    expect(t.sections.map((s) => s.type)).toEqual(['hero']);
    expect(t.sections[0].variants[0].html).toContain('{{headline}}');
    expect(t.activeSections).toEqual(['hero']);
  });

  it('customCss milik template ikut (bukan string kosong blueprint)', () => {
    const t = buildLibraryTemplate(
      (mockRow().template_data ?? {}) as Record<string, unknown>,
      { id: 'uuid-1', name: 'Kilau Laundry' },
    );
    expect((t as { customCss?: string }).customCss).toBe('.y{color:blue}');
  });

  it('fallback ke blueprint bila kunci hilang (template lama/v2)', () => {
    const t = buildLibraryTemplate(
      { theme: { palette: { primary: '#000000' } }, data: {} },
      { id: 'x', name: 'Lama' },
    );
    expect(t.headers.length).toBe(blueprint.headers.length);
    expect(t.sections.length).toBe(blueprint.sections.length);
    expect(t.theme.palette.primary).toBe('#000000');
    expect(t.theme.typography.headingFont).toBe(blueprint.theme.typography.headingFont);
  });

  it('pick varian: id dulu, lalu layout, lalu pertama', () => {
    const t = buildLibraryTemplate(
      (mockRow().template_data ?? {}) as Record<string, unknown>,
      { id: 'uuid-1', name: 'Kilau Laundry' },
    );
    expect(pickLibraryHeaderVariant(t, 'kl-hdr-1').id).toBe('kl-hdr-1');
    expect(pickLibraryHeaderVariant(t, 'standard').id).toBe('kl-hdr-1');
    expect(pickLibraryHeaderVariant(t, 'tak-ada').id).toBe('kl-hdr-1');
    expect(pickLibraryFooterVariant(t, 'columns').id).toBe('kl-ftr-1');
  });
});
