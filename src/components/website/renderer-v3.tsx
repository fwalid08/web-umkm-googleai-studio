import type { Template, TemplateSectionInstance } from '@/lib/builder/template-types';
import { getOnColor } from '@/lib/builder/design-styles';
import { getGoogleFontsUrl } from '@/lib/builder/font-categories';
import { MobileDrawer } from './mobile-drawer';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { SiteHeader } from '@/components/builder/site-header-shared';
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
  typographyOverride?: { headingFont?: string; bodyFont?: string };
  /** Config header/footer efektif (default varian + simpanan user). */
  headerConfig?: Record<string, unknown>;
  footerConfig?: Record<string, unknown>;
  seo: {
    title: string;
    description: string;
  };
}

interface ChromeNavItem {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  children?: ChromeNavItem[];
}

export function PublicWebsiteV3({ site }: { site: PublicSiteDataV3 }) {
  const { template, sections, seo, websiteId, themeOverride, typographyOverride } = site;
  const palette = { ...template.theme.palette, ...themeOverride };
  const onPrimary = getOnColor(palette.primary);
  const typography = {
    ...template.theme.typography,
    ...(typographyOverride?.headingFont ? { headingFont: typographyOverride.headingFont } : {}),
    ...(typographyOverride?.bodyFont ? { bodyFont: typographyOverride.bodyFont } : {}),
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

  const tokens = {
    '--color-primary': palette.primary,
    '--color-secondary': palette.secondary,
    '--color-accent': palette.accent,
    '--color-background': palette.background,
    '--color-surface': palette.surface,
    '--color-text': palette.text,
    '--color-text-muted': palette.textMuted,
    '--color-border': palette.border,
    '--color-on-primary': onPrimary,
    '--font-heading': typography.headingFont,
    '--font-body': typography.bodyFont,
    '--radius': `${template.theme.components.borderRadius}px`,
  } as React.CSSProperties;

  const fontFamilies = [...new Set([typography.headingFont, typography.bodyFont].map((f) => (f ?? '').trim()).filter(Boolean))];

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeaderV3 site={site} />

      <main>
        {sections.map((section) => {
          const variant = getSectionVariant(template, section.type, section.variantId);
          if (!variant) return null;
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
    </div>
  );
}

function SiteHeaderV3({ site }: { site: PublicSiteDataV3 }) {
  const { template, headerVariantId } = site;
  const headerVariant = template.headers.find((h) => h.id === headerVariantId) || template.headers[0];
  // Config efektif: default varian + simpanan user, agar live = kanvas.
  const config = { ...(headerVariant.defaultConfig ?? {}), ...(site.headerConfig ?? {}) };
  // Palet efektif: skema pilihan user ikut berlaku di chrome.
  const palette = { ...template.theme.palette, ...(site.themeOverride ?? {}) };
  const onPrimary = getOnColor(palette.primary);
  const navItems = (Array.isArray(config.navItems) ? config.navItems : []) as ChromeNavItem[];
  const links = navItems.filter((item) => item.enabled);
  const drawerStyle = headerVariant.mobileMenu?.style === 'drawer-top' ? 'drawer-top' : 'drawer-sidebar';
  const showCta = Boolean(config.showCta);
  const drawer = (
    <MobileDrawer
      items={links}
      style={drawerStyle}
      showCta={showCta}
      ctaText={(config.ctaText as string) || 'Hubungi Kami'}
      ctaLink={(config.ctaLink as string) || '#'}
      text={palette.text}
      surface={palette.surface}
      border={palette.border}
      primary={palette.primary}
      onPrimary={onPrimary}
      radius={template.theme.components.borderRadius}
    />
  );

  return (
    <SiteHeader
      variant={headerVariant}
      config={config}
      palette={palette}
      radius={template.theme.components.borderRadius}
      drawer={drawer}
    />
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
