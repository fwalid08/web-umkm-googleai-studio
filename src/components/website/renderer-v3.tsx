import type { Section, DesignStyle, HeaderConfig, FooterConfig } from '@/lib/builder/types';
import { getOnColor, resolvePalette, type PaletteOverride } from '@/lib/builder/design-styles';
import { SiteHeader } from './site-header';
import { BookingSection } from '@/components/builder/section-renderer';

export interface PublicSiteDataV3 {
  designStyle: DesignStyle;
  /** Override warna tema per-website (dari custom_config.palette_override). */
  paletteOverride?: PaletteOverride | null;
  sections: Section[];
  header: HeaderConfig;
  footer: FooterConfig;
  /** Diisi di situs live agar form booking bisa submit ke API. */
  websiteId?: string;
  seo: {
    title: string;
    description: string;
  };
}

export function PublicWebsiteV3({ site }: { site: PublicSiteDataV3 }) {
  const { designStyle, sections, header, footer, seo } = site;
  const palette = resolvePalette(designStyle, site.paletteOverride);
  // Teruskan style dengan palet efektif agar semua sub-komponen otomatis
  // memakai warna override tanpa ubahan per-baris.
  const effectiveStyle = { ...designStyle, palette };

  const tokens = {
    '--color-primary': palette.primary,
    '--color-secondary': palette.secondary,
    '--color-accent': palette.accent,
    '--color-background': palette.background,
    '--color-surface': palette.surface,
    '--color-text': palette.text,
    '--color-text-muted': palette.textMuted,
    '--color-border': palette.border,
    '--color-on-primary': getOnColor(palette.primary),
    '--font-heading': designStyle.typography.headingFont,
    '--font-body': designStyle.typography.bodyFont,
    '--radius': `${designStyle.components.borderRadius}px`,
  } as React.CSSProperties;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: header.siteTitle,
    description: seo.description,
    image: header.logoUrl || undefined,
  };

  return (
    <div
      className="min-h-screen"
      style={{
        ...tokens,
        // `background` (bukan backgroundColor) agar gradient ikut ter-cat;
        // backgroundColor menolak linear-gradient → halaman jadi putih
        // polos dengan teks putih = tidak terbaca di situs live.
        background: palette.background,
        color: palette.text,
        fontFamily: designStyle.typography.bodyFont,
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeaderV3 header={header} designStyle={effectiveStyle} />

      <main>
        {sections.map((section) => (
          <SectionRendererV3 key={section.id} section={section} designStyle={effectiveStyle} websiteId={site.websiteId} />
        ))}
      </main>

      <SiteFooterV3 footer={footer} designStyle={effectiveStyle} />
    </div>
  );
}

function SiteHeaderV3({ header, designStyle }: { header: HeaderConfig; designStyle: DesignStyle }) {
  return <SiteHeader header={header} designStyle={designStyle} />;
}

function SectionRendererV3({ section, designStyle: effectiveStyle, websiteId }: { section: Section; designStyle: DesignStyle; websiteId?: string }) {
  const sectionStyle: React.CSSProperties = {
    padding: `${section.style.padding.top}px ${section.style.padding.right}px ${section.style.padding.bottom}px ${section.style.padding.left}px`,
    background: section.style.background === 'color' ? section.style.backgroundColor : undefined,
  };

  const renderContent = () => {
    switch (section.type) {
      case 'hero':
        return <HeroSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'features':
        return <FeaturesSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'product_grid':
        return <ProductGridSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'testimonials':
        return <TestimonialsSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'faq':
        return <FaqSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'cta':
        return <CtaSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'contact':
        return <ContactSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'booking':
        return <BookingSection section={section} websiteId={websiteId} />;
      case 'about':
        return <AboutSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'gallery':
        return <GallerySectionV3 section={section} designStyle={effectiveStyle} />;
      case 'video':
        return <VideoSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'team':
        return <TeamSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'pricing':
        return <PricingSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'newsletter':
        return <NewsletterSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'divider':
        return <DividerSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'marquee':
        return <MarqueeSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'menu_board':
        return <MenuBoardSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'steps':
        return <StepsSectionV3 section={section} designStyle={effectiveStyle} />;
      case 'location':
        return <LocationSectionV3 section={section} designStyle={effectiveStyle} />;
      default:
        return null;
    }
  };

  return (
    <div style={sectionStyle}>
      {renderContent()}
    </div>
  );
}

function HeroSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const align = (config.text_align as string) || 'center';

  return (
    <div className="py-20 px-6" style={{ textAlign: align as 'left' | 'center' | 'right' }}>
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{
            fontFamily: designStyle.typography.headingFont,
            fontWeight: designStyle.typography.headingWeight,
            color: designStyle.palette.text,
            textTransform: designStyle.effects.uppercaseHeadings ? 'uppercase' : undefined,
          }}
        >
          {(config.headline as string) || 'Selamat Datang'}
        </h1>
        <p className="text-lg mb-8" style={{ color: designStyle.palette.textMuted }}>
          {(config.subheadline as string) || 'Deskripsi singkat'}
        </p>
        {(config.cta_text as string) && (
          <a
            href={(config.cta_link as string) || '#'}
            className="inline-block px-8 py-3 font-medium"
            style={{ background: designStyle.palette.primary, color: 'var(--color-on-primary)', borderRadius: `${designStyle.components.borderRadius}px` }}
          >
            {config.cta_text as string}
          </a>
        )}
      </div>
    </div>
  );
}

function FeaturesSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const items = (config.items as Array<{ icon: string; title: string; description: string }>) || [];

  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {(config.title as string) || 'Fitur Kami'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-6 text-center"
              style={{ background: designStyle.palette.surface, borderRadius: `${designStyle.components.borderRadius}px` }}
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: designStyle.palette.text }}>
                {item.title}
              </h3>
              <p className="text-sm" style={{ color: designStyle.palette.textMuted }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductGridSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const columns = (config.columns as number) || 4;

  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {(config.title as string) || 'Produk Kami'}
        </h2>
        <div
          className="pg-grid grid gap-6"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 border"
              style={{
                background: designStyle.palette.surface,
                borderColor: designStyle.palette.border,
                borderRadius: `${designStyle.components.borderRadius}px`,
              }}
            >
              <div className="aspect-square bg-muted rounded mb-4" style={{ borderRadius: `${designStyle.components.borderRadius}px` }} />
              <div className="h-5 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const items = (config.items as Array<{ name: string; text: string; rating: number }>) || [];

  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {(config.title as string) || 'Testimonials'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-6 border"
              style={{
                background: designStyle.palette.surface,
                borderColor: designStyle.palette.border,
                borderRadius: `${designStyle.components.borderRadius}px`,
              }}
            >
              <p className="mb-4" style={{ color: designStyle.palette.text }}>
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full bg-muted"
                  style={{ borderRadius: '50%' }}
                />
                <div>
                  <p className="font-semibold" style={{ color: designStyle.palette.text }}>
                    {item.name}
                  </p>
                  <div className="text-yellow-500">{'★'.repeat(item.rating)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const items = (config.items as Array<{ question: string; answer: string }>) || [];

  return (
    <div className="py-16 px-6 max-w-3xl mx-auto">
      <h2
        className="text-3xl font-bold text-center mb-12"
        style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
      >
        {(config.title as string) || 'FAQ'}
      </h2>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-4 border"
            style={{
              background: designStyle.palette.surface,
              borderColor: designStyle.palette.border,
              borderRadius: `${designStyle.components.borderRadius}px`,
            }}
          >
            <h3 className="font-semibold mb-2" style={{ color: designStyle.palette.text }}>
              {item.question}
            </h3>
            <p className="text-sm" style={{ color: designStyle.palette.textMuted }}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;

  return (
    <div
      className="py-16 px-6 text-center"
      style={{ background: designStyle.palette.primary, borderRadius: `${designStyle.components.borderRadius}px` }}
    >
      <div className="max-w-2xl mx-auto">
        <h2
          className="text-3xl font-bold mb-4"
          style={{ fontFamily: designStyle.typography.headingFont, color: 'var(--color-on-primary)' }}
        >
          {(config.title as string) || 'Siap Memulai?'}
        </h2>
        <p className="text-lg mb-8" style={{ color: 'var(--color-on-primary)', opacity: 0.85 }}>
          {(config.subtitle as string) || 'Hubungi kami sekarang'}
        </p>
        <a
          href={(config.button_link as string) || '#'}
          className="inline-block px-8 py-3 font-medium"
          style={{ background: 'var(--color-on-primary)', color: designStyle.palette.primary, borderRadius: `${designStyle.components.borderRadius}px` }}
        >
          {config.button_text as string}
        </a>
      </div>
    </div>
  );
}

function ContactSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;

  return (
    <div className="py-16 px-6 max-w-2xl mx-auto">
      <h2
        className="text-3xl font-bold text-center mb-4"
        style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
      >
        {(config.title as string) || 'Hubungi Kami'}
      </h2>
      <p className="text-center mb-8" style={{ color: designStyle.palette.textMuted }}>
        {(config.subtitle as string) || 'Kirim pesan kepada kami'}
      </p>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Nama"
          className="w-full px-4 py-3 border"
          style={{ borderColor: designStyle.palette.border, borderRadius: `${designStyle.components.borderRadius}px`, background: designStyle.palette.surface }}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-3 border"
          style={{ borderColor: designStyle.palette.border, borderRadius: `${designStyle.components.borderRadius}px`, background: designStyle.palette.surface }}
        />
        <textarea
          placeholder="Pesan"
          rows={4}
          className="w-full px-4 py-3 border"
          style={{ borderColor: designStyle.palette.border, borderRadius: `${designStyle.components.borderRadius}px`, background: designStyle.palette.surface }}
        />
        <button
          className="w-full py-3 font-medium"
          style={{ background: designStyle.palette.primary, color: 'var(--color-on-primary)', borderRadius: `${designStyle.components.borderRadius}px` }}
        >
          Kirim Pesan
        </button>
      </div>
    </div>
  );
}

function AboutSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;

  return (
    <div className="py-16 px-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
          >
            {(config.title as string) || 'Tentang Kami'}
          </h2>
          <p className="text-lg" style={{ color: designStyle.palette.textMuted }}>
            {(config.content as string) || 'Deskripsi tentang kami'}
          </p>
        </div>
        <div
          className="aspect-video bg-muted"
          style={{ borderRadius: `${designStyle.components.borderRadius}px` }}
        />
      </div>
    </div>
  );
}

function GallerySectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const images = (config.images as string[]) || [];

  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {(config.title as string) || 'Galeri'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(images.length > 0 ? images : ['', '', '', '']).map((img, idx) => (
            <div
              key={idx}
              className="aspect-square bg-muted"
              style={{ borderRadius: `${designStyle.components.borderRadius}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;

  return (
    <div className="py-16 px-6 max-w-4xl mx-auto">
      {(config.title as string) && (
        <h2
          className="text-3xl font-bold text-center mb-8"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {config.title as string}
        </h2>
      )}
      <div
        className="aspect-video bg-muted flex items-center justify-center"
        style={{ borderRadius: `${designStyle.components.borderRadius}px` }}
      >
        <div className="text-6xl">▶</div>
      </div>
    </div>
  );
}

function TeamSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const members = (config.members as Array<{ name: string; role: string; image: string }>) || [];

  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {(config.title as string) || 'Tim Kami'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {members.map((member, idx) => (
            <div key={idx} className="text-center">
              <div
                className="w-24 h-24 bg-muted mx-auto mb-4"
                style={{ borderRadius: '50%' }}
              />
              <h3 className="font-semibold" style={{ color: designStyle.palette.text }}>
                {member.name}
              </h3>
              <p className="text-sm" style={{ color: designStyle.palette.textMuted }}>
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;
  const items = (config.items as Array<{ name: string; price: string; features: string[] }>) || [];

  return (
    <div className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-12"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {(config.title as string) || 'Harga'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-6 border text-center"
              style={{
                background: designStyle.palette.surface,
                borderColor: designStyle.palette.border,
                borderRadius: `${designStyle.components.borderRadius}px`,
              }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: designStyle.palette.text }}>
                {item.name}
              </h3>
              <p className="text-3xl font-bold mb-6" style={{ color: designStyle.palette.primary }}>
                {item.price}
              </p>
              <ul className="space-y-3 mb-8">
                {item.features.map((feature, fIdx) => (
                  <li key={fIdx} className="text-sm" style={{ color: designStyle.palette.textMuted }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <button
                className="w-full py-3 font-medium"
                style={{ background: designStyle.palette.primary, color: 'var(--color-on-primary)', borderRadius: `${designStyle.components.borderRadius}px` }}
              >
                Pilih
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewsletterSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;

  return (
    <div
      className="py-16 px-6 text-center"
      style={{ background: designStyle.palette.surface, borderRadius: `${designStyle.components.borderRadius}px` }}
    >
      <div className="max-w-xl mx-auto">
        <h2
          className="text-3xl font-bold mb-4"
          style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}
        >
          {(config.title as string) || 'Newsletter'}
        </h2>
        <p className="text-lg mb-8" style={{ color: designStyle.palette.textMuted }}>
          {(config.subtitle as string) || 'Berlangganan untuk update terbaru'}
        </p>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder={(config.placeholder as string) || 'Email Anda'}
            className="flex-1 px-4 py-3 border"
            style={{ borderColor: designStyle.palette.border, borderRadius: `${designStyle.components.borderRadius}px`, background: designStyle.palette.background }}
          />
          <button
            className="px-6 py-3 font-medium"
            style={{ background: designStyle.palette.primary, color: 'var(--color-on-primary)', borderRadius: `${designStyle.components.borderRadius}px` }}
          >
            {config.button_text as string}
          </button>
        </div>
      </div>
    </div>
  );
}

function DividerSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const config = section.config;

  if (config.height) {
    return <div style={{ height: `${config.height}px` }} />;
  }

  return (
    <div className="py-4 px-6">
      <hr
        style={{
          borderStyle: (config.style as string) || 'solid',
          borderColor: (config.color as string) || designStyle.palette.border,
        }}
      />
    </div>
  );
}

function SiteFooterV3({ footer, designStyle }: { footer: FooterConfig; designStyle: DesignStyle }) {
  // Token {year} selalu jadi tahun berjalan (seperti referensi).
  const footerText = footer.text.replace('{year}', String(new Date().getFullYear()));
  const variant = footer.style || 'simple';
  const nav = footer.navItems.filter((n) => n.enabled);
  const socials = ['IG', 'FB', 'TW', 'WA'];

  const socialRow = (centered = false) =>
    footer.showSocial && (
      <div className={`flex items-center gap-3 ${centered ? 'justify-center' : ''}`}>
        {socials.map((social) => (
          <div
            key={social}
            className="w-8 h-8 flex items-center justify-center text-xs font-medium"
            style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary), borderRadius: `${designStyle.components.borderRadius}px` }}
          >
            {social}
          </div>
        ))}
      </div>
    );

  return (
    <footer
      className="border-t px-6 py-12"
      style={{ background: designStyle.palette.surface, borderColor: designStyle.palette.border }}
    >
      <div className="max-w-6xl mx-auto">
        {variant === 'minimal' ? (
          <p className="text-sm text-center" style={{ color: designStyle.palette.textMuted }}>
            {footerText}
          </p>
        ) : variant === 'centered' ? (
          /* Varian "Brand Tengah": inisial brand besar + ornamen. */
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center font-bold text-lg shadow-md"
              style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary), borderRadius: `${designStyle.components.borderRadius}px` }}
            >
              {(footerText || 'T').charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-semibold" style={{ color: designStyle.palette.text }}>
              {footerText}
            </p>
            <span aria-hidden="true" className="text-xs tracking-[0.4em]" style={{ color: designStyle.palette.primary }}>✦ ✦ ✦</span>
            {nav.length > 0 && (
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {nav.map((item) => (
                  <a key={item.id} href={item.url} className="text-sm font-medium hover:opacity-80 transition-opacity" style={{ color: designStyle.palette.textMuted }}>
                    {item.label}
                  </a>
                ))}
              </nav>
            )}
            {socialRow(true)}
          </div>
        ) : variant === 'columns' ? (
          <div>
            {/* Aksen gradasi khas varian kolom */}
            <div
              aria-hidden="true"
              className="h-1.5 rounded-full mb-8"
              style={{ background: `linear-gradient(90deg, ${designStyle.palette.primary}, ${designStyle.palette.accent})` }}
            />
            <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <p className="text-sm font-semibold mb-2" style={{ color: designStyle.palette.text }}>
                {footerText}
              </p>
              {(footer.address || footer.phone || footer.email) && (
                <div className="text-sm space-y-1" style={{ color: designStyle.palette.textMuted }}>
                  {footer.address && <p>📍 {footer.address}</p>}
                  {footer.phone && <p>📞 {footer.phone}</p>}
                  {footer.email && <p>✉️ {footer.email}</p>}
                </div>
              )}
            </div>
            <nav aria-label="Navigasi footer">
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: designStyle.palette.textMuted }}>
                Menu
              </p>
              <ul className="space-y-2">
                {nav.map((item) => (
                  <li key={item.id}>
                    <a href={item.url} className="text-sm hover:opacity-80 transition-opacity" style={{ color: designStyle.palette.text }}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: designStyle.palette.textMuted }}>
                Ikuti Kami
              </p>
              {socialRow()}
            </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm" style={{ color: designStyle.palette.textMuted }}>
              {footerText}
            </p>
            {nav.length > 0 && (
              <nav className="flex items-center gap-6">
                {nav.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    className="text-sm hover:opacity-80 transition-opacity"
                    style={{ color: designStyle.palette.textMuted }}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            )}
            {socialRow()}
          </div>
        )}
      </div>
    </footer>
  );
}

function MarqueeSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const items = (section.config.items as string[]) || [];
  const list = items.length > 0 ? items : ['Promo spesial', 'Gratis konsultasi', 'Buka setiap hari'];
  const row = [...list, ...list];
  return (
    <div aria-hidden="true" className="bk-marquee" style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary) }}>
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

interface MenuBoardItemV3 {
  name?: string;
  desc?: string;
  price?: string;
}

interface MenuBoardGroupV3 {
  key?: string;
  label?: string;
  items?: MenuBoardItemV3[];
}

function MenuBoardSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const c = section.config;
  const isTabs = section.variant !== 'menu-list';
  const groups = (Array.isArray(c.groups) ? c.groups : []) as MenuBoardGroupV3[];
  const flatItems = (Array.isArray(c.items) ? c.items : []) as MenuBoardItemV3[];
  const active = groups[0]?.key || 'menu';
  const current = isTabs ? (groups.find((g) => g.key === active) ?? groups[0]) : undefined;
  const list: MenuBoardItemV3[] = isTabs ? ((current?.items as MenuBoardItemV3[]) || []) : flatItems;
  const r = `${designStyle.components.borderRadius}px`;

  return (
    <div className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}>
          {(c.title as string) || 'Daftar Harga'}
        </h2>
        {(c.subtitle as string) && (
          <p className="text-center mb-8" style={{ color: designStyle.palette.textMuted }}>{c.subtitle as string}</p>
        )}
        {isTabs && groups.length > 0 && (
          <div role="tablist" aria-label="Kategori" className="flex gap-2 flex-wrap justify-center mb-8">
            {groups.map((g) => (
              <span
                key={g.key || g.label}
                className="px-5 py-2 rounded-full text-sm font-semibold"
                style={{ background: designStyle.palette.surface, color: designStyle.palette.text, borderRadius: r }}
              >
                {g.label || g.key}
              </span>
            ))}
          </div>
        )}
        <div>
          {list.map((it, i) => (
            <div key={i} className="py-4" style={{ borderBottom: `1px dashed ${designStyle.palette.border}` }}>
              <div className="flex items-baseline gap-3">
                <h3 className="font-semibold text-lg" style={{ color: designStyle.palette.text }}>{it.name || `Item ${i + 1}`}</h3>
                <span className="flex-1" aria-hidden="true" />
                <span className="font-bold whitespace-nowrap" style={{ color: designStyle.palette.primary }}>{it.price || ''}</span>
              </div>
              {it.desc && <p className="text-sm mt-1" style={{ color: designStyle.palette.textMuted }}>{it.desc}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepsSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const c = section.config;
  const items = (Array.isArray(c.items) ? c.items : []) as Array<{ title?: string; description?: string }>;
  const r = `${designStyle.components.borderRadius}px`;
  return (
    <div className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}>
          {(c.title as string) || 'Cara Pesan'}
        </h2>
        {(c.subtitle as string) && (
          <p className="text-center mb-10 text-lg" style={{ color: designStyle.palette.textMuted }}>{c.subtitle as string}</p>
        )}
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((s, i) => (
            <div key={i} className="text-center p-8" style={{ background: designStyle.palette.surface, borderRadius: r }}>
              <span
                className="inline-grid place-items-center w-14 h-14 rounded-full text-xl font-bold mb-4"
                style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary) }}
              >
                {i + 1}
              </span>
              <h3 className="font-bold text-lg mb-2" style={{ color: designStyle.palette.text }}>{s.title || `Langkah ${i + 1}`}</h3>
              <p style={{ color: designStyle.palette.textMuted }}>{s.description || ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LocationSectionV3({ section, designStyle }: { section: Section; designStyle: DesignStyle }) {
  const c = section.config;
  const hours = (Array.isArray(c.hours) ? c.hours : []) as Array<{ days?: string; time?: string }>;
  const buttonLink = (c.button_link as string) || '';
  const r = `${designStyle.components.borderRadius}px`;
  return (
    <div className="py-16 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
        <div>
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text }}>
            {(c.title as string) || 'Kunjungi Kami'}
          </h2>
          {(c.address as string) && <p className="text-lg" style={{ color: designStyle.palette.text }}>📍 {c.address as string}</p>}
          {(c.note as string) && <p className="mt-3" style={{ color: designStyle.palette.textMuted }}>{c.note as string}</p>}
          {(c.button_text as string) && buttonLink && (
            <a
              href={buttonLink}
              target={buttonLink.startsWith('http') ? '_blank' : undefined}
              rel={buttonLink.startsWith('http') ? 'noopener' : undefined}
              className="inline-block mt-6 px-7 py-3 font-semibold"
              style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary), borderRadius: r }}
            >
              {c.button_text as string}
            </a>
          )}
        </div>
        {hours.length > 0 && (
          <ul className="p-6" style={{ background: designStyle.palette.surface, borderRadius: r }}>
            {hours.map((h, i) => (
              <li
                key={i}
                className="flex justify-between gap-4 py-3 font-medium"
                style={{ borderBottom: `1px solid ${designStyle.palette.border}`, color: designStyle.palette.text }}
              >
                <span>{h.days || `Hari ${i + 1}`}</span>
                <span style={{ color: designStyle.palette.textMuted }}>{h.time || ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
