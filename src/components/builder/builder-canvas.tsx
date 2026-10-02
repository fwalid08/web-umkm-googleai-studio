'use client';

import { useState } from 'react';
import { useTemplateStore, getSectionVariant, getHeaderVariant, getFooterVariant } from '@/lib/builder/template-store';
import { useBuilderStore } from '@/lib/builder/store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, Edit3 } from 'lucide-react';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { SiteHeader } from '@/components/builder/site-header-shared';
import { SiteFooter } from '@/components/builder/site-footer-shared';
import { getDesignStyle } from '@/lib/builder/design-styles';
import { SectionPicker } from './section-picker';
import { GoogleFonts } from './google-fonts';
import { BehaviourRuntime } from './behaviour-runtime';
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
  const effectiveTheme = { ...template.theme, palette };

  const viewportWidth = useBuilderStore((s) => s.viewportWidth);
  const isMobileFrame = viewportWidth <= 480;
  // Konten header/footer efektif: default varian + override tersimpan agar
  // hasil edit user di sidebar terlihat langsung di kanvas.
  const savedHeader = useTemplateStore((s) => s.headerConfig);
  const savedFooter = useTemplateStore((s) => s.footerConfig);
  // Animasi template ikut dijalankan di kanvas supaya pratinjau di editor sama
  // persis dengan live site (sebelumnya hanya tersimpan, tak pernah jalan).
  const templateBehaviours = useTemplateStore((s) => s.behaviours);
  const templateAnimations = useTemplateStore((s) => s.animations);
  const templateCustomCss = useTemplateStore((s) => s.customCss);

  const openPicker = () => {
    window.dispatchEvent(new CustomEvent('open-section-picker'));
  };
  // Minta sidebar membuka form config untuk section ini. Sidebar (dan shell,
  // agar sidebar yang tertutup ikut terbuka) mendengarkan event yang sama.
  const openSectionConfig = (sectionId: string) => {
    window.dispatchEvent(new CustomEvent('open-section-config', { detail: { sectionId } }));
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
          : 'p-3 sm:p-6 bg-gradient-to-br from-slate-400 via-slate-300/60 to-emerald-200/45 dark:from-slate-950 dark:via-[#0d1a14] dark:to-slate-950 bg-[radial-gradient(circle_at_1px_1px,rgba(6,95,70,0.30)_1px,transparent_0)] bg-[size:22px_22px]'
      }`}
      onScroll={handleScroll}
      onClick={(e) => {
        if (!preview && e.target === e.currentTarget) selectSection(null);
      }}
    >
      <GoogleFonts fonts={[designStyle.typography.headingFont, designStyle.typography.bodyFont]} />
      {preview && (
        <BehaviourRuntime
          animations={templateAnimations}
          behaviours={templateBehaviours}
          customCss={templateCustomCss}
        />
      )}
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
                                backgroundOverlayOpacity: section.style.backgroundOverlayOpacity,
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
                                    const anchor = section.anchorId;
                                    if (!anchor) return;
                                    try {
                                      const done = navigator.clipboard?.writeText(`#${anchor}`);
                                      if (done) {
                                        void done
                                          .then(() => {
                                            setCopiedId(anchor);
                                            setTimeout(() => {
                                              setCopiedId((c) => (c === anchor ? null : c));
                                            }, 1200);
                                          })
                                          .catch(() => undefined);
                                      }
                                    } catch {
                                      // Clipboard tak tersedia — abaikan.
                                    }
                                  }}
                                  disabled={!section.anchorId}
                                  title={
                                    section.anchorId
                                      ? `Anchor: #${section.anchorId} — klik untuk salin`
                                      : 'Section ini belum punya anchor (untuk link menu)'
                                  }
                                  className="font-mono font-normal text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {section.anchorId
                                    ? copiedId === section.anchorId
                                      ? '✓ disalin'
                                      : `#${section.anchorId}`
                                    : 'tanpa anchor'}
                                </button>
                              </span>
                            </div>

                            <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity z-10">
                              <div
                                className="flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="py-0.5 pl-1.5 pr-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 rounded-lg mr-0.5">
                                  #{index + 1}
                                </span>
                                <button
                                  onClick={() => index > 0 && reorderSections(index, index - 1)}
                                  disabled={index === 0}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => index < sections.length - 1 && reorderSections(index, index + 1)}
                                  disabled={index === sections.length - 1}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => openSectionConfig(section.id)}
                                  title="Edit isi blok ini"
                                  aria-label={`Edit blok ${variant?.name || section.type}`}
                                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                </button>
                                <button
                                  onClick={() => duplicateSection(section.id)}
                                  className="p-1.5 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus blok "${variant?.name || section.type}"?`)) {
                                      deleteSection(section.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
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
  return (
    <SiteHeader
      variant={variant}
      config={config}
      palette={template.theme.palette}
      radius={template.theme.components.borderRadius}
      compact={compact}
      navSolid={navSolid}
    />
  );
}

/**
 * Footer kanvas = wrapper tipis atas `SiteFooter` (sumber kebenaran tunggal
 * yang sama dipakai live site), supaya preview builder tidak pernah berbeda
 * dari situs nyata.
 */
function CanvasFooter({ variant, config, template, compact = false }: {
  variant: { id: string; name: string; layout: string };
  config: Record<string, unknown>;
  template: { theme: { palette: { primary: string; secondary: string; accent: string; background: string; surface: string; text: string; textMuted: string; border: string }; components: { borderRadius: number } } };
  compact?: boolean;
}) {
  return (
    <SiteFooter
      variant={variant}
      config={config}
      palette={template.theme.palette}
      radius={template.theme.components.borderRadius}
      compact={compact}
    />
  );
}
