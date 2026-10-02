'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

export interface MobileDrawerItem {
  id: string;
  label: string;
  url: string;
  enabled?: boolean;
  children?: MobileDrawerItem[];
}

interface MobileDrawerProps {
  items: MobileDrawerItem[];
  /** 'drawer-top': meluncur dari atas; 'drawer-sidebar': meluncur dari kiri */
  style?: 'drawer-top' | 'drawer-sidebar';
  showCta?: boolean;
  ctaText?: string;
  ctaLink?: string;
  text: string;
  surface: string;
  border: string;
  primary: string;
  onPrimary: string;
  radius: number;
}

/**
 * Menu hamburger situs live: drawer dari atas ATAU sidebar (bukan dropdown),
 * dengan dukungan sub-menu 1 level. Menutup otomatis + smooth scroll untuk
 * link anchor (`#id`).
 */
export function MobileDrawer({
  items,
  style = 'drawer-sidebar',
  showCta = true,
  ctaText,
  ctaLink,
  text,
  surface,
  border,
  primary,
  onPrimary,
  radius,
}: MobileDrawerProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open ]);

  const links = (items ?? []).filter((i) => i.enabled !== false);
  if (links.length === 0) return null;

  const go = (e: React.MouseEvent, url: string) => {
    setOpen(false);
    setExpanded(null);
    if (url.startsWith('#') && url.length > 1) {
      e.preventDefault();
      // Tunggu drawer tertutup agar posisi scroll tepat.
      requestAnimationFrame(() => {
        document.querySelector(url)?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  const menuList = (
    <nav aria-label="Navigasi website" className="flex-1 overflow-y-auto p-2">
      <ul className="space-y-1">
        {links.map((item, i) => {
          const kids = (item.children ?? []).filter((c) => c.enabled !== false);
          const isOpen = expanded === item.id;
          return (
            <li key={`${typeof item.id === 'string' && item.id ? item.id : 'nav'}-${i}`}>
              <div className="flex items-center gap-1">
                <a
                  href={item.url || '#'}
                  onClick={(e) => go(e, item.url || '#')}
                  className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg hover:opacity-80"
                  style={{ color: text }}
                >
                  {item.label || 'Link'}
                </a>
                {kids.length > 0 && (
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    aria-label={isOpen ? `Tutup submenu ${item.label}` : `Buka submenu ${item.label}`}
                    aria-expanded={isOpen}
                    className="p-2 rounded-lg shrink-0"
                    style={{ color: text }}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {isOpen && kids.length > 0 && (
                <ul className="ml-3 pl-2 border-l space-y-0.5 mt-0.5" style={{ borderColor: border }}>
                  {kids.map((kid, ki) => (
                    <li key={`${typeof kid.id === 'string' && kid.id ? kid.id : 'nav'}-${ki}`}>
                      <a
                        href={kid.url || '#'}
                        onClick={(e) => go(e, kid.url || '#')}
                        className="block px-3 py-2 text-sm rounded-lg hover:opacity-80"
                        style={{ color: text }}
                      >
                        {kid.label || 'Link'}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const cta = showCta && (
    <div className="p-3 border-t shrink-0" style={{ borderColor: border }}>
      <a
        href={ctaLink || '#'}
        onClick={(e) => go(e, ctaLink || '#')}
        className="block w-full py-2.5 text-center text-sm font-bold"
        style={{ background: primary, color: onPrimary, borderRadius: `${radius}px` }}
      >
        {ctaText || 'Hubungi Kami'}
      </a>
    </div>
  );

  return (
    <div className="md:hidden shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        aria-expanded={open}
        className="p-2 -mr-1 rounded-lg"
        style={{ color: text }}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && style === 'drawer-top' && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <div className="absolute inset-0 bg-black/50 animate-drawer-fade" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute top-0 left-0 right-0 shadow-xl animate-slide-down flex flex-col max-h-[80vh]"
            style={{ background: surface, borderBottom: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-end p-2">
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup menu navigasi"
                className="p-2 rounded-lg"
                style={{ color: text }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {menuList}
            {cta}
          </div>
        </div>
      )}

      {open && style !== 'drawer-top' && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <div className="absolute inset-0 bg-black/50 animate-drawer-fade" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] shadow-xl animate-slide-in flex flex-col"
            style={{ background: surface, borderRight: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b shrink-0" style={{ borderColor: border }}>
              <span className="text-sm font-bold" style={{ color: text }}>Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup menu navigasi"
                className="p-2 rounded-lg"
                style={{ color: text }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {menuList}
            {cta}
          </div>
        </div>
      )}
    </div>
  );
}
