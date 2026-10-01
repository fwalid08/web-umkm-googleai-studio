import type { Template, TemplateSectionInstance } from '@/lib/builder/template-types';
import { getOnColor } from '@/lib/builder/design-styles';
import { getGoogleFontsUrl } from '@/lib/builder/font-categories';
import { MobileDrawer } from './mobile-drawer';
import { SectionRenderer } from '@/components/builder/section-renderer';
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

      <SiteHeaderV3 site={site} tokens={tokens} />

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

      <SiteFooterV3 site={site} tokens={tokens} />
    </div>
  );
}

function SiteHeaderV3({ site, tokens }: { site: PublicSiteDataV3; tokens: React.CSSProperties }) {
  const { template, headerVariantId } = site;
  const headerVariant = template.headers.find((h) => h.id === headerVariantId) || template.headers[0];
  // Config efektif: default varian + simpanan user, agar live = kanvas.
  const config = { ...(headerVariant.defaultConfig ?? {}), ...(site.headerConfig ?? {}) };
  // Palet efektif: skema pilihan user ikut berlaku di chrome.
  const palette = { ...template.theme.palette, ...(site.themeOverride ?? {}) };
  const onPrimary = getOnColor(palette.primary);
  const layout = headerVariant.layout;
  const navItems = (Array.isArray(config.navItems) ? config.navItems : []) as ChromeNavItem[];
  const links = navItems.filter((item) => item.enabled);
  const sticky = config.sticky !== false;
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

  if (layout === 'floating') {
    return (
      <div className={sticky ? 'px-3 pt-2.5 sticky top-0 z-20' : 'px-3 pt-2.5'}>
        <div
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 shadow-lg"
          style={{
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: '16px',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 flex items-center justify-center font-bold text-xs shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {((config.siteTitle as string) || 'T').charAt(0).toUpperCase()}
            </div>
            <h1 className="text-[13px] font-bold truncate" style={{ color: palette.text }}>
              {(config.siteTitle as string) || 'Nama Toko'}
            </h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {drawer}
            {(config.showCta as boolean) && (
              <a
                href={(config.ctaLink as string) || '#'}
                className="px-3 py-1.5 text-xs font-bold shrink-0"
                style={{ background: palette.primary, color: onPrimary, borderRadius: '999px' }}
              >
                {(config.ctaText as string) || 'Hubungi Kami'}
              </a>
            )}
          </div>
        </div>
        <div className="h-2" />
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <header className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 ${sticky ? 'sticky top-0 z-20' : ''}`} style={{ background: palette.surface, borderBottom: `1px solid ${palette.border}` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          {(config.logoUrl as string) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl as string} alt={(config.siteTitle as string) || ''} className="h-8 w-auto object-contain" />
          ) : (
            <div
              className="w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {((config.siteTitle as string) || 'T').charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-sm font-semibold truncate" style={{ color: palette.text }}>
            {(config.siteTitle as string) || 'Nama Toko'}
          </h1>
        </div>
        <nav className="hidden md:flex items-center gap-5 shrink-0" aria-label="Navigasi website">
          {links.slice(0, 5).map((item) => (
            <a key={item.id} href={item.url} className="text-sm font-medium" style={{ color: palette.text }}>
              {item.label || 'Link'}
            </a>
          ))}
        </nav>
        {drawer}
      </header>
    );
  }

  return (
    <header className={sticky ? 'sticky top-0 z-20' : 'relative'} style={{ background: palette.surface, borderBottom: `1px solid ${palette.border}` }}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {(config.logoUrl as string) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl as string} alt={(config.siteTitle as string) || ''} className="h-8 w-auto object-contain" />
          ) : (
            <div
              className="w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {((config.siteTitle as string) || 'T').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate" style={{ color: palette.text }}>
              {(config.siteTitle as string) || 'Nama Toko'}
            </h1>
            {(config.tagline as string) && (
              <p className="text-xs truncate" style={{ color: palette.textMuted }}>
                {config.tagline as string}
              </p>
            )}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-5 shrink-0" aria-label="Navigasi website">
          {links.slice(0, 5).map((item) => (
            <a key={item.id} href={item.url} className="text-sm font-medium" style={{ color: palette.text }}>
              {item.label || 'Link'}
            </a>
          ))}
        </nav>

        {drawer}

        {(config.showCta as boolean) && (
          <a
            href={(config.ctaLink as string) || '#'}
            className="px-3.5 py-2 text-[13px] font-medium shrink-0"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
          >
            {(config.ctaText as string) || 'Hubungi Kami'}
          </a>
        )}
      </div>
    </header>
  );
}

function SiteFooterV3({ site, tokens }: { site: PublicSiteDataV3; tokens: React.CSSProperties }) {
  const { template, footerVariantId } = site;
  const footerVariant = template.footers.find((f) => f.id === footerVariantId) || template.footers[0];
  // Config efektif: default varian + simpanan user, agar live = kanvas.
  const config = { ...(footerVariant.defaultConfig ?? {}), ...(site.footerConfig ?? {}) };
  // Palet efektif: skema pilihan user ikut berlaku di chrome.
  const palette = { ...template.theme.palette, ...(site.themeOverride ?? {}) };
  const onPrimary = getOnColor(palette.primary);
  const footerText = ((config.text as string) || '').replace('{year}', String(new Date().getFullYear()));
  const layout = footerVariant.layout;
  const navItems = (Array.isArray(config.navItems) ? config.navItems : []) as Array<{ id: string; label: string; url: string; enabled: boolean }>;
  const nav = navItems.filter((n) => n.enabled);
  const socials = ['IG', 'FB', 'TW', 'WA'];

  const socialRow = (centered = false) =>
    (config.showSocial as boolean) && (
      <div className={`flex items-center gap-1.5 ${centered ? 'justify-center' : ''}`}>
        {socials.map((social) => (
          <div
            key={social}
            className="w-7 h-7 flex items-center justify-center text-[10px] font-medium"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
          >
            {social}
          </div>
        ))}
      </div>
    );

  return (
    <footer
      className="border-t px-4 sm:px-6 py-6"
      style={{ background: palette.surface, borderColor: palette.border }}
    >
      {layout === 'minimal' ? (
        <p className="text-[13px] text-center" style={{ color: palette.textMuted }}>
          {footerText}
        </p>
      ) : layout === 'centered' ? (
        <div className="flex flex-col items-center text-center gap-2.5">
          <div
            className="w-10 h-10 flex items-center justify-center font-bold shadow-md"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
          >
            {(footerText || 'T').charAt(0).toUpperCase()}
          </div>
          <p className="text-[13px] font-semibold" style={{ color: palette.text }}>
            {footerText}
          </p>
          <span aria-hidden="true" className="text-[10px] tracking-[0.4em]" style={{ color: palette.primary }}>✦ ✦ ✦</span>
          {nav.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {nav.map((item) => (
                <a key={item.id} href={item.url} className="text-[13px] font-medium hover:opacity-80 transition-opacity" style={{ color: palette.textMuted }}>
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          {socialRow(true)}
        </div>
      ) : layout === 'columns' ? (
        <div>
          <div
            aria-hidden="true"
            className="h-1.5 rounded-full mb-5"
            style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})` }}
          />
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <p className="text-[13px] font-semibold mb-2" style={{ color: palette.text }}>
                {footerText}
              </p>
              {((config.address as string) || (config.phone as string) || (config.email as string)) && (
                <div className="text-sm space-y-1" style={{ color: palette.textMuted }}>
                  {(config.address as string) && <p>📍 {config.address as string}</p>}
                  {(config.phone as string) && <p>📞 {config.phone as string}</p>}
                  {(config.email as string) && <p>✉️ {config.email as string}</p>}
                </div>
              )}
            </div>
            <nav aria-label="Navigasi footer">
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: palette.textMuted }}>
                Menu
              </p>
              <ul className="space-y-2">
                {nav.map((item) => (
                  <li key={item.id}>
                    <a href={item.url} className="text-sm hover:opacity-80 transition-opacity" style={{ color: palette.text }}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: palette.textMuted }}>
                Ikuti Kami
              </p>
              {socialRow()}
            </div>
          </div>
        </div>
      ) : layout === 'newsletter' ? (
        <div className="max-w-xl mx-auto text-center space-y-3">
          <p className="text-sm font-semibold" style={{ color: palette.text }}>
            {(config.newsletterTitle as string) || 'Dapatkan Info Promo'}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder={(config.newsletterPlaceholder as string) || 'Email Anda'}
              className="flex-1 px-4 py-2 border rounded-lg text-sm"
              style={{ borderColor: palette.border, borderRadius: `${template.theme.components.borderRadius}px` }}
            />
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {(config.newsletterButton as string) || 'Berlangganan'}
            </button>
          </div>
          <p className="text-[11px]" style={{ color: palette.textMuted }}>{footerText}</p>
        </div>
      ) : layout === 'social' ? (
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex gap-2">
            {socials.map((social) => (
              <div
                key={social}
                className="w-9 h-9 flex items-center justify-center text-xs font-medium"
                style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
              >
                {social}
              </div>
            ))}
          </div>
          <p className="text-[13px]" style={{ color: palette.textMuted }}>{footerText}</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm" style={{ color: palette.textMuted }}>
            {footerText}
          </p>
          {nav.length > 0 && (
            <nav className="flex items-center gap-6">
              {nav.map((item) => (
                <a key={item.id} href={item.url} className="text-sm hover:opacity-80 transition-opacity" style={{ color: palette.textMuted }}>
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          {socialRow()}
        </div>
      )}
    </footer>
  );
}
