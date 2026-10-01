'use client';

import { useCallback, useEffect, useState } from 'react';
import { BuilderTopbar } from './builder-topbar';
import { BuilderSidebar } from './builder-sidebar';
import { BuilderCanvas } from './builder-canvas';
import { BuilderBottomBar } from './builder-bottom-bar';
import { useBuilderStore } from '@/lib/builder/store';
import { useTemplateStore } from '@/lib/builder/template-store';
import { Toaster, toast } from 'sonner';
import { X, Monitor, Tablet, Smartphone } from 'lucide-react';

export function BuilderShell({ websiteId, pageTitle, siteUrl, onShowPages, onShowTemplates, onSaveOverride, onPublishOverride, isPublished, exitHref }: { websiteId: string; pageTitle?: string; siteUrl?: string | null; onShowPages?: () => void; onShowTemplates?: () => void; onSaveOverride?: () => Promise<void>; onPublishOverride?: () => Promise<void>; isPublished?: boolean; exitHref?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saved = useBuilderStore((s) => s.saved);
  const templateSaved = useTemplateStore((s) => s.saved);
  const isSaved = saved && templateSaved;
  const sectionsCount = useTemplateStore((s) => s.sections.length);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Wajib ada override: penyimpanan configs.section pindah ke page-builder
      // (Builder Global dipensiunkan, store.save() dihapus).
      if (!onSaveOverride) throw new Error('Simpan hanya tersedia di page-builder');
      await onSaveOverride();
      toast.success('Perubahan tersimpan');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setIsSaving(false);
    }
  }, [onSaveOverride]);

  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    try {
      // Tombol ini hanya dirender bila onPublishOverride ada (lihat topbar).
      if (!onPublishOverride) throw new Error('Publish hanya tersedia di page-builder');
      await onPublishOverride();
      // Sebut nama halaman supaya jelas apa yang baru tayang.
      toast.success(
        pageTitle ? `Halaman "${pageTitle}" berhasil ditayangkan 🎉` : 'Halaman berhasil ditayangkan 🎉',
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal publish');
    } finally {
      setIsSaving(false);
    }
  }, [pageTitle, onPublishOverride]);

  // Keyboard shortcuts: Ctrl+S simpan, Ctrl+Z / Ctrl+Shift+Z undo-redo, Esc keluar preview / deselect
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void handleSave();
      } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        // Urutan: undo kanvas (template-store) dulu, lalu state global.
        // Kedua store di-undo agar histori konsisten bila keduanya berubah.
        useTemplateStore.getState().undo();
        useBuilderStore.getState().undo();
      } else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        useTemplateStore.getState().redo();
        useBuilderStore.getState().redo();
      } else if (e.key === 'Escape') {
        if (isPreview) setIsPreview(false);
        else useTemplateStore.getState().selectSection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave, isPreview]);

  // Peringatan saat keluar dengan perubahan belum disimpan
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!useBuilderStore.getState().saved || !useTemplateStore.getState().saved) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Kanvas men-dispatch event ini saat tombol Edit diklik; pastikan sidebar
  // terlihat (desktop bisa sengaja ditutup, mobile jadi overlay tersembunyi).
  useEffect(() => {
    const open = () => setSidebarOpen(true);
    window.addEventListener('open-section-config', open);
    return () => window.removeEventListener('open-section-config', open);
  }, []);

  if (isPreview) {
    return (
      <div className="flex flex-col h-dvh w-full bg-slate-950 overflow-hidden">
        <PreviewBar onExit={() => setIsPreview(false)} />
        {/* Kanvas tampil full-page: desktop selebar viewport (full-bleed),
            tablet/HP di tengah selebar device — tanpa bingkai kartu. */}
        <PreviewCanvas websiteId={websiteId} />
        <Toaster position="bottom-center" richColors closeButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh w-full bg-gradient-to-br from-slate-100 via-emerald-100/40 to-amber-100/30 dark:from-slate-950 dark:via-[#0d1a14] dark:to-slate-950 overflow-hidden">
      <BuilderTopbar
        websiteId={websiteId}
        saved={isSaved}
        isSaving={isSaving}
        pageTitle={pageTitle}
        sectionsCount={sectionsCount}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onPreview={() => setIsPreview(true)}
        onSave={handleSave}
        // Tanpa `onPublishOverride` builder ini tidak punya konsep publish
        // (publish = alias save) → tombol Publish tidak dirender sama sekali.
        onPublish={onPublishOverride ? handlePublish : undefined}
        isPublished={isPublished}
        onShowPages={onShowPages}
        onShowTemplates={onShowTemplates}
        exitHref={exitHref}
        siteUrl={siteUrl}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Backdrop HP: ketuk area kanvas untuk menutup sidebar */}
        {sidebarOpen && (
          <div
            className="sm:hidden absolute inset-0 z-20 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <div
          className={`shrink-0 h-full border-r border-slate-200/40 bg-white/60 dark:bg-slate-900/60 dark:border-white/[0.06] transition-all duration-200 overflow-hidden ${
            sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-transparent'
          } max-sm:absolute max-sm:z-30 max-sm:h-full max-sm:shadow-2xl ${
            sidebarOpen ? 'max-sm:w-80' : 'max-sm:w-0'
          }`}
        >
          <div className="w-80 h-full">
            <BuilderSidebar websiteId={websiteId} />
          </div>
        </div>

        <div className="flex-1 min-w-0 min-h-0 flex">
          <BuilderCanvas websiteId={websiteId} />
        </div>
      </div>

      <BuilderBottomBar />
      <Toaster position="bottom-center" richColors closeButton />
    </div>
  );
}

function PreviewCanvas({ websiteId }: { websiteId: string }) {
  const viewportWidth = useBuilderStore((s) => s.viewportWidth);
  return (
    <div className={viewportWidth >= 1024 ? 'flex-1 min-h-0 flex' : 'flex-1 min-h-0 overflow-auto bg-slate-900'}>
      <BuilderCanvas preview fullBleed={viewportWidth >= 1024} websiteId={websiteId} />
    </div>
  );
}

function PreviewBar({ onExit }: { onExit: () => void }) {
  const viewportWidth = useBuilderStore((s) => s.viewportWidth);
  const setViewportWidth = useBuilderStore((s) => s.setViewportWidth);

  const devices = [
    { id: 'desktop' as const, width: 1024, icon: Monitor, label: 'Desktop' },
    { id: 'tablet' as const, width: 768, icon: Tablet, label: 'Tablet' },
    { id: 'mobile' as const, width: 375, icon: Smartphone, label: 'HP' },
  ];

  return (
    <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-white/10 bg-black/40 backdrop-blur shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
        <p className="font-semibold text-white text-sm whitespace-nowrap">Preview</p>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/10 p-0.5 ml-1">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => setViewportWidth(d.width)}
              title={`${d.label} (${d.width}px)`}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                viewportWidth === d.width ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'
              }`}
            >
              <d.icon className="w-3.5 h-3.5" />
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onExit}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
        Keluar (Esc)
      </button>
    </div>
  );
}
