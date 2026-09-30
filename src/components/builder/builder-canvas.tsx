'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/lib/builder/store';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, Menu, X } from 'lucide-react';
import { SectionRenderer } from './section-renderer';
import { getDesignStyle, getOnColor, resolvePalette } from '@/lib/builder/design-styles';
import { SECTION_REGISTRY } from '@/lib/builder/sections/registry';
import { SectionPicker } from './section-picker';
import type { SectionType } from '@/lib/builder/types';

export function BuilderCanvas({ preview = false, fullBleed = false }: { preview?: boolean; fullBleed?: boolean }) {
  const sections = useBuilderStore((s) => s.sections);
  const designStyleId = useBuilderStore((s) => s.designStyleId);
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId);
  const selectSection = useBuilderStore((s) => s.selectSection);
  const deleteSection = useBuilderStore((s) => s.deleteSection);
  const duplicateSection = useBuilderStore((s) => s.duplicateSection);
  const reorderSections = useBuilderStore((s) => s.reorderSections);
  const header = useBuilderStore((s) => s.header);
  const footer = useBuilderStore((s) => s.footer);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showInsertPicker, setShowInsertPicker] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);

  const designStyle = getDesignStyle(designStyleId) || getDesignStyle('minimalist')!;
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);
  const palette = resolvePalette(designStyle, paletteOverride);

  const viewportWidth = useBuilderStore((s) => s.viewportWidth);
  const isMobileFrame = viewportWidth <= 480;

  const openPicker = () => {
    // Sidebar mendengarkan event ini (lihat BuilderSidebar).
    // Fallback lokal jika sidebar tertutup: buka picker insert di canvas.
    window.dispatchEvent(new CustomEvent('open-section-picker'));
  };

  const handleInsertAt = (type: SectionType, variantId: string) => {
    const at = insertAt ?? sections.length;
    useBuilderStore.getState().insertSectionAt(type, variantId, at);
    setShowInsertPicker(false);
    setInsertAt(null);
    setHoveredIndex(null);
  };

  const totalVariants = Object.values(SECTION_REGISTRY).length;

  // Mode full-bleed (preview desktop): website tampil selebar viewport tanpa
  // kartu/bingkai — persis seperti situs live. Preview tablet/HP tetap di
  // tengah selebar device, juga tanpa chrome kartu.
  const bleed = preview && fullBleed;
  // builder-cq = query container: semua responsivitas konten section
  // mengikuti LEBAR BINGKAI kanvas (mode device), bukan viewport.
  const frameChrome = bleed
    ? 'flex-1 overflow-hidden builder-cq'
    : `flex-1 overflow-hidden builder-cq border-4 border-white dark:border-slate-800 ${
        isMobileFrame
          ? 'rounded-[2rem] border-slate-900 shadow-2xl shadow-emerald-900/20'
          : 'rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-900/10'
      }`;

  // Nav transparan menjadi solid setelah scroll > 50px (seperti referensi).
  // Dengarkan scroll container kanvas — bukan window — agar work di
  // mode edit MAUPUN preview full-page. State hanya berubah saat
  // melewati ambang agar tidak re-render tiap piksel.
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
        // Klik area kosong membatalkan seleksi
        if (!preview && e.target === e.currentTarget) selectSection(null);
      }}
    >
      <div
        className={`${bleed ? 'w-full' : 'mx-auto'} min-h-full flex flex-col transition-all duration-300`}
        // min() agar mode HP (375px) tidak overflow di layar < 375 + padding.
        style={bleed ? undefined : { maxWidth: `min(${viewportWidth}px, 100%)` }}
      >
        {/* Bingkai website dicat dengan background style (seperti situs live),
            agar teks vs latar selalu berpasangan: teks putih style gelap
            tidak lagi tampil di atas abu terang kanvas. */}
        <div
          className={frameChrome}
          style={{
            background: palette.background,
            color: palette.text,
            fontFamily: designStyle.typography.bodyFont,
          }}
        >
          {isMobileFrame && !preview && (
            <div className="flex justify-center pt-2 bg-slate-900">
              <div className="w-24 h-1.5 rounded-full bg-white/20" />
            </div>
          )}
          {/* compact: hamburger saat kanvas sempit (ikut lebar device,
              bukan lebar viewport — media query salah kaprah di sini). */}
          <CanvasHeader header={header} designStyle={designStyle} compact={viewportWidth < 640} navSolid={navSolid} />

          <div className="relative min-h-[320px]">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 sm:py-18 text-center bg-gradient-to-b from-emerald-50/80 via-white to-amber-50/60 dark:from-slate-800/40 dark:via-transparent dark:to-transparent">
                <div className="text-5xl mb-3">🏪✨</div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full shadow-sm mb-3">
                  🎉 {totalVariants} jenis blok siap pakai
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
                  const sectionType = SECTION_REGISTRY[section.type];
                  const isSelected = selectedSectionId === section.id;

                  return (
                    <div key={section.id}>
                      <div
                        role={!preview ? 'button' : undefined}
                        tabIndex={!preview ? 0 : undefined}
                        aria-label={sectionType?.name || section.type}
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
                        <SectionRenderer section={section} designStyle={designStyle} />

                        {!preview && (
                          <>
                            {/* Badge nama section playful */}
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/95 dark:bg-slate-900/95 backdrop-blur text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full shadow-md border border-emerald-200/70 dark:border-slate-700">
                                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                                  {index + 1}
                                </span>
                                {sectionType?.name || section.type}
                              </span>
                            </div>

                            {/* Toolbar melayang playful */}
                            <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-within:opacity-100 transition-opacity z-10">
                              <div
                                className="flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span className="py-1 pl-1.5 pr-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 rounded-lg mr-0.5" title="Blok {index + 1}">
                                  #{index + 1}
                                </span>
                                <button
                                  onClick={() => index > 0 && reorderSections(index, index - 1)}
                                  disabled={index === 0}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                                  title="Pindah ke atas"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => index < sections.length - 1 && reorderSections(index, index + 1)}
                                  disabled={index === sections.length - 1}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-30 transition-colors"
                                  title="Pindah ke bawah"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => duplicateSection(section.id)}
                                  className="p-2 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Duplikat blok"
                                >
                                  <Copy className="w-4 h-4 text-slate-500" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Hapus blok "${sectionType?.name || section.type}"?`)) {
                                      deleteSection(section.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                  title="Hapus blok"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>

                            {/* Tombol sisip di antara section */}
                            {hoveredIndex === index && index < sections.length - 1 && (
                              <div className="absolute -bottom-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInsertAt(index + 1);
                                    setShowInsertPicker(true);
                                  }}
                                  className="pointer-events-auto h-8 px-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform flex items-center gap-1"
                                  title="Sisipkan blok di sini"
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
                  Tambah Blok Baru ✨
                </Button>
              </div>
            )}
          </div>

          <CanvasFooter footer={footer} designStyle={designStyle} compact={viewportWidth < 640} />
        </div>
        {!preview && (
          <p className="text-center text-[11px] font-medium text-muted-foreground mt-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur inline-block mx-auto px-3 py-1 rounded-full border border-white dark:border-slate-800 shadow-sm">
            👆 Klik blok untuk edit • 🧱 {sections.length} blok • 📐 {viewportWidth}px
          </p>
        )}
      </div>

      {showInsertPicker && !preview && (
        <SectionPicker
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

function CanvasHeader({
  header,
  designStyle,
  compact = false,
  navSolid = false,
}: {
  header: { variant?: string; logoUrl: string; siteTitle: string; tagline: string; navItems: Array<{ id: string; label: string; url: string; enabled: boolean }>; ctaText: string; ctaLink: string; showCta: boolean; sticky?: boolean };
  designStyle: NonNullable<ReturnType<typeof getDesignStyle>>;
  compact?: boolean;
  /** true bila kanvas sudah di-scroll > 50px (nav transparan jadi solid). */
  navSolid?: boolean;
}) {
  const navStyle = designStyle.components.navStyle;
  const palette = resolvePalette(designStyle, useBuilderStore((s) => s.paletteOverride));
  const onPrimary = getOnColor(palette.primary);
  const [menuOpen, setMenuOpen] = useState(false);
  const links = header.navItems.filter((item) => item.enabled);
  const variant = header.variant || 'standard';
  // Nav transparan menyatu hero, solid setelah scroll — persis referensi.
  const transparentNow = navStyle === 'transparent' && !navSolid;

  const headerStyle: React.CSSProperties = {
    // Samakan dengan situs live: header kaca = putih 10% (bukan 80%),
    // agar teks putih style gelap/gradient tetap terbaca.
    background: transparentNow ? 'transparent' : navStyle === 'glass' ? 'rgba(255,255,255,0.1)' : palette.surface,
    borderBottom: transparentNow ? '1px solid transparent' : `1px solid ${palette.border}`,
    backdropFilter: navStyle === 'glass' ? 'blur(20px)' : undefined,
    transition: 'background .3s',
  };

  return (
    <header className={header.sticky !== false ? 'sticky top-0 z-20' : 'relative'} style={headerStyle}>
      {variant === 'centered' ? (
        /* Varian "Pill Tengah": brand besar di tengah, menu berbentuk pil. */
        <div className="flex flex-col items-center gap-2.5 px-4 sm:px-6 py-5 text-center">
          <div className="flex flex-col items-center gap-1.5">
            {header.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={header.logoUrl} alt={header.siteTitle} className="h-10 w-auto object-contain" />
            ) : (
              <div
                className="w-10 h-10 flex items-center justify-center font-bold text-base shrink-0"
                style={{ background: palette.primary, color: onPrimary, borderRadius: `${designStyle.components.borderRadius}px` }}
              >
                {(header.siteTitle || 'T').charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-base font-bold" style={{ color: palette.text }}>
              {header.siteTitle || 'Nama Toko'}
            </h1>
          </div>
          {!compact && links.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Navigasi website">
              {links.slice(0, 5).map((item) => (
                <span
                  key={item.id}
                  className="text-xs font-semibold px-3 py-1 rounded-full border"
                  style={{ color: palette.text, background: palette.surface, borderColor: palette.border, borderRadius: '999px' }}
                >
                  {item.label || 'Link'}
                </span>
              ))}
            </nav>
          )}
          {header.showCta && (
            <button
              className="px-5 py-2 text-[13px] font-bold shrink-0 shadow-md"
              style={{ background: palette.primary, color: onPrimary, borderRadius: '999px' }}
            >
              {header.ctaText || 'Hubungi Kami'}
            </button>
          )}
        </div>
      ) : variant === 'minimal' ? (
        /* Varian "Melayang": bar mengambang rounded dengan blur & bayangan. */
        <div className="px-3 pt-2.5">
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
                style={{ background: palette.primary, color: onPrimary, borderRadius: `${designStyle.components.borderRadius}px` }}
              >
                {(header.siteTitle || 'T').charAt(0).toUpperCase()}
              </div>
              <h1 className="text-[13px] font-bold truncate" style={{ color: palette.text }}>
                {header.siteTitle || 'Nama Toko'}
              </h1>
            </div>
            {header.showCta && (
              <button
                className="px-3 py-1.5 text-xs font-bold shrink-0"
                style={{ background: palette.primary, color: onPrimary, borderRadius: '999px' }}
              >
                {header.ctaText || 'Hubungi Kami'}
              </button>
            )}
          </div>
          <div className="h-2" />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {header.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={header.logoUrl} alt={header.siteTitle} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0"
                style={{ background: palette.primary, color: onPrimary, borderRadius: `${designStyle.components.borderRadius}px` }}
              >
                {(header.siteTitle || 'T').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate" style={{ color: palette.text }}>
                {header.siteTitle || 'Nama Toko'}
              </h1>
              {header.tagline && (
                <p className="text-xs truncate" style={{ color: palette.textMuted }}>
                  {header.tagline}
                </p>
              )}
            </div>
          </div>

          {variant !== 'minimal' && (compact ? (
            links.length > 0 && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
                  aria-expanded={menuOpen}
                  className="p-2 -mr-1 rounded-lg"
                  style={{ color: palette.text }}
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-xl p-1.5 z-30"
                    style={{ background: palette.surface, borderColor: palette.border }}
                  >
                    {links.slice(0, 7).map((item) => (
                      <span
                        key={item.id}
                        className="block px-3 py-2 text-sm font-medium rounded-lg"
                        style={{ color: palette.text }}
                      >
                        {item.label || 'Link'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <nav className="hidden @[640px]:flex items-center gap-5 shrink-0" aria-label="Navigasi website">
              {links.slice(0, 5).map((item) => (
                <span key={item.id} className="text-sm font-medium" style={{ color: palette.text }}>
                  {item.label || 'Link'}
                </span>
              ))}
            </nav>
          ))}

          {header.showCta && (
            <button
              className="px-3.5 py-2 text-[13px] font-medium shrink-0"
              style={{ background: palette.primary, color: onPrimary, borderRadius: `${designStyle.components.borderRadius}px` }}
            >
              {header.ctaText || 'Hubungi Kami'}
            </button>
          )}
        </div>
      )}
    </header>
  );
}

function CanvasFooter({
  footer,
  designStyle,
  compact = false,
}: {
  footer: { style: string; text: string; navItems: Array<{ id: string; label: string; url: string; enabled: boolean }>; showSocial: boolean };
  designStyle: NonNullable<ReturnType<typeof getDesignStyle>>;
  compact?: boolean;
}) {
  const palette = resolvePalette(designStyle, useBuilderStore((s) => s.paletteOverride));
  const onPrimary = getOnColor(palette.primary);
  // Token {year} selalu jadi tahun berjalan (seperti referensi).
  const footerText = footer.text.replace('{year}', String(new Date().getFullYear()));
  const variant = footer.style || 'simple';
  const nav = footer.navItems.filter((n) => n.enabled);
  const socials = ['IG', 'FB', 'TW', 'WA'];

  const socialRow = (centered = false) => (
    footer.showSocial && (
      <div className={`flex items-center gap-1.5 ${centered ? 'justify-center' : ''}`}>
        {socials.map((social) => (
          <div
            key={social}
            className="w-7 h-7 flex items-center justify-center text-[10px] font-medium"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${designStyle.components.borderRadius}px` }}
          >
            {social}
          </div>
        ))}
      </div>
    )
  );

  return (
    <footer
      className="border-t px-4 sm:px-6 py-6"
      style={{ background: palette.surface, borderColor: palette.border }}
    >
      {variant === 'minimal' ? (
        <p className="text-[13px] text-center" style={{ color: palette.textMuted }}>
          {footerText}
        </p>
      ) : variant === 'centered' ? (
        <div className="flex flex-col items-center text-center gap-2.5">
          <div
            className="w-10 h-10 flex items-center justify-center font-bold shadow-md"
            style={{ background: palette.primary, color: onPrimary, borderRadius: `${designStyle.components.borderRadius}px` }}
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
                <span key={item.id} className="text-[13px] font-medium" style={{ color: palette.textMuted }}>
                  {item.label}
                </span>
              ))}
            </nav>
          )}
          {socialRow(true)}
        </div>
      ) : variant === 'columns' ? (
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
                <li key={item.id} className="text-[13px]" style={{ color: palette.text }}>
                  {item.label}
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
      ) : (
        <div className={`flex ${compact ? 'flex-col' : 'flex-col @md:flex-row'} items-center justify-between gap-3`}>
          <p className="text-[13px] text-center @md:text-left" style={{ color: palette.textMuted }}>
            {footerText}
          </p>
          {nav.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {nav.map((item) => (
                <span key={item.id} className="text-[13px]" style={{ color: palette.textMuted }}>
                  {item.label}
                </span>
              ))}
            </nav>
          )}
          {socialRow()}
        </div>
      )}
    </footer>
  );
}
