'use client';

import type { ReactNode } from 'react';
import { getOnColor } from '@/lib/builder/design-styles';

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
  variant: { id: string; name: string; layout: string };
  config: Record<string, unknown>;
  palette: FooterPalette;
  radius: number;
  /** Lebar kanvas < 640px → kolom footer dirapatkan jadi satu. */
  compact?: boolean;
}

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

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
        {nav.map((item) => (
          <a
            key={item.id}
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
        {groups.map((group) => (
          <nav key={group.id} aria-label={group.title || 'Navigasi footer'}>
            {group.title && sectionTitle(group.title)}
            <ul className="space-y-1.5">
              {(group.items ?? [])
                .filter((i) => i.enabled !== false)
                .map((item) => (
                  <li key={item.id}>
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

  /* Layout inline: brand, nav datar, sosmed, lalu copyright. */
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