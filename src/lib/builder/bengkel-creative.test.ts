/**
 * BUKTI bahwa lever "kreativitas" yang dipakai template bengkel benar-benar
 * bekerja — bukan sekadar kelihatan promising di data.
 *
 * Dua hal yang diuji di sini tidak pernah disentuh template bawaan mana pun
 * (`grep "style: {"` di enam template → 0, dan 0 template punya animasi):
 *  1. `style` per-section: gradasi, foto + overlay gelap + blur.
 *  2. Kontrak animasi: selector stagger benar-benar cocok dengan DOM yang
 *     di-render `SectionRenderer`, dan script-nya bertahan sanitasi.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { sanitizeBehaviourScript, sanitizeTemplateCss, MAX_TEMPLATE_CSS_LENGTH } from './behaviour-script';
import { BENGKEL_TEMPLATE } from './templates/bengkel';
import type { DesignStyle, Section } from './types';

const tpl = BENGKEL_TEMPLATE as unknown as {
  theme: {
    palette: DesignStyle['palette'];
    typography: DesignStyle['typography'];
    components: DesignStyle['components'];
  };
  data: {
    sections: Array<{
      type: string;
      variant: string;
      anchorId?: string;
      config?: Record<string, unknown>;
      style?: Record<string, unknown>;
    }>;
    header?: { navItems?: Array<{ label: string; url: string }> };
    customCss?: string;
  };
};

const designStyle: DesignStyle = {
  id: 'bengkel-test',
  name: 'Bengkel',
  description: 'Bengkel Industrial Noir',
  palette: tpl.theme.palette,
  typography: tpl.theme.typography,
  components: tpl.theme.components,
  effects: {},
  thumbnailUrl: '',
};

/** Render satu section bengkel dari seed aslinya (bukan config buatan). */
function renderSeed(match: (s: { type: string }) => boolean): string {
  const seed = tpl.data.sections.find(match);
  if (!seed) throw new Error('seed section tidak ditemukan');
  const section: Section = {
    id: 'seed',
    type: seed.type as Section['type'],
    variant: seed.variant,
    config: seed.config ?? {},
    style: {
      padding: { top: 64, right: 24, bottom: 64, left: 24 },
      background: 'transparent',
      ...(seed.style as Record<string, unknown>),
    } as Section['style'],
    responsive: {},
    anchorId: seed.anchorId,
  };
  return renderToStaticMarkup(createElement(SectionRenderer, { section, designStyle }));
}

/** Render section dengan `theme.effects` tertentu (untuk uji flag data-tpl-fx). */
function renderWithEffects(effects: DesignStyle['effects']): string {
  const seed = tpl.data.sections.find((s) => s.type === 'features');
  if (!seed) throw new Error('seed features tidak ditemukan');
  const section: Section = {
    id: 'seed',
    type: seed.type as Section['type'],
    variant: seed.variant,
    config: seed.config ?? {},
    style: {
      padding: { top: 64, right: 24, bottom: 64, left: 24 },
      background: 'transparent',
      ...(seed.style as Record<string, unknown>),
    } as Section['style'],
    responsive: {},
    anchorId: seed.anchorId,
  };
  const styleWithEffects: DesignStyle = { ...designStyle, effects };
  return renderToStaticMarkup(createElement(SectionRenderer, { section, designStyle: styleWithEffects }));
}

describe('lever `style` per-section (template bengkel)', () => {
  it('hero benar-benar menghasilkan CSS linear-gradient', () => {
    const html = renderSeed((s) => s.type === 'hero');
    expect(html).toContain('linear-gradient');
    // Gradasi penuh yang ditulis template harus utuh, bukan di-fallback.
    expect(html).toContain('#0b1220');
    expect(html).toContain('#7c2d12');
  });

  it('section foto menghasilkan layer gambar + overlay gelap 70% + blur', () => {
    const html = renderSeed((s) => s.type === 'gallery');
    // Lapisan gambar dipisah dari wrapper (lihat komentar section-renderer).
    expect(html).toContain('url(assets/workshop-bengkel.jpg)');
    // overlayCss('dark', palette, 70) → rgba(0, 0, 0, 0.700)
    expect(html).toContain('rgba(0, 0, 0, 0.700)');
    expect(html).toContain('blur(3px)');
  });

  it('latar `theme:surface` di-resolve ke hex palet', () => {
    const html = renderSeed((s) => s.type === 'booking');
    expect(html).toContain('#131c2e');
  });
});


describe('kontrak animasi', () => {
  it('selector stagger cocok dengan DOM yang di-render features-3col', () => {
    const html = renderSeed((s) => s.type === 'features');
    // Yang diuji selector animasi: #keunggulan .grid > div:nth-child(N)
    expect(html, 'section features harus punya id="keunggulan"').toContain('id="keunggulan"');
    expect(html, 'harus ada container .grid').toMatch(/class="grid[^"]*"/);

    const gridIdx = html.indexOf('class="grid');
    expect(gridIdx).toBeGreaterThan(-1);
    const afterGrid = html.slice(gridIdx);
    // 3 kartu features → minimal 3 anak bertanda "p-6 rounded-lg text-center"
    const cardMatches = afterGrid.match(/class="p-6 rounded-lg text-center"/g) ?? [];
    expect(cardMatches.length, 'features-3col harus punya 3 kartu').toBe(3);
  });

  it('script behaviour bertahan sanitasi dan pola berbahaya diblokir', () => {
    const script = [
      '(function () {',
      "  var bar = document.createElement('div');",
      '  document.body.appendChild(bar);',
      '})();',
    ].join('\n');

    const clean = sanitizeBehaviourScript(script);
    expect(clean).toContain('createElement');
    expect(clean).toContain('document.body.appendChild');
    expect(clean).not.toContain('BLOCKED');

    // Pola yang memang diblokir
    expect(sanitizeBehaviourScript('eval("1+1")')).toContain('BLOCKED');
    expect(sanitizeBehaviourScript('document.write("x")')).toContain('BLOCKED');
    expect(sanitizeBehaviourScript('location.href = "http://evil.test"')).toContain('BLOCKED');
    expect(sanitizeBehaviourScript('<script>alert(1)</script>')).toContain('BLOCKED');
  });
});

