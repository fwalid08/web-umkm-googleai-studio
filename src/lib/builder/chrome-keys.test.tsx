/**
 * Regresi warning React: Each child in a list should have a unique "key" prop
 * di `SiteFooter`/`SiteHeader`/`MobileDrawer`.
 *
 * Template AI/ZIP kadang mengisi nav `id` kosong atau duplikat — key murni
 * `item.id` memicu warning (dan risiko reconciliasi salah). Semua renderer
 * chrome memakai `navKey(id, index)` sehingga unik meski id hilang/kembar.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SiteFooter } from '@/components/builder/site-footer-shared';
import { SiteHeader } from '@/components/builder/site-header-shared';

const palette = {
  primary: '#111827',
  secondary: '#374151',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
  textMuted: '#6b7280',
  border: '#e5e7eb',
};

// Nav ala template AI: id duplikat + tanpa id.
const dupeNav = [
  { id: 'n1', label: 'Layanan', url: '#layanan', enabled: true },
  { id: 'n1', label: 'Harga', url: '#harga', enabled: true },
  { label: 'Kontak', url: '#kontak', enabled: true },
];

describe('chrome renderer tahan nav id duplikat/kosong', () => {
  it('SiteFooter simple merender semua item', () => {
    const html = renderToStaticMarkup(
      createElement(SiteFooter, {
        variant: { id: 'f', name: 'F', layout: 'simple' },
        config: { text: '© {year} Toko', navItems: dupeNav, showNav: true },
        palette,
        radius: 8,
      }),
    );
    expect(html).toContain('Layanan');
    expect(html).toContain('Harga');
    expect(html).toContain('Kontak');
  });

  it('SiteFooter columns merender semua grup + item', () => {
    const html = renderToStaticMarkup(
      createElement(SiteFooter, {
        variant: { id: 'f', name: 'F', layout: 'columns' },
        config: {
          text: '© {year} Toko',
          showNav: true,
          navGroups: [
            { title: 'G1', items: dupeNav },
            { title: 'G1', items: [{ id: 'x', label: 'Bantuan', url: '#bantuan' }] },
          ],
        },
        palette,
        radius: 8,
      }),
    );
    expect(html).toContain('Bantuan');
    expect(html.match(/Layanan/g)?.length).toBe(1);
  });

  it('SiteHeader standard merender semua item', () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeader, {
        variant: { id: 'h', name: 'H', layout: 'standard' },
        config: { siteTitle: 'Toko', navItems: dupeNav, showCta: false },
        palette,
        radius: 8,
      }),
    );
    expect(html).toContain('Layanan');
    expect(html).toContain('Harga');
    expect(html).toContain('Kontak');
  });
});
