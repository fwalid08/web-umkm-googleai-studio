'use client';

import { useEffect, useState } from 'react';
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
import { ConfigForm } from '@/lib/builder/config-form';
import { MockupPreview } from '@/lib/builder/mockup-preview';

type SidebarLevel = 'main' | 'sections' | 'section-config' | 'header' | 'footer' | 'seo' | 'style' | 'template-info';

export function BuilderSidebar({ websiteId }: { websiteId: string }) {
  const [level, setLevel] = useState<SidebarLevel>('main');
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [sectionSearch, setSectionSearch] = useState('');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const template = useTemplateStore((s) => s.template);
  const sections = useTemplateStore((s) => s.sections);
  const selectedSectionId = useTemplateStore((s) => s.selectedSectionId);
  const headerVariantId = useTemplateStore((s) => s.headerVariantId);
  const footerVariantId = useTemplateStore((s) => s.footerVariantId);
  const setHeaderVariant = useTemplateStore((s) => s.setHeaderVariant);
  const setFooterVariant = useTemplateStore((s) => s.setFooterVariant);
  const selectSection = useTemplateStore((s) => s.selectSection);
  const addSection = useTemplateStore((s) => s.addSection);

  const designStyleId = useBuilderStore((s) => s.designStyleId);

  useEffect(() => {
    const open = () => {
      setLevel('sections');
      setShowSectionPicker(true);
    };
    window.addEventListener('open-section-picker', open);
    return () => window.removeEventListener('open-section-picker', open);
  }, []);

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

  const headerVariant = getHeaderVariant(template, headerVariantId);
  const footerVariant = getFooterVariant(template, footerVariantId);

  const renderMainMenu = () => (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200/50 bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-amber-50/60 p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:from-white/[0.04] dark:via-transparent dark:to-transparent dark:border-white/[0.06]">
        <p className="text-[13px] font-extrabold leading-tight">Atur tampilan tokomu</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Klik kartu di bawah untuk edit. Semua tersimpan otomatis saat kamu tekan Simpan.
        </p>
      </div>
      <p className="px-1 pt-1 text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
        Konten halaman
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
        Percantik & promosi
      </p>
      <MenuCard
        onClick={() => setLevel('style')}
        icon={<Palette className="w-5 h-5 text-white" />}
        gradient="from-teal-500 to-emerald-600"
        hover="hover:border-teal-300 hover:shadow-teal-100"
        title="Tema & Warna"
        desc="Ganti theme & skema warna aman"
      />
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
          <h3 className="text-sm font-extrabold">{sections.length} blok halaman</h3>
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
              className={`p-2 rounded-xl border-2 text-left transition-all ${
                headerVariantId === h.id
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-slate-200/70 dark:border-white/10 hover:border-emerald-300'
              }`}
            >
              <div className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 mb-1.5 overflow-hidden">
                <MockupPreview mockup={h.mockup} />
              </div>
              <p className="text-[11px] font-bold">{h.name}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">{h.description}</p>
            </button>
          ))}
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Konten Header</h4>
        <ConfigForm
          fields={headerVariant.configFields}
          config={headerVariant.defaultConfig}
          onChange={() => {}}
        />
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
              className={`p-2 rounded-xl border-2 text-left transition-all ${
                footerVariantId === f.id
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'border-slate-200/70 dark:border-white/10 hover:border-emerald-300'
              }`}
            >
              <div className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 mb-1.5 overflow-hidden">
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
          config={footerVariant.defaultConfig}
          onChange={() => {}}
        />
      </div>
    </div>
  );

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
      case 'main': return 'Builder';
      case 'sections': return 'Sections';
      case 'section-config': return 'Section Config';
      case 'header': return 'Header';
      case 'footer': return 'Footer';
      case 'seo': return 'SEO';
      case 'style': return 'Tema & Warna';
      default: return 'Builder';
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
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">Pilih yang mau diatur</p>
              ) : level === 'section-config' && selectedSection ? (
                <p className="text-xs text-muted-foreground truncate">{selectedSection.type} • {selectedSection.variantId}</p>
              ) : level === 'style' ? (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">Theme, skema & warna — berlaku di semua halaman</p>
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
            <TemplateGallery
              websiteId={websiteId}
              onApply={async (template: any) => {
                const td = template.template_data as unknown as import('@/lib/builder/template-types').Template;
                useTemplateStore.getState().setTemplate(td.id);
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

function SeoConfigPanel() {
  const seo = useBuilderStore((s) => s.seo);
  const updateSeo = useBuilderStore((s) => s.updateSeo);
  const sections = useTemplateStore((s) => s.sections);

  const checks = [
    { label: `Meta title terisi (${seo.title.length}/60)`, ok: seo.title.trim().length >= 10 && seo.title.length <= 60 },
    { label: `Meta description terisi (${seo.description.length}/160)`, ok: seo.description.trim().length >= 50 && seo.description.length <= 160 },
    { label: `Minimal 3 section konten (${sections.length})`, ok: sections.length >= 3 },
    { label: 'Template dipilih', ok: true },
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