describe('kontrak template bengkel', () => {
  it('memakai `style` di beberapa section (lever utama)', () => {
    const styled = tpl.data.sections.filter((s) => s.style && Object.keys(s.style).length > 0);
    expect(styled.length, 'minimal 3 section harus punya style').toBeGreaterThanOrEqual(3);
    expect(styled.map((s) => s.type)).toContain('hero');
    expect(styled.map((s) => s.type)).toContain('gallery');
  });

  it('semua section punya anchorId unik dan nav selalu punya tujuan', () => {
    const anchors = tpl.data.sections
      .map((s) => s.anchorId)
      .filter((a): a is string => typeof a === 'string' && a.length > 0);
    expect(new Set(anchors).size, 'anchorId harus unik').toBe(anchors.length);
    for (const item of tpl.data.header?.navItems ?? []) {
      const slug = item.url.replace(/^#/, '');
      expect(anchors, `nav "${item.label}" → #${slug} tidak ada section-nya`).toContain(slug);
    }
  });
});

describe('hook styling + theme.effects', () => {
  it('wrapper section memuat data-tpl-type dan data-tpl-variant', () => {
    // Hook ini yang jadi target `customCss`. Tanpa itu, CSS template hanya
    // bisa menyasar class Tailwind yang bisa berubah tiap build.
    const html = renderSeed((s) => s.type === 'features');
    expect(html).toContain('data-tpl-type="features"');
    expect(html).toContain('data-tpl-variant="features-3col"');
  });

  it('effects.uppercaseHeadings + borderWidth jadi flag data-tpl-fx', () => {
    const withFx = renderWithEffects({ uppercaseHeadings: true, borderWidth: 2 });
    expect(withFx).toContain('data-tpl-fx="uppercase border"');
    expect(withFx, 'var --tpl-border-width harus ikut').toContain('--tpl-border-width:2px');

    // Tanpa efek → atribut tidak muncul sama sekali (bukan string kosong).
    const plain = renderWithEffects({});
    expect(plain).not.toContain('data-tpl-fx');
  });
});

describe('sanitizeTemplateCss', () => {
  it('CSS yang sah — justru yang dibutuhkan gaya modern — TIDAK dirusak', () => {
    const css = [
      '[data-tpl-type="menu_board"] > div > div { backdrop-filter: blur(14px); }',
      '[data-tpl-type="hero"] { clip-path: ellipse(78% 88% at 50% 0%); }',
      '[data-tpl-type="features"] > div > div > div { box-shadow: 6px 6px 0 #f97316; }',
      '.x { background-image: url(data:image/png;base64,AAA); }',
    ].join('\n');
    const clean = sanitizeTemplateCss(css);
    expect(clean).not.toContain('BLOCKED');
    expect(clean).toContain('backdrop-filter');
    expect(clean).toContain('clip-path');
    expect(clean).toContain('box-shadow');
    expect(clean).toContain('url(data:image/png;base64,AAA)');
  });

  it('memblokir breakout <style>, @import, dan url() eksternal', () => {
    expect(sanitizeTemplateCss('a{}</style><script>alert(1)</script>')).toContain('BLOCKED');
    expect(sanitizeTemplateCss('</STYLE>')).toContain('BLOCKED');
    expect(sanitizeTemplateCss('@import url("http://evil.test/x.css");')).toContain('BLOCKED');
    expect(sanitizeTemplateCss('a{background:url(http://evil.test/p.png)}')).toContain('BLOCKED');
    expect(sanitizeTemplateCss('a{width:expression(alert(1))}')).toContain('BLOCKED');
    expect(sanitizeTemplateCss('a{-moz-binding:url(x.xml)}')).toContain('BLOCKED');
  });

  it('memotong CSS yang melebihi batas ukuran', () => {
    const huge = `.x{color:red}`.repeat(50_000);
    expect(sanitizeTemplateCss(huge).length).toBeLessThanOrEqual(MAX_TEMPLATE_CSS_LENGTH);
  });
});

describe('customCss template bengkel', () => {
  it('ada dan menyasar hook data-tpl-*, bukan class Tailwind', () => {
    const css = tpl.data.customCss ?? '';
    expect(css.length, 'bengkel harus punya customCss sebagai contoh').toBeGreaterThan(200);
    expect(css).toContain('data-tpl-type=');
    // Tidak boleh menyasar kelas utilitas Tailwind — rapuh antar build.
    expect(css).not.toMatch(/@md:|grid-cols-|rounded-lg/);
  });

  it('memakai teknik yang tidak mungkin dicapai lewat theme/style saja', () => {
    const css = tpl.data.customCss ?? '';
    for (const trick of ['clip-path', 'box-shadow', 'mask-image', 'translateY']) {
      expect(css, `harus memakai ${trick}`).toContain(trick);
    }
  });

  it('tidak mengandung pola yang akan diblokir sanitizer', () => {
    const css = tpl.data.customCss ?? '';
    expect(sanitizeTemplateCss(css)).not.toContain('BLOCKED');
  });
});

