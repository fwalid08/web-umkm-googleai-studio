'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';

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
  /**
   * Batas overlay untuk preview kanvas builder. Di live site overlay portal
   * ke `document.body` (selayar viewport). Di kanvas, portal ke body akan
   * selayar browser — bukan selebar frame HP — jadi teruskan ref frame
   * kanvas sebagai `container` agar overlay menempel di frame tersebut.
   * Di dalam container, `fixed inset-0` dihitung relatif terhadap ancestor
   * ber-transform/contain (frame kanvas punya keduanya) — tepat yang kita mau.
   */
  container?: HTMLElement | null;
  /**
   * Isolasi overlay ke dalam container (bukan selayar viewport). Dipakai
   * pratinjau mobile di dalam modal: overlay memakai `absolute inset-0`
   * (relatif ke container yang `relative`) sehingga drawer tidak keluar
   * dari bingkai HP virtual. Tanpa ini drawer portal ke body dan menutupi
   * seluruh layar — pratinjau mobile jadi tidak mewakili HP sungguhan.
   * Default false = perilaku lama (kanvas builder mengandalkan
   * `fixed` + ancestor ber-transform).
   */
  contained?: boolean;
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
  container,
  contained = false,
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

  // Kunci scroll body selama drawer terbuka (overlay portal ke body).
  // Dilewati saat contained: scroll halaman induk sudah dikunci dialog.
  useEffect(() => {
    if (!open || contained) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, contained]);

  const links = (items ?? []).filter((i) => i.enabled !== false);

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
          const itemKey = `${item.id ?? `nav-${i}`}`;
          return (
            <li key={itemKey}>
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
                  {kids.map((kid, ki) => {
                    const kidKey = `${kid.id ?? `nav-${i}-${ki}`}`;
                    return (
                      <li key={kidKey}>
                        <a
                          href={kid.url || '#'}
                          onClick={(e) => go(e, kid.url || '#')}
                          className="block px-3 py-2 text-sm rounded-lg hover:opacity-80"
                          style={{ color: text }}
                        >
                          {kid.label || 'Link'}
                        </a>
                      </li>
                    );
                  })}
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

  // `open` hanya bisa true lewat klik di client, jadi guard `typeof document`
  // inline sudah cukup untuk SSR — tanpa state `mounted` tambahan.
  // contained → absolute terhadap container (bingkai HP); selebihnya
  // fixed selayar viewport seperti dulu.
  const overlayPos = contained ? 'absolute inset-0 z-50' : 'fixed inset-0 z-50';
  const overlay =
    open && typeof document !== 'undefined' ? (
      style === 'drawer-top' ? (
        <div className={overlayPos} role="dialog" aria-modal="true" aria-label="Menu navigasi">
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
      ) : (
        <div className={overlayPos} role="dialog" aria-modal="true" aria-label="Menu navigasi">
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
      )
    ) : null;

  // Tombol hamburger kini IN-FLOW di HTML varian (`[data-hdr-burger]`,
  // selalu sejajar brand) — drawer ini tidak me-render trigger sendiri.
  // Klik didelegasikan: satu listener membuka drawer dari placeholder
  // mana pun. Tanpa nav, placeholder disembunyikan (dulu trigger me-return
  // null — perilaku yang sama dipertahankan).
  useEffect(() => {
    const placeholders = Array.from(document.querySelectorAll('[data-hdr-burger]'));
    if (links.length === 0) {
      placeholders.forEach((el) =>
        (el as HTMLElement).style.setProperty('display', 'none', 'important'),
      );
      return;
    }
    placeholders.forEach((el) => (el as HTMLElement).style.removeProperty('display'));
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('[data-hdr-burger]')) setOpen(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [links.length]);

  // Setelah semua hooks — aman dari rules-of-hooks.
  if (links.length === 0) return null;

  return overlay ? createPortal(overlay, container ?? document.body) : null;
}
