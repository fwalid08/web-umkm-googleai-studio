import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BUILT_IN_CATALOG } from './templates/catalog';
import { getSectionVariant } from './template-store';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { SiteHeader, type HeaderPalette } from '@/components/builder/site-header-shared';
import { SiteFooter, type FooterPalette } from '@/components/builder/site-footer-shared';
import type { Section, DesignStyle } from './types';

function buildAuditSection(
  type: string,
  v: { id: string; defaultConfig?: Record<string, unknown>; defaultStyle?: Record<string, unknown> },
): Section {
  const style = (v.defaultStyle ?? {}) as Record<string, unknown>;
  const padding = (style.padding ?? {}) as Record<string, unknown>;
  const pickNum = (n: unknown, fallback: number): number => (typeof n === 'number' ? n : fallback);
  const bg = style.background;
  return {
    id: `audit-${type}-${v.id}`,
    type: type as Section['type'],
    variant: v.id,
    config: { ...((v.defaultConfig ?? {}) as Record<string, unknown>) },
    style: {
      padding: {
        top: pickNum(padding.top, 48),
        right: pickNum(padding.right, 24),
        bottom: pickNum(padding.bottom, 48),
        left: pickNum(padding.left, 24),
      },
      background:
        bg === 'color' || bg === 'image' || bg === 'gradient' || bg === 'transparent'
          ? bg
          : ('transparent' as const),
      ...(typeof style.backgroundColor === 'string' ? { backgroundColor: style.backgroundColor } : {}),
      ...(typeof style.backgroundImage === 'string' ? { backgroundImage: style.backgroundImage } : {}),
      ...(typeof style.backgroundGradient === 'string' ? { backgroundGradient: style.backgroundGradient } : {}),
    },
    responsive: {},
    anchorId: `audit-${v.id}`,
  };
}

function renderAudit(section: Section, designStyle: DesignStyle): string {
  return renderToStaticMarkup(createElement(SectionRenderer, { section, designStyle }));
}

describe('section variants render parity', () => {
  it('every variant resolves and renders real markup', () => {
    const problems: string[] = [];
    let count = 0;
    for (const t of BUILT_IN_CATALOG) {
      const designStyle: DesignStyle = {
        id: t.id,
        name: t.name,
        description: t.description,
        palette: t.theme.palette,
        typography: t.theme.typography,
        components: t.theme.components,
        effects: t.theme.effects || {},
        thumbnailUrl: '',
      };
      for (const st of t.sections) {
        for (const v of st.variants) {
          count++;
          const resolved = getSectionVariant(t, st.type, v.id);
          if (!resolved) problems.push(`${t.id}/${st.type}/${v.id}: getSectionVariant null`);
          if (!v.layout) problems.push(`${t.id}/${st.type}/${v.id}: layout kosong`);
          if (!v.mockup) problems.push(`${t.id}/${st.type}/${v.id}: mockup kosong`);
          if (!v.configFields || v.configFields.length === 0) problems.push(`${t.id}/${st.type}/${v.id}: configFields kosong`);
          const section = buildAuditSection(st.type, v);
          try {
            const html = renderAudit(section, designStyle);
            if (html.length < 50) problems.push(`${t.id}/${st.type}/${v.id}: markup terlalu pendek (${html.length})`);
            if (html.includes(`Section: ${st.type}`)) problems.push(`${t.id}/${st.type}/${v.id}: jatuh ke fallback unknown`);
            if (!html.includes(`id="audit-${v.id}"`)) problems.push(`${t.id}/${st.type}/${v.id}: anchorId tidak ter-render`);
          } catch (e) {
            problems.push(`${t.id}/${st.type}/${v.id}: throw ${(e as Error).message}`);
          }
        }
      }
    }
    console.log(`CHECKED=${count}`);
    if (problems.length > 0) console.log(problems.join('\n'));
    expect(problems).toEqual([]);
  });

  it('variants within one type render distinct markup', () => {
    const problems: string[] = [];
    // Satu template cukup: definisi varian dibagikan antar template turunan.
    const t = BUILT_IN_CATALOG[0];
    const designStyle: DesignStyle = {
      id: t.id,
      name: t.name,
      description: t.description,
      palette: t.theme.palette,
      typography: t.theme.typography,
      components: t.theme.components,
      effects: t.theme.effects || {},
      thumbnailUrl: '',
    };
    for (const st of t.sections) {
      if (st.variants.length < 2) continue;
      const seen = new Map<string, string>();
      for (const v of st.variants) {
        const html = renderAudit(buildAuditSection(st.type, v), designStyle);
        for (const [otherId, otherHtml] of seen) {
          if (otherHtml === html) {
            problems.push(`${st.type}: ${v.id} identik dengan ${otherId}`);
          }
        }
        seen.set(v.id, html);
      }
    }
    if (problems.length > 0) console.log(problems.join('\n'));
    expect(problems).toEqual([]);
  });
});

