import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BUILT_IN_CATALOG } from './templates/catalog';
import { getSectionVariant } from './template-store';
import { SectionRenderer } from '@/components/builder/section-renderer';
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
