import type { Template, TemplateSectionInstance, AnimationConfig, BehaviourConfig } from '@/lib/builder/template-types';
import { buildThemeTokens } from '@/lib/builder/theme-tokens';
import { getGoogleFontsUrl } from '@/lib/builder/font-categories';
import { MobileBottomBar } from './mobile-bottom-bar';
import { SiteHeaderLive } from './site-header-live';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { VariantHtmlRenderer } from '@/components/builder/variant-html-renderer';
import { BehaviourRuntime } from '@/components/builder/behaviour-runtime';
import { SiteFooter } from '@/components/builder/site-footer-shared';
import { getSectionVariant } from '@/lib/builder/template-store';
import type { Section } from '@/lib/builder/types';
import type { DesignStyle } from '@/lib/builder/types';

export interface PublicSiteDataV3 {
  template: Template;
  headerVariantId: string;
  footerVariantId: string;
  sections: TemplateSectionInstance[];
  websiteId?: string;
  themeOverride?: Record<string, string>;
  typographyOverride?: { headingFont?: string; bodyFont?: string; accentFont?: string };
  /** Config header/footer efektif (default varian + simpanan user). */
  headerConfig?: Record<string, unknown>;
  footerConfig?: Record<string, unknown>;
  /** Bottom bar config untuk mobile (app-like). */
  bottomBar?: {
    enabled?: boolean;
    items?: Array<{
      id: string;
      label: string;
      icon: string;
      url: string;
      isExternal?: boolean;
      enabled?: boolean;
      badge?: string;
    }>;
  };
  /** Animasi & behaviour template — dijalankan oleh `BehaviourRuntime`. */
  animations?: AnimationConfig[];
  behaviours?: BehaviourConfig[];
  /**
   * Batas overlay drawer (pratinjau mobile di modal). Diteruskan ke
   * SiteHeaderLive → MobileDrawer (contained). Live site normal: kosong.
   */
  drawerContainer?: HTMLElement | null;
  /** CSS kustom template — bebaskan desain dari 47 layout bawaan. */
  customCss?: string;
  seo: {
    title: string;
    description: string;
  };
}

