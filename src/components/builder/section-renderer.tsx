'use client';

import { useState } from 'react';
import type { Section, DesignStyle, BookingService } from '@/lib/builder/types';
import { getOnColor, resolvePalette, resolveThemeColor, resolveThemeTokensInString } from '@/lib/builder/design-styles';
import { autoFixMutedColor, autoFixTextColor, getSectionEffectiveBackground, resolveButtonColors, resolvePrimaryOnSectionBg } from '@/lib/builder/section-contrast';
import { useBuilderStore } from '@/lib/builder/store';

interface SectionRendererProps {
  section: Section;
  designStyle: DesignStyle;
  /** Diisi saat render di situs live agar form booking bisa submit. Kosong = mode editor (submit nonaktif). */
  websiteId?: string;
  anchorId?: string;
}

export function SectionRenderer({ section, designStyle, websiteId, anchorId }: SectionRendererProps) {
  // Palet efektif = bawaan style + override warna tema user.
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);
  const palette = resolvePalette(designStyle, paletteOverride);
  const onPrimary = getOnColor(palette.primary);
  // Varian baru menyimpan `theme:*` (mis. theme:primary) agar ikut warna
  // bawaan template — resolve di sini supaya kanvas, preview, dan live-site
  // selalu sama tanpa perlu edit manual.
  const resolvedBgColor = resolveThemeColor(section.style.backgroundColor, palette);
  const resolvedBgGradient = resolveThemeTokensInString(section.style.backgroundGradient, palette);

  // Latar efektif section (traverse: style sendiri → halaman). Teks yang
  // duduk langsung di atas section (judul hero, judul blok) di-autofix ke
  // warna paling terbaca (WCAG penuh: heading ≥ 3:1, body ≥ 4.5) agar tetap
  // terlihat dalam view apa pun warna temanya. Kartu interior tetap memakai
  // --color-text vs --color-surface (sudah tervalidasi level palet).
  const effBg = getSectionEffectiveBackground(section.style, palette, palette.background);
  const onSection = autoFixTextColor(palette.text, effBg, true, palette);
  const onSectionMuted = autoFixMutedColor(palette.textMuted, effBg, palette);
  // Tombol dijamin beda dari latar section (traverse hingga section):
  // primary → secondary → accent → surface → text.
  const buttonColors = resolveButtonColors(effBg, palette);
  // Background foto tanpa overlay dipaksa overlay gelap otomatis agar teks
  // terang hasil autofix selalu terbaca di atas foto apa pun.
  const forcedOverlay = section.style.background === 'image' &&
    (!section.style.backgroundOverlay || section.style.backgroundOverlay === 'none')
    ? 'dark' as const
    : section.style.backgroundOverlay;
  const tokens = {
    '--color-primary': palette.primary,
    '--color-secondary': palette.secondary,
    '--color-accent': palette.accent,
    '--color-background': palette.background,
    '--color-surface': palette.surface,
    '--color-text': palette.text,
    '--color-text-muted': palette.textMuted,
    '--color-border': palette.border,
    // Warna teks kontras otomatis di atas primary (ganti teks putih hardcoded
    // yang tenggelam di primary terang seperti retro #e07a5f).
    '--color-on-primary': onPrimary,
    // Teks autofix vs latar efektif section (lihat effBg di bawah).
    '--color-on-section': onSection,
    '--color-on-section-muted': onSectionMuted,
    // Tombol anti-tumpang-tindih vs latar section (lihat buttonColors).
    '--color-button': buttonColors.bg,
    '--color-on-button': buttonColors.fg,
    // Aksen primer sebagai TEKS langsung di atas latar section (mis. harga):
    // dipertahankan bila lolos, di-autofix bila nabrak.
    '--color-primary-on-section': resolvePrimaryOnSectionBg(effBg, palette),
    '--font-heading': designStyle.typography.headingFont,
    '--font-body': designStyle.typography.bodyFont,
    '--radius': `${designStyle.components.borderRadius}px`,
  } as React.CSSProperties;

  const sectionStyle: React.CSSProperties = {
    ...tokens,
    padding: `${section.style.padding.top}px ${section.style.padding.right}px ${section.style.padding.bottom}px ${section.style.padding.left}px`,
    background: section.style.background === 'color' ? resolvedBgColor : undefined,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
  };

  if (section.style.background === 'image' && section.style.backgroundImage) {
    sectionStyle.backgroundImage = `url(${section.style.backgroundImage})`;
    sectionStyle.backgroundSize = section.style.backgroundSize || 'cover';
    sectionStyle.backgroundPosition = 'center';
    if (section.style.backgroundBlur) {
      sectionStyle.filter = `blur(${section.style.backgroundBlur}px)`;
    }
    if (forcedOverlay && forcedOverlay !== 'none') {
      const overlayColors: Record<string, string> = {
        light: 'rgba(255,255,255,0.3)',
        dark: 'rgba(0,0,0,0.5)',
        primary: `${palette.primary}80`,
      };
      sectionStyle.backgroundColor = overlayColors[forcedOverlay];
    }
  }

  if (section.style.background === 'gradient' && resolvedBgGradient) {
    sectionStyle.background = resolvedBgGradient;
  }

  const renderContent = () => {
    switch (section.type) {
      case 'booking':
        return <BookingSection section={section} websiteId={websiteId} />;
      case 'hero':
        return <HeroSection section={section} tokens={tokens} />;
      case 'features':
        return <FeaturesSection section={section} tokens={tokens} />;
      case 'product_grid':
        return <ProductGridSection section={section} tokens={tokens} />;
      case 'testimonials':
        return <TestimonialsSection section={section} tokens={tokens} />;
      case 'faq':
        return <FaqSection section={section} tokens={tokens} />;
      case 'cta':
        return <CtaSection section={section} tokens={tokens} />;
      case 'contact':
        return <ContactSection section={section} tokens={tokens} />;
      case 'about':
        return <AboutSection section={section} tokens={tokens} />;
      case 'gallery':
        return <GallerySection section={section} tokens={tokens} />;
      case 'video':
        return <VideoSection section={section} tokens={tokens} />;
      case 'team':
        return <TeamSection section={section} tokens={tokens} />;
      case 'pricing':
        return <PricingSection section={section} tokens={tokens} />;
      case 'newsletter':
        return <NewsletterSection section={section} tokens={tokens} />;
      case 'divider':
        return <DividerSection section={section} tokens={tokens} />;
      case 'marquee':
        return <MarqueeSection section={section} />;
      case 'menu_board':
        return <MenuBoardSection section={section} />;
      case 'steps':
        return <StepsSection section={section} />;
      case 'location':
        return <LocationSection section={section} />;
      default:
        return <div className="p-8 text-center text-muted-foreground">Section: {section.type}</div>;
    }
  };

  return (
    <div id={anchorId || section.anchorId} style={sectionStyle} className="transition-all">
      {renderContent()}
    </div>
  );
}

