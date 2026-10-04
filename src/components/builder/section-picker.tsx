'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Layout, Grid, ShoppingBag, Quote, HelpCircle, Megaphone, Mail, Info, Image as ImageIcon, Play, Users, DollarSign, Send, Minus, MoveHorizontal, Coffee, ListOrdered, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { SectionTypeDefinition, SectionVariant } from '@/lib/builder/template-types';
import { MockupPreview } from '@/lib/builder/mockup-preview';

interface SectionPickerProps {
  sections: SectionTypeDefinition[];
  onSelect: (type: SectionType, variant: SectionVariant) => void;
  onClose: () => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Layout className="w-5 h-5" />,
  features: <Grid className="w-5 h-5" />,
  product_grid: <ShoppingBag className="w-5 h-5" />,
  testimonials: <Quote className="w-5 h-5" />,
  faq: <HelpCircle className="w-5 h-5" />,
  cta: <Megaphone className="w-5 h-5" />,
  contact: <Mail className="w-5 h-5" />,
  about: <Info className="w-5 h-5" />,
  gallery: <ImageIcon className="w-5 h-5" />,
  video: <Play className="w-5 h-5" />,
  team: <Users className="w-5 h-5" />,
  pricing: <DollarSign className="w-5 h-5" />,
  newsletter: <Send className="w-5 h-5" />,
  divider: <Minus className="w-5 h-5" />,
  marquee: <MoveHorizontal className="w-5 h-5" />,
  menu_board: <Coffee className="w-5 h-5" />,
  steps: <ListOrdered className="w-5 h-5" />,
  location: <MapPin className="w-5 h-5" />,
};

const POPULAR: string[] = ['hero', 'product_grid', 'testimonials', 'cta', 'menu_board'];

const TYPE_TINT: Record<string, string> = {
  hero: 'from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/30',
  product_grid: 'from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/20',
  testimonials: 'from-pink-100 to-rose-100 dark:from-pink-950/40 dark:to-rose-950/20',
  features: 'from-sky-100 to-blue-100 dark:from-sky-950/40 dark:to-blue-950/20',
  cta: 'from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/20',
  gallery: 'from-fuchsia-100 to-purple-100 dark:from-fuchsia-950/40 dark:to-purple-950/20',
  faq: 'from-cyan-100 to-sky-100 dark:from-cyan-950/40 dark:to-sky-950/20',
  pricing: 'from-lime-100 to-emerald-100 dark:from-lime-950/30 dark:to-emerald-950/30',
  menu_board: 'from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/20',
};

function tintFor(type: string) {
  return TYPE_TINT[type] ?? 'from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700';
}

export function SectionPicker({ sections, onSelect, onClose }: SectionPickerProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'semua' | 'populer' | string>('semua');
  const inputRef = useRef<HTMLInputElement>(null);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = sections;
    if (category === 'populer') list = list.filter((s) => POPULAR.includes(s.type));
    else if (category !== 'semua') list = list.filter((s) => s.type === category);
    if (!q) return list;
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.variants.some((v) => v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)),
    );
  }, [sections, q, category]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pilih blok halaman"
    >
      <div
        className="bg-gradient-to-b from-white to-emerald-50/40 dark:from-slate-900 dark:to-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden border border-emerald-100 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2.5 p-4 pb-2.5">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Pilih Blok Halaman</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {filtered.length} dari {sections.length} jenis • klik untuk langsung pasang
              {q && (
                <>
                  {' '}• &ldquo;<span className="font-semibold text-foreground">{search.trim()}</span>&rdquo;
                </>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Tutup (Esc)"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 sm:px-6 pb-3 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Cari: hero, produk, testimoni, harga… (Esc untuk tutup)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-[12px] rounded-lg bg-white dark:bg-slate-800 border-emerald-200/60 focus-visible:ring-emerald-400"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {[
              { id: 'semua' as const, label: 'Semua' },
              { id: 'populer' as const, label: 'Populer' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  category === c.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent shadow-md shadow-emerald-500/25'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                {c.label}
              </button>
            ))}
            {sections.map((s) => (
              <button
                key={s.type}
                onClick={() => setCategory(category === s.type ? 'semua' : s.type)}
                className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                  category === s.type
                    ? 'bg-slate-900 text-white border-transparent dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-white/60 dark:bg-transparent">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">...</div>
              <p className="font-extrabold">Tidak ketemu &ldquo;{search.trim() || category}&rdquo;</p>
              <p className="text-sm text-muted-foreground mt-1">Coba kata kunci lain, mis. &ldquo;produk&rdquo; atau &ldquo;kontak&rdquo;.</p>
              <button
                onClick={() => { setSearch(''); setCategory('semua'); }}
                className="mt-4 text-sm font-bold text-emerald-600 hover:underline"
              >
                Tampilkan semua blok
              </button>
            </div>
          ) : (
            <div className="space-y-7">
              {filtered.map((sectionType) => (
                <div key={sectionType.type}>
                  <h3 className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      {SECTION_ICONS[sectionType.type] || <Layout className="w-5 h-5" />}
                    </span>
                    {sectionType.name}
                    <span className="font-bold normal-case tracking-normal bg-white dark:bg-slate-800 border px-2 py-0.5 rounded-full">
                      • {sectionType.variants.length} gaya
                    </span>
                    {POPULAR.includes(sectionType.type) && (
                      <span className="font-bold normal-case tracking-normal bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 rounded-full">
                        Populer
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sectionType.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => onSelect(sectionType.type, variant)}
                        className="group overflow-hidden border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-100 dark:hover:shadow-none hover:-translate-y-0.5 transition-all text-left bg-white dark:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <div className={`h-28 m-2 mb-0 rounded-xl bg-gradient-to-br ${tintFor(sectionType.type)} overflow-hidden relative`}>
                          <MockupPreview mockup={variant.mockup} />
                          <span className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold bg-slate-900 text-white px-2 py-1 rounded-full shadow-lg">
                            Pakai
                          </span>
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-extrabold leading-tight">{variant.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{variant.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type SectionType = string;
