'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTemplateStore, getHeaderVariant, getFooterVariant } from '@/lib/builder/template-store';
import { useBuilderStore } from '@/lib/builder/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Layout,
  FileText,
  PanelBottom,
  Search,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Palette,
  LayoutTemplate,
  Sparkles,
  Home,
  Search as SearchIcon,
  Settings,
  ChevronRight,
  Keyboard,
  X,
} from 'lucide-react';
import { SectionList } from './section-list';
import {
  SIDEBAR_TITLES,
  BUILDER_SHORTCUTS,
  MIN_SEO_TITLE,
  type SidebarLevel as BuilderSidebarLevel,
} from '@/lib/builder/builder-ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SectionConfig } from './section-config';
import { SectionPicker } from './section-picker';
import { StyleSelector } from './style-selector';
import { TemplateGallery } from './template-gallery';
import { ConfigForm } from '@/lib/builder/config-form';
import { MockupPreview } from '@/lib/builder/mockup-preview';
// No BUILT_IN_CATALOG import - templates now come from database
import type { BusinessCategory } from '@/lib/builder/templates/catalog';
import {
  applyTemplateToWebsite,
  applySavedTemplate,
  deleteSavedTemplate,
  resolveStoreTemplate,
  type ApplyableTemplate,
} from '@/lib/builder/apply-template';
import type { Template, HeaderVariant, FooterVariant } from '@/lib/builder/template-types';

/** Level panel sidebar. Sumber tunggal: `builder-ui.ts` (dipakai juga judulnya). */
type SidebarLevel = BuilderSidebarLevel;

/**
 * Varian darurat bila template aktif tidak punya varian header/footer
 * (mis. template kosong / data library tanpa varian). Tanpa ini
 * `headerVariant.defaultConfig` meledak "reading 'defaultConfig'".
 */
const FALLBACK_HEADER_VARIANT: HeaderVariant = {
  id: 'standard',
  name: 'Standar',
  description: '',
  layout: 'solid',
  configFields: [],
  defaultConfig: {},
  mockup: '',
};

const FALLBACK_FOOTER_VARIANT: FooterVariant = {
  id: 'simple',
  name: 'Simpel',
  description: '',
  layout: 'solid',
  configFields: [],
  defaultConfig: {},
  mockup: '',
};

/**
 * Baca konten header/footer chrome tersimpan untuk varian aktif.
 * Bila tersimpan di bawah key `config` (format instance) atau flat, dinormalkan.
 * Hasil di-memo oleh pemanggil; fungsi ini murni.
 */
function normalizeChrome(
  stored: unknown,
  defaults: Record<string, unknown>,
): Record<string, unknown> {
  const flat = (stored ?? {}) as Record<string, unknown>;
  const nested = (flat as { config?: unknown }).config;
  const cfg = (nested !== null && typeof nested === 'object' && !Array.isArray(nested)
    ? (nested as Record<string, unknown>)
    : flat) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(defaults)) {
    if (cfg[key] !== undefined) out[key] = cfg[key];
  }
  // Pertahankan key tersimpan lain (mis. navItems kustom) agar tidak hilang.
  for (const key of Object.keys(cfg)) {
    if (!(key in out) && key !== 'variant' && key !== 'style') out[key] = cfg[key];
  }
  return out;
}

