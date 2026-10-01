'use client';

import { ArrowLeft, Undo2, Redo2, Eye, Save, Rocket, PanelLeft, FileText, LayoutTemplate, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useBuilderStore } from '@/lib/builder/store';
import { useTemplateStore } from '@/lib/builder/template-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BuilderTopbarProps {
  websiteId: string;
  saved: boolean;
  isSaving: boolean;
  pageTitle?: string;
  sectionsCount?: number;
  onToggleSidebar: () => void;
  onPreview: () => void;
  onSave: () => void;
  onPublish: () => void;
  onShowPages?: () => void;
  onShowTemplates?: () => void;
  exitHref?: string;
  siteUrl?: string | null;
}

function BarButton({
  title,
  hint,
  onClick,
  disabled,
  children,
  label,
}: {
  title: string;
  hint?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 rounded-xl hover:bg-emerald-100/80 hover:text-emerald-800 dark:hover:bg-slate-800 sm:w-auto sm:px-3 sm:gap-2 font-semibold"
          onClick={onClick}
          disabled={disabled}
        >
          {children}
          {label && <span className="hidden sm:inline text-[13px] font-medium">{label}</span>}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">{title}</p>
        {hint && <p className="text-xs opacity-70">{hint}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

export function BuilderTopbar({
  saved,
  isSaving,
  pageTitle,
  sectionsCount = 0,
  onToggleSidebar,
  onPreview,
  onSave,
  onPublish,
  onShowPages,
  onShowTemplates,
  exitHref = '/dashboard',
  siteUrl,
}: BuilderTopbarProps) {
  const router = useRouter();
  const undo = () => {
    useTemplateStore.getState().undo();
    useBuilderStore.getState().undo();
  };
  const redo = () => {
    useTemplateStore.getState().redo();
    useBuilderStore.getState().redo();
  };
  const canUndo = useBuilderStore((s) => s.past.length > 0) || useTemplateStore((s) => s.past.length > 0);
  const canRedo = useBuilderStore((s) => s.future.length > 0) || useTemplateStore((s) => s.future.length > 0);

  const handleExit = () => {
    if (!saved) {
      if (confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?')) {
        router.push(exitHref);
      }
    } else {
      router.push(exitHref);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <header className="relative border-b border-emerald-100/80 bg-gradient-to-r from-white via-emerald-50/50 to-amber-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 sm:px-4 py-2 shrink-0 sticky top-0 z-20">
        {/* Progress bar saat menyimpan */}
        {isSaving && (
          <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-emerald-100 dark:bg-slate-800">
            <span className="block h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 animate-[topbar-slide_1.1s_ease-in-out_infinite]" />
          </span>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <BarButton title="Keluar ke Dashboard" hint="Perubahan belum disimpan akan ditanya dulu" onClick={handleExit}>
            <ArrowLeft className="w-[18px] h-[18px]" />
          </BarButton>

          {/* Konteks halaman yang sedang diedit */}
          <div className="flex items-center gap-2 min-w-0 rounded-xl border border-emerald-200/70 bg-white/80 dark:bg-slate-800/80 dark:border-slate-700 pl-1.5 pr-2.5 py-1 shadow-sm">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Page Builder
              </span>
              <span className="block text-[13px] font-bold truncate max-w-32 sm:max-w-48">
                {pageTitle || 'Halaman toko'}
              </span>
            </span>
            {sectionsCount > 0 && (
              <span className="hidden sm:inline-flex items-center text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 rounded-full shrink-0">
                {sectionsCount} blok
              </span>
            )}
          </div>

          <div className="w-px h-6 bg-emerald-200/60 dark:bg-slate-700 mx-0.5 shrink-0 hidden sm:block" />

          <BarButton title="Panel pengaturan" hint="Tampilkan / sembunyikan sidebar" onClick={onToggleSidebar}>
            <PanelLeft className="w-[18px] h-[18px]" />
          </BarButton>

          {onShowPages && (
            <BarButton title="Kelola Halaman" onClick={onShowPages} label="Halaman">
              <FileText className="w-[18px] h-[18px]" />
            </BarButton>
          )}

          {onShowTemplates && (
            <BarButton title="Galeri Template" hint="Terapkan template siap pakai" onClick={onShowTemplates} label="Template">
              <LayoutTemplate className="w-[18px] h-[18px]" />
            </BarButton>
          )}

          {/* Status simpan playful */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 transition-colors ${
              isSaving
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                : saved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            <span className="relative flex w-2 h-2">
              <span
                className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${
                  isSaving ? 'bg-blue-400' : saved ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex w-2 h-2 rounded-full ${
                  isSaving ? 'bg-blue-500' : saved ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            {isSaving ? 'Menyimpan…' : saved ? '✨ Tersimpan' : '● Belum disimpan'}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <BarButton title="Undo" hint="Ctrl+Z" onClick={undo} disabled={!canUndo}>
            <Undo2 className="w-[18px] h-[18px]" />
          </BarButton>

          <BarButton title="Redo" hint="Ctrl+Shift+Z" onClick={redo} disabled={!canRedo}>
            <Redo2 className="w-[18px] h-[18px]" />
          </BarButton>

          <div className="w-px h-6 bg-emerald-200/60 dark:bg-slate-700 mx-0.5 shrink-0" />

          <BarButton title="Preview website" hint="Lihat tampilan asli (Esc untuk keluar)" onClick={onPreview} label="Preview">
            <Eye className="w-[18px] h-[18px]" />
          </BarButton>

          {siteUrl && (
            <BarButton
              title="Lihat website"
              hint={`${siteUrl} — buka di tab baru`}
              onClick={() => window.open(siteUrl, '_blank', 'noopener,noreferrer')}
              label="Lihat Web"
            >
              <ExternalLink className="w-[18px] h-[18px]" />
            </BarButton>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-emerald-800 dark:bg-slate-800 dark:text-emerald-200 dark:border-slate-700 font-semibold shadow-sm"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                ) : (
                  <Save className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline text-[13px]">Simpan</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">Simpan perubahan</p>
              <p className="text-xs opacity-70">Ctrl+S</p>
            </TooltipContent>
          </Tooltip>

          <Button
            size="sm"
            className="h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/25 border border-emerald-400/40"
            onClick={onPublish}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
            ) : (
              <Rocket className="w-4 h-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline text-[13px]">Publish 🚀</span>
          </Button>
        </div>
        <style>{`@keyframes topbar-slide { 0% { transform: translateX(-100%);} 100% { transform: translateX(220%);} }`}</style>
      </header>
    </TooltipProvider>
  );
}
