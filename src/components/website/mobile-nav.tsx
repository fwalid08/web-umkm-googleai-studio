'use client';

import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  url: string;
  children?: MobileNavItem[];
}

/**
 * Menu hamburger untuk navigasi header di HP (situs live).
 * Client component mungil agar halaman live tetap server-rendered.
 */
export function MobileNav({
  items,
  color,
  surface,
  border,
}: {
  items: MobileNavItem[];
  color: string;
  surface: string;
  border: string;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        aria-expanded={open}
        className="p-2 -mr-1 rounded-lg"
        style={{ color }}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && (
        <nav
          aria-label="Navigasi website"
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-xl p-1.5 z-50"
          style={{ background: surface, borderColor: border }}
        >
          {items.slice(0, 7).map((item) => {
            const kids = item.children ?? [];
            if (kids.length === 0) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:opacity-80"
                  style={{ color }}
                >
                  {item.label || 'Link'}
                </a>
              );
            }
            const isOpen = expanded === item.id;
            return (
              <div key={item.id}>
                <div className="flex items-center gap-1">
                  <a
                    href={item.url}
                    onClick={() => setOpen(false)}
                    className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg hover:opacity-80"
                    style={{ color }}
                  >
                    {item.label || 'Link'}
                  </a>
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    aria-label={isOpen ? `Tutup submenu ${item.label}` : `Buka submenu ${item.label}`}
                    aria-expanded={isOpen}
                    className="p-2 rounded-lg"
                    style={{ color }}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {isOpen && (
                  <div className="ml-4 pl-2 border-l" style={{ borderColor: border }}>
                    {kids.map((kid) => (
                      <a
                        key={kid.id}
                        href={kid.url}
                        onClick={() => setOpen(false)}
                        className="block px-3 py-2 text-sm rounded-lg hover:opacity-80"
                        style={{ color }}
                      >
                        {kid.label || 'Link'}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      )}
    </div>
  );
}