export function BuilderSidebar({ websiteId, isPublished, onCloseMobile }: { websiteId: string; isPublished?: boolean; onCloseMobile?: () => void }) {
  const [level, setLevel] = useState<SidebarLevel>('main');
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  // Error apply template ditampilkan ke user. Versi lama hanya console.error +
  // return senyap, jadi kegagalan total terlihat seperti "tidak terjadi apa-apa".
  const [applyError, setApplyError] = useState('');

  const template = useTemplateStore((s) => s.template);
  const sections = useTemplateStore((s) => s.sections);
  const selectedSectionId = useTemplateStore((s) => s.selectedSectionId);
  const headerVariantId = useTemplateStore((s) => s.headerVariantId);
  const footerVariantId = useTemplateStore((s) => s.footerVariantId);
  const headerChromeConfig = useTemplateStore((s) => s.headerConfig);
  const footerChromeConfig = useTemplateStore((s) => s.footerConfig);
  const updateHeaderChrome = useTemplateStore((s) => s.updateHeaderConfig);
  const updateFooterChrome = useTemplateStore((s) => s.updateFooterConfig);
  const setHeaderVariant = useTemplateStore((s) => s.setHeaderVariant);
  const setFooterVariant = useTemplateStore((s) => s.setFooterVariant);
  const selectSection = useTemplateStore((s) => s.selectSection);
  const addSection = useTemplateStore((s) => s.addSection);

  useEffect(() => {
    const open = () => {
      setLevel('sections');
      setShowSectionPicker(true);
    };
    // Dipicu kanvas: tombol Edit pada action bar tiap blok.
    const openConfig = (e: Event) => {
      const sectionId = (e as CustomEvent<{ sectionId: string }>).detail?.sectionId;
      if (!sectionId) return;
      selectSection(sectionId);
      setLevel('section-config');
    };
    window.addEventListener('open-section-picker', open);
    window.addEventListener('open-section-config', openConfig as EventListener);
    return () => {
      window.removeEventListener('open-section-picker', open);
      window.removeEventListener('open-section-config', openConfig as EventListener);
    };
  }, [selectSection]);

  const handleBack = () => {
    if (level === 'section-config') setLevel('sections');
    else setLevel('main');
  };

  const selectedSection = selectedSectionId
    ? sections.find((s) => s.id === selectedSectionId)
    : null;

  const handleAddSection = (type: string, variant: { id: string }) => {
    addSection(type, variant.id);
    setShowSectionPicker(false);
  };

  const headerVariant = getHeaderVariant(template, headerVariantId) ?? FALLBACK_HEADER_VARIANT;
  const footerVariant = getFooterVariant(template, footerVariantId) ?? FALLBACK_FOOTER_VARIANT;

  const headerConfig = useMemo(
    () => normalizeChrome(headerChromeConfig, headerVariant.defaultConfig),
    [headerChromeConfig, headerVariant],
  );
  const footerConfig = useMemo(
    () => normalizeChrome(footerChromeConfig, footerVariant.defaultConfig),
    [footerChromeConfig, footerVariant],
  );

  const renderMainMenu = () => (
    <div className="space-y-3">
      <p className="px-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
        Desain & Styles
      </p>

      {/* Template jadi pintu pertama: user paling sering mulai dari "pakai
          template lain", bukan dari menyusun blok satu per satu. */}
      <MenuCard
        onClick={() => setShowTemplateGallery(true)}
        icon={<LayoutTemplate className="w-5 h-5 text-white" />}
        gradient="from-pink-500 to-rose-600"
        hover="hover:border-pink-300 hover:shadow-pink-100"
        title="Ganti Template"
        desc="Warna, font & gaya sekaligus"
        badge="Baru"
        badgeClass="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200"
      />
      <MenuCard
        onClick={() => setLevel('style')}
        icon={<Palette className="w-5 h-5 text-white" />}
        gradient="from-teal-500 to-emerald-600"
        hover="hover:border-teal-300 hover:shadow-teal-100"
        title="Theme & Font"
        desc="Ganti theme & skema warna aman"
      />

      <p className="px-1 pt-3 text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
        Konfigurasi Template
      </p>
      <MenuCard
        onClick={() => setLevel('header')}
        icon={<Layout className="w-5 h-5 text-white" />}
        gradient="from-sky-500 to-blue-600"
        hover="hover:border-sky-300 hover:shadow-sky-100"
        title="Header Toko"
        desc="Logo, nama toko & menu navigasi"
      />
      <MenuCard
        onClick={() => setLevel('sections')}
        icon={<FileText className="w-5 h-5 text-white" />}
        gradient="from-emerald-500 to-teal-600"
        hover="hover:border-emerald-300 hover:shadow-emerald-100"
        title="Blok Halaman"
        desc="Hero, produk, testimoni & lainnya"
        badge={`${sections.length} blok`}
        badgeClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      />
      <MenuCard
        onClick={() => setLevel('footer')}
        icon={<PanelBottom className="w-5 h-5 text-white" />}
        gradient="from-violet-500 to-purple-600"
        hover="hover:border-violet-300 hover:shadow-violet-100"
        title="Footer"
        desc="Info bawah, kontak & sosmed"
      />

      {/* SEO dipindah ke halaman dashboard sendiri (/seo) — lihat
          app/dashboard/seo/page.tsx. Di dalam builder tidak ada lagi, karena
          pengaturan ini bukan bagian dari template. */}

      {/* Pintasan keyboard — daftarnya diambil dari BUILDER_SHORTCUTS. */}
      <details className="group rounded-2xl border border-slate-200/70 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] overflow-hidden">
        <summary className="flex items-center gap-2 px-3.5 py-2.5 cursor-pointer select-none text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
          <Keyboard className="w-4 h-4" />
          Pintasan keyboard
          <ChevronRight className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-90" />
        </summary>
        <ul className="px-3.5 pb-3 space-y-1.5">
          {BUILDER_SHORTCUTS.map((s) => (
            <li key={s.keys} className="flex items-center justify-between gap-3">
              <kbd className="px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 font-mono text-[10px] font-bold text-foreground">
                {s.keys}
              </kbd>
              <span className="text-[11px] text-muted-foreground text-right">{s.label}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );

  const renderSectionsList = () => (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200/50 bg-white p-3 flex items-center justify-between gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:bg-white/[0.03] dark:border-white/[0.06]">
        <div>
          <h3 className="text-sm font-extrabold">{sections.length} blok halaman</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Klik blok untuk edit • seret untuk susun</p>
        </div>
        <Button size="sm" className="h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 font-bold shadow-sm shrink-0" onClick={() => setShowSectionPicker(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          Tambah
        </Button>
      </div>
      {sections.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari blok… mis. hero, produk"
            value={sectionSearch}
            onChange={(e) => setSectionSearch(e.target.value)}
            className="pl-8 h-8 text-[11px] rounded-lg bg-white dark:bg-slate-800"
          />
        </div>
      )}
      <SectionList search={sectionSearch} onEditSection={(id) => {
        selectSection(id);
        setLevel('section-config');
      }} />
    </div>
  );

  const renderSectionConfig = () => {
    if (!selectedSection) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Pilih section untuk mengedit</p>
        </div>
      );
    }
    return <SectionConfig section={selectedSection} />;
  };

  const renderHeaderConfig = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/50 bg-white dark:bg-white/[0.03] dark:border-white/[0.06] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] space-y-2">
        <Label className="text-xs font-bold">Gaya header</Label>
        <div className="grid grid-cols-2 gap-2">
          {template.headers.map((h) => (
            <button
              key={h.id}
              onClick={() => setHeaderVariant(h.id)}
              className={`p-1.5 rounded-lg border-2 text-left transition-all ${
                headerVariantId === h.id
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-slate-200/70 dark:border-white/10 hover:border-emerald-300'
              }`}
            >
              <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 mb-1 overflow-hidden">
                <MockupPreview mockup={h.mockup} />
              </div>
              <p className="text-[11px] font-bold">{h.name}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{h.description}</p>
            </button>
          ))}
        </div>
      </div>
      <Separator />
      {/* Daftar anchor yang bisa dipakai di kolom URL menu. Tanpa ini user
          cenderung menyalin "Section ID" (UUID) yang tidak akan pernah cocok
          dengan id di DOM — bug link menu yang tidak menuju section. */}
      {sections.filter((s) => s.anchorId).length > 0 && (
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-3.5 space-y-2">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            Anchor tersedia untuk URL menu
          </Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Di kolom URL menu, pakai format <span className="font-mono">#</span> +
            nama anchor di bawah ini agar link melompat ke section yang benar.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sections
              .filter((s) => s.anchorId)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title="Klik untuk menyalin #anchor"
                  onClick={() => {
                    try {
                      void navigator.clipboard
                        ?.writeText(`#${s.anchorId}`)
                        ?.catch(() => undefined);
                    } catch {
                      // Clipboard tak tersedia — abaikan.
                    }
                  }}
                  className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  #{s.anchorId}
                </button>
              ))}
          </div>
        </div>
      )}
      <Separator />
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Konten Header</h4>
        {/* Field "Submenu" hanya ditampilkan bila template ini mendukung 2
            tingkat menu (`maxNavDepth: 2`). Template 1 tingkat tetap punya
            key `children` di configFields agar renderer tidak error, tapi
            form menyembunyikannya agar user tidak bisa membuat menu yang
            tidak akan dirender. */}
        <ConfigForm
          fields={headerVariant.configFields}
          config={{ ...headerVariant.defaultConfig, ...headerConfig }}
          onChange={(key, value) => updateHeaderChrome({ [key]: value })}
          hiddenItemFieldKeys={headerVariant.maxNavDepth === 2 ? [] : ['children']}
        />
        {headerVariant.maxNavDepth !== 2 && (
          <p className="text-[10px] text-muted-foreground">
            Template ini memakai menu 1 tingkat (tanpa submenu).
          </p>
        )}
      </div>
    </div>
  );

  const renderFooterConfig = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/50 bg-white dark:bg-white/[0.03] dark:border-white/[0.06] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] space-y-2">
        <Label className="text-xs font-bold">Gaya footer</Label>
        <div className="grid grid-cols-2 gap-2">
          {template.footers.map((f) => (
            <button
              key={f.id}
              onClick={() => setFooterVariant(f.id)}
              className={`p-1.5 rounded-lg border-2 text-left transition-all ${
                footerVariantId === f.id
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-slate-200/70 dark:border-white/10 hover:border-emerald-300'
              }`}
            >
              <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 mb-1 overflow-hidden">
                <MockupPreview mockup={f.mockup} />
              </div>
              <p className="text-[11px] font-bold">{f.name}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{f.description}</p>
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Konten Footer</h4>
        <ConfigForm
          fields={footerVariant.configFields}
          config={{ ...footerVariant.defaultConfig, ...footerConfig }}
          onChange={(key, value) => updateFooterChrome({ [key]: value })}
        />
      </div>
    </div>
  );

  const renderStyleSelector = () => <StyleSelector />;

  const renderContent = () => {
    switch (level) {
      case 'main':
        return renderMainMenu();
      case 'sections':
        return renderSectionsList();
      case 'section-config':
        return renderSectionConfig();
      case 'header':
        return renderHeaderConfig();
      case 'footer':
        return renderFooterConfig();
      case 'style':
        return renderStyleSelector();
      default:
        return renderMainMenu();
    }
  };

  const getTitle = () => SIDEBAR_TITLES[level] ?? SIDEBAR_TITLES.main;

  const canGoBack = level !== 'main';

  return (
    <>
      <aside className="w-full flex flex-col shrink-0 h-full min-h-0 bg-gradient-to-b from-white to-emerald-50/40 dark:from-slate-900 dark:to-slate-900">
        <div className="px-3.5 py-2.5 border-b border-slate-200/40 dark:border-white/[0.06] shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-emerald-100" onClick={handleBack} title="Kembali">
                <ArrowLeft className="w-3.5 h-3.5" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 inline-block" />
                {getTitle()}
              </h2>
              {level === 'main' ? (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">Pilih yang mau diatur</p>
              ) : level === 'section-config' && selectedSection ? (
                <p className="text-xs text-muted-foreground truncate">{selectedSection.type} • {selectedSection.variantId}</p>
              ) : level === 'style' ? (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">Tema, skema & warna — berlaku di semua halaman</p>
              ) : (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{sections.length} blok di halaman ini</p>
              )}
            </div>
            {/* Di HP sidebar jadi drawer menumpuk di atas kanvas, jadi butuh
                tombol tutup yang jelas — sebelumnya satu-satunya cara menutup
                adalah mengetuk area gelap di belakang panel. */}
            {onCloseMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg hover:bg-emerald-100 sm:hidden shrink-0"
                onClick={onCloseMobile}
                aria-label="Tutup panel pengaturan"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-8 min-h-0">
          {renderContent()}
        </div>
      </aside>

      {showSectionPicker && (
        <SectionPicker
          sections={template.sections}
          onSelect={handleAddSection}
          onClose={() => setShowSectionPicker(false)}
        />
      )}

      {showTemplateGallery && (
        <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-primary" />
                Pilih Template Website
              </DialogTitle>
              <DialogDescription>
                Satu template mengatur semuanya: style, warna, font, navigasi, footer, dan layout —
                berlaku di homepage, blog, checkout, dan halaman custom.
              </DialogDescription>
            </DialogHeader>
            {applyError && (
              <div className="mx-4 mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {applyError}
              </div>
            )}
            <TemplateGallery
              websiteId={websiteId}
              onApply={async (template: any) => {
                if (!template?.id) {
                  setApplyError('Template tidak valid.');
                  return;
                }
                setApplyError('');

                // Apply ditangani modul bersama (`lib/builder/apply-template`) —
                // jangan diduplikasi di sini.
                const applyable = template as ApplyableTemplate;

                // Resolve template untuk store/kanvas via helper bersama
                // (lookup katalog statis; undefined → error "Template tidak
                // ditemukan").
                let storeTemplate: Template | undefined;
                try {
                  storeTemplate = resolveStoreTemplate(applyable);
                } catch (e) {
                  setApplyError(e instanceof Error ? e.message : 'Gagal menyiapkan template');
                  return;
                }
                if (!storeTemplate) {
                  setApplyError('Template tidak ditemukan. Coba muat ulang halaman.');
                  return;
                }

                const result = await applyTemplateToWebsite({ websiteId, template: applyable });
                if (!result.ok) {
                  setApplyError(result.error ?? 'Gagal menerapkan template');
                  return;
                }

                useTemplateStore.getState().applyTemplate(result.templateId, storeTemplate);
                useBuilderStore.getState().resetPaletteOverride();
                setShowTemplateGallery(false);
              }}
              onApplySaved={async (saved) => {
                setApplyError('');
                // Ganti template: config library ditulis ulang ke template
                // aktif website. Setelah itu kanvas dimuat ulang dari server
                // supaya isi store = isi DB (apply lewat katalog cukup dengan
                // `applyTemplate`, tapi apply ini menulis config dari DB
                // sehingga store lokal jadi basi).
                const result = await applySavedTemplate({ websiteId, saved });
                if (!result.ok) {
                  setApplyError(result.error ?? 'Gagal memakai template');
                  return;
                }
                setShowTemplateGallery(false);
                // Muat ulang builder supaya kanvas/header/footer mengikuti
                // template yang baru dipakai.
                window.location.reload();
              }}
              onDeleteSaved={async (saved) => {
                setApplyError('');
                // Hapus hanya salinan library. Template aktif website tidak
                // tersentuh, jadi kanvas user tetap utuh — tidak perlu reload.
                const result = await deleteSavedTemplate({ libraryId: saved.id });
                if (!result.ok) {
                  setApplyError(result.error ?? 'Gagal menghapus template');
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function MenuCard({
  onClick,
  icon,
  gradient,
  hover,
  title,
  desc,
  badge,
  badgeClass,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  gradient: string;
  hover: string;
  title: string;
  desc: string;
  badge?: string;
  badgeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/[0.04] text-left group border border-slate-200/50 dark:border-white/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:shadow-[0_4px_12px_rgba(15,23,42,0.07)] hover:-translate-y-px transition-all duration-200 ${hover}`}
    >
      <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold leading-tight">{title}</span>
        <span className="block text-xs text-muted-foreground truncate mt-0.5">{desc}</span>
      </span>
      {badge ? (
        <span className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${badgeClass ?? 'bg-slate-100 text-slate-600'}`}>
          {badge}
        </span>
      ) : (
        <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0">›</span>
      )}
    </button>
  );
}
