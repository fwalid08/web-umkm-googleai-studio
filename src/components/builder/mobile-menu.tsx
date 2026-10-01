'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

export interface MobileMenuItem {
  id: string;
  label: string;
  url: string;
  children?: MobileMenuItem[];
}

interface MobileMenuProps {
  items: MobileMenuItem[];
  style: 'drawer-top' | 'drawer-sidebar';
  showCta: boolean;
  ctaText?: string;
  ctaLink?: string;
  subMenuSupport: boolean;
  onClose: () => void;
}

export function MobileMenu({
  items,
  style,
  showCta,
  ctaText,
  ctaLink,
  subMenuSupport,
  onClose,
}: MobileMenuProps) {
  if (style === 'drawer-top') {
    return (
      <DrawerTop
        items={items}
        showCta={showCta}
        ctaText={ctaText}
        ctaLink={ctaLink}
        subMenuSupport={subMenuSupport}
        onClose={onClose}
      />
    );
  }

  return (
    <DrawerSidebar
      items={items}
      showCta={showCta}
      ctaText={ctaText}
      ctaLink={ctaLink}
      subMenuSupport={subMenuSupport}
      onClose={onClose}
    />
  );
}

function DrawerTop({
  items,
  showCta,
  ctaText,
  ctaLink,
  subMenuSupport,
  onClose,
}: Omit<MobileMenuProps, 'style'>) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-0 left-0 right-0 bg-white dark:bg-slate-900 shadow-lg animate-slide-down">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="font-bold text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="max-h-[70vh] overflow-y-auto">
          <MobileMenuItems items={items} depth={0} subMenuSupport={subMenuSupport} onClose={onClose} />
        </nav>
        {showCta && ctaText && ctaLink && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <a
              href={ctaLink}
              className="block w-full py-3 text-center font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function DrawerSidebar({
  items,
  showCta,
  ctaText,
  ctaLink,
  subMenuSupport,
  onClose,
}: Omit<MobileMenuProps, 'style'>) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-lg animate-slide-in flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span className="font-bold text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <MobileMenuItems items={items} depth={0} subMenuSupport={subMenuSupport} onClose={onClose} />
        </nav>
        {showCta && ctaText && ctaLink && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <a
              href={ctaLink}
              className="block w-full py-3 text-center font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileMenuItems({
  items,
  depth,
  subMenuSupport,
  onClose,
}: {
  items: MobileMenuItem[];
  depth: number;
  subMenuSupport: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClick = (e: React.MouseEvent, url: string) => {
    if (url.startsWith('#')) {
      e.preventDefault();
      onClose();
      const target = document.querySelector(url);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      onClose();
    }
  };

  return (
    <ul className="space-y-1 p-2">
      {items.map((item) => (
        <li key={item.id}>
          <div className="flex items-center">
            <a
              href={item.url}
              onClick={(e) => handleClick(e, item.url)}
              className="flex-1 flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium"
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              <span>{item.label}</span>
              {item.children && subMenuSupport && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(item.id);
                  }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  aria-label={expanded.has(item.id) ? 'Tutup sub-menu' : 'Buka sub-menu'}
                >
                  {expanded.has(item.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
            </a>
          </div>
          {item.children && subMenuSupport && expanded.has(item.id) && (
            <MobileMenuItems items={item.children} depth={depth + 1} subMenuSupport={subMenuSupport} onClose={onClose} />
          )}
        </li>
      ))}
    </ul>
  );
}
