'use client';

import { useState, type ReactNode } from 'react';
import { Menu, X, Phone, Mail, ChevronDown } from 'lucide-react';
import { getOnColor } from '@/lib/builder/design-styles';
import { resolveContentWidthClass } from '@/lib/builder/chrome';
import { VariantHtmlRenderer } from '@/components/builder/variant-html-renderer';
import type { ConfigField } from '@/lib/builder/template-types';

export interface HeaderPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface HeaderLink {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  /** Submenu 1 level (dropdown). Tidak boleh punya cucu. */
  children?: HeaderLink[];
}

export interface SiteHeaderProps {
  variant: { id: string; name: string; layout: string; html?: string; configFields?: ConfigField[] };
  config: Record<string, unknown>;
  palette: HeaderPalette;
  /** Radius tombol/kartu dari tema template. */
  radius: number;
  /** Lebar kanvas < 640px → nav desktop disembunyikan, dipakai dropdown. */
  compact?: boolean;
  /** Kanvas sudah di-scroll > 50px → header hero-overlay jadi solid. */
  navSolid?: boolean;
  /**
   * Komponen menu mobile milik live site (MobileDrawer). Kalau diisi, dipakai
   * apa adanya; kalau tidak, komponen memakai dropdown hamburger sendiri.
   * Ini satu-satunya perbedaan perilaku antara kanvas dan live site.
   */
  drawer?: ReactNode;
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const flag = (v: unknown) => v === true;

/**
 * Key unik untuk item nav (lihat navKey di site-footer-shared.tsx —
 * template AI/ZIP kadang mengisi `id` kosong/duplikat).
 */
const navKey = (id: unknown, index: number) =>
  `${typeof id === 'string' && id ? id : 'nav'}-${index}`;

/**
 * Header website — SATU sumber kebenaran untuk kanvas editor maupun live site.
 *
 * Tujuh layout yang umum dipakai website modern:
 * standard · floating · hero-overlay · split-nav · with-topbar · glass · minimal
 *
 * Semua warna diturunkan dari `palette` template, jadi varian yang sama
 * otomatis menyesuaikan diri di setiap template tanpa kode tambahan.
 */
export function SiteHeader({
  variant,
  config,
  palette,
  radius,
  compact = false,
  navSolid = false,
  drawer,
}: SiteHeaderProps) {
  // v3.0: varian dengan `html` kustom dirender langsung dari HTML template.
  if (typeof variant.html === 'string' && variant.html.trim().length > 0) {
    return (
      <VariantHtmlRenderer
        type="header"
        variantId={variant.id}
        html={variant.html}
        config={config}
        configFields={variant.configFields ?? []}
      />
    );
  }
  const onPrimary = getOnColor(palette.primary);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = (Array.isArray(config.navItems) ? config.navItems : []) as HeaderLink[];
  const links = navItems.filter((item) => item.enabled);
  const layout = variant.layout;

  const siteTitle = str(config.siteTitle, 'Nama Toko') || 'Nama Toko';
  const tagline = str(config.tagline);
  const logoUrl = str(config.logoUrl);
  const ctaText = str(config.ctaText, 'Hubungi Kami') || 'Hubungi Kami';
  const ctaLink = str(config.ctaLink, '#') || '#';
  const showCta = flag(config.showCta);
  // Hormati opsi "Header menempel" seperti di live site (default menempel).
  const sticky = config.sticky !== false;
  const topbarText = str(config.topbarText);

  /* ---------- Lebar konten ----------
     Isi header (nama web, menu, CTA) dibox agar tidak terdistribusi ke tepi
     layar pada monitor lebar — sama seperti isi section dan footer.

     ATURAN ALIGNMENT (penting, jangan dibalik): padding horizontal tetap di
     elemen LUAR (<header>), yang di-box hanya baris isinya. Dengan begitu
     brand mulai persis satu garis dengan isi section & footer. Kalau padding
     ikut masuk ke dalam wrapper, konten akan bergeser 24px ke kanan.

     Latar/border <header> tetap edge-to-edge — itu memang tampilan bar. */
  const box = resolveContentWidthClass(config.contentWidth);

  // Hanya hero-overlay yang transparan saat belum scroll (khusus kanvas).
  const isTransparent = layout === 'hero-overlay' && !navSolid;
  const textShadow = isTransparent
    ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
    : undefined;

  /* ---------- Sub-elemen yang dipakai bersama oleh beberapa layout ---------- */

  const logoMark = (size: 'sm' | 'md' | 'lg' = 'md') => {
    if (logoUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={siteTitle}
          className={size === 'lg' ? 'h-11 w-auto object-contain' : size === 'sm' ? 'h-7 w-auto object-contain' : 'h-8 w-auto object-contain'}
        />
      );
    }
    const box = size === 'lg' ? 'w-11 h-11 text-lg' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm';
    return (
      <div
        className={`${box} flex items-center justify-center font-bold shrink-0`}
        style={{ background: palette.primary, color: onPrimary, borderRadius: `${radius}px` }}
      >
        {siteTitle.charAt(0).toUpperCase()}
      </div>
    );
  };

