/**
 * Regresi crash preview: "Objects are not valid as a React child
 * (found: object with keys {text})" di `PricingSection`.
 *
 * Kontrak kanonis `pricing.items[].features` adalah `string[]`, tapi template
 * hasil AI/ZIP kadang mengisi objek (`{text}`/`{v}`) karena `ConfigField`
 * tidak punya tipe "list of strings". Tanpa normalisasi, satu section
 * merobohkan SELURUH halaman (preview putih).
 *
 * `PricingSection` wajib menormalisasi kedua bentuk (pola yang sama dipakai
 * `MarqueeSection`: string | {text}).
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { BENGKEL_TEMPLATE } from './templates/bengkel';
import type { DesignStyle, Section } from './types';

const tpl = BENGKEL_TEMPLATE as unknown as {
  theme: {
    palette: DesignStyle['palette'];
    typography: DesignStyle['typography'];
    components: DesignStyle['components'];
  };
};

const designStyle: DesignStyle = {
  id: 'pricing-test',
  name: 'Pricing',
  description: 'Uji ketahanan pricing',
  palette: tpl.theme.palette,
  typography: tpl.theme.typography,
  components: tpl.theme.components,
  effects: {},
  thumbnailUrl: '',
};

function renderPricing(features: unknown[]): string {
  const section: Section = {
    id: 'pricing-test',
    type: 'pricing',
    variant: 'pricing-3tier',
    config: {
      title: 'Paket',
      items: [{ name: 'Reguler', price: 'Rp 25rb', features }],
    },
    style: {
      padding: { top: 64, right: 24, bottom: 64, left: 24 },
      background: 'transparent',
    },
    responsive: {},
  };
  return renderToStaticMarkup(createElement(SectionRenderer, { section, designStyle }));
}

describe('PricingSection tahan bentuk features non-kanonis', () => {
  it('features string[] (kanonis) tetap render', () => {
    const html = renderPricing(['Ganti oli', 'Cek rem']);
    expect(html).toContain('Ganti oli');
    expect(html).toContain('Cek rem');
  });

  it('features objek {text} (hasil AI) tidak crash', () => {
    const html = renderPricing([{ text: 'Ganti oli' }, { text: 'Cek rem' }]);
    expect(html).toContain('Ganti oli');
    expect(html).toContain('Cek rem');
  });

  it('features objek {v} (konvensi FEATURES_F) tidak crash', () => {
    const html = renderPricing([{ v: 'Ganti oli' }]);
    expect(html).toContain('Ganti oli');
  });

  it('features campuran string + objek + sampah tidak crash', () => {
    const html = renderPricing(['Ganti oli', { text: 'Cek rem' }, null, 42, {}]);
    expect(html).toContain('Ganti oli');
    expect(html).toContain('Cek rem');
  });
});
