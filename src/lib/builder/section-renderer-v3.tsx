'use client';

import { useState } from 'react';
import type { SectionVariant, TemplateTheme } from './template-types';
import type { DesignStylePalette } from './types';
import { getOnColor } from './design-styles';

interface SectionRendererV3Props {
  section: {
    type: string;
    variantId: string;
    config: Record<string, unknown>;
    style: {
      padding: { top: number; right: number; bottom: number; left: number };
      background: string;
      backgroundColor?: string;
      backgroundImage?: string;
      backgroundGradient?: string;
      backgroundBlur?: number;
      backgroundSize?: string;
      backgroundOverlay?: string;
    };
  };
  variant: SectionVariant;
  theme: TemplateTheme;
  websiteId?: string;
}

function resolveThemeColor(value: string | undefined, palette: { primary: string; secondary: string; accent: string; background: string; surface: string; text: string; textMuted: string; border: string }): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('theme:')) {
    const key = value.slice(6) as keyof typeof palette;
    return palette[key];
  }
  return value;
}

function isDarkColor(hex: string): boolean {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return false;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function getContrastFromChain(bgChain: (string | undefined)[], palette: DesignStylePalette, onPrimary: string): { text: string; muted: string } {
  for (const bg of bgChain) {
    if (!bg) continue;
    const resolved = resolveThemeColor(bg, palette);
    if (!resolved) continue;
    if (resolved === 'transparent') continue;
    if (isDarkColor(resolved)) {
      return { text: onPrimary, muted: onPrimary };
    }
    return { text: palette.text, muted: palette.textMuted };
  }
  return { text: palette.text, muted: palette.textMuted };
}

export function SectionRendererV3({ section, variant, theme, websiteId }: SectionRendererV3Props) {
  const { config, style } = section;
  const palette = theme.palette;
  const onPrimary = getOnColor(palette.primary);
  const radius = `${theme.components.borderRadius}px`;
  const effectiveTheme = { ...theme, palette };

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
    '--font-heading': theme.typography.headingFont,
    '--font-body': theme.typography.bodyFont,
    '--radius': radius,
  } as React.CSSProperties;

  const resolvedBgColor = resolveThemeColor(style.backgroundColor, palette);
  const sectionBg = style.background === 'color' ? resolvedBgColor : style.background === 'transparent' ? palette.background : undefined;

  const getGradient = (): string | undefined => {
    if (style.background !== 'gradient' || !style.backgroundGradient) return undefined;
    const parts = style.backgroundGradient.split(',');
    if (parts.length < 2) return undefined;
    const start = resolveThemeColor(parts[0]?.trim(), palette) || palette.primary;
    const end = resolveThemeColor(parts[1]?.trim(), palette) || palette.secondary;
    const angle = parts[2]?.trim() || '135deg';
    return `linear-gradient(${angle}, ${start}, ${end})`;
  };

  const getBackgroundImage = (): React.CSSProperties | undefined => {
    if (style.background !== 'image' || !style.backgroundImage) return undefined;
    const blur = style.backgroundBlur || 0;
    const size = style.backgroundSize || 'cover';
    return {
      backgroundImage: `url(${style.backgroundImage})`,
      backgroundSize: size,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      filter: blur > 0 ? `blur(${blur}px)` : undefined,
    };
  };

  const getOverlay = (): React.CSSProperties | undefined => {
    if (style.background !== 'image' || !style.backgroundImage) return undefined;
    const overlay = style.backgroundOverlay || 'none';
    if (overlay === 'none') return undefined;
    const overlayColor = overlay === 'light' ? 'rgba(255,255,255,0.3)' : overlay === 'dark' ? 'rgba(0,0,0,0.5)' : overlay === 'primary' ? `${palette.primary}99` : undefined;
    return {
      background: overlayColor,
    };
  };

  const bgImageStyle = getBackgroundImage();
  const overlayStyle = getOverlay();

  const sectionStyle: React.CSSProperties = {
    ...tokens,
    padding: `${style.padding.top}px ${style.padding.right}px ${style.padding.bottom}px ${style.padding.left}px`,
    background: style.background === 'gradient' ? getGradient() : bgImageStyle ? undefined : sectionBg,
    fontFamily: 'var(--font-body)',
    color: palette.text,
    position: 'relative',
    overflow: 'hidden',
  };

  const renderContent = () => {
    const layout = variant.layout;

    if (layout.startsWith('hero-')) return <HeroVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('features-')) return <FeaturesVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('product-')) return <ProductVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} />;
    if (layout.startsWith('testimonials-')) return <TestimonialsVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('faq-')) return <FaqVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('cta-')) return <CtaVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('contact-')) return <ContactVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('booking-')) return <BookingVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} websiteId={websiteId} sectionBg={sectionBg} />;
    if (layout.startsWith('about-')) return <AboutVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('gallery-')) return <GalleryVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('video-')) return <VideoVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('team-')) return <TeamVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('pricing-')) return <PricingVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('newsletter-')) return <NewsletterVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('divider-')) return <DividerVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} />;
    if (layout.startsWith('marquee-')) return <MarqueeVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('menu-')) return <MenuVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('steps-')) return <StepsVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;
    if (layout.startsWith('location-')) return <LocationVariant layout={layout} config={config} tokens={tokens} palette={palette} onPrimary={onPrimary} sectionBg={sectionBg} />;

    return <div className="p-8 text-center text-muted-foreground">Layout: {layout}</div>;
  };

  return (
    <div style={sectionStyle} className="transition-all">
      {bgImageStyle && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            ...bgImageStyle,
          }}
        />
      )}
      {overlayStyle && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            ...overlayStyle,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {renderContent()}
      </div>
    </div>
  );
}

function HeroVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const headline = (config.headline as string) || 'Selamat Datang';
  const subheadline = (config.subheadline as string) || '';
  const ctaText = (config.cta_text as string) || '';
  const ctaLink = (config.cta_link as string) || '#';
  const bgType = (config.background_type as string) || 'color';
  const bgImage = (config.background_image as string) || '';
  const bgColor = resolveThemeColor((config.background_color as string) || 'theme:primary', palette) || palette.primary;
  const isDarkBg = bgColor === palette.primary || bgColor === palette.secondary;
  const ctaContrast = getContrastFromChain([palette.primary], palette, onPrimary);

  if (layout === 'hero-split') {
    const image = (config.image as string) || '';
    const contrast = getContrastFromChain([sectionBg], palette, onPrimary);
    return (
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>
              {headline}
            </h1>
            <p className="text-lg mb-8" style={{ color: contrast.muted }}>{subheadline}</p>
            {ctaText && (
              <a href={ctaLink} className="inline-block px-8 py-3 font-medium" style={{ background: 'var(--color-primary)', color: ctaContrast.text, borderRadius: 'var(--radius)' }}>
                {ctaText}
              </a>
            )}
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={headline} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }} />
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'hero-card') {
    const contrast = getContrastFromChain([palette.surface, bgColor], palette, onPrimary);
    return (
      <div className="py-12 px-6" style={{ background: bgType === 'image' && bgImage ? `url(${bgImage}) center/cover` : bgColor }}>
        <div className="max-w-2xl mx-auto rounded-2xl p-8 shadow-xl text-center" style={{ borderRadius: 'var(--radius)', background: isDarkBg ? palette.surface : palette.background }}>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>
            {headline}
          </h1>
          <p className="text-lg mb-8" style={{ color: contrast.muted }}>{subheadline}</p>
          {ctaText && (
            <a href={ctaLink} className="inline-block px-8 py-3 font-medium" style={{ background: 'var(--color-primary)', color: ctaContrast.text, borderRadius: 'var(--radius)' }}>
              {ctaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'hero-video') {
    const videoUrl = (config.video_url as string) || '';
    const contrast = getContrastFromChain([palette.primary], palette, onPrimary);
    return (
      <div className="py-12 px-6 relative overflow-hidden">
        {videoUrl && (
          <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${palette.primary}99, ${palette.secondary}99)` }} />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>
            {headline}
          </h1>
          <p className="text-lg mb-8" style={{ color: contrast.muted, opacity: 0.8 }}>{subheadline}</p>
          {ctaText && (
            <a href={ctaLink} className="inline-block px-8 py-3 font-medium" style={{ background: 'var(--color-primary)', color: ctaContrast.text, borderRadius: 'var(--radius)' }}>
              {ctaText}
            </a>
          )}
        </div>
      </div>
    );
  }

  const contrast = getContrastFromChain([bgColor], palette, onPrimary);
  return (
    <div className="py-12 px-6 text-center" style={{ background: bgType === 'image' && bgImage ? `url(${bgImage}) center/cover` : bgColor }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>
          {headline}
        </h1>
        <p className="text-lg mb-8" style={{ color: contrast.muted, opacity: isDarkBg ? 0.85 : undefined }}>
          {subheadline}
        </p>
        {ctaText && (
          <a href={ctaLink} className="inline-block px-8 py-3 font-medium" style={{ background: 'var(--color-primary)', color: ctaContrast.text, borderRadius: 'var(--radius)' }}>
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}

function FeaturesVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Fitur Kami';
  const items = (Array.isArray(config.items) ? config.items : []) as Array<{ icon?: string; title: string; description: string }>;
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const itemContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);

  if (layout === 'features-list') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          <div className="space-y-6">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
                  {item.icon || '✓'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: itemContrast.text }}>{item.title}</h3>
                  <p style={{ color: itemContrast.muted }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'features-stacked') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '50%' }}>
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: itemContrast.text }}>{item.title}</h3>
                  <p style={{ color: itemContrast.muted }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'features-masonry') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((item, i) => (
              <div key={i} className="p-6 text-center" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
                <div className="text-4xl mb-4">{item.icon || '✓'}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: itemContrast.text }}>{item.title}</h3>
                <p className="text-sm" style={{ color: itemContrast.muted }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div key={i} className="p-6 text-center" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
              <div className="text-4xl mb-4">{item.icon || '✓'}</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: itemContrast.text }}>{item.title}</h3>
              <p className="text-sm" style={{ color: itemContrast.muted }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductVariant({ layout, config, tokens, palette }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string }) {
  const title = (config.title as string) || 'Produk Kami';
  const columns = (config.columns as number) || 4;

  if (layout === 'product-carousel') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: palette.text }}>{title}</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[200px] p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
                <div className="aspect-square bg-muted rounded mb-4" style={{ borderRadius: 'var(--radius)' }} />
                <div className="h-5 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: palette.text }}>{title}</h2>
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
              <div className="aspect-square bg-muted rounded mb-4" style={{ borderRadius: 'var(--radius)' }} />
              <div className="h-5 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Testimoni';
  const items = (Array.isArray(config.items) ? config.items : []) as Array<{ name: string; text: string; rating: number }>;
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const cardContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);

  if (layout === 'testimonials-carousel') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {items.map((item, i) => (
              <div key={i} className="min-w-[300px] p-6 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
                <p className="mb-4" style={{ color: cardContrast.text }}>&ldquo;{item.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted" style={{ borderRadius: '50%' }} />
                  <div>
                    <p className="font-semibold" style={{ color: cardContrast.text }}>{item.name}</p>
                    <div style={{ color: palette.accent }}>{'★'.repeat(item.rating)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'testimonials-single') {
    const item = items[0] || { name: '', text: '', rating: 5 };
    return (
      <div className="py-12 px-6 text-center">
        <div className="text-6xl mb-4" style={{ color: 'var(--color-primary)' }}>&ldquo;</div>
        <p className="text-2xl md:text-3xl font-bold mb-8 max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-heading)', color: cardContrast.text }}>
          {item.text}
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" style={{ borderRadius: '50%' }} />
          <div className="text-left">
            <p className="font-semibold" style={{ color: cardContrast.text }}>{item.name}</p>
            <div style={{ color: palette.accent }}>{'★'.repeat(item.rating)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="p-6 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
              <p className="mb-4" style={{ color: cardContrast.text }}>&ldquo;{item.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" style={{ borderRadius: '50%' }} />
                <div>
                  <p className="font-semibold" style={{ color: cardContrast.text }}>{item.name}</p>
                  <div style={{ color: palette.accent }}>{'★'.repeat(item.rating)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'FAQ';
  const items = (Array.isArray(config.items) ? config.items : []) as Array<{ question: string; answer: string }>;
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const itemContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);

  if (layout === 'faq-accordion') {
    return (
      <div className="py-12 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <details key={i} className="border rounded-xl px-4 py-3" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
              <summary className="font-medium cursor-pointer" style={{ color: itemContrast.text }}>{item.question}</summary>
              <p className="mt-2 text-sm" style={{ color: itemContrast.muted }}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    );
  }

  if (layout === 'faq-list') {
    return (
      <div className="py-12 px-6 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="p-4 border rounded-xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
              <h3 className="font-semibold mb-2" style={{ color: itemContrast.text }}>{item.question}</h3>
              <p className="text-sm" style={{ color: itemContrast.muted }}>{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 border rounded-xl" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
            <h3 className="font-semibold mb-2" style={{ color: itemContrast.text }}>{item.question}</h3>
            <p className="text-sm" style={{ color: itemContrast.muted }}>{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Siap Memulai?';
  const subtitle = (config.subtitle as string) || '';
  const buttonText = (config.button_text as string) || '';
  const buttonLink = (config.button_link as string) || '#';
  const primaryContrast = getContrastFromChain([palette.primary], palette, onPrimary);

  if (layout === 'cta-card') {
    const contrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);
    return (
      <div className="py-12 px-6">
        <div className="max-w-2xl mx-auto p-8 text-center rounded-2xl shadow-xl" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
          <p className="text-lg mb-8" style={{ color: contrast.muted }}>{subtitle}</p>
          {buttonText && (
            <a href={buttonLink} className="inline-block px-8 py-3 font-medium" style={{ background: 'var(--color-primary)', color: primaryContrast.text, borderRadius: 'var(--radius)' }}>
              {buttonText}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (layout === 'cta-split') {
    const contrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto flex md:flex-row flex-col items-center gap-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
            <p className="text-lg" style={{ color: contrast.muted }}>{subtitle}</p>
          </div>
          {buttonText && (
            <a href={buttonLink} className="inline-block px-8 py-3 font-medium shrink-0" style={{ background: 'var(--color-primary)', color: primaryContrast.text, borderRadius: 'var(--radius)' }}>
              {buttonText}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 text-center" style={{ background: 'var(--color-primary)' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: primaryContrast.text }}>{title}</h2>
        <p className="text-lg mb-8" style={{ color: primaryContrast.muted }}>{subtitle}</p>
        {buttonText && (
          <a href={buttonLink} className="inline-block px-8 py-3 font-medium" style={{ background: 'var(--color-on-primary)', color: primaryContrast.text, borderRadius: 'var(--radius)' }}>
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

function ContactVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Hubungi Kami';
  const subtitle = (config.subtitle as string) || '';
  const address = (config.address as string) || '';
  const phone = (config.phone as string) || '';
  const email = (config.email as string) || '';
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const formContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);
  const buttonContrast = getContrastFromChain([palette.primary], palette, onPrimary);
  const inputStyle = { borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-surface)', color: formContrast.text } as React.CSSProperties;

  if (layout === 'contact-form-map') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          <p className="text-center mb-12" style={{ color: titleContrast.muted }}>{subtitle}</p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <input type="text" placeholder="Nama" className="w-full px-4 py-3 border" style={inputStyle} />
              <input type="email" placeholder="Email" className="w-full px-4 py-3 border" style={inputStyle} />
              <textarea placeholder="Pesan" rows={4} className="w-full px-4 py-3 border" style={inputStyle} />
              <button className="w-full py-3 font-medium" style={{ background: 'var(--color-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}>Kirim Pesan</button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.5!2d106.8!3d-6.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMDAuMCJTIDEwNsKwNDgnMDAuMCJF!5e0!3m2!1sid!2sid!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'contact-split') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
            <p className="mb-6" style={{ color: titleContrast.muted }}>{subtitle}</p>
            <div className="space-y-2 text-sm">
              {address && <p>📍 {address}</p>}
              {phone && <p>📞 {phone}</p>}
              {email && <p>✉️ {email}</p>}
            </div>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Nama" className="w-full px-4 py-3 border" style={inputStyle} />
            <input type="email" placeholder="Email" className="w-full px-4 py-3 border" style={inputStyle} />
            <textarea placeholder="Pesan" rows={4} className="w-full px-4 py-3 border" style={inputStyle} />
            <button className="w-full py-3 font-medium" style={{ background: 'var(--color-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}>Kirim Pesan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
      <p className="text-center mb-8" style={{ color: titleContrast.muted }}>{subtitle}</p>
      <div className="space-y-4">
        <input type="text" placeholder="Nama" className="w-full px-4 py-3 border" style={inputStyle} />
        <input type="email" placeholder="Email" className="w-full px-4 py-3 border" style={inputStyle} />
        <textarea placeholder="Pesan" rows={4} className="w-full px-4 py-3 border" style={inputStyle} />
        <button className="w-full py-3 font-medium" style={{ background: 'var(--color-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}>Kirim Pesan</button>
      </div>
    </div>
  );
}

function BookingVariant({ layout, config, tokens, palette, onPrimary, websiteId, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; websiteId?: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Booking Layanan';
  const subtitle = (config.subtitle as string) || '';
  const services = (Array.isArray(config.services) ? config.services : []) as Array<{ name: string; duration: string; price: string }>;
  const hours = (config.hours as string) || '';
  const address = (config.address as string) || '';
  const successMessage = (config.success_message as string) || 'Terima kasih! Booking Anda diterima.';
  const [form, setForm] = useState({ name: '', phone: '', service: '', date: '', time: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!websiteId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_id: websiteId,
          customer_name: form.name,
          customer_phone: form.phone,
          service_name: form.service,
          booking_date: form.date,
          booking_time: form.time,
          notes: form.notes,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? 'Gagal mengirim booking');
        return;
      }
      setDone(successMessage);
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const formContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);
  const buttonContrast = getContrastFromChain([palette.primary], palette, onPrimary);
  const inputCls = 'w-full px-4 py-2.5 border rounded-md text-sm';
  const inputStyle = { borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-background)', color: formContrast.text } as React.CSSProperties;

  const formEl = (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
        <input type="text" required placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} />
        <input type="tel" required placeholder="No. WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} style={inputStyle} />
      </div>
      <select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className={inputCls} style={inputStyle}>
        <option value="">— Pilih layanan —</option>
        {services.map((s, i) => (
          <option key={i} value={s.name}>
            {s.name}{s.price ? ` • ${s.price}` : ''}{s.duration ? ` (${s.duration})` : ''}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} style={inputStyle} />
        <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={inputCls} style={inputStyle} />
      </div>
      <textarea placeholder="Catatan (opsional)" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} style={inputStyle} />
      {error && <p className="text-sm" style={{ color: 'var(--color-primary)' }}>{error}</p>}
      {done ? (
        <p className="text-sm font-medium p-3 rounded-md" style={{ background: 'var(--color-surface)' }}>
          ✅ {done}
        </p>
      ) : (
        <button type="submit" disabled={loading || !websiteId} className="w-full py-3 rounded-md font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}>
          {loading ? 'Mengirim…' : '📅 Booking Sekarang'}
        </button>
      )}
      {!websiteId && !done && (
        <p className="text-xs text-center" style={{ color: formContrast.muted }}>
          Pratinjau editor — form aktif di situs live setelah publish
        </p>
      )}
    </form>
  );

  if (layout === 'booking-split') {
    return (
      <div className="py-12 px-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        <p className="text-center mb-8" style={{ color: titleContrast.muted }}>{subtitle}</p>
        <div className="grid grid-cols-1 @md:grid-cols-5 gap-6 items-start">
          <div className="@md:col-span-3">{formEl}</div>
          <div className="@md:col-span-2 p-5 rounded-lg space-y-3 text-sm" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
            {hours && <p>🕘 <span className="font-semibold">Jam buka</span><br />{hours}</p>}
            {address && <p>📍 <span className="font-semibold">Lokasi</span><br />{address}</p>}
            {services.length > 0 && (
              <div>
                <p className="font-semibold mb-1">💈 Daftar layanan</p>
                <ul className="space-y-1" style={{ color: formContrast.muted }}>
                  {services.map((s, i) => (
                    <li key={i}>• {s.name} — {s.price}{s.duration ? ` (${s.duration})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
      <p className="text-center mb-8" style={{ color: titleContrast.muted }}>{subtitle}</p>
      <div className="max-w-xl mx-auto">{formEl}</div>
    </div>
  );
}

function AboutVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Tentang Kami';
  const content = (config.content as string) || '';
  const image = (config.image as string) || '';
  const contrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);

  if (layout === 'about-centered') {
    return (
      <div className="py-12 px-6 max-w-4xl mx-auto text-center">
        {image && (
          <div className="aspect-video rounded-2xl overflow-hidden mb-8" style={{ borderRadius: 'var(--radius)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
        <p className="text-lg" style={{ color: contrast.muted }}>{content}</p>
      </div>
    );
  }

  const imageLeft = layout === 'about-image-left';
  return (
    <div className="py-12 px-6 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {imageLeft && (
          <div className="aspect-square rounded-2xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }} />
             )}
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
            <p className="text-lg" style={{ color: contrast.muted }}>{content}</p>
          </div>
          {!imageLeft && (
            <div className="aspect-square rounded-2xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }} />
             )}
            </div>
        )}
      </div>
    </div>
  );
}

function GalleryVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Galeri';
  const images = (Array.isArray(config.images) ? config.images : []) as string[];
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);

  if (layout === 'gallery-carousel') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(images.length > 0 ? images : ['', '', '']).map((img, i) => (
              <div key={i} className="min-w-[300px] aspect-[4/3] rounded-xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'gallery-masonry') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(images.length > 0 ? images : ['', '', '', '', '', '']).map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(images.length > 0 ? images : ['', '', '', '']).map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={`Galeri ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || '';
  const url = (config.url as string) || '';
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);

  if (layout === 'video-centered') {
    return (
      <div className="py-12 px-6 max-w-4xl mx-auto">
        {title && <h2 className="text-3xl font-bold text-center mb-8" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>}
        <div className="aspect-video rounded-2xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
          {url ? (
            <iframe src={url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen title={title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
              <div className="text-6xl">▶</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 max-w-6xl mx-auto">
      {title && <h2 className="text-3xl font-bold text-center mb-8" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>}
      <div className="aspect-video rounded-2xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
        {url ? (
          <iframe src={url} width="100%" height="100%" style={{ border: 0 }} allowFullScreen title={title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
            <div className="text-6xl">▶</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Tim Kami';
  const members = (Array.isArray(config.members) ? config.members : []) as Array<{ name: string; role: string; image: string }>;
  const contrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);

  if (layout === 'team-list') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
          <div className="space-y-6">
            {members.map((member, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" style={{ borderRadius: '50%' }}>
                  {member.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: contrast.text }}>{member.name}</h3>
                  <p style={{ color: contrast.muted }}>{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {members.map((member, i) => (
            <div key={i} className="text-center">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4" style={{ borderRadius: '50%' }}>
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }} />
                )}
              </div>
              <h3 className="font-semibold" style={{ color: contrast.text }}>{member.name}</h3>
              <p className="text-sm" style={{ color: contrast.muted }}>{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Harga';
  const items = (Array.isArray(config.items) ? config.items : []) as Array<{ name: string; price: string; features: string[] }>;
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const cardContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);
  const buttonContrast = getContrastFromChain([palette.primary], palette, onPrimary);

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div key={i} className="p-6 border text-center" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}>
              <h3 className="text-lg font-semibold mb-2" style={{ color: cardContrast.text }}>{item.name}</h3>
              <p className="text-3xl font-bold mb-6" style={{ color: cardContrast.text }}>{item.price}</p>
              <ul className="space-y-3 mb-8">
                {item.features.map((feature, fIdx) => (
                  <li key={fIdx} className="text-sm" style={{ color: cardContrast.muted }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 font-medium" style={{ background: 'var(--color-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}>
                Pilih
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewsletterVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Newsletter';
  const subtitle = (config.subtitle as string) || '';
  const placeholder = (config.placeholder as string) || 'Email Anda';
  const buttonText = (config.button_text as string) || 'Berlangganan';
  const primaryContrast = getContrastFromChain([palette.primary], palette, onPrimary);
  const buttonContrast = getContrastFromChain([palette.primary], palette, onPrimary);

  if (layout === 'newsletter-card') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-2xl mx-auto p-8 text-center rounded-2xl" style={{ background: 'var(--color-primary)', borderRadius: 'var(--radius)' }}>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: primaryContrast.text }}>{title}</h2>
          <p className="text-lg mb-8" style={{ color: primaryContrast.muted }}>{subtitle}</p>
          <div className="flex gap-3">
            <input type="email" placeholder={placeholder} className="flex-1 px-4 py-3 border" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-background)' }} />
            <button className="px-6 py-3 font-medium" style={{ background: 'var(--color-on-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}>
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  return (
    <div className="py-12 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
        <p className="text-lg mb-8" style={{ color: contrast.muted }}>{subtitle}</p>
        <div className="flex gap-3">
          <input type="email" placeholder={placeholder} className="flex-1 px-4 py-3 border" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-surface)' }} />
          <button className="px-6 py-3 font-medium" style={{ background: 'var(--color-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}>
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}

function DividerVariant({ layout, config, tokens }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string }) {
  const height = (config.height as number) || 80;
  const style = (config.style as string) || 'solid';
  const color = (config.color as string) || 'var(--color-border)';

  if (layout === 'divider-spacer') {
    return <div style={{ height: `${height}px` }} />;
  }

  return (
    <div className="py-4 px-6">
      <hr style={{ borderStyle: style, borderColor: color }} />
    </div>
  );
}

function MarqueeVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const items = (Array.isArray(config.items) ? config.items : []) as string[];
  const list = items.length > 0 ? items : ['Promo spesial', 'Gratis konsultasi', 'Buka setiap hari'];
  const row = [...list, ...list];
  const contrast = getContrastFromChain([palette.primary], palette, onPrimary);
  return (
    <div aria-hidden="true" className="bk-marquee" style={{ background: 'var(--color-primary)', color: contrast.text }}>
      <div className="bk-marquee-track">
        {[0, 1].map((half) => (
          <div key={half} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {row.map((t, i) => (
              <span key={`${half}-${i}`}>
                <span className="bk-marquee-item">{t}</span>
                <span style={{ margin: '0 26px' }}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Daftar Harga';
  const subtitle = (config.subtitle as string) || '';
  const groups = (Array.isArray(config.groups) ? config.groups : []) as Array<{ key: string; label: string; items: Array<{ name: string; desc: string; price: string }> }>;
  const flatItems = (Array.isArray(config.items) ? config.items : []) as Array<{ name: string; desc: string; price: string }>;
  const [active, setActive] = useState<string>(groups[0]?.key || 'menu');
  const isTabs = layout === 'menu-tabs';
  const current = isTabs ? (groups.find((g) => g.key === active) ?? groups[0]) : undefined;
  const list = isTabs ? (current?.items || []) : flatItems;
  const contrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);

  return (
    <div className="py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: contrast.text }}>{title}</h2>
        {subtitle && <p className="text-center mb-6" style={{ color: contrast.muted }}>{subtitle}</p>}
        {isTabs && groups.length > 0 && (
          <div role="tablist" aria-label="Kategori" className="flex gap-2 flex-wrap justify-center mb-6">
            {groups.map((g) => {
              const key = g.key || g.label || 'menu';
              const selected = key === active;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(key)}
                  className="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
                  style={selected
                    ? { background: 'var(--color-primary)', color: 'var(--color-on-primary)' }
                    : { background: 'var(--color-surface)', color: contrast.text }
                  }
                >
                  {g.label || key}
                </button>
              );
            })}
          </div>
        )}
        <div aria-live="polite">
          {list.length === 0 && (
            <p className="text-sm text-center" style={{ color: contrast.muted }}>
              Belum ada item. Tambahkan lewat panel Section Config.
            </p>
          )}
          {list.map((it, i) => (
            <div key={`${active}-${i}`} className="py-3" style={{ borderBottom: '1px dashed var(--color-border)' }}>
              <div className="flex items-baseline gap-3">
                <h3 className="font-semibold" style={{ color: contrast.text }}>{it.name || `Item ${i + 1}`}</h3>
                <span className="flex-1" aria-hidden="true" />
                <span className="font-bold whitespace-nowrap" style={{ color: contrast.text }}>{it.price || ''}</span>
              </div>
              {it.desc && <p className="text-sm mt-0.5" style={{ color: contrast.muted }}>{it.desc}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepsVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Cara Pesan';
  const subtitle = (config.subtitle as string) || '';
  const items = (Array.isArray(config.items) ? config.items : []) as Array<{ title: string; description: string }>;
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const cardContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);
  const badgeContrast = getContrastFromChain([palette.primary], palette, onPrimary);

  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
        {subtitle && <p className="text-center mb-8" style={{ color: titleContrast.muted }}>{subtitle}</p>}
        <div className="grid grid-cols-1 @md:grid-cols-3 gap-6">
          {items.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-lg" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
              <span className="inline-grid place-items-center w-12 h-12 rounded-full text-lg font-bold mb-3" style={{ background: 'var(--color-primary)', color: badgeContrast.text }}>
                {i + 1}
              </span>
              <h3 className="font-semibold mb-1.5" style={{ color: cardContrast.text }}>{s.title || `Langkah ${i + 1}`}</h3>
              <p className="text-sm" style={{ color: cardContrast.muted }}>{s.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocationVariant({ layout, config, tokens, palette, onPrimary, sectionBg }: { layout: string; config: Record<string, unknown>; tokens: React.CSSProperties; palette: DesignStylePalette; onPrimary: string; sectionBg: string | undefined }) {
  const title = (config.title as string) || 'Kunjungi Kami';
  const address = (config.address as string) || '';
  const note = (config.note as string) || '';
  const buttonText = (config.button_text as string) || '';
  const buttonLink = (config.button_link as string) || '';
  const hours = (Array.isArray(config.hours) ? config.hours : []) as Array<{ days: string; time: string }>;
  const titleContrast = getContrastFromChain([undefined, sectionBg], palette, onPrimary);
  const hoursContrast = getContrastFromChain([palette.surface, undefined, sectionBg], palette, onPrimary);
  const buttonContrast = getContrastFromChain([palette.primary], palette, onPrimary);

  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 @md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: titleContrast.text }}>{title}</h2>
          {address && <p style={{ color: titleContrast.text }}>📍 {address}</p>}
          {note && <p className="mt-2 text-sm" style={{ color: titleContrast.muted }}>{note}</p>}
          {buttonText && buttonLink && (
            <a
              href={buttonLink}
              target={buttonLink.startsWith('http') ? '_blank' : undefined}
              rel={buttonLink.startsWith('http') ? 'noopener' : undefined}
              className="inline-block mt-5 px-6 py-2.5 font-semibold"
              style={{ background: 'var(--color-primary)', color: buttonContrast.text, borderRadius: 'var(--radius)' }}
            >
              {buttonText}
            </a>
          )}
        </div>
        {hours.length > 0 && (
          <ul className="rounded-lg p-5" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
            {hours.map((h, i) => (
              <li key={i} className="flex justify-between gap-4 py-2.5 text-sm font-medium" style={{ borderBottom: '1px solid var(--color-border)', color: hoursContrast.text }}>
                <span>{h.days || `Hari ${i + 1}`}</span>
                <span style={{ color: hoursContrast.muted }}>{h.time || ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
