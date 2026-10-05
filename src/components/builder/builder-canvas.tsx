'use client';

import { useEffect, useState, useRef } from 'react';
import { useTemplateStore, getSectionVariant, getHeaderVariant, getFooterVariant } from '@/lib/builder/template-store';
import { useBuilderStore } from '@/lib/builder/store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, Edit3 } from 'lucide-react';
import { SectionRenderer } from '@/components/builder/section-renderer';
import { VariantHtmlRenderer } from '@/components/builder/variant-html-renderer';
import { SiteHeader } from '@/components/builder/site-header-shared';
import { SiteFooter } from '@/components/builder/site-footer-shared';
import { DEFAULT_COMPONENTS, DEFAULT_TYPOGRAPHY } from '@/lib/builder/design-styles';
import { SectionPicker } from './section-picker';
import { GoogleFonts } from './google-fonts';
import { BehaviourRuntime } from './behaviour-runtime';
import { useConfirm } from '@/components/ui/confirm-dialog';
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
  const { requestConfirm, confirmDialog } = useConfirm();

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

  /**
   * Gulung kanvas ke blok yang baru dipilih.
   *
   * Tanpa ini, memilih blok lewat daftar di sidebar sering tidak terlihat
   * perubahannya kalau bloknya berada di luar area yang sedang digulir —
   * user merasa "klik-nya tidak masuk". Ini juga membuat blok terpilih tetap
   * terlihat saat navigasi pakai keyboard.
   */
  useEffect(() => {
    if (preview || !selectedSectionId) return;
    const el = document.querySelector<HTMLElement>(
      `[data-builder-block="${CSS.escape(selectedSectionId)}"]`,
    );
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedSectionId, preview]);
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
  // manual. Katalog DESIGN_STYLES sudah dihapus (migrasi 046); palet,
  // tipografi, dan komponen semuanya berasal dari template, dengan
  // DEFAULT_TYPOGRAPHY/DEFAULT_COMPONENTS sebagai jaring pengaman.
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);
  const typographyOverride = useBuilderStore((s) => s.typographyOverride);
  // Urutan merge: bawaan template → override user (dua store disinkronkan
  // di StyleSelector) → pastikan token theme:* selalu resolve ke warna aktif.
  const mergedPalette = { ...template.theme.palette, ...themeOverride, ...paletteOverride };
  const baseTypography = template.theme.typography ?? DEFAULT_TYPOGRAPHY;
  const designStyle: DesignStyle = {
    id: template.id,
    name: template.name,
    description: template.description,
    palette: mergedPalette,
    typography: {
      ...baseTypography,
      ...(typographyOverride.headingFont ? { headingFont: typographyOverride.headingFont } : {}),
      ...(typographyOverride.bodyFont ? { bodyFont: typographyOverride.bodyFont } : {}),
    },
    components: template.theme.components ?? DEFAULT_COMPONENTS,
    effects: template.theme.effects ?? {},
    thumbnailUrl: '',
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

  const canvasRef = useRef<HTMLDivElement>(null);

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
      {/*
        customCss SELALU dipasang (mode edit maupun preview): sebagian besar
        desain template library tinggal di sini (wave divider, neon, grid).
        Tanpa ini kanvas edit-mode telanjang sementara preview benar.
        Animasi & behaviour script HANYA di mode preview — script template di
        dalam editor bisa membajak klik/scroll dan merusak pengalaman edit.
      */}
      <BehaviourRuntime
        animations={preview ? templateAnimations : []}
        behaviours={preview ? templateBehaviours : []}
        customCss={templateCustomCss}
        root={canvasRef.current}
      />
      <div
        id="tpl-canvas"
        ref={canvasRef}
        className={`${bleed ? 'w-full' : 'mx-auto'} w-full flex flex-col transition-all duration-300`}
        style={{
          ...(bleed ? undefined : { maxWidth: `min(${viewportWidth}px, 100%)` }),
          transform: 'translateZ(0)',
          contain: 'layout paint style',
          isolation: 'isolate',
          position: 'relative',
          zIndex: 0,
        }}
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
          {/* Slot header: chrome overlay (mis. position:absolute) harus boleh
              terlukis di luar kotak slot yang tingginya nol — JANGAN beri
              overflow clip / paint containment di sini (pernah membuat header
              "tidak muncul" tanpa error). */}
          <div style={{ contain: 'layout style', isolation: 'isolate', position: 'relative' }}>
            <CanvasHeader variant={headerVariant} config={savedHeader as Record<string, unknown>} template={{ ...template, theme: effectiveTheme }} compact={viewportWidth < 640} navSolid={navSolid} />
          </div>

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
                    <div key={section.id} id={section.anchorId} data-builder-block={section.id}>
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
                            // v3.0: varian dengan `html` kustom dirender langsung
                            // dari HTML template (desain tidak terbatas layout bawaan).
                            if (typeof (variant as { html?: unknown }).html === 'string' && ((variant as { html: string }).html.trim().length > 0)) {
                              return (
                                <VariantHtmlRenderer
                                  type={section.type}
                                  variantId={section.variantId}
                                  html={(variant as { html: string }).html}
                                  config={section.config as Record<string, unknown>}
                                  configFields={variant.configFields}
                                  anchorId={section.anchorId}
                                />
                              );
                            }
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
                            {/* Toolbar kanvas.
                                Semuanya `opacity-0 group-hover:opacity-100`, artinya
                                HANYA muncul saat kursor di atas blok. Di layar sentuh
                                tidak ada hover sama sekali — kontrol jadi mustahil
                                dijangkau; untuk keyboard, blok tidak bisa difokus.
                                Sekarang: tetap tampil untuk blok terpilih, tampil saat
                                fokus di dalam, dan tetap tampil di perangkat tanpa
                                hover (`@media (hover: none)` — lihat globals.css). */}
                            <div
                              className={`section-toolbar section-toolbar-right transition-opacity ${
                                selectedSectionId === section.id
                                  ? 'opacity-100'
                                  : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold builder-tool">
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
                                   className="builder-tool builder-tool-primary anchor-copy-btn"
                                 >
                                   {section.anchorId
                                     ? copiedId === section.anchorId
                                       ? '✓ disalin'
                                       : `#${section.anchorId}`
                                     : 'tanpa anchor'}
                                 </button>
                              </span>
                            </div>

<div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity z-10 section-toolbar section-toolbar-left">
                               <div
                                 className="flex items-center gap-1.5 builder-tool"
                                 onClick={(e) => e.stopPropagation()}
                               >
                                 <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-200 px-2 py-1 rounded-lg">
                                   #{index + 1}
                                 </span>
                                 <button
                                   onClick={() => index > 0 && reorderSections(index, index - 1)}
                                   disabled={index === 0}
                                   className="builder-tool"
                                   aria-label="Pindah ke atas"
                                 >
                                   <ChevronUp className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => index < sections.length - 1 && reorderSections(index, index + 1)}
                                   disabled={index === sections.length - 1}
                                   className="builder-tool"
                                   aria-label="Pindah ke bawah"
                                 >
                                   <ChevronDown className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => openSectionConfig(section.id)}
                                   title="Edit isi blok ini"
                                   aria-label={`Edit blok ${variant?.name || section.type}`}
                                   className="builder-tool"
                                 >
                                   <Edit3 className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() => duplicateSection(section.id)}
                                   className="builder-tool"
                                   aria-label="Duplikat blok"
                                 >
                                   <Copy className="w-4 h-4" />
                                 </button>
                                 <button
                                   onClick={() =>
                                     requestConfirm({
                                       title: 'Hapus blok ini?',
                                       description: `Blok "${variant?.name || section.type}" akan dihapus dari halaman. Kalau salah, kamu bisa membatalkannya dengan Ctrl+Z.`,
                                       confirmLabel: 'Hapus blok',
                                       tone: 'destructive',
                                       onConfirm: () => deleteSection(section.id),
                                     })
                                   }
                                   className="builder-tool builder-tool-danger"
                                   aria-label={`Hapus blok ${variant?.name || section.type}`}
                                 >
                                   <Trash2 className="w-4 h-4" />
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
                                  className="pointer-events-auto builder-tool builder-tool-primary insert-block-btn"
                                >
                                  <Plus className="w-4 h-4" />
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
                <button
                  className="builder-tool builder-tool-primary w-full py-4 text-sm"
                  onClick={openPicker}
                >
                  <span className="flex items-center justify-center mr-1">
                    <Plus className="w-4 h-4" />
                  </span>
                  Tambah Blok Baru
                </button>
              </div>
            )}
          </div>

          {/* Slot footer: sama seperti header — chrome tidak boleh ter-clip. */}
          <div style={{ contain: 'layout style', isolation: 'isolate', position: 'relative' }}>
            <CanvasFooter variant={footerVariant} config={savedFooter as Record<string, unknown>} template={{ ...template, theme: effectiveTheme }} compact={viewportWidth < 640} />
          </div>
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
      {confirmDialog}
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
