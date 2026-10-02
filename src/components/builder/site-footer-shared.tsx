'use client';

import type { ReactNode } from 'react';
import { getOnColor } from '@/lib/builder/design-styles';
import { VariantHtmlRenderer } from '@/components/builder/variant-html-renderer';
import type { ConfigField } from '@/lib/builder/template-types';

export interface FooterPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  enabled?: boolean;
}

export interface FooterNavGroup {
  id: string;
  title: string;
  items: FooterLink[];
}

export interface SiteFooterProps {
  variant: { id: string; name: string; layout: string; html?: string; configFields?: ConfigField[] };
  config: Record<string, unknown>;
  palette: FooterPalette;
  radius: number;
  /** Lebar kanvas < 640px → kolom footer dirapatkan jadi satu. */
  compact?: boolean;
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

/**
 * Key unik untuk item nav. Template AI/ZIP kadang mengisi `id` kosong atau
 * duplikat — key murni `item.id` memicu warning React "unique key prop".
 * Indeks selalu ditempel agar unik meski id hilang/kembar.
 */
const navKey = (id: unknown, index: number) =>
  `${typeof id === 'string' && id ? id : 'nav'}-${index}`;

/**
 * Footer website — SATU sumber kebenaran untuk kanvas editor & live site
 * (pola yang sama dengan `site-header-shared.tsx`).
 *
 * Aturan konten (berlaku di semua layout):
 * - Brand (logo + nama) dan copyright = INTI → selalu tampil, tanpa toggle.
 * - Navigasi & sosmed = opsional → punya toggle show/hide.
 * - Kontak (alamat/telepon/email) tampil bila diisi.
 *
 * Layout `simple` (inline) memakai `navItems` datar;
 * layout `columns` memakai `navGroups` terkelompok.
 */
export function SiteFooter({ variant, config, palette, radius, compact = false }: SiteFooterProps) {
  // v3.0: varian dengan `html` kustom dirender langsung dari HTML template.
  if (typeof variant.html === 'string' && variant.html.trim().length > 0) {
    return (
      <VariantHtmlRenderer
        type="footer"
        variantId={variant.id}
        html={variant.html}
        config={config}
        configFields={variant.configFields ?? []}
      />
    );
  }
  const onPrimary = getOnColor(palette.primary);
  const layout = variant.layout;

  const footerText = str(config.text).replace('{year}', String(new Date().getFullYear()));
  const siteTitle = str(config.siteTitle, 'Nama Toko') || 'Nama Toko';
  const logoUrl = str(config.logoUrl);

  const nav = ((Array.isArray(config.navItems) ? config.navItems : []) as FooterLink[]).filter(
    (n) => n.enabled !== false,
  );
  const groups = (
    (Array.isArray(config.navGroups) ? config.navGroups : []) as FooterNavGroup[]
  ).filter((g) => (g.items ?? []).some((i) => i.enabled !== false));

  // Toggle: `showNav` default true agar data lama tanpa key ini tetap
  // menampilkan bloknya (backward compatible).
  const showNav = config.showNav !== false;
  const showSocial = config.showSocial === true;

  const address = str(config.address);
  const phone = str(config.phone);
  const email = str(config.email);
  const hasContact = Boolean(address || phone || email);
  const socials = ['IG', 'FB', 'TW', 'WA'];

  /** Blok brand — inti footer, selalu tampil. */
  const brand = (
    <div className="flex items-center gap-2.5 min-w-0">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={siteTitle} className="h-8 w-auto object-contain" />
      ) : (
        <div
          className="w-9 h-9 flex items-center justify-center font-bold shrink-0"
          style={{ background: palette.primary, color: onPrimary, borderRadius: `${radius}px` }}
        >
          {siteTitle.charAt(0).toUpperCase()}
        </div>
      )}
      <p className="text-sm font-bold truncate" style={{ color: palette.text }}>
        {siteTitle}
      </p>
    </div>
  );

  const copyright = (
    <p className="text-[12px]" style={{ color: palette.textMuted }}>
      {footerText}
    </p>
  );

  const socialRow = () =>
    showSocial && (
      <div className="flex items-center gap-1.5">
        {socials.map((s) => (
          <div
            key={s}
            className="w-7 h-7 flex items-center justify-center text-[10px] font-medium"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${radius}px` }}
          >
            {s}
          </div>
        ))}
      </div>
    );

  const sectionTitle = (children: ReactNode) => (
    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: palette.textMuted }}>
      {children}
    </p>
  );

  const contactBlock = () =>
    hasContact && (
      <address className="text-[12px] not-italic space-y-1" style={{ color: palette.textMuted }}>
        {address && <p>📍 {address}</p>}
        {phone && <p>📞 {phone}</p>}
        {email && <p>✉️ {email}</p>}
      </address>
    );

  /** Navigasi datar (inline). */
  const inlineNav = () =>
    showNav &&
    nav.length > 0 && (
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Navigasi footer">
        {nav.map((item, i) => (
          <a
            key={navKey(item.id, i)}
            href={item.url}
            className="text-[13px] hover:opacity-80 transition-opacity"
            style={{ color: palette.text }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    );
  /** Navigasi terkelompok (column). */
  const groupNav = () =>
    showNav &&
    groups.length > 0 && (
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2 @md:grid-cols-3'} gap-6`}>
        {groups.map((group, gi) => (
          <nav key={navKey(group.id, gi)} aria-label={group.title || 'Navigasi footer'}>
            {group.title && sectionTitle(group.title)}
            <ul className="space-y-1.5">
              {(group.items ?? [])
                .filter((i) => i.enabled !== false)
                .map((item, i) => (
                  <li key={navKey(item.id, i)}>
                    <a
                      href={item.url}
                      className="text-[13px] hover:opacity-80 transition-opacity"
                      style={{ color: palette.text }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
            </ul>
          </nav>
        ))}
      </div>
    );

  const shell = (children: ReactNode) => (
    <footer
      className="border-t px-4 sm:px-6 py-6"
      style={{ background: palette.surface, borderColor: palette.border }}
    >
      <div className="max-w-6xl mx-auto space-y-5">{children}</div>
    </footer>
  );

  /* Layout kolom: grup navigasi + kontak + sosmed; brand & copyright mengapit. */
  if (layout === 'columns') {
    return shell(
      <>
        {brand}
        <div
          aria-hidden="true"
          className="h-1.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})` }}
        />
        <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 @md:grid-cols-3'} gap-8`}>
          <div className="space-y-3">{groupNav()}</div>
          {hasContact && (
            <div>
              {sectionTitle('Kontak')}
              {contactBlock()}
            </div>
          )}
          {showSocial && (
            <div>
              {sectionTitle('Ikuti Kami')}
              {socialRow()}
            </div>
          )}
        </div>
        {copyright}
      </>,
    );
  }

  /* Layout brand-tengah: logo + nama besar di tengah, navigasi & sosmed
     menjadi baris simetris di bawahnya. */
  if (layout === 'centered') {
    return shell(
      <>
        <div className="flex flex-col items-center text-center gap-3">
          {brand}
          <p className="text-[12px] max-w-md" style={{ color: palette.textMuted }}>
            {footerText}
          </p>
        </div>
        {groups.length > 0 ? (
          <div className="flex justify-center">{groupNav()}</div>
        ) : (
          <div className="flex justify-center">{inlineNav()}</div>
        )}
        {showSocial && <div className="flex justify-center">{socialRow()}</div>}
        {hasContact && (
          <div className="flex justify-center text-center">{contactBlock()}</div>
        )}
      </>,
    );
  }

  /* Layout mini: satu baris super ringkas. Hanya brand + copyright — blok
     lain sengaja disembunyikan supaya footer tetap "tidak terlihat". */
  if (layout === 'minimal') {
    return shell(
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {brand}
        {copyright}
      </div>,
    );
  }

  /* Layout newsletter: pita signup di atas, footer ringkas di bawahnya. */
  if (layout === 'newsletter') {
    const nlTitle = str(config.newsletterTitle);
    const nlText = str(config.newsletterText);
    const nlButton = str(config.newsletterButtonText, 'Daftar');
    const nlPlaceholder = str(config.newsletterPlaceholder, 'Email Anda');
    return shell(
      <>
        {(nlTitle || nlText) && (
          <div
            className="rounded-2xl px-5 py-6 sm:px-8 sm:py-7 flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4"
            style={{ background: palette.background, border: `1px solid ${palette.border}` }}
          >
            <div className="min-w-0">
              {nlTitle && (
                <p className="text-base font-bold" style={{ color: palette.text }}>
                  {nlTitle}
                </p>
              )}
              {nlText && (
                <p className="text-[13px] mt-1" style={{ color: palette.textMuted }}>
                  {nlText}
                </p>
              )}
            </div>
            <div className="flex flex-col @md:flex-row gap-2 shrink-0">
              <input
                type="email"
                readOnly
                placeholder={nlPlaceholder}
                className="px-3 py-2 text-[13px] outline-none min-w-[200px]"
                style={{
                  background: palette.background,
                  border: `1px solid ${palette.border}`,
                  borderRadius: `${radius}px`,
                  color: palette.text,
                }}
              />
              <button
                type="button"
                className="px-4 py-2 text-[13px] font-semibold"
                style={{ background: palette.primary, color: onPrimary, borderRadius: `${radius}px` }}
              >
                {nlButton}
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4">
          {brand}
          {inlineNav()}
          {showSocial && socialRow()}
        </div>
        {copyright}
      </>,
    );
  }

  /* Layout fokus sosial: blok sosial besar di tengah, navigasi rapat di bawah. */
  if (layout === 'social') {
    return shell(
      <>
        <div className="flex flex-col items-center text-center gap-3">
          {brand}
          <p className="text-[11px] uppercase tracking-wider" style={{ color: palette.textMuted }}>
            Ikuti Kami
          </p>
          <div className="flex items-center gap-2.5">
            {socials.map((s) => (
              <div
                key={s}
                className="w-10 h-10 flex items-center justify-center text-[11px] font-semibold"
                style={{
                  background: palette.background,
                  color: palette.primary,
                  border: `1px solid ${palette.border}`,
                  borderRadius: '9999px',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
        <nav
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          aria-label="Navigasi footer"
        >
          {nav
            .filter((n) => showNav)
            .map((item, i) => (
              <a
                key={navKey(item.id, i)}
                href={item.url}
                className="text-[13px] hover:opacity-80 transition-opacity"
                style={{ color: palette.text }}
              >
                {item.label}
              </a>
            ))}
        </nav>
        {copyright}
      </>,
    );
  }

  /* Layout CTA besar: blok ajakan(full-width) dengan tombol besar, lalu
     baris informasi ringkas. */
  if (layout === 'cta-overlap') {
    const ctaTitle = str(config.ctaTitle);
    const ctaText = str(config.ctaText);
    const ctaButton = str(config.ctaButtonText, 'Hubungi Kami');
    const ctaLink = str(config.ctaButtonLink, '#');
    return shell(
      <>
        <div
          className="px-6 py-10 sm:px-10 sm:py-14 text-center"
          style={{
            background: palette.primary,
            color: onPrimary,
            borderRadius: `${radius * 2}px`,
          }}
        >
          {ctaTitle && (
            <p className="text-xl sm:text-2xl font-bold" style={{ color: onPrimary }}>
              {ctaTitle}
            </p>
          )}
          {ctaText && (
            <p className="text-[13px] mt-2 mx-auto max-w-lg" style={{ color: onPrimary, opacity: 0.9 }}>
              {ctaText}
            </p>
          )}
          <a
            href={ctaLink}
            className="inline-block mt-5 px-6 py-3 text-sm font-semibold"
            style={{
              background: palette.background,
              color: palette.text,
              borderRadius: `${radius}px`,
            }}
          >
            {ctaButton}
          </a>
        </div>
        <div className="flex flex-col @md:flex-row @md:items-center @md:justify-between gap-4">
          {brand}
          {inlineNav()}
          {showSocial && socialRow()}
        </div>
        {copyright}
      </>,
    );
  }

  /* Layout inline (default / `simple`): brand, nav datar, sosmed, copyright. */
  return shell(
    <div
      className={`flex ${compact ? 'flex-col' : 'flex-col @md:flex-row'} items-center justify-between gap-4`}
    >
      {brand}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {inlineNav()}
        {socialRow()}
      </div>
      {copyright}
    </div>,
  );
}