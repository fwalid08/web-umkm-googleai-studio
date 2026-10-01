'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HeaderConfig, DesignStyle } from '@/lib/builder/types';
import { getOnColor } from '@/lib/builder/design-styles';
import { MobileNav } from './mobile-nav';

/**
 * Header situs live (client): nav transparan menyatu hero lalu solid
 * setelah scroll > 50px — persis perilaku referensi. Halaman live di
 * bawahnya tetap server-rendered; hanya header yang interaktif.
 */
export function SiteHeader({ header, designStyle }: { header: HeaderConfig; designStyle: DesignStyle }) {
  const navStyle = designStyle.components.navStyle;
  const sticky = header.sticky !== false;
  const transparentFx = navStyle === 'transparent';
  const variant = header.variant || 'standard';

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!transparentFx) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparentFx]);

  const transparentNow = transparentFx && !scrolled;

  const textShadow = transparentNow
    ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
    : undefined;

  const headerStyle: React.CSSProperties = {
    background: transparentNow
      ? 'transparent'
      : navStyle === 'glass'
        ? 'rgba(255,255,255,0.1)'
        : designStyle.palette.surface,
    borderBottom: transparentNow ? '1px solid transparent' : `1px solid ${designStyle.palette.border}`,
    backdropFilter: navStyle === 'glass' ? 'blur(10px)' : undefined,
    transition: 'background .3s',
    // Opsi "Header menempel": sticky/fixed saat scroll, atau ikut halaman.
    ...(sticky ? { position: 'sticky' as const, top: 0, zIndex: 40 } : {}),
  };

  return (
    <header style={headerStyle}>
      {variant === 'centered' ? (
        /* Varian "Pill Tengah": brand besar di tengah, menu berbentuk pil. */
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 px-6 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            {header.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={header.logoUrl} alt={header.siteTitle} className="h-12" />
            ) : (
              <div
                className="w-12 h-12 flex items-center justify-center font-bold text-lg"
                style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary), borderRadius: `${designStyle.components.borderRadius}px` }}
              >
                {header.siteTitle.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text, textShadow }}>
                {header.siteTitle}
              </h1>
              {header.tagline && (
                <p className="text-sm" style={{ color: designStyle.palette.textMuted, textShadow }}>
                  {header.tagline}
                </p>
              )}
            </div>
          </div>
          <nav className="hidden md:flex items-center justify-center gap-2 flex-wrap" aria-label="Navigasi website">
            {header.navItems
              .filter((item) => item.enabled)
              .map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  className="text-sm font-semibold px-4 py-1.5 rounded-full border transition-opacity hover:opacity-80"
                  style={{
                    color: designStyle.palette.text,
                    background: designStyle.palette.surface,
                    borderColor: designStyle.palette.border,
                    borderRadius: '999px',
                    textShadow,
                  }}
                  target={item.url.startsWith('http') ? '_blank' : undefined}
                  rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {item.label}
                </a>
              ))}
          </nav>
          <MobileNav
            items={header.navItems.filter((item) => item.enabled)}
            color={designStyle.palette.text}
            surface={designStyle.palette.surface}
            border={designStyle.palette.border}
          />
          {header.showCta && (
            <a
              href={header.ctaLink}
              className="px-7 py-2.5 text-sm font-bold shadow-md"
              style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary), borderRadius: '999px' }}
            >
              {header.ctaText}
            </a>
          )}
        </div>
      ) : variant === 'minimal' ? (
        /* Varian "Melayang": bar mengambang rounded dengan blur & bayangan. */
        <div className="max-w-6xl mx-auto px-4 pt-3">
          <div
            className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 shadow-lg"
            style={{
              background: navStyle === 'glass' ? 'rgba(255,255,255,0.85)' : designStyle.palette.surface,
              border: `1px solid ${designStyle.palette.border}`,
              borderRadius: '18px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <Brand header={header} designStyle={designStyle} />
            <div className="flex items-center gap-2">
              <MobileNav
                items={header.navItems.filter((item) => item.enabled)}
                color={designStyle.palette.text}
                surface={designStyle.palette.surface}
                border={designStyle.palette.border}
              />
              {header.showCta && (
                <CtaButton header={header} designStyle={designStyle} />
              )}
            </div>
          </div>
          <div className="h-3" />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Brand header={header} designStyle={designStyle} />
          <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi website">
            <NavLinks header={header} designStyle={designStyle} />
          </nav>
          <div className="flex items-center gap-2">
            <MobileNav
              items={header.navItems.filter((item) => item.enabled)}
              color={designStyle.palette.text}
              surface={designStyle.palette.surface}
              border={designStyle.palette.border}
            />
            {header.showCta && (
              <CtaButton header={header} designStyle={designStyle} className="hidden sm:inline-block" />
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Brand({ header, designStyle }: { header: HeaderConfig; designStyle: DesignStyle }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const textShadow = !scrolled ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)' : undefined;

  return (
    <div className="flex items-center gap-3">
      {header.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={header.logoUrl} alt={header.siteTitle} className="h-8" />
      ) : (
        <div
          className="w-8 h-8 flex items-center justify-center font-bold"
          style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary), borderRadius: `${designStyle.components.borderRadius}px` }}
        >
          {header.siteTitle.charAt(0)}
        </div>
      )}
      <div>
        <h1 className="text-lg font-bold" style={{ fontFamily: designStyle.typography.headingFont, color: designStyle.palette.text, textShadow }}>
          {header.siteTitle}
        </h1>
        {header.tagline && (
          <p className="text-sm" style={{ color: designStyle.palette.textMuted, textShadow }}>
            {header.tagline}
          </p>
        )}
      </div>
    </div>
  );
}

function NavLinks({ header, designStyle }: { header: HeaderConfig; designStyle: DesignStyle }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const textShadow = !scrolled ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)' : undefined;

  return (
    <>
      {header.navItems
        .filter((item) => item.enabled)
        .map((item) => {
          const kids = (item.children ?? []).filter((c) => c.enabled);
          if (kids.length === 0) {
            return (
              <a
                key={item.id}
                href={item.url}
                className="text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: designStyle.palette.text, textShadow }}
                target={item.url.startsWith('http') ? '_blank' : undefined}
                rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {item.label}
              </a>
            );
          }
          return (
            <div key={item.id} className="relative group">
              <a
                href={item.url}
                className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: designStyle.palette.text, textShadow }}
                aria-haspopup="true"
              >
                {item.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </a>
              <div className="absolute left-0 top-full pt-2 hidden group-hover:block group-focus-within:block">
                <div
                  className="min-w-48 rounded-xl border shadow-xl p-1.5"
                  style={{ background: designStyle.palette.surface, borderColor: designStyle.palette.border }}
                >
                  {kids.map((kid) => (
                    <a
                      key={kid.id}
                      href={kid.url}
                      className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:opacity-80"
                      style={{ color: designStyle.palette.text }}
                      target={kid.url.startsWith('http') ? '_blank' : undefined}
                      rel={kid.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {kid.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
    </>
  );
}

function CtaButton({ header, designStyle, className = '' }: { header: HeaderConfig; designStyle: DesignStyle; className?: string }) {
  return (
    <a
      href={header.ctaLink}
      className={`px-5 py-2 text-sm font-medium ${className}`}
      style={{ background: designStyle.palette.primary, color: getOnColor(designStyle.palette.primary), borderRadius: `${designStyle.components.borderRadius}px` }}
    >
      {header.ctaText}
    </a>
  );
}
