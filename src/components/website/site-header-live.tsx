'use client';

import { SiteHeader } from '@/components/builder/site-header-shared';
import { MobileDrawer } from './mobile-drawer';
import { useCompactNav, useNavSolid } from './use-compact-nav';
import { getOnColor } from '@/lib/builder/design-styles';
import type { Template } from '@/lib/builder/template-types';

interface ChromeNavItem {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  children?: ChromeNavItem[];
}

/**
 * Header live site (client) — cerminan `CanvasHeader` di builder-canvas.
 *
 * Server (`renderer-v3.tsx`) tidak bisa membaca lebar viewport, padahal
 * branch bawaan `SiteHeader` memilih `mobileMenu() vs desktopNav()` lewat
 * prop `compact`. Tanpa ini nav hilang total di HP untuk varian non-HTML.
 * Hook `useCompactNav` + `useNavSolid` menutup selisih kanvas vs live.
 */
export function SiteHeaderLive({
  template,
  headerVariantId,
  headerConfig,
  themeOverride,
  drawerContainer,
}: {
  template: Template;
  headerVariantId: string;
  headerConfig?: Record<string, unknown>;
  themeOverride?: Record<string, string>;
  /**
   * Batas overlay drawer (pratinjau mobile di modal). Bila diisi, drawer
   * portal ke elemen ini + mode contained (terisolasi di bingkai HP).
   * Live site normal: kosongkan (portal ke body, selayar viewport).
   */
  drawerContainer?: HTMLElement | null;
}) {
  const headerVariant = template.headers.find((h) => h.id === headerVariantId) || template.headers[0];
  const config = { ...(headerVariant.defaultConfig ?? {}), ...(headerConfig ?? {}) };
  const palette = { ...template.theme.palette, ...(themeOverride ?? {}) };
  const onPrimary = getOnColor(palette.primary);
  const navItems = (Array.isArray(config.navItems) ? config.navItems : []) as ChromeNavItem[];
  const links = navItems.filter((item) => item.enabled !== false);
  const drawerStyle = headerVariant.mobileMenu?.style === 'drawer-top' ? 'drawer-top' : 'drawer-sidebar';
  const showCta = Boolean(config.showCta);

  const compact = useCompactNav(640);
  const navSolid = useNavSolid(50);

  const drawer = (
    <MobileDrawer
      key="mobile-drawer"
      items={links}
      style={drawerStyle}
      showCta={showCta}
      ctaText={(config.ctaText as string) || 'Hubungi Kami'}
      ctaLink={(config.ctaLink as string) || '#'}
      text={palette.text}
      surface={palette.surface}
      border={palette.border}
      primary={palette.primary}
      onPrimary={onPrimary}
      radius={template.theme.components.borderRadius}
      container={drawerContainer}
      contained={drawerContainer != null}
    />
  );

  return (
    <SiteHeader
      variant={headerVariant}
      config={config}
      palette={palette}
      radius={template.theme.components.borderRadius}
      compact={compact}
      navSolid={navSolid}
      drawer={drawer}
    />
  );
}
