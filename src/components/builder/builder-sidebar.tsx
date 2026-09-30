'use client';

import { useEffect, useState } from 'react';
import { useBuilderStore } from '@/lib/builder/store';
import { DESIGN_STYLES } from '@/lib/builder/design-styles';
import { HEADER_VARIANTS, FOOTER_VARIANTS } from '@/lib/builder/chrome';
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
  ExternalLink,
} from 'lucide-react';
import { SectionList } from './section-list';
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
import type { SectionType } from '@/lib/builder/types';

type SidebarLevel = 'main' | 'sections' | 'section-config' | 'header' | 'footer' | 'seo' | 'style' | 'template-info';

export function BuilderSidebar({ websiteId }: { websiteId: string }) {
  const [level, setLevel] = useState<SidebarLevel>('main');
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId);
  const sections = useBuilderStore((s) => s.sections);
  const designStyleId = useBuilderStore((s) => s.designStyleId);

  // Canvas memicu event ini saat tombol "Tambah Section" diklik.
  // Tanpa listener ini tombol tersebut tidak melakukan apa-apa (bug lama).
  useEffect(() => {
    const open = () => {
      setLevel('sections');
      setShowSectionPicker(true);
    };
    window.addEventListener('open-section-picker', open);
    return () => window.removeEventListener('open-section-picker', open);
  }, []);

  const handleBack = () => {
    // Kembali ke context sebelumnya, bukan selalu ke main
    if (level === 'section-config') setLevel('sections');
    else setLevel('main');
  };

  const selectedSection = selectedSectionId
    ? sections.find((s) => s.id === selectedSectionId)
    : null;

  const handleAddSection = (type: SectionType, variantId: string) => {
    useBuilderStore.getState().addSection(type, variantId);
    setShowSectionPicker(false);
  };

  const renderMainMenu = () => (
    <div className="space-y-3">
      {/* Banner sambutan playful */}
      <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-amber-50/60 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:from-white/[0.04] dark:via-transparent dark:to-transparent dark:border-white/[0.06]">
        <p className="text-[13px] font-extrabold leading-tight">🎨 Atur tampilan tokomu</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Klik kartu di bawah untuk edit. Semua tersimpan otomatis saat kamu tekan Simpan.
        </p>
      </div>
      <p className="px-1 pt-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
        🧱 Konten halaman
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

      <p className="px-1 pt-3 text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
        ⚙️ Percantik & promosi
      </p>
      <MenuCard
        onClick={() => setLevel('style')}
        icon={<Palette className="w-5 h-5 text-white" />}
        gradient="from-teal-500 to-emerald-600"
        hover="hover:border-teal-300 hover:shadow-teal-100"
        title="Tema & Warna"
        desc="Ganti theme & skema warna aman"
        badge={DESIGN_STYLES.find((s) => s.id === designStyleId)?.name ?? 'Tema'}
        badgeClass="bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200"
      />
      <MenuCard
        onClick={() => setShowTemplateGallery(true)}
        icon={<LayoutTemplate className="w-5 h-5 text-white" />}
        gradient="from-pink-500 to-rose-600"
        hover="hover:border-pink-300 hover:shadow-pink-100"
        title="Ganti Template"
        desc="Warna, font & gaya sekaligus ✨"
        badge="Baru"
        badgeClass="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200"
      />
      <MenuCard
        onClick={() => setLevel('seo')}
        icon={<Search className="w-5 h-5 text-white" />}
        gradient="from-amber-500 to-orange-600"
        hover="hover:border-amber-300 hover:shadow-amber-100"
        title="SEO Google"
        desc="Judul & deskripsi agar mudah dicari"
      />
    </div>
  );

  const renderSectionsList = () => (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200/50 bg-white p-3 flex items-center justify-between gap-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:bg-white/[0.03] dark:border-white/[0.06]">
        <div>
          <h3 className="text-sm font-extrabold">🧱 {sections.length} blok halaman</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Klik blok untuk edit • seret untuk susun</p>
        </div>
        <Button size="sm" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold shadow-sm shrink-0" onClick={() => setShowSectionPicker(true)}>
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
            className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-800"
          />
        </div>
      )}
      <SectionList search={sectionSearch} onEditSection={(id) => {
        useBuilderStore.getState().selectSection(id);
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

  const renderHeaderConfig = () => <HeaderConfigPanel />;
  const renderFooterConfig = () => <FooterConfigPanel />;
  const renderSeoConfig = () => <SeoConfigPanel />;
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
      case 'seo':
        return renderSeoConfig();
      case 'style':
        return renderStyleSelector();
      default:
        return renderMainMenu();
    }
  };

  const getTitle = () => {
    switch (level) {
      case 'main':
        return 'Builder';
      case 'sections':
        return 'Sections';
      case 'section-config':
        return 'Section Config';
      case 'header':
        return 'Top Header';
      case 'footer':
        return 'Footer';
      case 'seo':
        return 'SEO';
      case 'style':
        return 'Tema & Warna';
      default:
        return 'Builder';
    }
  };

  const canGoBack = level !== 'main';

  return (
    <>
      <aside className="w-full flex flex-col shrink-0 h-full min-h-0 bg-gradient-to-b from-white to-emerald-50/40 dark:from-slate-900 dark:to-slate-900">
        <div className="px-4 py-3 border-b border-slate-200/40 dark:border-white/[0.06] shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur">
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-emerald-100" onClick={handleBack} title="Kembali">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 inline-block" />
                {getTitle()}
              </h2>
              {level === 'main' ? (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">Pilih yang mau diatur 👇</p>
              ) : level === 'section-config' && selectedSection ? (
                <p className="text-xs text-muted-foreground truncate">{selectedSection.type} • {selectedSection.variant}</p>
              ) : level === 'style' ? (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">Theme, skema & warna — berlaku di semua halaman ✨</p>
              ) : (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{sections.length} blok di halaman ini</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-8 min-h-0">
          {renderContent()}
        </div>
      </aside>

      {showSectionPicker && (
        <SectionPicker
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
            <TemplateGallery
              websiteId={websiteId}
              onApply={async (template: any) => {
                const td = template.template_data as unknown as import('@/lib/builder/types').FullTemplateData;
                useBuilderStore.getState().applyFullTemplate({
                  designStyleId: td.designStyleId ?? td.design_style_id,
                  paletteOverride: td.paletteOverride ?? td.palette_override,
                  sections: td.sections ?? [],
                  header: td.header,
                  footer: td.footer,
                  seo: td.seo,
                  core: td.core,
                });
                try {
                  await useBuilderStore.getState().save(websiteId);
                } catch (e) {
                  console.error('Gagal simpan template:', e);
                }
                setShowTemplateGallery(false);
              }}
              onPreview={(template: any) => {
                window.open(`/preview/${template.id}`, '_blank');
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

function HeaderConfigPanel() {
  const header = useBuilderStore((s) => s.header);
  const updateHeader = useBuilderStore((s) => s.updateHeader);
  const addNavItem = useBuilderStore((s) => s.addNavItem);
  const updateNavItem = useBuilderStore((s) => s.updateNavItem);
  const deleteNavItem = useBuilderStore((s) => s.deleteNavItem);
  const reorderNavItems = useBuilderStore((s) => s.reorderNavItems);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/50 bg-white dark:bg-white/[0.03] dark:border-white/[0.06] p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] space-y-2">
        <Label className="text-xs font-bold">🎨 Gaya header (bawaan template)</Label>
        <Select
          value={header.variant || 'standard'}
          onValueChange={(value) => updateHeader({ variant: value })}
        >
          <SelectTrigger className="h-9 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-900 font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HEADER_VARIANTS.map((v) => (
              <SelectItem key={v.id} value={v.id} className="text-xs">{v.name} — {v.description}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Logo & Title</h4>
        <div className="space-y-2">
          <Label>Logo URL</Label>
          <Input
            value={header.logoUrl}
            onChange={(e) => updateHeader({ logoUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label>Site Title</Label>
          <Input
            value={header.siteTitle}
            onChange={(e) => updateHeader({ siteTitle: e.target.value })}
            placeholder="Toko Saya"
          />
        </div>
        <div className="space-y-2">
          <Label>Tagline</Label>
          <Input
            value={header.tagline}
            onChange={(e) => updateHeader({ tagline: e.target.value })}
            placeholder="Produk berkualitas"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Navigation</h4>
          <Button size="sm" variant="outline" onClick={() => addNavItem('header')}>
            <Plus className="w-3 h-3 mr-1" />
            Tambah
          </Button>
        </div>
        <div className="space-y-2">
          {header.navItems.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => reorderNavItems('header', index, index - 1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => reorderNavItems('header', index, index + 1)}
                  disabled={index === header.navItems.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  className="h-7 text-xs"
                  value={item.label}
                  onChange={(e) => updateNavItem('header', item.id, { label: e.target.value })}
                  placeholder="Label"
                />
                <Input
                  className="h-7 text-xs"
                  value={item.url}
                  onChange={(e) => updateNavItem('header', item.id, { url: e.target.value })}
                  placeholder="URL"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => updateNavItem('header', item.id, { enabled: e.target.checked })}
                  className="w-3 h-3"
                />
              </label>
              <button
                onClick={() => deleteNavItem('header', item.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Perilaku</h4>
        <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
          <div>
            <Label htmlFor="header-sticky">Header menempel</Label>
            <p className="text-[11px] text-muted-foreground">Tetap terlihat saat scroll (sticky)</p>
          </div>
          <Switch
            id="header-sticky"
            checked={header.sticky !== false}
            onCheckedChange={(v) => updateHeader({ sticky: v })}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">CTA Button</h4>
        <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
          <Label htmlFor="header-cta">Tampilkan CTA</Label>
          <Switch
            id="header-cta"
            checked={header.showCta}
            onCheckedChange={(v) => updateHeader({ showCta: v })}
          />
        </div>
        {header.showCta && (
          <>
            <div className="space-y-2">
              <Label>CTA Text</Label>
              <Input
                value={header.ctaText}
                onChange={(e) => updateHeader({ ctaText: e.target.value })}
                placeholder="Hubungi Kami"
              />
            </div>
            <div className="space-y-2">
              <Label>CTA Link</Label>
              <Input
                value={header.ctaLink}
                onChange={(e) => updateHeader({ ctaLink: e.target.value })}
                placeholder="/kontak"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FooterConfigPanel() {
  const footer = useBuilderStore((s) => s.footer);
  const updateFooter = useBuilderStore((s) => s.updateFooter);
  const addNavItem = useBuilderStore((s) => s.addNavItem);
  const updateNavItem = useBuilderStore((s) => s.updateNavItem);
  const deleteNavItem = useBuilderStore((s) => s.deleteNavItem);
  const reorderNavItems = useBuilderStore((s) => s.reorderNavItems);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">🎨 Gaya footer (bawaan template)</h4>
        <Select
          value={footer.style}
          onValueChange={(value) => updateFooter({ style: value as 'simple' | 'columns' | 'centered' | 'minimal' })}
        >
          <SelectTrigger className="h-9 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-900 font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOOTER_VARIANTS.map((v) => (
              <SelectItem key={v.id} value={v.id as 'simple' | 'columns' | 'centered' | 'minimal'} className="text-xs">{v.name} — {v.description}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Footer Text</h4>
        <Input
          value={footer.text}
          onChange={(e) => updateFooter({ text: e.target.value })}
          placeholder={`© ${new Date().getFullYear()} Toko Saya`}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Footer Navigation</h4>
          <Button size="sm" variant="outline" onClick={() => addNavItem('footer')}>
            <Plus className="w-3 h-3 mr-1" />
            Tambah
          </Button>
        </div>
        <div className="space-y-2">
          {footer.navItems.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => reorderNavItems('footer', index, index - 1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => reorderNavItems('footer', index, index + 1)}
                  disabled={index === footer.navItems.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  className="h-7 text-xs"
                  value={item.label}
                  onChange={(e) => updateNavItem('footer', item.id, { label: e.target.value })}
                  placeholder="Label"
                />
                <Input
                  className="h-7 text-xs"
                  value={item.url}
                  onChange={(e) => updateNavItem('footer', item.id, { url: e.target.value })}
                  placeholder="URL"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => updateNavItem('footer', item.id, { enabled: e.target.checked })}
                  className="w-3 h-3"
                />
              </label>
              <button
                onClick={() => deleteNavItem('footer', item.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Social Links</h4>
        <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
          <Label htmlFor="footer-social">Tampilkan ikon sosial</Label>
          <Switch
            id="footer-social"
            checked={footer.showSocial}
            onCheckedChange={(v) => updateFooter({ showSocial: v })}
          />
        </div>
      </div>
    </div>
  );
}

function SeoConfigPanel() {
  const seo = useBuilderStore((s) => s.seo);
  const updateSeo = useBuilderStore((s) => s.updateSeo);
  const sections = useBuilderStore((s) => s.sections);
  const designStyleId = useBuilderStore((s) => s.designStyleId);

  const checks = [
    { label: `Meta title terisi (${seo.title.length}/60)`, ok: seo.title.trim().length >= 10 && seo.title.length <= 60 },
    { label: `Meta description terisi (${seo.description.length}/160)`, ok: seo.description.trim().length >= 50 && seo.description.length <= 160 },
    { label: `Minimal 3 section konten (${sections.length})`, ok: sections.length >= 3 },
    { label: 'Design style dipilih', ok: Boolean(designStyleId) },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Meta Tags</h4>
        <div className="space-y-2">
          <Label>Meta Title</Label>
          <Input
            value={seo.title}
            onChange={(e) => updateSeo({ title: e.target.value, description: seo.description })}
            placeholder="Toko Saya - Produk Berkualitas"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">{seo.title.length}/60 karakter</p>
        </div>
        <div className="space-y-2">
          <Label>Meta Description</Label>
          <Textarea
            className="min-h-[100px]"
            value={seo.description}
            onChange={(e) => updateSeo({ title: seo.title, description: e.target.value })}
            placeholder="Deskripsi toko Anda untuk mesin pencari"
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">{seo.description.length}/160 karakter</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Social Preview</h4>
        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
          Preview sosial (OG image) dibuat otomatis dari judul, deskripsi, dan logo toko saat website dipublish.
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">SEO Score</h4>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${score >= 75 ? 'bg-emerald-100 text-emerald-700' : score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {score}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="p-3 border rounded-lg bg-muted/40">
          <ul className="text-xs space-y-1.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${c.ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={c.ok ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
