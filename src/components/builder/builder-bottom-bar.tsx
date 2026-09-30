'use client';

import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuilderStore } from '@/lib/builder/store';

export function BuilderBottomBar() {
  const viewportWidth = useBuilderStore((s) => s.viewportWidth);
  const setViewportWidth = useBuilderStore((s) => s.setViewportWidth);
  const sectionsCount = useBuilderStore((s) => s.sections.length);
  const saved = useBuilderStore((s) => s.saved);

  const widths = { desktop: 1024, tablet: 768, mobile: 375 } as const;

  const handleViewportChange = (v: 'desktop' | 'tablet' | 'mobile') => {
    setViewportWidth(widths[v]);
  };

  const active: 'desktop' | 'tablet' | 'mobile' =
    viewportWidth === widths.mobile ? 'mobile' : viewportWidth === widths.tablet ? 'tablet' : 'desktop';

  return (
    <footer className="shrink-0 px-3 pb-3 pt-1 bg-transparent">
      <div className="mx-auto w-fit max-w-full flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 px-3 py-2 rounded-2xl border border-emerald-200/70 bg-white/85 dark:bg-slate-900/85 backdrop-blur shadow-lg shadow-emerald-900/10">
        <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5">
          <Button
            variant={active === 'desktop' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-2.5 rounded-lg font-bold ${active === 'desktop' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : ''}`}
            onClick={() => handleViewportChange('desktop')}
            title="Tampilan desktop (1024px)"
          >
            <Monitor className="w-3.5 h-3.5 sm:mr-1" />
            <span className="text-xs hidden sm:inline">💻 Desktop</span>
          </Button>
          <Button
            variant={active === 'tablet' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-2.5 rounded-lg font-bold ${active === 'tablet' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : ''}`}
            onClick={() => handleViewportChange('tablet')}
            title="Tampilan tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5 sm:mr-1" />
            <span className="text-xs hidden sm:inline">📟 Tablet</span>
          </Button>
          <Button
            variant={active === 'mobile' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-2.5 rounded-lg font-bold ${active === 'mobile' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : ''}`}
            onClick={() => handleViewportChange('mobile')}
            title="Tampilan HP (375px)"
          >
            <Smartphone className="w-3.5 h-3.5 sm:mr-1" />
            <span className="text-xs hidden sm:inline">📱 HP</span>
          </Button>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 px-2 py-1 rounded-full tabular-nums">{viewportWidth}px</span>
        <span className={`hidden md:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${saved ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'}`}>
          🧱 {sectionsCount} blok {saved ? '✨ tersimpan' : '● belum simpan'}
        </span>
        <span className="hidden lg:inline text-[11px] text-muted-foreground font-medium">⌨️ Ctrl+S simpan • Ctrl+Z undo</span>
      </div>
    </footer>
  );
}

// Re-export agar file tetap kompatibel bila diimpor dengan nama lama
export default BuilderBottomBar;
