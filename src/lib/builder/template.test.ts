import { describe, it, expect } from 'vitest';
import { PANGKAS_RAPI_TEMPLATE } from './templates/pangkas-rapi';
import { getTemplate, getSectionType, getSectionVariant, getHeaderVariant, getFooterVariant } from './template-store';
import { migrateOldConfig, isOldConfig } from './migration';

describe('Template System', () => {
  it('should have Pangkas Rapi template', () => {
    expect(PANGKAS_RAPI_TEMPLATE.id).toBe('pangkas-rapi');
    expect(PANGKAS_RAPI_TEMPLATE.name).toContain('Pangkas Rapi');
  });

  it('should have 4 header variants', () => {
    expect(PANGKAS_RAPI_TEMPLATE.headers).toHaveLength(4);
    expect(PANGKAS_RAPI_TEMPLATE.headers.map((h) => h.id)).toEqual([
      'header-klasik',
      'header-melayang',
      'header-minimal',
      'header-hero',
    ]);
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