describe('teks memakai warna parent langsungnya (bukan section)', () => {
  const ds: DesignStyle = {
    id: 'audit-dark',
    name: 'Audit Dark',
    description: '',
    palette: {
      primary: '#00A3FF',
      secondary: '#00E5FF',
      accent: '#FF6B35',
      background: '#ffffff',
      surface: '#0F172A',
      text: '#E0F2FE',
      textMuted: '#94A3B8',
      border: '#1E293B',
    },
    typography: {
      headingFont: 'Inter',
      bodyFont: 'Inter',
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 8,
      buttonStyle: 'solid',
      shadowStyle: 'md',
      navStyle: 'solid',
      footerStyle: 'simple',
    },
    effects: {},
    thumbnailUrl: '',
  };
  const mk = (type: Section['type'], variant: string, config: Record<string, unknown>): string => {
    const section: Section = {
      id: `audit-${variant}`,
      type,
      variant,
      config,
      style: {
        padding: { top: 48, right: 24, bottom: 48, left: 24 },
        background: 'color',
        backgroundColor: '#ffffff',
      },
      responsive: {},
      anchorId: `audit-${variant}`,
    };
    return renderToStaticMarkup(createElement(SectionRenderer, { section, designStyle: ds }));
  };

  it('hero-card: judul memakai warna-vs-kartu', () => {
    const html = mk('hero', 'hero-card', { headline: 'Halo', subheadline: 'Sub', cta_text: 'OK' });
    expect(html).toContain('var(--color-text)');
    expect(html).not.toContain('var(--color-on-section)');
  });

  it('hero-video: judul putih eksplisit di blok gelap', () => {
    const html = mk('hero', 'hero-video-bg', { headline: 'Halo', subheadline: 'Sub' });
    expect(html).toContain('#ffffff');
    expect(html).not.toContain('var(--color-on-section)');
  });

  it('video-bg: judul putih eksplisit di blok gelap', () => {
    const html = mk('video', 'video-bg', { title: 'Vid', url: '' });
    expect(html).toContain('#ffffff');
    expect(html).not.toContain('var(--color-on-section)');
  });
});

/**
 * Submenu navigasi (dropdown 1 level).
 *
 * Regression: `site-header-shared.tsx` (renderer yang dipakai kanvas DAN live
 * site) sebelumnya merender nav datar — `children` diabaikan, sehingga menu
 * bertingkat hasil editing user tidak pernah tampil. Dukungan `children`
 * hanya ada di `site-header.tsx` yang dead code.
 */
describe('header submenu (dropdown 1 level)', () => {
  const palette: HeaderPalette = {
    primary: '#0f766e',
    secondary: '#115e59',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
  };

  const render = (config: Record<string, unknown>) =>
    renderToStaticMarkup(
      createElement(SiteHeader, {
        variant: { id: 'header-klasik', name: 'Klasik', layout: 'standard' },
        config,
        palette,
        radius: 8,
      }),
    );

  const nav = (children: Array<Record<string, unknown>>) => ({
    siteTitle: 'Toko Saya',
    navItems: [
      { id: 'n1', label: 'Katalog', url: '#katalog', enabled: true },
      {
        id: 'n2',
        label: 'Layanan',
        url: '#layanan',
        enabled: true,
        children,
      },
    ],
    ctaText: 'WA',
    ctaLink: '#',
    showCta: false,
  });

  it('link tanpa anak tetap dirender sebagai <a> biasa', () => {
    const html = render(nav([]));
    expect(html).toContain('Katalog');
    expect(html).toContain('Layanan');
    // Tidak ada chevron/popup karena tidak punya anak aktif.
    expect(html).not.toContain('aria-haspopup="true"');
  });

  it('link dengan anak aktif jadi dropdown: anak link + chevron', () => {
    const html = render(
      nav([
        { id: 'c1', label: 'Potong Rambut', url: '#potong', enabled: true },
        { id: 'c2', label: 'Pijat', url: '#pijat', enabled: true },
      ]),
    );
    // Induk menandai dirinya sebagai popup.
    expect(html).toContain('aria-haspopup="true"');
    // Kedua anak ikut ter-render sebagai link.
    expect(html).toContain('Potong Rambut');
    expect(html).toContain('#potong');
    expect(html).toContain('Pijat');
    expect(html).toContain('#pijat');
  });

  it('anak disabled disembunyikan dan tidak memaksa dropdown', () => {
    const withDisabled = render(
      nav([
        { id: 'c1', label: 'Aktif', url: '#a', enabled: true },
        { id: 'c2', label: 'Mati', url: '#m', enabled: false },
      ]),
    );
    expect(withDisabled).toContain('Aktif');
    expect(withDisabled).not.toContain('Mati');
    // Karena masih ada 1 anak aktif → tetap dropdown.
    expect(withDisabled).toContain('aria-haspopup="true"');

    // Semua anak disabled → induk jadi link biasa, bukan dropdown kosong.
    const allDisabled = render(
      nav([{ id: 'c1', label: 'Mati Semua', url: '#m', enabled: false }]),
    );
    expect(allDisabled).not.toContain('Mati Semua');
    expect(allDisabled).not.toContain('aria-haspopup="true"');
  });

  it('induk disabled tidak muncul walau punya anak', () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeader, {
        variant: { id: 'header-klasik', name: 'Klasik', layout: 'standard' },
        config: {
          siteTitle: 'Toko Saya',
          navItems: [
            { id: 'x', label: 'Induk Mati', url: '#x', enabled: false, children: [{ id: 'y', label: 'Anak', url: '#y', enabled: true }] },
          ],
        },
        palette,
        radius: 8,
      }),
    );
    expect(html).not.toContain('Induk Mati');
    expect(html).not.toContain('Anak');
  });
});

