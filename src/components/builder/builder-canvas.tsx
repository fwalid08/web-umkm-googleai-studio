'use client';

import { useState } from 'react';
import { useTemplateStore, getSectionVariant, getHeaderVariant, getFooterVariant } from '@/lib/builder/template-store';
import { useBuilderStore } from '@/lib/builder/store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, Menu, X } from 'lucide-react';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { getDesignStyle } from '@/lib/builder/design-styles';
import { getOnColor } from '@/lib/builder/design-styles';
import { SectionPicker } from './section-picker';
import { GoogleFonts } from './google-fonts';
import type { SectionVariant } from '@/lib/builder/template-types';
import type { Section } from '@/lib/builder/types';
import type { DesignStyle } from '@/lib/builder/types';

export function BuilderCanvas({ preview = false, fullBleed = false, websiteId }: { preview?: boolean; fullBleed?: boolean; websiteId?: string }) {
  const template = useTemplateStore((s) => s.template);
  const sections = useTemplateStore((s) => s.sections);
  const selectedSectionId = useTemplateStore((s) => s.selectedSectionId);
  const selectSection = useTemplateStore((s) => s.selectSection);
  const deleteSection = useTemplateStore((s) => s.deleteSection);
  const duplicateSection = useTemplateStore((s) => s.duplicateSection);
  const reorderSections = useTemplateStore((s) => s.reorderSections);
  const insertSectionAt = useTemplateStore((s) => s.insertSectionAt);
  const headerVariantId = useTemplateStore((s) => s.headerVariantId);
  const footerVariantId = useTemplateStore((s) => s.footerVariantId);
  const themeOverride = useTemplateStore((s) => s.themeOverride);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showInsertPicker, setShowInsertPicker] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const palette = { ...template.theme.palette, ...themeOverride };
  const onPrimary = getOnColor(palette.primary);
  const effectiveTheme = { ...template.theme, palette };

  const viewportWidth = useBuilderStore((s) => s.viewportWidth);
  const isMobileFrame = viewportWidth <= 480;
  // Konten header/footer efektif: default varian + override tersimpan agar
  // hasil edit user di sidebar terlihat langsung di kanvas.
  const savedHeader = useTemplateStore((s) => s.headerConfig);
  const savedFooter = useTemplateStore((s) => s.footerConfig);

  const openPicker = () => {
    window.dispatchEvent(new CustomEvent('open-section-picker'));
  };

  const handleInsertAt = (type: string, variant: SectionVariant) => {
    const at = insertAt ?? sections.length;
    insertSectionAt(type, variant.id, at);
    setShowInsertPicker(false);
    setInsertAt(null);
    setHoveredIndex(null);
  };

  const headerVariant = getHeaderVariant(template, headerVariantId);
  const footerVariant = getFooterVariant(template, footerVariantId);

  // Sumber tunggal warna = tema bawaan template (+ override user).
  // Disamakan dengan renderer-v3 (live-site/preview) agar varian yang baru
  // ditambahkan ke kanvas langsung tampil dengan warna template tanpa edit
  // manual. Fallback DESIGN_STYLES hanya untuk tipografi/komponen bila
  // template tidak menyediakannya.
  const designStyleId = useBuilderStore((s) => s.designStyleId);
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);
  const typographyOverride = useBuilderStore((s) => s.typographyOverride);
  const baseDesignStyle = getDesignStyle(designStyleId) ?? getDesignStyle('minimalist')!;
  // Urutan merge: bawaan template → override user (dua store disinkronkan
  // di StyleSelector) → pastikan token theme:* selalu resolve ke warna aktif.
  const mergedPalette = { ...template.theme.palette, ...themeOverride, ...paletteOverride };
  const baseTypography = template.theme.typography ?? baseDesignStyle.typography;
  const designStyle: DesignStyle = {
    ...baseDesignStyle,
    id: template.id,
    name: template.name,
    palette: mergedPalette,
    typography: {
      ...baseTypography,
      ...(typographyOverride.headingFont ? { headingFont: typographyOverride.headingFont } : {}),
      ...(typographyOverride.bodyFont ? { bodyFont: typographyOverride.bodyFont } : {}),
    },
    components: template.theme.components ?? baseDesignStyle.components,
    effects: template.theme.effects ?? baseDesignStyle.effects,
  };

  const bleed = preview && fullBleed;
  // overflow-clip (bukan hidden): tetap memotong sudut rounded bingkai,
  // tapi tidak membuat scroll-container sehingga header sticky di dalam
  // kanvas tetap bisa menempel saat kanvas di-scroll.
  const frameChrome = bleed
    ? 'flex-1 overflow-clip builder-cq'
    : `flex-1 overflow-clip builder-cq border-4 border-white dark:border-slate-800 ${
        isMobileFrame
          ? 'rounded-[2rem] border-slate-900 shadow-2xl shadow-emerald-900/20'
          : 'rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-900/10'
      }`;

  const [navSolid, setNavSolid] = useState(false);
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const y = e.currentTarget.scrollTop;
    setNavSolid((prev) => {
      const next = y > 50;
      return prev === next ? prev : next;
    });
  };

  return (
    <main
      className={`flex-1 overflow-auto min-h-0 transition-colors duration-300 ${
        preview
          ? 'bg-transparent p-0'
          : 'p-3 sm:p-6 bg-gradient-to-br from-slate-200 via-emerald-100/60 to-amber-100/50 dark:from-slate-950 dark:via-[#0d1a14] dark:to-slate-950 bg-[radial-gradient(circle_at_1px_1px,rgba(6,95,70,0.18)_1px,transparent_0)] bg-[size:22px_22px]'
      }`}
      onScroll={handleScroll}
      onClick={(e) => {
        if (!preview && e.target === e.currentTarget) selectSection(null);
      }}
    >
      <GoogleFonts fonts={[designStyle.typography.headingFont, designStyle.typography.bodyFont]} />
      <div
        className={`${bleed ? 'w-full' : 'mx-auto'} min-h-full flex flex-col transition-all duration-300`}
        style={bleed ? undefined : { maxWidth: `min(${viewportWidth}px, 100%)` }}
      >
        <div
          className={frameChrome}
          style={{
            background: palette.background,
            color: palette.text,
            fontFamily: template.theme.typography.bodyFont,
          }}
        >
          {isMobileFrame && !preview && (
            <div className="flex justify-center pt-2 bg-slate-900">
              <div className="w-24 h-1.5 rounded-full bg-white/20" />
            </div>
          )}
          <CanvasHeader variant={headerVariant} config={savedHeader as Record<string, unknown>} template={{ ...template, theme: effectiveTheme }} compact={viewportWidth < 640} navSolid={navSolid} />

          <div className="relative min-h-[320px]">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 sm:py-18 text-center bg-gradient-to-b from-emerald-50/80 via-white to-amber-50/60 dark:from-slate-800/40 dark:via-transparent dark:to-transparent">
                <div className="text-5xl mb-3">...</div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full shadow-sm mb-3">
                  {template.sections.length} jenis blok siap pakai
                </div>
                <p className="text-lg sm:text-2xl font-extrabold tracking-tight">Yuk, bangun halaman tokomu!</p>
                <p className="text-sm text-muted-foreground mt-1.5 mb-6 max-w-sm leading-relaxed">
                  Mulai dari hero yang menarik, katalog produk, sampai testimoni pembeli — tinggal klik, tanpa coding.
                </p>
                {!preview && (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <Button onClick={openPicker} className="gap-2 shadow-lg shadow-emerald-500/25 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl h-11 px-5 font-bold">
                      <Plus className="w-4 h-4" />
                      Tambah Blok Pertama
                    </Button>
                    <span className="text-xs text-muted-foreground">atau klik tombol + di bawah</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={!preview ? 'divide-y divide-slate-100/80 dark:divide-slate-800' : undefined}>
                {sections.map((section, index) => {
                  const variant = getSectionVariant(template, section.type, section.variantId);
                  const isSelected = selectedSectionId === section.id;

                  return (
                    <div key={section.id} id={section.anchorId}>
                      <div
                        role={!preview ? 'button' : undefined}
                        tabIndex={!preview ? 0 : undefined}
                        aria-label={variant?.name || section.type}
                        className={`group relative transition-all duration-200 outline-none ${
                          preview
                            ? ''
                            : isSelected
                              ? 'ring-[3px] ring-inset ring-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]'
                              : 'hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-400'
                        } ${!preview ? 'cursor-pointer' : ''}`}
                        onClick={() => !preview && selectSection(section.id)}
                        onKeyDown={(e) => {
                          if (!preview && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            selectSection(section.id);
                          }
                        }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {variant && (
                          (() => {
                            const rendererSection: Section = {
                              id: section.id,
                              type: section.type as Section['type'],
                              variant: section.variantId,
                              config: section.config,
                              style: {
                                padding: section.style.padding,
                                background: section.style.background,
                                backgroundColor: section.style.backgroundColor,
                                backgroundImage: section.style.backgroundImage,
                                backgroundGradient: section.style.backgroundGradient,
                                backgroundBlur: section.style.backgroundBlur,
                                backgroundSize: section.style.backgroundSize,
                                backgroundOverlay: section.style.backgroundOverlay,
                              },
                              responsive: section.responsive,
                            };
                            return (
                              <SectionRenderer
                                section={rendererSection}
                                designStyle={designStyle}
                                websiteId={websiteId}
                              />
                            );
                          })()
                        )}

                        {!preview && (
                          <>
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/95 dark:bg-slate-900/95 backdrop-blur text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full shadow-md border border-emerald-200/70 dark:border-slate-700">
                                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                                  {index + 1}
                                </span>
                                {variant?.name || section.type}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    try {
                                      const done = navigator.clipboard?.writeText(section.id);
                                      if (done) {
                                        void done
                                          .then(() => {
                                            setCopiedId(section.id);
                                            setTimeout(() => {
                                              setCopiedId((c) => (c === section.id ? null : c));
                                            }, 1200);
                                          })
                                          .catch(() => undefined);
                                      }
                                    } catch {
                                      // Clipboard tak tersedia — abaikan.
                                    }
                                  }}
                                  title={`Section ID: ${section.id} — klik untuk salin`}
                                  className="font-mono font-normal text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-200 transition-colors"
                                >
                                  {copiedId === section.id ? '✓ disalin' : `id:${section.id.slice(0, 8)}`}
                                </button>
                              </span>
                            </div>

                            <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity z-10">
                              <div
                                className="flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="py-1 pl-1.5 pr-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 rounded-lg mr-0.5">
                                  #{index + 1}
                                </span>
                                <button
                                  onClick={() => index > 0 && reorderSections(index, index - 1)}
                                  disabled={index === 0}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => index < sections.length - 1 && reorderSections(index, index + 1)}
                                  disabled={index === sections.length - 1}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => duplicateSection(section.id)}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                  <Copy className="w-4 h-4 text-slate-500" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus blok "${variant?.name || section.type}"?`)) {
                                      deleteSection(section.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>

                            {hoveredIndex === index && index < sections.length - 1 && (
                              <div className="absolute -bottom-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInsertAt(index + 1);
                                    setShowInsertPicker(true);
                                  }}
                                  className="pointer-events-auto h-8 px-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Sisip blok
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!preview && (
              <div className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-emerald-50/50 dark:to-transparent">
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 border-emerald-300 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 py-6 rounded-2xl font-bold text-sm shadow-sm transition-all hover:shadow-md"
                  onClick={openPicker}
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mr-1">
                    <Plus className="w-4 h-4" />
                  </span>
                  Tambah Blok Baru
                </Button>
              </div>
            )}
          </div>

          <CanvasFooter variant={footerVariant} config={savedFooter as Record<string, unknown>} template={{ ...template, theme: effectiveTheme }} compact={viewportWidth < 640} />
        </div>
        {!preview && (
          <p className="text-center text-[11px] font-medium text-muted-foreground mt-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur inline-block mx-auto px-3 py-1 rounded-full border border-white dark:border-slate-800 shadow-sm">
            Klik blok untuk edit • {sections.length} blok • {viewportWidth}px
          </p>
        )}
      </div>

      {showInsertPicker && !preview && (
        <SectionPicker
          sections={template.sections}
          onSelect={handleInsertAt}
          onClose={() => {
            setShowInsertPicker(false);
            setInsertAt(null);
            setHoveredIndex(null);
          }}
        />
      )}
    </main>
  );
}

function CanvasHeader({ variant, config, template, compact = false, navSolid = false }: {
  variant: { id: string; name: string; layout: string };
  config: Record<string, unknown>;
  template: { theme: { palette: { primary: string; secondary: string; accent: string; background: string; surface: string; text: string; textMuted: string; border: string }; typography: { headingFont: string }; components: { borderRadius: number } } };
  compact?: boolean;
  navSolid?: boolean;
}) {
  const palette = template.theme.palette;
  const onPrimary = getOnColor(palette.primary);
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = (Array.isArray(config.navItems) ? config.navItems : []) as Array<{ id: string; label: string; url: string; enabled: boolean }>;
  const links = navItems.filter((item) => item.enabled);
  const layout = variant.layout;
  const isTransparent = layout === 'hero-overlay' && !navSolid;
  // Hormati opsi "Header menempel" seperti di live site (default menempel).
  const sticky = config.sticky !== false;
  const textShadow = isTransparent
    ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
    : undefined;

  const headerStyle: React.CSSProperties = {
    background: isTransparent ? 'transparent' : palette.surface,
    borderBottom: isTransparent ? '1px solid transparent' : `1px solid ${palette.border}`,
    transition: 'background .3s',
  };

  if (layout === 'floating') {
    return (
      <div className={sticky ? 'px-3 pt-2.5 sticky top-0 z-20' : 'px-3 pt-2.5'}>
        <div
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 shadow-lg"
          style={{
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: '16px',
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 flex items-center justify-center font-bold text-xs shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {((config.siteTitle as string) || 'T').charAt(0).toUpperCase()}
            </div>
            <h1 className="text-[13px] font-bold truncate" style={{ color: palette.text, textShadow }}>
              {(config.siteTitle as string) || 'Nama Toko'}
            </h1>
          </div>
          {(config.showCta as boolean) && (
            <button
              className="px-3 py-1.5 text-xs font-bold shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: '999px', textShadow }}
            >
              {(config.ctaText as string) || 'Hubungi Kami'}
            </button>
          )}
        </div>
        <div className="h-2" />
      </div>
    );
  }

  if (layout === 'minimal') {
    return (
      <header className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 ${sticky ? 'sticky top-0 z-20' : ''}`} style={headerStyle}>
        <div className="flex items-center gap-2.5 min-w-0">
          {(config.logoUrl as string) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl as string} alt={(config.siteTitle as string) || ''} className="h-8 w-auto object-contain" />
          ) : (
            <div
              className="w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {((config.siteTitle as string) || 'T').charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-sm font-semibold truncate" style={{ color: palette.text, textShadow }}>
            {(config.siteTitle as string) || 'Nama Toko'}
          </h1>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={menuOpen}
            className="p-2 -mr-1 rounded-lg"
            style={{ color: palette.text, textShadow }}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl p-1.5 z-30"
              style={{ background: palette.surface, borderColor: palette.border }}
            >
              {links.slice(0, 7).map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium rounded-lg hover:opacity-80"
                  style={{ color: palette.text }}
                >
                  {item.label || 'Link'}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className={layout !== 'hero-overlay' && sticky ? 'sticky top-0 z-20' : 'relative'} style={headerStyle}>
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {(config.logoUrl as string) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl as string} alt={(config.siteTitle as string) || ''} className="h-8 w-auto object-contain" />
          ) : (
            <div
              className="w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {((config.siteTitle as string) || 'T').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate" style={{ color: palette.text, textShadow }}>
              {(config.siteTitle as string) || 'Nama Toko'}
            </h1>
            {(config.tagline as string) && (
              <p className="text-xs truncate" style={{ color: palette.textMuted, textShadow }}>
                {config.tagline as string}
              </p>
            )}
          </div>
        </div>

        {compact ? (
          links.length > 0 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                aria-expanded={menuOpen}
                className="p-2 -mr-1 rounded-lg"
                style={{ color: palette.text, textShadow }}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl p-1.5 z-30"
                  style={{ background: palette.surface, borderColor: palette.border }}
                >
                  {links.slice(0, 7).map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-sm font-medium rounded-lg hover:opacity-80"
                      style={{ color: palette.text }}
                    >
                      {item.label || 'Link'}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <nav className="hidden @[640px]:flex items-center gap-5 shrink-0" aria-label="Navigasi website">
            {links.slice(0, 5).map((item) => (
              <a
                key={item.id}
                href={item.url}
                className="text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: palette.text, textShadow }}
              >
                {item.label || 'Link'}
              </a>
            ))}
          </nav>
        )}

        {(config.showCta as boolean) && (
          <button
            className="px-3.5 py-2 text-[13px] font-medium shrink-0"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px`, textShadow }}
          >
            {(config.ctaText as string) || 'Hubungi Kami'}
          </button>
        )}
      </div>
    </header>
  );
}

function CanvasFooter({ variant, config, template, compact = false }: {
  variant: { id: string; name: string; layout: string };
  config: Record<string, unknown>;
  template: { theme: { palette: { primary: string; secondary: string; accent: string; background: string; surface: string; text: string; textMuted: string; border: string }; typography: { headingFont: string }; components: { borderRadius: number } } };
  compact?: boolean;
}) {
  const palette = template.theme.palette;
  const onPrimary = getOnColor(palette.primary);
  const footerText = ((config.text as string) || '').replace('{year}', String(new Date().getFullYear()));
  const layout = variant.layout;
  const navItems = (Array.isArray(config.navItems) ? config.navItems : []) as Array<{ id: string; label: string; url: string; enabled: boolean }>;
  const nav = navItems.filter((n) => n.enabled);
  const socials = ['IG', 'FB', 'TW', 'WA'];

  const socialRow = (centered = false) =>
    (config.showSocial as boolean) && (
      <div className={`flex items-center gap-1.5 ${centered ? 'justify-center' : ''}`}>
        {socials.map((social) => (
          <div
            key={social}
            className="w-7 h-7 flex items-center justify-center text-[10px] font-medium"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
          >
            {social}
          </div>
        ))}
      </div>
    );

  return (
    <footer
      className="border-t px-4 sm:px-6 py-6"
      style={{ background: palette.surface, borderColor: palette.border }}
    >
      {layout === 'minimal' ? (
        <p className="text-[13px] text-center" style={{ color: palette.textMuted }}>
          {footerText}
        </p>
      ) : layout === 'centered' ? (
        <div className="flex flex-col items-center text-center gap-2.5">
          <div
            className="w-10 h-10 flex items-center justify-center font-bold shadow-md"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
          >
            {(footerText || 'T').charAt(0).toUpperCase()}
          </div>
          <p className="text-[13px] font-semibold" style={{ color: palette.text }}>
            {footerText}
          </p>
          <span aria-hidden="true" className="text-[10px] tracking-[0.4em]" style={{ color: palette.primary }}>✦ ✦ ✦</span>
          {nav.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {nav.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  className="text-[13px] font-medium hover:opacity-80 transition-opacity"
                  style={{ color: palette.textMuted }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          {socialRow(true)}
        </div>
      ) : layout === 'columns' ? (
        <div>
          <div
            aria-hidden="true"
            className="h-1.5 rounded-full mb-5"
            style={{ background: `linear-gradient(90deg, ${palette.primary}, ${palette.accent})` }}
          />
          <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 @md:grid-cols-3'} gap-5`}>
            <p className="text-[13px] font-semibold" style={{ color: palette.text }}>
              {footerText}
            </p>
            <nav aria-label="Navigasi footer">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: palette.textMuted }}>
                Menu
              </p>
              <ul className="space-y-1.5">
                {nav.map((item) => (
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
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: palette.textMuted }}>
                Ikuti Kami
              </p>
              {socialRow()}
            </div>
          </div>
        </div>
      ) : layout === 'newsletter' ? (
        <div className="max-w-xl mx-auto text-center space-y-3">
          <p className="text-sm font-semibold" style={{ color: palette.text }}>
            {(config.newsletterTitle as string) || 'Dapatkan Info Promo'}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder={(config.newsletterPlaceholder as string) || 'Email Anda'}
              className="flex-1 px-4 py-2 border rounded-lg text-sm"
              style={{ borderColor: palette.border, borderRadius: `${template.theme.components.borderRadius}px` }}
            />
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
            >
              {(config.newsletterButton as string) || 'Berlangganan'}
            </button>
          </div>
          <p className="text-[11px]" style={{ color: palette.textMuted }}>{footerText}</p>
        </div>
      ) : layout === 'social' ? (
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex gap-2">
            {socials.map((social) => (
              <div
                key={social}
                className="w-9 h-9 flex items-center justify-center text-xs font-medium"
                style={{ background: palette.primary, color: onPrimary, borderRadius: `${template.theme.components.borderRadius}px` }}
              >
                {social}
              </div>
            ))}
          </div>
          <p className="text-[13px]" style={{ color: palette.textMuted }}>{footerText}</p>
        </div>
      ) : (
        <div className={`flex ${compact ? 'flex-col' : 'flex-col @md:flex-row'} items-center justify-between gap-3`}>
          <p className="text-[13px] text-center @md:text-left" style={{ color: palette.textMuted }}>
            {footerText}
          </p>
          {nav.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {nav.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  className="text-[13px] hover:opacity-80 transition-opacity"
                  style={{ color: palette.textMuted }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}
          {socialRow()}
        </div>
      )}
    </footer>
  );
}
