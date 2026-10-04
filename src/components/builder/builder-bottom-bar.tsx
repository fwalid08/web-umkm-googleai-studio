'use client';

import { Monitor, Tablet, Smartphone, LayoutGrid, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuilderStore } from '@/lib/builder/store';
import { useTemplateStore } from '@/lib/builder/template-store';
import { viewportModeOf, VIEWPORT_WIDTHS, type ViewportMode } from '@/lib/builder/builder-ui';

const VIEWPORTS: { id: ViewportMode; icon: typeof Monitor; label: string }[] = [
  { id: 'desktop', icon: Monitor, label: 'Desktop' },
  { id: 'tablet', icon: Tablet, label: 'Tablet' },
  { id: 'mobile', icon: Smartphone, label: 'HP' },
];

export function BuilderBottomBar() {
  const viewportWidth = useBuilderStore((s) => s.viewportWidth);
  const setViewportWidth = useBuilderStore((s) => s.setViewportWidth);
  // Jumlah blok diambil dari template-store (sumber render kanvas), BUKAN
  // builder-store, agar angka di footer sama dengan yang terlihat di kanvas.
  const sectionsCount = useTemplateStore((s) => s.sections.length);
  const builderSaved = useBuilderStore((s) => s.saved);
  const templateSaved = useTemplateStore((s) => s.saved);
  const saved = builderSaved && templateSaved;

  // Mode dihitung dari lebar kanal, bukan disimpan terpisah — lebar bisa diubah
  // dari panel lain dan tombol punyalah selalu menyorot mode yang benar.
  const active = viewportModeOf(viewportWidth);
  const activeViewport = VIEWPORTS.find((v) => v.id === active) ?? VIEWPORTS[0];

  return (
    <footer className="shrink-0 px-3 pb-2.5 pt-1 bg-slate-200/80 backdrop-blur-sm border-t border-slate-300/80">
      <div className="mx-auto w-fit max-w-full flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 rounded-2xl border border-slate-300 bg-white/95 dark:bg-slate-900/85 dark:border-slate-700 backdrop-blur shadow-md shadow-emerald-900/10">
        <div
          className="flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5"
          role="group"
          aria-label="Pilih ukuran tampilan"
        >
          {VIEWPORTS.map((v) => {
            const isActive = v.id === active;
            return (
              <Button
                key={v.id}
                variant="ghost"
                size="sm"
                aria-pressed={isActive}
                className={`h-7 px-2 rounded-lg font-bold transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-700'
                    : 'text-muted-foreground hover:bg-white dark:hover:bg-slate-700'
                }`}
                onClick={() => setViewportWidth(VIEWPORT_WIDTHS[v.id])}
                title={`Tampilan ${v.label}`}
              >
                <v.icon className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">{v.label}</span>
                <span className="sr-only">{v.label}</span>
              </Button>
            );
          })}
        </div>

        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 px-1.5 py-0.5 rounded-full tabular-nums">
          {viewportWidth}px
        </span>

        {/* Status tersimpan: dulunya `hidden md:inline-flex` sehingga hilang di HP.
            Sekarang ikon + teks ringkas selalu terlihat. */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            saved
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
          }`}
          title={saved ? 'Semua perubahan tersimpan' : 'Ada perubahan yang belum disimpan'}
        >
          {saved ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          <span className="hidden md:inline">{saved ? 'Tersimpan' : 'Belum simpan'}</span>
          <span className="sr-only">{saved ? 'Tersimpan' : 'Belum simpan'}</span>
        </span>

        <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          <LayoutGrid className="w-3 h-3" />
          {sectionsCount} blok
        </span>

        <span className="sr-only">
          Ukuran tampilan {activeViewport.label} {viewportWidth} piksel. Tekan Ctrl+S untuk
          menyimpan, Ctrl+Z untuk membatalkan perubahan.
        </span>
      </div>
    </footer>
  );
}

// Re-export agar file tetap kompatibel bila diimpor dengan nama lama
export default BuilderBottomBar;