export function PublicWebsiteV3({ site }: { site: PublicSiteDataV3 }) {
  const { template, sections, seo, websiteId, themeOverride, typographyOverride, animations, behaviours, customCss, bottomBar, drawerContainer } = site;
  const palette = { ...template.theme.palette, ...themeOverride };
  const typography = {
    ...template.theme.typography,
    ...(typographyOverride?.headingFont ? { headingFont: typographyOverride.headingFont } : {}),
    ...(typographyOverride?.bodyFont ? { bodyFont: typographyOverride.bodyFont } : {}),
    ...(typographyOverride?.accentFont ? { accentFont: typographyOverride.accentFont } : {}),
  };

  // Build DesignStyle from template theme for SectionRenderer
  const designStyle: DesignStyle = {
    id: 'custom',
    name: 'Custom',
    description: 'Custom theme from template',
    palette,
    typography,
    components: template.theme.components,
    effects: template.theme.effects || {},
    thumbnailUrl: '',
  };

  // Token tema dari helper bersama kanvas (theme-tokens.ts) — kedua
  // permukaan render selalu sepakat.
  const tokens = {
    ...buildThemeTokens(palette, typography, template.theme.components.borderRadius, {
      contrast: template.contrast,
    }),
  } as React.CSSProperties;

  const fontFamilies = [...new Set([typography.headingFont, typography.bodyFont, typography.accentFont].map((f) => (f ?? '').trim()).filter(Boolean))];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: (template.headers[0].defaultConfig.siteTitle as string) || 'Toko',
    description: seo.description,
    image: (template.headers[0].defaultConfig.logoUrl as string) || undefined,
  };

  return (
    <div
      // builder-cq: konteks container-query agar layout responsif section
      // (@md:grid-cols-3 dsb.) merespons lebar halaman — sama seperti kanvas.
      // Tanpa ini semua grid ambruk ke 1 kolom di live site.
      className="min-h-screen builder-cq"
      style={{
        ...tokens,
        background: palette.background,
        color: palette.text,
        fontFamily: typography.bodyFont,
      }}
    >
      {fontFamilies.length > 0 && (
        <link rel="stylesheet" href={getGoogleFontsUrl(fontFamilies)} />
      )}
      {/* Animasi/behaviour template (client component) — menyuntikkan
          @keyframes + menjalankan script tersanitasi supaya animasi dari
          template ZIP benar-benar hidup di live site, bukan sekadar tersimpan. */}
      <BehaviourRuntime animations={animations} behaviours={behaviours} customCss={customCss} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeaderLive
        template={template}
        headerVariantId={site.headerVariantId}
        headerConfig={site.headerConfig}
        themeOverride={themeOverride}
        drawerContainer={drawerContainer}
      />

      <main>
        {sections.map((section) => {
          const variant = getSectionVariant(template, section.type, section.variantId);
          if (!variant) return null;
          // v3.0: varian dengan `html` kustom dirender langsung dari HTML
          // template (kreativitas tidak terbatas layout bawaan renderer).
          const customHtml = (variant as { html?: unknown }).html;
          if (typeof customHtml === 'string' && customHtml.trim().length > 0) {
            return (
              <VariantHtmlRenderer
                key={section.id}
                type={section.type}
                variantId={section.variantId}
                html={customHtml}
                config={section.config as Record<string, unknown>}
                configFields={variant.configFields}
                anchorId={section.anchorId}
              />
            );
          }
          // Convert TemplateSectionInstance to Section type for SectionRenderer
          // (token theme:* diteruskan mentah — SectionRenderer yang me-resolve
          // ke palet template aktif agar preview/canvas/live selalu sama).
          const rendererSection: Section = {
            id: section.id,
            type: section.type as Section['type'],
            variant: section.variantId,
            config: section.config,
            style: {
              padding: section.style.padding,
              background: section.style.background,
              backgroundColor: section.style.backgroundColor,
              backgroundImage: section.style.backgroundImage,
              backgroundGradient: section.style.backgroundGradient,
              backgroundBlur: section.style.backgroundBlur,
              backgroundSize: section.style.backgroundSize,
              backgroundOverlay: section.style.backgroundOverlay,
              backgroundOverlayOpacity: section.style.backgroundOverlayOpacity,
            },
            responsive: section.responsive,
          };
          return (
            <SectionRenderer
              key={section.id}
              section={rendererSection}
              designStyle={designStyle}
              websiteId={websiteId}
              anchorId={section.anchorId}
            />
          );
        })}
      </main>

<SiteFooterV3 site={site} />
      {bottomBar?.enabled === true && bottomBar.items && bottomBar.items.length > 0 && (
        <>
          {/* Spacer agar konten/footer tidak tertutup bottom bar fixed. */}
          <div className="lg:hidden" style={{ height: 76 }} aria-hidden="true" />
          <MobileBottomBar
            config={bottomBar}
            palette={{
              primary: palette.primary,
              surface: palette.surface,
              text: palette.text,
              textMuted: palette.textMuted,
              border: palette.border,
            }}
          />
        </>
      )}
      </div>
  );
}

function SiteFooterV3({ site }: { site: PublicSiteDataV3; tokens?: React.CSSProperties }) {
  const { template, footerVariantId } = site;
  const footerVariant = template.footers.find((f) => f.id === footerVariantId) || template.footers[0];
  // Config efektif: default varian + simpanan user, agar live = kanvas.
  const config = { ...(footerVariant.defaultConfig ?? {}), ...(site.footerConfig ?? {}) };
  const palette = { ...template.theme.palette, ...(site.themeOverride ?? {}) };
  return (
    <SiteFooter
      variant={footerVariant}
      config={config}
      palette={palette}
      radius={template.theme.components.borderRadius}
    />
  );
}