function HeroCta({ config }: { config: Section['config'] }) {
  if (!(config.cta_text as string)) return null;
  return (
    <a
      href={(config.cta_link as string) || '#'}
      className="inline-block px-8 py-3 rounded-md font-medium"
      style={{ background: 'var(--color-button)', color: 'var(--color-on-button)', borderRadius: 'var(--radius)' }}
    >
      {config.cta_text as string}
    </a>
  );
}

function HeroSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const align = (config.text_align as string) || 'center';
  const variant = section.variant;

  const headline = (
    <h1
      className="text-4xl font-bold mb-4"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {(config.headline as string) || 'Selamat Datang'}
    </h1>
  );
  const subheadline = (
    <p className="text-lg mb-6" style={{ color: 'var(--color-on-section-muted)' }}>
      {(config.subheadline as string) || 'Deskripsi singkat'}
    </p>
  );
  const image = (config.image as string) || (config.background_image as string) || '';
  const imageBlock = (
    <div
      className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden"
      style={{ borderRadius: 'var(--radius)' }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={(config.headline as string) || 'Hero'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-4xl" aria-hidden="true">🖼️</span>
      )}
    </div>
  );

  // Split: teks di kiri + gambar di kanan, berdampingan.
  if (variant === 'hero-split') {
    return (
      <div className="py-16 px-6 max-w-6xl mx-auto grid grid-cols-1 @md:grid-cols-2 gap-8 items-center">
        <div style={{ textAlign: 'left' }}>
          {headline}
          {subheadline}
          <HeroCta config={config} />
        </div>
        {imageBlock}
      </div>
    );
  }

  // Left / right: tipografi rata kiri / kanan tanpa gambar.
  if (variant === 'hero-left' || variant === 'hero-right') {
    return (
      <div className="py-16 px-6 max-w-6xl mx-auto" style={{ textAlign: variant === 'hero-right' ? 'right' : 'left' }}>
        {headline}
        {subheadline}
        <HeroCta config={config} />
      </div>
    );
  }

  // Card: konten terpusat dalam kartu surface.
  // PENTING: teks di sini memakai warna-vs-kartu (--color-text), BUKAN
  // --color-on-section — node headline/subheadline di atas membawa warna
  // lawan-latar-section yang tenggelam di atas kartu surface.
  if (variant === 'hero-card') {
    return (
      <div className="py-16 px-6">
        <div
          className="max-w-3xl mx-auto text-center px-8 py-12 shadow-lg"
          style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
        >
          <h1
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
          >
            {(config.headline as string) || 'Selamat Datang'}
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {(config.subheadline as string) || 'Deskripsi singkat'}
          </p>
          <div className="mt-2">
            <HeroCta config={config} />
          </div>
        </div>
      </div>
    );
  }

  // Video background: blok gelap + tombol play.
  // Judul memakai putih eksplisit (pasangan tetap dengan bg #111), BUKAN
  // node on-section — warnanya dihitung terhadap latar section.
  if (variant === 'hero-video' || variant === 'hero-video-bg') {
    const videoUrl = (config.video_url as string) || '';
    return (
      <div className="py-20 px-6 text-center" style={{ background: '#111111' }}>
        <div className="max-w-3xl mx-auto" style={{ color: '#ffffff' }}>
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-full grid place-items-center text-2xl"
            style={{ background: 'var(--color-button)', color: 'var(--color-on-button)' }}
            aria-hidden="true"
          >
            ▶
          </div>
          <h1
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: '#ffffff' }}
          >
            {(config.headline as string) || 'Selamat Datang'}
          </h1>
          <p className="text-lg mb-6" style={{ color: '#ffffff', opacity: 0.8 }}>
            {(config.subheadline as string) || 'Deskripsi singkat'}
          </p>
          <div className="mt-4">
            <HeroCta config={config} />
          </div>
          {videoUrl ? <p className="mt-3 text-xs" style={{ opacity: 0.6 }}>{videoUrl}</p> : null}
        </div>
      </div>
    );
  }

  // Default: full-width terpusat (hero-full, hero-bg-image).
  return (
    <div className="py-16 px-6" style={{ textAlign: align as 'left' | 'center' | 'right' }}>
      {headline}
      {subheadline}
      <HeroCta config={config} />
    </div>
  );
}

function FeaturesSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ icon: string; title: string; description: string }>) || [];
  const variant = section.variant;

  const title = (
    <h2
      className="text-2xl font-bold text-center mb-8"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {(config.title as string) || 'Fitur Kami'}
    </h2>
  );
  const cardStyle = { background: 'var(--color-surface)', borderRadius: 'var(--radius)' } as React.CSSProperties;

  // List: baris horizontal, icon di kiri.
  if (variant === 'features-list') {
    return (
      <div className="py-12 px-6">
        {title}
        <div className="space-y-3 max-w-2xl mx-auto">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 p-4 rounded-lg" style={cardStyle}>
              <div className="text-2xl shrink-0" aria-hidden="true">{item.icon}</div>
              <div className="text-left">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Stacked: kartu bernomor urut.
  if (variant === 'features-stacked') {
    return (
      <div className="py-12 px-6">
        {title}
        <div className="space-y-4 max-w-2xl mx-auto">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-4 p-5 rounded-lg" style={cardStyle}>
              <span
                className="shrink-0 w-8 h-8 rounded-full grid place-items-center font-bold"
                style={{ background: 'var(--color-button)', color: 'var(--color-on-button)' }}
                aria-hidden="true"
              >
                {idx + 1}
              </span>
              <div className="text-left">
                <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Masonry: kolom bervariasi.
  if (variant === 'features-masonry') {
    return (
      <div className="py-12 px-6">
        {title}
        <div className="columns-1 @md:columns-2 gap-6 max-w-4xl mx-auto [&>*]:mb-6 [&>*]:break-inside-avoid">
          {items.map((item, idx) => (
            <div key={idx} className="p-6 rounded-lg text-center" style={cardStyle}>
              <div className="text-3xl mb-3" aria-hidden="true">{item.icon}</div>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.description}</p>
              {idx % 2 === 0 && (
                <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)', opacity: 0.75 }}>
                  ✦ ✦ ✦
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid: 2 kolom lebar atau 3 kolom (default).
  const gridCols = variant === 'features-2col' ? '@md:grid-cols-2' : '@md:grid-cols-3';
  return (
    <div className="py-12 px-6">
      {title}
      <div className={`grid grid-cols-1 ${gridCols} gap-6 max-w-4xl mx-auto`}>
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg text-center"
            style={cardStyle}
          >
            <div className="text-3xl mb-3" aria-hidden="true">{item.icon}</div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductGridSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const columns = (config.columns as number) || 4;

  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
      >
        {(config.title as string) || 'Produk Kami'}
      </h2>
      {section.variant === 'product-carousel' ? (
        <div className="flex gap-4 max-w-6xl mx-auto overflow-x-auto snap-x snap-mandatory pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border snap-start shrink-0 w-56"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
            >
              <div className="aspect-square bg-muted rounded mb-3" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="pg-grid grid gap-4 max-w-6xl mx-auto"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-lg border"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
            >
              <div className="aspect-square bg-muted rounded mb-3" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestimonialCard({ item }: { item: { name: string; text: string; rating: number } }) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
    >
      <p className="mb-4" style={{ color: 'var(--color-text)' }}>&ldquo;{item.text}&rdquo;</p>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted" />
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>{item.name}</p>
          <div className="text-yellow-500 text-sm">{'★'.repeat(item.rating)}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ name: string; text: string; rating: number }>) || [];
  const variant = section.variant;

  // Single: satu quote besar terpusat.
  if (variant === 'testimonials-single') {
    const item = items[0];
    return (
      <div className="py-12 px-6 text-center max-w-2xl mx-auto">
        <div className="text-5xl mb-4" style={{ color: 'var(--color-on-section)' }} aria-hidden="true">&ldquo;</div>
        {item ? (
          <>
            <p className="text-xl font-medium mb-4" style={{ color: 'var(--color-on-section)' }}>{item.text}</p>
            <p className="font-semibold" style={{ color: 'var(--color-on-section)' }}>{item.name}</p>
            <div className="text-yellow-500">{'★'.repeat(item.rating)}</div>
          </>
        ) : (
          <p style={{ color: 'var(--color-on-section-muted)' }}>Belum ada testimoni.</p>
        )}
      </div>
    );
  }

  // Carousel: deret geser + titik navigasi.
  if (variant === 'testimonials-carousel') {
    return (
      <div className="py-12 px-6">
        <h2
          className="text-2xl font-bold text-center mb-8"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
        >
          {(config.title as string) || 'Testimonials'}
        </h2>
        <div className="flex gap-4 max-w-4xl mx-auto overflow-x-auto snap-x snap-mandatory pb-2">
          {items.map((item, idx) => (
            <div key={idx} className="snap-start shrink-0 w-72">
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-4" aria-hidden="true">
          {items.map((_, idx) => (
            <span
              key={idx}
              className="w-2 h-2 rounded-full"
              style={{ background: idx === 0 ? 'var(--color-button)' : 'var(--color-border)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Grid (default).
  return (
    <div className="py-12 px-6">
      <h2
        className="text-2xl font-bold text-center mb-8"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
      >
        {(config.title as string) || 'Testimonials'}
      </h2>
      <div className="grid grid-cols-1 @md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {items.map((item, idx) => (
          <TestimonialCard key={idx} item={item} />
        ))}
      </div>
    </div>
  );
}

function FaqSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ question: string; answer: string }>) || [];
  const variant = section.variant;

  const title = (
    <h2
      className="text-2xl font-bold text-center mb-8"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {(config.title as string) || 'FAQ'}
    </h2>
  );
  const cardStyle = {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius)',
  } as React.CSSProperties;

  // Accordion: buka-tutup native (SSR-safe).
  if (variant === 'faq-accordion') {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto">
        {title}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <details
              key={idx}
              className="p-4 rounded-lg border group"
              style={cardStyle}
              open={idx === 0}
            >
              <summary
                className="font-semibold cursor-pointer list-none flex items-center justify-between gap-2"
                style={{ color: 'var(--color-text)' }}
              >
                {item.question}
                <span aria-hidden="true" className="shrink-0 group-open:rotate-45 transition-transform">＋</span>
              </summary>
              <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    );
  }

  // Grid 2 kolom.
  if (variant === 'faq-grid') {
    return (
      <div className="py-12 px-6 max-w-4xl mx-auto">
        {title}
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg border" style={cardStyle}>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.question}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List: jawaban selalu terlihat (default).
  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      {title}
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border"
            style={cardStyle}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.question}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const variant = section.variant;

  const heading = (
    <h2
      className="text-2xl font-bold mb-2"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-primary)' }}
    >
      {(config.title as string) || 'Siap Memulai?'}
    </h2>
  );
  const subheading = (
    <p className="mb-6" style={{ color: 'var(--color-on-primary)', opacity: 0.85 }}>
      {(config.subtitle as string) || 'Hubungi kami sekarang'}
    </p>
  );
  const button = (
    <a
      href={(config.button_link as string) || '#'}
      className="inline-block px-8 py-3 rounded-md font-medium"
      // Tombol dibalik: bg = on-primary, teks = primary → rasio selalu ≥4.5
      style={{ background: 'var(--color-on-primary)', color: 'var(--color-primary)', borderRadius: 'var(--radius)' }}
    >
      {config.button_text as string}
    </a>
  );

  // Card: kartu surface terpusat di atas latar section.
  if (variant === 'cta-card') {
    return (
      <div className="py-12 px-6">
        <div
          className="max-w-2xl mx-auto text-center px-8 py-10 shadow-lg"
          style={{ background: 'var(--color-primary)', borderRadius: 'var(--radius)' }}
        >
          {heading}
          {subheading}
          {button}
        </div>
      </div>
    );
  }

  // Split: teks kiri, tombol kanan.
  if (variant === 'cta-split') {
    return (
      <div className="py-12 px-6" style={{ background: 'var(--color-primary)' }}>
        <div className="max-w-4xl mx-auto flex flex-col @md:flex-row items-center justify-between gap-6 text-center @md:text-left">
          <div>
            {heading}
            <p className="mb-0" style={{ color: 'var(--color-on-primary)', opacity: 0.85 }}>
              {(config.subtitle as string) || 'Hubungi kami sekarang'}
            </p>
          </div>
          <div className="shrink-0">{button}</div>
        </div>
      </div>
    );
  }

  // Banner full-width (default).
  return (
    <div
      className="py-12 px-6 text-center"
      style={{ background: 'var(--color-primary)', borderRadius: 'var(--radius)' }}
    >
      {heading}
      {subheading}
      {button}
    </div>
  );
}

function ContactFormFields() {
  // Input diberi latar surface sendiri: tanpa ini, input transparan
  // mengikuti latar section sehingga teks ketikan tenggelam di latar gelap.
  const inputStyle = {
    borderColor: 'var(--color-border)',
    borderRadius: 'var(--radius)',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
  } as React.CSSProperties;
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Nama"
        className="w-full px-4 py-2 border rounded-md"
        style={inputStyle}
      />
      <input
        type="email"
        placeholder="Email"
        className="w-full px-4 py-2 border rounded-md"
        style={inputStyle}
      />
      <textarea
        placeholder="Pesan"
        rows={4}
        className="w-full px-4 py-2 border rounded-md"
        style={inputStyle}
      />
      <button
        className="w-full py-2 rounded-md font-medium"
        style={{ background: 'var(--color-button)', color: 'var(--color-on-button)', borderRadius: 'var(--radius)' }}
      >
        Kirim Pesan
      </button>
    </div>
  );
}

function ContactInfoPanel({ config }: { config: Section['config'] }) {
  const lines = [
    config.address ? `📍 ${config.address as string}` : '',
    config.phone ? `📞 ${config.phone as string}` : '',
    config.email ? `✉️ ${config.email as string}` : '',
  ].filter(Boolean);
  return (
    <div
      className="p-6 rounded-lg space-y-2 text-sm"
      style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', color: 'var(--color-text)' }}
    >
      <p className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Info Kontak</p>
      {lines.length > 0 ? (
        lines.map((line, idx) => <p key={idx}>{line}</p>)
      ) : (
        <p style={{ color: 'var(--color-text-muted)' }}>Lengkapi alamat/telepon di panel Section Config.</p>
      )}
      <div
        className="aspect-video rounded-md bg-muted grid place-items-center text-2xl"
        style={{ borderRadius: 'var(--radius)' }}
        aria-hidden="true"
      >
        🗺️
      </div>
    </div>
  );
}

function ContactSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const variant = section.variant;

  const heading = (
    <>
      <h2
        className="text-2xl font-bold text-center mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
      >
        {(config.title as string) || 'Hubungi Kami'}
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--color-on-section-muted)' }}>
        {(config.subtitle as string) || 'Kirim pesan kepada kami'}
      </p>
    </>
  );

  // Form + Map: form kiri, panel info/peta kanan.
  if (variant === 'contact-form-map') {
    return (
      <div className="py-12 px-6 max-w-4xl mx-auto">
        {heading}
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-6 items-start">
          <ContactFormFields />
          <ContactInfoPanel config={config} />
        </div>
      </div>
    );
  }

  // Split: info kiri, form kanan.
  if (variant === 'contact-split') {
    return (
      <div className="py-12 px-6 max-w-4xl mx-auto">
        {heading}
        <div className="grid grid-cols-1 @md:grid-cols-2 gap-6 items-start">
          <ContactInfoPanel config={config} />
          <ContactFormFields />
        </div>
      </div>
    );
  }

  // Form saja (default).
  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      {heading}
      <ContactFormFields />
    </div>
  );
}
export function BookingSection({
  section,
  websiteId,
}: {
  section: Section;
  websiteId?: string;
}) {
  const config = section.config;
  const services = (config.services as BookingService[]) || [];
  const split = section.variant === 'booking-split';
  const [form, setForm] = useState({ name: '', phone: '', service: '', date: '', time: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
      setDone((config.success_message as string) || 'Terima kasih! Booking Anda diterima.');
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full px-4 py-2.5 border rounded-md text-sm bg-white';
  const inputStyle = { borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' } as React.CSSProperties;

  const formEl = (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
        <input type="text" required placeholder="Nama lengkap" value={form.name} onChange={set('name')} className={inputCls} style={inputStyle} />
        <input type="tel" required placeholder="No. WhatsApp" value={form.phone} onChange={set('phone')} className={inputCls} style={inputStyle} />
      </div>
      <select required value={form.service} onChange={set('service')} className={inputCls} style={inputStyle}>
        <option value="">— Pilih layanan —</option>
        {services.map((s, i) => (
          <option key={i} value={s.name}>
            {s.name}{s.price ? ` • ${s.price}` : ''}{s.duration ? ` (${s.duration})` : ''}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" required value={form.date} onChange={set('date')} className={inputCls} style={inputStyle} />
        <input type="time" required value={form.time} onChange={set('time')} className={inputCls} style={inputStyle} />
      </div>
      <textarea placeholder="Catatan (opsional)" rows={3} value={form.notes} onChange={set('notes')} className={inputCls} style={inputStyle} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {done ? (
        <p className="text-sm font-medium p-3 rounded-md" style={{ background: 'var(--color-surface)' }}>
          ✅ {done}
        </p>
      ) : (
        <button
          type="submit"
          disabled={loading || !websiteId}
          title={!websiteId ? 'Form aktif setelah website dipublish' : undefined}
          className="w-full py-3 rounded-md font-semibold disabled:opacity-60"
          style={{ background: 'var(--color-button)', color: 'var(--color-on-button)', borderRadius: 'var(--radius)' }}
        >
          {loading ? 'Mengirim…' : '📅 Booking Sekarang'}
        </button>
      )}
      {!websiteId && !done && (
        <p className="text-xs text-center" style={{ color: 'var(--color-on-section-muted)' }}>
          Pratinjau editor — form aktif di situs live setelah publish
        </p>
      )}
    </form>
  );

  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}>
        {(config.title as string) || 'Booking Layanan'}
      </h2>
      <p className="text-center mb-8" style={{ color: 'var(--color-on-section-muted)' }}>
        {(config.subtitle as string) || 'Pilih layanan dan jadwal Anda'}
      </p>
      {split ? (
        <div className="grid grid-cols-1 @md:grid-cols-5 gap-6 items-start">
          <div className="@md:col-span-3">{formEl}</div>
          <div className="@md:col-span-2 p-5 rounded-lg space-y-3 text-sm" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
            {(config.hours as string) && <p>🕘 <span className="font-semibold">Jam buka</span><br />{config.hours as string}</p>}
            {(config.address as string) && <p>📍 <span className="font-semibold">Lokasi</span><br />{config.address as string}</p>}
            {services.length > 0 && (
              <div>
                <p className="font-semibold mb-1">💈 Daftar layanan</p>
                <ul className="space-y-1" style={{ color: 'var(--color-text-muted)' }}>
                  {services.map((s, i) => (
                    <li key={i}>• {s.name} — {s.price}{s.duration ? ` (${s.duration})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-xl mx-auto">{formEl}</div>
      )}
    </div>
  );
}

function AboutSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {  const config = section.config;
  const variant = section.variant;

  const imageUrl = (config.image as string) || '';
  const imageBlock = (
    <div
      className="aspect-video bg-muted rounded-lg overflow-hidden grid place-items-center"
      style={{ borderRadius: 'var(--radius)' }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={(config.title as string) || 'Tentang'} className="w-full h-full object-cover" />
      ) : (
        <span className="text-4xl" aria-hidden="true">🖼️</span>
      )}
    </div>
  );
  const textBlock = (
    <div>
      <h2
        className="text-2xl font-bold mb-4"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
      >
        {(config.title as string) || 'Tentang Kami'}
      </h2>
      <p style={{ color: 'var(--color-on-section-muted)' }}>
        {(config.content as string) || 'Deskripsi tentang kami'}
      </p>
    </div>
  );

  // Centered: gambar di atas, teks terpusat.
  if (variant === 'about-centered') {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto text-center">
        <div className="mb-6">{imageBlock}</div>
        {textBlock}
      </div>
    );
  }

  // Right: teks kiri, gambar kanan. Left (default): gambar kiri.
  const imageFirst = variant !== 'about-right';
  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-8 items-center">
        {imageFirst ? imageBlock : textBlock}
        {imageFirst ? textBlock : imageBlock}
      </div>
    </div>
  );
}

function GalleryTile({ img, ratio, rounded }: { img: string; ratio: string; rounded: string }) {
  return (
    <div className={`${ratio} bg-muted rounded-lg overflow-hidden grid place-items-center`} style={{ borderRadius: rounded }}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="Galeri" className="w-full h-full object-cover" />
      ) : (
        <span className="text-2xl" aria-hidden="true">🖼️</span>
      )}
    </div>
  );
}

function GallerySection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const images = (config.images as string[]) || [];
  const variant = section.variant;
  const radius = 'var(--radius)';

  const title = (
    <h2
      className="text-2xl font-bold text-center mb-8"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {(config.title as string) || 'Galeri'}
    </h2>
  );

  // Masonry: ukuran bervariasi.
  if (variant === 'gallery-masonry') {
    const list = images.length > 0 ? images : ['', '', '', '', '', ''];
    const ratios = ['aspect-square', 'aspect-[4/3]', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-square', 'aspect-[3/4]'];
    return (
      <div className="py-12 px-6">
        {title}
        <div className="columns-2 @md:columns-3 gap-4 max-w-4xl mx-auto [&>*]:mb-4 [&>*]:break-inside-avoid">
          {list.map((img, idx) => (
            <GalleryTile key={idx} img={img} ratio={ratios[idx % ratios.length]} rounded={radius} />
          ))}
        </div>
      </div>
    );
  }

  // Carousel: deret geser.
  if (variant === 'gallery-carousel') {
    const list = images.length > 0 ? images : ['', '', ''];
    return (
      <div className="py-12 px-6">
        {title}
        <div className="flex gap-4 max-w-4xl mx-auto overflow-x-auto snap-x snap-mandatory pb-2">
          {list.map((img, idx) => (
            <div key={idx} className="snap-start shrink-0 w-64">
              <GalleryTile img={img} ratio="aspect-video" rounded={radius} />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1.5 mt-4" aria-hidden="true">
          {list.map((_, idx) => (
            <span
              key={idx}
              className="w-2 h-2 rounded-full"
              style={{ background: idx === 0 ? 'var(--color-button)' : 'var(--color-border)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Grid seragam (default).
  return (
    <div className="py-12 px-6">
      {title}
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {(images.length > 0 ? images : ['', '', '', '']).map((img, idx) => (
          <GalleryTile key={idx} img={img} ratio="aspect-square" rounded={radius} />
        ))}
      </div>
    </div>
  );
}

function toEmbedUrl(raw: string): string {
  const url = (raw || '').trim();
  const watch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

function VideoPlayer({ url }: { url: string }) {
  const embed = toEmbedUrl(url);
  if (!embed) {
    return (
      <div
        className="aspect-video bg-muted rounded-lg flex items-center justify-center"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div className="text-4xl" aria-hidden="true">▶</div>
      </div>
    );
  }
  return (
    <div className="aspect-video rounded-lg overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
      <iframe
        src={embed}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

function VideoSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const variant = section.variant;
  const url = (config.url as string) || '';

  const title = (config.title as string) && (
    <h2
      className="text-2xl font-bold text-center mb-8"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {config.title as string}
    </h2>
  );

  // Background: blok sinematik dengan judul di atas overlay gelap.
  // Judul memakai putih eksplisit (pasangan tetap dengan bg #111).
  if (variant === 'video-bg') {
    return (
      <div className="py-20 px-6 text-center" style={{ background: '#111111' }}>
        <div className="max-w-3xl mx-auto" style={{ color: '#ffffff' }}>
          {(config.title as string) && (
            <h2
              className="text-2xl font-bold text-center mb-8"
              style={{ fontFamily: 'var(--font-heading)', color: '#ffffff' }}
            >
              {config.title as string}
            </h2>
          )}
          <div
            className="w-16 h-16 mx-auto mt-2 rounded-full grid place-items-center text-2xl"
            style={{ background: 'var(--color-button)', color: 'var(--color-on-button)' }}
            aria-hidden="true"
          >
            ▶
          </div>
          {url ? <p className="mt-3 text-xs" style={{ opacity: 0.6 }}>{url}</p> : null}
        </div>
      </div>
    );
  }

  // Centered: video menyempit di tengah.
  if (variant === 'video-centered') {
    return (
      <div className="py-12 px-6 max-w-2xl mx-auto">
        {title}
        <VideoPlayer url={url} />
      </div>
    );
  }

  // Full width (default).
  return (
    <div className="py-12 px-6 max-w-4xl mx-auto">
      {title}
      <VideoPlayer url={url} />
    </div>
  );
}

function TeamAvatar({ member, size }: { member: { name: string; role: string; image: string }; size: string }) {
  if (member.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={member.image} alt={member.name} className={`${size} rounded-full object-cover mx-auto mb-3`} />;
  }
  return <div className={`${size} rounded-full bg-muted mx-auto mb-3`} aria-hidden="true" />;
}

function TeamSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const members = (config.members as Array<{ name: string; role: string; image: string }>) || [];
  const variant = section.variant;

  const title = (
    <h2
      className="text-2xl font-bold text-center mb-8"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {(config.title as string) || 'Tim Kami'}
    </h2>
  );

  // List: baris horizontal foto kiri.
  if (variant === 'team-list') {
    return (
      <div className="py-12 px-6">
        {title}
        <div className="space-y-3 max-w-2xl mx-auto">
          {members.map((member, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 rounded-lg"
              style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
            >
              {member.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.image} alt={member.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-muted shrink-0" aria-hidden="true" />
              )}
              <div className="text-left">
                <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{member.name}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carousel: deret geser.
  if (variant === 'team-carousel') {
    return (
      <div className="py-12 px-6">
        {title}
        <div className="flex gap-6 max-w-4xl mx-auto overflow-x-auto snap-x snap-mandatory pb-2">
          {members.map((member, idx) => (
            <div key={idx} className="text-center snap-start shrink-0 w-44">
              <TeamAvatar member={member} size="w-20 h-20" />
              <h3 className="font-semibold" style={{ color: 'var(--color-on-section)' }}>{member.name}</h3>
              <p className="text-sm" style={{ color: 'var(--color-on-section-muted)' }}>{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Grid (default).
  return (
    <div className="py-12 px-6">
      {title}
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {members.map((member, idx) => (
          <div key={idx} className="text-center">
            <TeamAvatar member={member} size="w-20 h-20" />
            <h3 className="font-semibold" style={{ color: 'var(--color-on-section)' }}>{member.name}</h3>
            <p className="text-sm" style={{ color: 'var(--color-on-section-muted)' }}>{member.role}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const items = (config.items as Array<{ name: string; price: string; features: string[] }>) || [];
  const variant = section.variant;

  const title = (
    <h2
      className="text-2xl font-bold text-center mb-8"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {(config.title as string) || 'Harga'}
    </h2>
  );
  const card = (item: { name: string; price: string; features: string[] }, idx: number, highlight: boolean) => (
    <div
      key={idx}
      className={`p-6 rounded-lg border text-center ${highlight ? 'ring-2 shadow-lg' : ''}`}
      style={{
        background: 'var(--color-surface)',
        borderColor: highlight ? 'var(--color-button)' : 'var(--color-border)',
        borderRadius: 'var(--radius)',
      }}
    >
      {highlight && (
        <span
          className="inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-3"
          style={{ background: 'var(--color-button)', color: 'var(--color-on-button)' }}
        >
          POPULER
        </span>
      )}
      <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{item.name}</h3>
      <p className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>{item.price}</p>
      <ul className="space-y-2 mb-6">
        {item.features.map((feature, fIdx) => (
          <li key={fIdx} className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            ✓ {feature}
          </li>
        ))}
      </ul>
      <button
        className="w-full py-2 rounded-md font-medium"
        style={{ background: 'var(--color-button)', color: 'var(--color-on-button)', borderRadius: 'var(--radius)' }}
      >
        Pilih
      </button>
    </div>
  );

  // Single: satu kartu terpusat.
  if (variant === 'pricing-single' || items.length <= 1) {
    return (
      <div className="py-12 px-6">
        {title}
        <div className="max-w-md mx-auto">
          {items.map((item, idx) => card(item, idx, true))}
        </div>
      </div>
    );
  }

  // Tier jamak: kolom mengikuti jumlah paket, tengah disorot bila 3 paket.
  const cols = items.length === 2 ? '@md:grid-cols-2' : '@md:grid-cols-3';
  return (
    <div className="py-12 px-6">
      {title}
      <div className={`grid grid-cols-1 ${cols} gap-6 max-w-4xl mx-auto`}>
        {items.map((item, idx) => card(item, idx, items.length === 3 && idx === 1))}
      </div>
    </div>
  );
}

function NewsletterSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;
  const variant = section.variant;

  const heading = (
    <h2
      className="text-2xl font-bold mb-2"
      style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}
    >
      {(config.title as string) || 'Newsletter'}
    </h2>
  );
  const subheading = (
    <p className="mb-6" style={{ color: 'var(--color-on-section-muted)' }}>
      {(config.subtitle as string) || 'Berlangganan untuk update terbaru'}
    </p>
  );
  const form = (
    <div className="flex flex-col @sm:flex-row gap-2 max-w-md mx-auto">
      <input
        type="email"
        placeholder={(config.placeholder as string) || 'Email Anda'}
        className="flex-1 px-4 py-2 border rounded-md"
        style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
      />
      <button
        className="px-6 py-2 rounded-md font-medium shrink-0"
        style={{ background: 'var(--color-button)', color: 'var(--color-on-button)', borderRadius: 'var(--radius)' }}
      >
        {config.button_text as string}
      </button>
    </div>
  );

  // Card: kartu surface terpusat dengan bayangan.
  if (variant === 'newsletter-card') {
    return (
      <div className="py-12 px-6">
        <div
          className="max-w-xl mx-auto text-center px-8 py-10 shadow-lg"
          style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}
        >
          <div style={{ color: 'var(--color-text)' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {(config.title as string) || 'Newsletter'}
            </h2>
          </div>
          <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {(config.subtitle as string) || 'Berlangganan untuk update terbaru'}
          </p>
          {form}
        </div>
      </div>
    );
  }

  // Split: teks kiri, form kanan.
  if (variant === 'newsletter-split') {
    return (
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 @md:grid-cols-2 gap-6 items-center">
          <div className="text-center @md:text-left">
            {heading}
            <p style={{ color: 'var(--color-on-section-muted)' }}>
              {(config.subtitle as string) || 'Berlangganan untuk update terbaru'}
            </p>
          </div>
          <div>{form}</div>
        </div>
      </div>
    );
  }

  // Inline (default): terpusat langsung di atas latar section.
  return (
    <div className="py-12 px-6 text-center">
      {heading}
      {subheading}
      {form}
    </div>
  );
}

function DividerSection({ section, tokens }: { section: Section; tokens: React.CSSProperties }) {
  const config = section.config;

  // Spacer: ruang kosong.
  if (section.variant === 'divider-spacer' || config.height) {
    return <div style={{ height: `${(config.height as number) || 80}px` }} />;
  }

  // Image: gambar sebagai pemisah.
  if (section.variant === 'divider-image') {
    const image = (config.image as string) || '';
    return (
      <div className="py-4 px-6 text-center">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            aria-hidden="true"
            className="mx-auto max-w-full"
            style={{ borderRadius: 'var(--radius)' }}
          />
        ) : (
          <div
            className="mx-auto max-w-xs h-16 rounded-lg border-2 border-dashed grid place-items-center text-2xl"
            style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius)' }}
            aria-hidden="true"
          >
            🖼️
          </div>
        )}
      </div>
    );
  }

  // Line (default).
  return (
    <div className="py-4 px-6">
      <hr
        style={{
          borderStyle: (config.style as string) || 'solid',
          // Ikut warna garis tema agar varian baru tidak abu-abu statis.
          borderColor: 'var(--color-border)',
        }}
      />
    </div>
  );
}

function MarqueeSection({ section }: { section: Section }) {
  const rawItems = (section.config.items as Array<{text: string}> | string[]) || [];
  const items = rawItems.map(item => typeof item === 'string' ? item : item.text);
  const list = items.length > 0 ? items : ['Promo spesial', 'Gratis konsultasi', 'Buka setiap hari'];
  const row = [...list, ...list];
  return (
    <div aria-hidden="true" className="bk-marquee" style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>
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

interface MenuBoardItem {
  name?: string;
  desc?: string;
  price?: string;
}

interface MenuBoardGroup {
  key?: string;
  label?: string;
  items?: MenuBoardItem[];
}

function MenuBoardSection({ section }: { section: Section }) {
  const c = section.config;
  const isTabs = section.variant !== 'menu-list';
  const groups = (Array.isArray(c.groups) ? c.groups : []) as MenuBoardGroup[];
  const flatItems = (Array.isArray(c.items) ? c.items : []) as MenuBoardItem[];
  const [active, setActive] = useState<string>(groups[0]?.key || 'menu');
  const current = isTabs ? (groups.find((g) => g.key === active) ?? groups[0]) : undefined;
  const list: MenuBoardItem[] = isTabs ? ((current?.items as MenuBoardItem[]) || []) : flatItems;

  return (
    <div className="py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}>
          {(c.title as string) || 'Daftar Harga'}
        </h2>
        {(c.subtitle as string) && (
          <p className="text-center mb-6" style={{ color: 'var(--color-on-section-muted)' }}>{c.subtitle as string}</p>
        )}
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
                  style={
                    selected
                      ? { background: 'var(--color-button)', color: 'var(--color-on-button)' }
                      : { background: 'var(--color-surface)', color: 'var(--color-text)' }
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
            <p className="text-sm text-center" style={{ color: 'var(--color-on-section-muted)' }}>
              Belum ada item. Tambahkan lewat panel Section Config.
            </p>
          )}
          {list.map((it, i) => (
            <div key={`${active}-${i}`} className="py-3" style={{ borderBottom: '1px dashed var(--color-border)' }}>
              <div className="flex items-baseline gap-3">
                <h3 className="font-semibold" style={{ color: 'var(--color-on-section)' }}>{it.name || `Item ${i + 1}`}</h3>
                <span className="flex-1" aria-hidden="true" />
                <span className="font-bold whitespace-nowrap" style={{ color: 'var(--color-primary-on-section)' }}>{it.price || ''}</span>
              </div>
              {it.desc && <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-section-muted)' }}>{it.desc}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepsSection({ section }: { section: Section }) {
  const c = section.config;
  const items = (Array.isArray(c.items) ? c.items : []) as Array<{ title?: string; description?: string }>;
  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}>
          {(c.title as string) || 'Cara Pesan'}
        </h2>
        {(c.subtitle as string) && (
          <p className="text-center mb-8" style={{ color: 'var(--color-on-section-muted)' }}>{c.subtitle as string}</p>
        )}
        <div className="grid grid-cols-1 @md:grid-cols-3 gap-6">
          {items.map((s, i) => (
            <div key={i} className="text-center p-6 rounded-lg" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
              <span
                className="inline-grid place-items-center w-12 h-12 rounded-full text-lg font-bold mb-3"
                style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
              >
                {i + 1}
              </span>
              <h3 className="font-semibold mb-1.5" style={{ color: 'var(--color-text)' }}>{s.title || `Langkah ${i + 1}`}</h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{s.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocationSection({ section }: { section: Section }) {
  const c = section.config;
  const hours = (Array.isArray(c.hours) ? c.hours : []) as Array<{ days?: string; time?: string }>;
  const buttonLink = (c.button_link as string) || '';
  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 @md:grid-cols-2 gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-section)' }}>
            {(c.title as string) || 'Kunjungi Kami'}
          </h2>
          {(c.address as string) && <p style={{ color: 'var(--color-on-section)' }}>📍 {c.address as string}</p>}
          {(c.note as string) && <p className="mt-2 text-sm" style={{ color: 'var(--color-on-section-muted)' }}>{c.note as string}</p>}
          {(c.button_text as string) && buttonLink && (
            <a
              href={buttonLink}
              target={buttonLink.startsWith('http') ? '_blank' : undefined}
              rel={buttonLink.startsWith('http') ? 'noopener' : undefined}
              className="inline-block mt-5 px-6 py-2.5 font-semibold"
              style={{ background: 'var(--color-button)', color: 'var(--color-on-button)', borderRadius: 'var(--radius)' }}
            >
              {c.button_text as string}
            </a>
          )}
        </div>
        {hours.length > 0 && (
          <ul className="rounded-lg p-5" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)' }}>
            {hours.map((h, i) => (
              <li
                key={i}
                className="flex justify-between gap-4 py-2.5 text-sm font-medium"
                style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <span>{h.days || `Hari ${i + 1}`}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{h.time || ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