/**
 * Footer — kontrak konten wajib.
 *
 * Brand (logo & nama) + copyright = INTI → selalu tampil, tanpa toggle.
 * Navigasi + sosmed = opsional → punya toggle show/hide.
 * Layout kolom memakai `navGroups` (grup), inline memakai `navItems` datar.
 */
describe('footer kontrak konten', () => {
  const palette: FooterPalette = {
    primary: '#0f766e',
    secondary: '#115e59',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
  };

  const render = (layout: string, config: Record<string, unknown>) =>
    renderToStaticMarkup(
      createElement(SiteFooter, {
        variant: { id: 'f', name: 'F', layout },
        config,
        palette,
        radius: 8,
      }),
    );

  const base = {
    siteTitle: 'Toko Saya',
    text: '© 2026 Toko Saya',
    showNav: true,
    showSocial: true,
    navItems: [{ id: 'n1', label: 'Katalog', url: '#katalog' }],
  };

  it('brand + copyright SELALU tampil walau nav & sosmed dimatikan', () => {
    const html = render('simple', { ...base, showNav: false, showSocial: false });
    // Inti footer tidak punya toggle.
    expect(html).toContain('Toko Saya');
    expect(html).toContain('© 2026 Toko Saya');
    // Yang dimatikan benar-benar hilang.
    expect(html).not.toContain('Katalog');
    expect(html).not.toContain('>IG<');
  });

  it('inline: nav datar tampil, showNav=false menyembunyikannya', () => {
    const on = render('simple', base);
    expect(on).toContain('Katalog');
    const off = render('simple', { ...base, showNav: false });
    expect(off).not.toContain('Katalog');
    // Copyright tetap ada meski nav dimatikan.
    expect(off).toContain('© 2026 Toko Saya');
  });

  it('kolom: navGroups dirender per grup dengan judulnya', () => {
    const html = render('columns', {
      ...base,
      navGroups: [
        { id: 'g1', title: 'Produk', items: [{ id: 'a', label: 'Katalog', url: '#k' }] },
        { id: 'g2', title: 'Bantuan', items: [{ id: 'b', label: 'Pengiriman', url: '#p' }] },
      ],
    });
    expect(html).toContain('Produk');
    expect(html).toContain('Bantuan');
    expect(html).toContain('Katalog');
    expect(html).toContain('Pengiriman');
  });

  it('kolom: kontak (alamat/telepon/email) tampil bila diisi', () => {
    const html = render('columns', {
      ...base,
      address: 'Jl. Merdeka No. 12',
      phone: '0812-3456-7890',
      email: 'halo@toko.id',
    });
    expect(html).toContain('Jl. Merdeka No. 12');
    expect(html).toContain('0812-3456-7890');
    expect(html).toContain('halo@toko.id');
  });

  it('kolom: blok kontak TIDAK muncul bila semua kosong', () => {
    const html = render('columns', base);
    expect(html).not.toContain('Kontak');
  });

  it('grup kosong atau item disabled tidak membuat kolom kosong', () => {
    const html = render('columns', {
      ...base,
      navGroups: [
        { id: 'g1', title: 'Kosong', items: [] },
        { id: 'g2', title: 'Mati', items: [{ id: 'x', label: 'Mati', url: '#m', enabled: false }] },
      ],
    });
    expect(html).not.toContain('Kosong');
    expect(html).not.toContain('Mati');
    // Inti footer tetap aman.
    expect(html).toContain('Toko Saya');
  });

  it('copyright diganti tahun berjalan dari {year}', () => {
    const html = render('simple', { ...base, text: '© {year} Toko Saya' });
    expect(html).toContain(String(new Date().getFullYear()));
    expect(html).not.toContain('{year}');
  });
});
