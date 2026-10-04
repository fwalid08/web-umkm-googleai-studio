'use client';

import { useMemo } from 'react';
import { useTemplateStore, getSectionVariant } from '@/lib/builder/template-store';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Trash2, Edit3, Copy } from 'lucide-react';

interface SectionListProps {
  onEditSection: (sectionId: string) => void;
  search?: string;
}

const TYPE_DOT: Record<string, string> = {
  hero: 'bg-gradient-to-br from-emerald-400 to-teal-500',
  product_grid: 'bg-gradient-to-br from-amber-400 to-orange-500',
  testimonials: 'bg-gradient-to-br from-pink-400 to-rose-500',
  features: 'bg-gradient-to-br from-sky-400 to-blue-500',
  cta: 'bg-gradient-to-br from-violet-400 to-purple-500',
  gallery: 'bg-gradient-to-br from-fuchsia-400 to-purple-500',
  faq: 'bg-gradient-to-br from-cyan-400 to-sky-500',
  pricing: 'bg-gradient-to-br from-lime-400 to-emerald-500',
};

function dotFor(type: string) {
  return TYPE_DOT[type] ?? 'bg-gradient-to-br from-slate-400 to-slate-500';
}

export function SectionList({ onEditSection, search = '' }: SectionListProps) {
  const template = useTemplateStore((s) => s.template);
  const sections = useTemplateStore((s) => s.sections);
  const selectedSectionId = useTemplateStore((s) => s.selectedSectionId);
  const selectSection = useTemplateStore((s) => s.selectSection);
  const deleteSection = useTemplateStore((s) => s.deleteSection);
  const duplicateSection = useTemplateStore((s) => s.duplicateSection);
  const reorderSections = useTemplateStore((s) => s.reorderSections);

  const q = search.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!q) return sections.map((s, i) => ({ s, i }));
    return sections
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => {
        const variant = getSectionVariant(template, s.type, s.variantId);
        const sectionType = template.sections.find((st) => st.type === s.type);
        return (
          (sectionType?.name || s.type).toLowerCase().includes(q) ||
          (variant?.name || s.variantId).toLowerCase().includes(q)
        );
      });
  }, [sections, q, template]);

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderSections(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sections.length - 1) {
      reorderSections(index, index + 1);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-300/50 bg-slate-50/60 dark:bg-white/[0.03] dark:border-white/10">
        <div className="text-3xl mb-2">...</div>
        <p className="text-sm font-extrabold">Belum ada blok</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Klik "Tambah" untuk pasang blok pertama — hero, produk, testimoni.</p>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="p-6 text-center rounded-xl border">
        <p className="text-sm font-medium">Tidak ada section cocok</p>
        <p className="text-xs text-muted-foreground mt-1">Coba kata kunci lain.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map(({ s: section, i: index }) => {
        const variant = getSectionVariant(template, section.type, section.variantId);
        const sectionType = template.sections.find((st) => st.type === section.type);
        const isSelected = selectedSectionId === section.id;

        return (
          <div
            key={section.id}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSection(section.id);
            }}
            className={`group relative flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 bg-white dark:bg-white/[0.03] ${
              isSelected
                ? 'border-emerald-300/70 bg-emerald-50/50 shadow-[0_2px_8px_rgba(16,185,129,0.12)] dark:bg-emerald-950/20 dark:border-emerald-800/50'
                : 'border-slate-200/50 dark:border-white/[0.06] hover:border-slate-300/70 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
            }`}
            onClick={() => {
              selectSection(section.id);
              onEditSection(section.id);
            }}
          >
            <span className={`w-7 h-7 rounded-lg text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-sm ${dotFor(section.type)}`}>
              {index + 1}
            </span>

            <div className="flex flex-col shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors p-0.5"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === sections.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors p-0.5"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{sectionType?.name || section.type}</p>
              <p className="text-[11px] text-muted-foreground truncate">{variant?.name || section.variantId}</p>
            </div>

            <div
              className="flex items-center gap-0.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEditSection(section.id)}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => duplicateSection(section.id)}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:text-red-500"
                onClick={() => {
                  if (confirm(`Hapus section "${sectionType?.name || section.type}"?`)) {
                    deleteSection(section.id);
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
