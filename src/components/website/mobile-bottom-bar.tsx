'use client';

import { useState, useEffect } from 'react';
import { Home, Package, Star, Phone, MessageCircle, Image, Menu } from 'lucide-react';

interface BottomBarItem {
  id: string;
  label: string;
  icon: string;
  url: string;
  isExternal?: boolean;
  enabled?: boolean;
  badge?: string;
}

interface BottomBarConfig {
  enabled?: boolean;
  items?: BottomBarItem[];
}

interface MobileBottomBarProps {
  config: BottomBarConfig;
  palette: {
    primary: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  activeSection?: string;
  currentPath?: string;
  /**
   * `true` (default) = fixed bottom ala live site.
   * `false` = static inline untuk preview kanvas builder — `position:fixed`
   * di dalam kanvas akan menempel ke viewport browser, bukan ke frame
   * kanvas, sehingga merchant tidak bisa melihatnya di tempat yang benar.
   */
  floating?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Package,
  Star,
  Phone,
  MessageCircle,
  Image,
  Menu,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Home;
}

export function MobileBottomBar({ config, palette, activeSection, currentPath, floating = true }: MobileBottomBarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!config.enabled || !config.items || config.items.length === 0) return null;

  const items = config.items.filter((i) => i.enabled !== false).slice(0, 5);
  if (items.length === 0) return null;

  const activeId = activeSection || (currentPath ? currentPath.replace(/^#/, '') : '');

  return (
    <footer
      className={floating ? 'lg:hidden fixed bottom-0 left-0 right-0 z-40' : 'w-full'}
      style={{
        background: palette.surface,
        borderTop: `1px solid ${palette.border}`,
        paddingBottom: floating ? 'env(safe-area-inset-bottom)' : undefined,
      }}
      role="navigation"
      aria-label="Navigasi utama mobile"
    >
      <nav className="flex items-center justify-around" style={{ maxWidth: '100%' }}>
        {items.map((item) => {
          const Icon = getIcon(item.icon);
          const isActive = activeId && (item.url === `#${activeId}` || item.id === activeId);
          const href = item.isExternal ? item.url : item.url;

          return (
            <a
              key={item.id}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-2 min-w-0 flex-1"
              style={{
                color: isActive ? palette.primary : palette.textMuted,
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <span className="relative flex items-center justify-center" style={{ width: 28, height: 28 }}>
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[14px] h-4 px-1 text-[8px] font-bold rounded-full flex items-center justify-center"
                    style={{
                      background: palette.primary,
                      color: palette.surface,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium truncate max-w-[60px]" style={{ color: isActive ? palette.primary : palette.textMuted }}>
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>
    </footer>
  );
}