  const ctaButton = (size: 'sm' | 'md' = 'md') => (
    <a
      href={ctaLink}
      className={`${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-[13px]'} font-medium shrink-0`}
      style={{ background: palette.primary, color: onPrimary, borderRadius: `${radius}px`, textShadow }}
    >
      {ctaText}
    </a>
  );

  /**
   * Menu mobile — HANYA untuk layar sempit (<640px).
   *
   * Bila live site menyuntik `drawer` (MobileDrawer) kita pakai itu; komponen
   * itu sendiri sudah `md:hidden`. Bila tidak (kanvas editor) kita pakai
   * dropdown ringkas, dan wrapper-nya disembunyikan di atas 640px lewat
   * container query (`@max-[640px]`) supaya sesuai aturan yang sama: menu
   * link desktop yang tampil di layar lebar, hamburger hanya di mobile.
   */
  const mobileMenu = (opts: { navText?: string } = {}) => {
    if (drawer) return drawer;
    if (links.length === 0) return null;
    return (
      <div className="relative shrink-0 hidden @max-[640px]:block">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={menuOpen}
          className="p-2 -mr-1 rounded-lg"
          style={{ color: opts.navText ?? palette.text, textShadow }}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-xl p-1.5 z-30"
            style={{ background: palette.surface, borderColor: palette.border }}
          >
            {links.slice(0, 7).map((item, i) => {
              const kids = (item.children ?? []).filter((c) => c.enabled);
              return (
                <div key={navKey(item.id, i)}>
                  <a
                    href={item.url}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-medium rounded-lg hover:opacity-80"
                    style={{ color: palette.text }}
                  >
                    {item.label || 'Link'}
                  </a>
                  {/* Submenu ditampilkan flat-indent supaya kanvas ikut
                      meniru MobileDrawer (live site) yang punya dropdown. */}
                  {kids.map((kid, ki) => (
                    <a
                      key={navKey(kid.id, ki)}
                      href={kid.url}
                      onClick={() => setMenuOpen(false)}
                      className="block py-1.5 pl-6 pr-3 text-[13px] rounded-lg hover:opacity-80"
                      style={{ color: palette.textMuted }}
                    >
                      {kid.label || 'Link'}
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /**
   * Satu renderer link untuk desktop nav. Bila punya anak aktif → jadi
   * dropdown (group-hover + focus-within supaya tetap bisa diakses keyboard).
   * Mobile tidak lewat sini: `MobileDrawer` sudah menangani submenu sendiri.
   */
  const navLink = (item: HeaderLink, index: number, navText?: string) => {
    const kids = (item.children ?? []).filter((c) => c.enabled);
    const linkClass = 'text-sm font-medium hover:opacity-80 transition-opacity';

    if (kids.length === 0) {
      return (
        <a
          key={navKey(item.id, index)}
          href={item.url}
          className={linkClass}
          style={{ color: navText ?? palette.text, textShadow }}
        >
          {item.label || 'Link'}
        </a>
      );
    }

    return (
      <div key={navKey(item.id, index)} className="relative group">
        <a
          href={item.url}
          className={`${linkClass} inline-flex items-center gap-1`}
          style={{ color: navText ?? palette.text, textShadow }}
          aria-haspopup="true"
        >
          {item.label || 'Link'}
          <ChevronDown className="w-3.5 h-3.5" />
        </a>
        <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block">
          <div
            className="min-w-48 rounded-xl border shadow-xl p-1.5"
            style={{ background: palette.surface, borderColor: palette.border }}
          >
            {kids.map((kid, ki) => (
              <a
                key={navKey(kid.id, ki)}
                href={kid.url}
                className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:opacity-80"
                style={{ color: palette.text }}
              >
                {kid.label || 'Link'}
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Nav horizontal desktop; disembunyikan di kanvas sempit. Opsi `gap`/`max`
   * dipakai layout dengan ruang terbatas (mis. bar mengambang "floating")
   * supaya link tidak membuat bar meluber.
   */
  const desktopNav = ({ gap = 'gap-5', max = 5 }: { gap?: string; max?: number } = {}) => (
    <nav className={`hidden @[640px]:flex items-center ${gap} shrink-0`} aria-label="Navigasi website">
      {links.slice(0, max).map((item, i) => navLink(item, i))}
    </nav>
  );

  const barStyle: React.CSSProperties = {
    background: isTransparent ? 'transparent' : palette.surface,
    borderBottom: isTransparent ? '1px solid transparent' : `1px solid ${palette.border}`,
    transition: 'background .3s',
  };

  /* ============================ Layout 1: FLOATING ============================
     Bar mengambang rounded dengan bayangan: brand di kiri, menu navigasi +
     CTA pil di kanan.
     Menu desktop self-hide di bawah 640px (container query) sementara tombol
     hamburger (dropdown di kanvas / drawer di live site) tetap ikut dirender,
     jadi navigasi mobile tidak pernah hilang. */
  if (layout === 'floating') {
    return (
      <div className={sticky ? 'px-3 pt-2.5 sticky top-0 z-20' : 'px-3 pt-2.5'}>
        {/* Kartu rounded-nya yang di-box, bukan isi di dalamnya: pada layar
            lebar bar melayang tidak boleh melar 100% (pola yang sama dengan
            renderer versi lama). */}
        <div
          className={`mx-auto ${box} w-full flex items-center justify-between gap-3 px-3.5 py-2.5 shadow-lg`}
          style={{ background: palette.surface, border: `1px solid ${palette.border}`, borderRadius: '16px' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {logoMark('sm')}
            <h1 className="text-[13px] font-bold truncate" style={{ color: palette.text, textShadow }}>
              {siteTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {desktopNav({ gap: 'gap-3.5', max: 4 })}
            {mobileMenu()}
            {showCta && ctaButton('sm')}
          </div>
        </div>
        <div className="h-2" />
      </div>
    );
  }

  /* ============================ Layout 2: MINIMAL =============================
     Logo + hamburger saja, bersih dan simpel. */
  if (layout === 'minimal') {
    return (
      <header
        className={`px-4 sm:px-6 ${sticky ? 'sticky top-0 z-20' : ''}`}
        style={barStyle}
      >
        {/* Baris isi dipisah dari <header> supaya bisa di-box; sebelumnya
            flex + padding menempel langsung ke elemen yang sticky. */}
        <div className={`mx-auto ${box} w-full flex items-center justify-between gap-3 py-3.5`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {logoMark()}
            <h1 className="text-sm font-semibold truncate" style={{ color: palette.text, textShadow }}>
              {siteTitle}
            </h1>
          </div>
          {desktopNav()}
          {mobileMenu()}
        </div>
      </header>
    );
  }

  /* ========================= Layout 3: STANDARD ==============================
     Bar penuh: logo kiri + menu tengah + CTA kanan. */
  if (layout === 'standard') {
    return (
      <header className={`px-4 sm:px-6 ${sticky ? 'sticky top-0 z-20' : 'relative'}`} style={barStyle}>
        <div className={`mx-auto ${box} w-full flex items-center justify-between gap-3 py-3.5`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {logoMark()}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate" style={{ color: palette.text, textShadow }}>
                {siteTitle}
              </h1>
              {tagline && (
                <p className="text-xs truncate" style={{ color: palette.textMuted, textShadow }}>
                  {tagline}
                </p>
              )}
            </div>
          </div>
          {compact ? mobileMenu() : desktopNav()}
          {showCta && ctaButton()}
        </div>
      </header>
    );
  }

  /* ======================== Layout 4: HERO-OVERLAY ===========================
     Transparan di atas hero, solid begitu kanvas di-scroll. */
  if (layout === 'hero-overlay') {
    return (
      <header className={`px-4 sm:px-6 ${sticky ? 'sticky top-0 z-20' : 'relative'}`} style={barStyle}>
        <div className={`mx-auto ${box} w-full flex items-center justify-between gap-3 py-3.5`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {logoMark()}
            <h1 className="text-sm font-semibold truncate" style={{ color: palette.text, textShadow }}>
              {siteTitle}
            </h1>
          </div>
          {compact ? mobileMenu() : desktopNav()}
          {showCta && ctaButton()}
        </div>
      </header>
    );
  }

  /* ========================= Layout 5: SPLIT-NAV =============================
     Pola agency/SaaS: blok brand (logo + nama + tagline) di kiri,
     daftar menu + CTA dirapatkan ke kanan. */
  if (layout === 'split-nav') {
    return (
      <header className={`px-4 sm:px-6 ${sticky ? 'sticky top-0 z-20' : 'relative'}`} style={barStyle}>
        <div className={`mx-auto ${box} w-full flex items-center justify-between gap-4 py-3.5`}>
          <div className="flex items-center gap-3 min-w-0">
            {logoMark('lg')}
            <div className="min-w-0">
              <h1 className="text-base font-extrabold leading-tight truncate" style={{ color: palette.text, textShadow }}>
                {siteTitle}
              </h1>
              {tagline && (
                <p className="text-[11px] truncate" style={{ color: palette.textMuted, textShadow }}>
                  {tagline}
                </p>
              )}
            </div>
          </div>
          {compact ? mobileMenu() : desktopNav()}
          {showCta && ctaButton()}
        </div>
      </header>
    );
  }

  /* ======================= Layout 6: WITH-TOPBAR =============================
     Pola retail & F&B: bar tipis di atas (kontak / promo) lalu bar utama.
     Kalau `topbarText` kosong, bar atas disembunyikan. */
  if (layout === 'with-topbar') {
    return (
      <header className={sticky ? 'sticky top-0 z-20' : 'relative'}>
        {topbarText && (
          /* Bar atas tetap full-bleed (warna primary-nya sengaja sampai tepi),
             hanya isinya yang di-box agar rata dengan bar utama. */
          <div
            className="px-4 sm:px-6 py-1.5"
            style={{ background: palette.primary, color: onPrimary }}
          >
            <div className={`mx-auto ${box} w-full flex items-center justify-between gap-3 text-[11px]`}>
              <span className="truncate">{topbarText}</span>
              <span className="hidden @[640px]:flex items-center gap-3 shrink-0">
                <a href={`tel:${str(config.topbarPhone)}`} className="inline-flex items-center gap-1 hover:opacity-80">
                  <Phone className="w-3 h-3" />
                  {str(config.topbarPhone, '0812-0000-0000')}
                </a>
                <a href={`mailto:${str(config.topbarEmail)}`} className="inline-flex items-center gap-1 hover:opacity-80">
                  <Mail className="w-3 h-3" />
                  {str(config.topbarEmail, 'halo@toko.id')}
                </a>
              </span>
            </div>
          </div>
        )}
        <div className="px-4 sm:px-6" style={barStyle}>
          <div className={`mx-auto ${box} w-full flex items-center justify-between gap-3 py-3`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {logoMark('sm')}
              <h1 className="text-sm font-bold truncate" style={{ color: palette.text, textShadow }}>
                {siteTitle}
              </h1>
            </div>
            {compact ? mobileMenu() : desktopNav()}
            {showCta && ctaButton('sm')}
          </div>
        </div>
      </header>
    );
  }

  /* ========================== Layout 7: GLASS ================================
     Header kaca frosted: semi transparan + blur, konten di belakang tetap
     terlihat samar. Cocok untuk template bernuansa modern/startup. */
  if (layout === 'glass') {
    return (
      <header
        className={`backdrop-blur-md px-4 sm:px-6 ${sticky ? 'sticky top-0 z-20' : 'relative'}`}
        style={{
          background: isTransparent ? 'transparent' : `${palette.surface}cc`,
          borderBottom: isTransparent ? '1px solid transparent' : `1px solid ${palette.border}`,
        }}
      >
        <div className={`mx-auto ${box} w-full flex items-center justify-between gap-3 py-3`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {logoMark('sm')}
            <h1 className="text-sm font-semibold truncate" style={{ color: palette.text, textShadow }}>
              {siteTitle}
            </h1>
          </div>
          {compact ? mobileMenu() : desktopNav()}
          {showCta && ctaButton('sm')}
        </div>
      </header>
    );
  }

  /* Fallback aman: layout tak dikenal (mis. template lama) → standard. */
  return (
    <header className={`px-4 sm:px-6 ${sticky ? 'sticky top-0 z-20' : 'relative'}`} style={barStyle}>
      <div className={`mx-auto ${box} w-full flex items-center justify-between gap-3 py-3.5`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {logoMark()}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate" style={{ color: palette.text }}>
              {siteTitle}
            </h1>
            {tagline && (
              <p className="text-xs truncate" style={{ color: palette.textMuted }}>
                {tagline}
              </p>
            )}
          </div>
        </div>
        {compact ? mobileMenu() : desktopNav()}
        {showCta && ctaButton()}
      </div>
    </header>
  );
}

