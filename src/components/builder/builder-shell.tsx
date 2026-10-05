'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BuilderTopbar } from './builder-topbar';
import { BuilderSidebar } from './builder-sidebar';
import { BuilderCanvas } from './builder-canvas';
import { BuilderBottomBar } from './builder-bottom-bar';
import { SaveDialog } from './save-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useBuilderStore } from '@/lib/builder/store';
import { useTemplateStore } from '@/lib/builder/template-store';
import {
  clampSidebarWidth,
  loadSidebarWidth,
  persistSidebarWidth,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from '@/lib/builder/builder-ui';
import { toast } from 'sonner';
import { X, Monitor, Tablet, Smartphone, Loader2 } from 'lucide-react';

export function BuilderShell({ websiteId, pageTitle, siteUrl, onShowPages, onShowTemplates, onSaveOverride, onPublishOverride, isPublished }: { websiteId: string; pageTitle?: string; siteUrl?: string | null; onShowPages?: () => void; onShowTemplates?: () => void; onSaveOverride?: (opts?: { saveAsTemplate?: boolean; libraryName?: string }) => Promise<void>; onPublishOverride?: () => Promise<void>; isPublished?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Lebar sidebar bisa di-drag (desktop) dan disimpan antar sesi. Di HP
  // lebarnya dikunci ke drawer — resizer hanya aktif di pointer halus.
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  // Tombol "Simpan" (dan Ctrl+S) membuka dialog "Simpan sebagai template".
  // Tidak ada lagi aksi "simpan saja": config kanvas hanya bisa disimpan ke
  // library, dan hanya tombol "Tampilkan" yang menyentuh website publik.
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  // Konfirmasi sebelum menimpa template aktif yang sedang tayang.
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const saved = useBuilderStore((s) => s.saved);
  const templateSaved = useTemplateStore((s) => s.saved);
  const isSaved = saved && templateSaved;
  const sectionsCount = useTemplateStore((s) => s.sections.length);

  // Status histori untuk mengaktifkan tombol Undo/Redo. `past`/`future` yang
  // diseleksi (bukan `canUndo()`) karena Zustand hanya memicu render ulang
  // bila nilai seleksinya berubah — method reference selalu sama.
  const templatePast = useTemplateStore((s) => s.past.length);
  const templateFuture = useTemplateStore((s) => s.future.length);
  const builderPast = useBuilderStore((s) => s.past.length);
  const builderFuture = useBuilderStore((s) => s.future.length);
  const canUndo = templatePast > 0 || builderPast > 0;
  const canRedo = templateFuture > 0 || builderFuture > 0;

  /**
   * Lebar sidebar disimpan di localStorage, jadi hanya bisa dibaca di browser.
   * Membacanya lewat `useState(() => loadSidebarWidth())` akan membuat HTML
   * server (320px) berbeda dengan hasil hidrasi di klien → mismatch. Karena
   * itu baru dimuat setelah mount.
   */
  useEffect(() => {
    setSidebarWidth(loadSidebarWidth());
  }, []);

  /**
   * Undo/redo hanya boleh menyentuh SATU store per invocation.
   *
   * Versi lama memanggil `templateStore.undo()` DAN `builderStore.undo()` setiap
   * Ctrl+Z. Akibatnya satu tekan bisa membatalkan dua perubahan sekaligus —
   * atau membatalkan sebuah perubahan dari store yang salah, karena urutan
   * tekan tidak sinkron dengan histori kedua store. Di sini store yang punya
   * histori diprioritaskan (kanvas selalu lebih sering berubah daripada state
   * global), dan store lain tidak disentuh sama sekali.
   */
  const handleUndo = useCallback(() => {
    const template = useTemplateStore.getState();
    if (template.canUndo()) {
      template.undo();
      return;
    }
    const builder = useBuilderStore.getState();
    if (builder.canUndo()) builder.undo();
  }, []);

  const handleRedo = useCallback(() => {
    const template = useTemplateStore.getState();
    if (template.canRedo()) {
      template.redo();
      return;
    }
    const builder = useBuilderStore.getState();
    if (builder.canRedo()) builder.redo();
  }, []);

  /**
   * `opts.asTemplate` = "Simpan sebagai template": config saat ini disalin ke
   * library (`user_templates`, migrasi 045) alih-alih menimpa template aktif.
   * Pesan toast-nya dibedakan supaya user tahu apa yang sebenarnya terjadi —
   * template aktif website tidak ikut berubah pada mode ini.
   */
  /**
   * Ctrl+S memakai nama default tanpa membuka dialog — shortcut tidak boleh
   * terhalang modal. Hasilnya tetap "Simpan sebagai template", bukan lagi
   * "simpan ke website" yang bisa mengubah status tayang.
   */
  const handleSave = useCallback(
    async (opts?: { asTemplate?: boolean; libraryName?: string }) => {
      setIsSaving(true);
      try {
        // Wajib ada override: penyimpanan configs.section pindah ke page-builder
        // (Builder Global dipensiunkan, store.save() dihapus).
        if (!onSaveOverride) throw new Error('Simpan hanya tersedia di page-builder');
        await onSaveOverride({
          saveAsTemplate: true,
          libraryName: opts?.libraryName,
        });
        toast.success(
          opts?.libraryName
            ? `Template "${opts.libraryName}" tersimpan di library`
            : 'Tersimpan sebagai template di library',
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Gagal menyimpan');
      } finally {
        setIsSaving(false);
      }
    },
    [onSaveOverride],
  );

  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    try {
      // Tombol ini hanya dirender bila onPublishOverride ada (lihat topbar).
      if (!onPublishOverride) throw new Error('Publish hanya tersedia di page-builder');
      await onPublishOverride();
      // Sebut nama halaman supaya jelas apa yang baru tayang.
      toast.success(
        pageTitle ? `Halaman "${pageTitle}" berhasil ditayangkan` : 'Halaman berhasil ditayangkan',
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
        // Sama seperti tombol: "Simpan sebagai template" dengan nama default.
        void handleSave({ asTemplate: true });
      } else if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((mod && e.key.toLowerCase() === 'y') || (mod && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        if (isPreview) setIsPreview(false);
        else useTemplateStore.getState().selectSection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave, handleUndo, handleRedo, isPreview]);

  /**
   * Resize sidebar via drag pada handle di sisi kanvas.
   *
   * Pakai pointer event (bukan event mouse) supaya tetap satu jalur kode untuk
   * mouse/pen, dan `setPointerCapture` menjaga drag walau kursor keluar dari
   * handle. Lebar disimpan ke localStorage hanya di akhir drag — menulis tiap
   * `pointermove` berarti ratusan write/detik dan memblokir thread utama.
   */
  const sidebarRef = useRef<HTMLDivElement>(null);
  const onResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarRef.current?.getBoundingClientRect().width ?? sidebarWidth;
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      // Sidebar di kiri kanvas, jadi lebar bertambah saat kursor bergerak ke KANAN.
      setSidebarWidth(clampSidebarWidth(startWidth + (ev.clientX - startX)));
    };
    const onUp = () => {
      handle.releasePointerCapture?.(e.pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      setSidebarWidth((current) => {
        persistSidebarWidth(current);
        return current;
      });
      // Cegah drag gambar/tautan selama resize berlangsung.
      document.body.style.removeProperty('user-select');
      document.body.style.removeProperty('cursor');
    };

    document.body.style.setProperty('user-select', 'none');
    document.body.style.setProperty('cursor', 'col-resize');
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }, [sidebarWidth]);

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
      <div className="flex flex-col h-full min-h-0 w-full bg-slate-950 overflow-hidden">
        <PreviewBar onExit={() => setIsPreview(false)} />
        {/* Kanvas tampil full-page: desktop selebar viewport (full-bleed),
            tablet/HP di tengah selebar device — tanpa bingkai kartu. */}
        <PreviewCanvas websiteId={websiteId} />
      </div>
    );
  }

  /*
   * Tinggi builder = `h-full`, BUKAN `h-dvh`.
   *
   * `h-dvh` benar hanya kalau builder satu-satunya isi halaman. Sekarang
   * builder menempel di halaman dashboard, jadi ada header dashboard
   * (h-16 sm:h-20) di atasnya — dengan `h-dvh` builder jadi satu viewport
   * penuh, halaman ikut ter-scroll, dan bottom bar terdorong keluar layar.
   *
   * `h-full` bekerja untuk kedua mode tanpa perubahan lain:
   *  - menempel: mengisi sisa ruang di kolom `h-dvh` milik dashboard shell,
   *  - full page: mengisi wrapper `h-dvh` di dashboard shell.
   * Sifatnya: topbar (shrink-0) / sidebar (h-full) / kanvas (flex-1 +
   * overflow-auto) / bottom bar (shrink-0) — hanya kanvas yang scroll.
   */
  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-gradient-to-br from-slate-100 via-emerald-100/40 to-amber-100/30 dark:from-slate-950 dark:via-[#0d1a14] dark:to-slate-950 overflow-hidden">
      <BuilderTopbar
        websiteId={websiteId}
        saved={isSaved}
        isSaving={isSaving}
        pageTitle={pageTitle}
        sectionsCount={sectionsCount}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onPreview={() => setIsPreview(true)}
        onSave={handleSave}
        onOpenSaveDialog={() => setSaveDialogOpen(true)}
        // Tanpa `onPublishOverride` builder ini tidak punya konsep publish
        // (publish = alias save) → tombol Publish tidak dirender sama sekali.
        onPublish={
          onPublishOverride
            ? // Buka konfirmasi dulu — menimpa template aktif bersifat destruktif.
              () => setPublishConfirmOpen(true)
            : undefined
        }
        isPublished={isPublished}
        onShowPages={onShowPages}
        onShowTemplates={onShowTemplates}
        siteUrl={siteUrl}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Backdrop HP: ketuk area kanvas untuk menutup sidebar */}
        {sidebarOpen && (
          <div
            className="sm:hidden absolute inset-0 z-20 bg-black/40 animate-in fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* Lebar desktop mengikuti state (di-drag, disimpan di localStorage),
            di HP lebarnya dikunci w-80 sebagai drawer.

            Lebar dikirim lewat CSS custom property, BUKAN `style.width`
            langsung: inline style menang atas class Tailwind, sehingga
            `max-sm:w-80` akan kalah dan drawer di HP ikut selebar panel
            desktop (bisa melebihi lebar layar). Dengan custom property,
            utility lebar yang memakainya bisa ditimpa `max-sm:w-80`
            pada layar kecil.

            Catatan: jangan menulis sintaks utility arbitrary value Tailwind
            secara literal di file mana pun yang discan Tailwind (className,
            JSX, atau komentar). Teksnya dibaca sebagai kandidat class dan
            akan menghasilkan CSS yang rusak saat diparse PostCSS. */}
        <div
          className={`shrink-0 relative h-full border-r border-slate-200/40 bg-white/60 dark:bg-slate-900/60 dark:border-white/[0.06] transition-[width,opacity] duration-200 overflow-hidden max-sm:absolute max-sm:z-30 max-sm:h-full max-sm:shadow-2xl ${
            sidebarOpen
              ? 'w-[var(--builder-sidebar-w)] opacity-100 max-sm:w-80'
              : 'w-0 opacity-0 border-transparent max-sm:w-0'
          }`}
          style={{ '--builder-sidebar-w': `${sidebarWidth}px` } as React.CSSProperties}
        >
          <div ref={sidebarRef} className="w-full h-full">
            <BuilderSidebar
              websiteId={websiteId}
              isPublished={isPublished}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </div>

          {/* Handle resize. `hidden` di HP: di layar sentuh lebar/lebar tidak
              bisa di-drag dengan nyaman, jadi drawer tetap w-80. */}
          {sidebarOpen && (
            <div
              onPointerDown={onResizeStart}
              role="separator"
              aria-orientation="vertical"
              aria-label="Ubah lebar panel pengaturan"
              aria-valuenow={sidebarWidth}
              aria-valuemin={SIDEBAR_MIN_WIDTH}
              aria-valuemax={SIDEBAR_MAX_WIDTH}
              tabIndex={-1}
              className="absolute -right-1 top-0 h-full w-2 cursor-col-resize z-10 hidden sm:block
                         after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2
                         after:bg-transparent after:transition-colors hover:after:bg-emerald-400"
            />
          )}
        </div>

        <div className="flex-1 min-w-0 min-h-0 flex">
          <BuilderCanvas websiteId={websiteId} />
        </div>
      </div>

      <BuilderBottomBar />

      <SaveDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        dirty={!isSaved}
        saving={isSaving}
        onSave={(libraryName) => {
          void handleSave({ asTemplate: true, libraryName });
        }}
      />

      {/*
        Konfirmasi menimpa template aktif. Ini satu-satunya aksi yang menyentuh
        website publik, jadi efeknya harus eksplisit — bukan hasil samping
        dari "Simpan".
      */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tayangkan desain ini?</DialogTitle>
            <DialogDescription>
              Template yang sedang tayang akan <strong>ditimpa</strong> oleh desain di
              editor ini. Pengunjung akan langsung melihat perubahannya.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Kalau belum yakin, tekan <strong>Batal</strong> lalu simpan desainnya
            sebagai template dulu lewat &quot;Simpan Template&quot;.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishConfirmOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                setPublishConfirmOpen(false);
                void handlePublish();
              }}
              disabled={isSaving}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 font-bold"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Tayangkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
