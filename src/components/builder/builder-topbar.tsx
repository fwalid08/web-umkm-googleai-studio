'use client';

import { Eye, Save, Rocket, PanelLeft, FileText, LayoutTemplate, Loader2, ExternalLink, Undo2, Redo2, Globe, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useBuilderFullPage } from './builder-fullpage';

interface BuilderTopbarProps {
  websiteId: string;
  saved: boolean;
  isSaving: boolean;
  pageTitle?: string;
  sectionsCount?: number;
  onToggleSidebar: () => void;
  onPreview: () => void;
  onSave: () => void;
  /**
   * Buka dialog "Simpan" (dua pilihan: simpan saja / simpan sebagai template).
   * Bila tidak diisi, tombol Simpan langsung memanggil `onSave`.
   */
  onOpenSaveDialog?: () => void;
  /**
   * Aksi Publish. Opsional: hanya diisi bila builder memang punya konsep
   * publish (page-builder set `is_published`). Builder lama TIDAK punya —
   * di sana tombol ini disembunyikan karena publish = alias save, sehingga
   * menampilkannya hanya membingungkan.
   */
  onPublish?: () => void;
  /** Status tayang halaman. Undefined = builder tidak punya konsep publish. */
  isPublished?: boolean;
  onShowPages?: () => void;
  onShowTemplates?: () => void;
  siteUrl?: string | null;
  /**
   * Aksi undo/redo. Diturunkan oleh `BuilderShell` supaya logika "store mana
   * yang punya histori" hanya ada di satu tempat (lihat catatan di shell).
   */
  onUndo?: () => void;
  onRedo?: () => void;
  /** Nonaktifkan tombol undo/redo saat tidak ada histori. */
  canUndo?: boolean;
  canRedo?: boolean;
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
          className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-100/80 hover:text-emerald-800 dark:hover:bg-slate-800 sm:w-auto sm:px-2.5 sm:gap-1.5 font-semibold"
          onClick={onClick}
          disabled={disabled}
        >
          {children}
          {label && <span className="hidden sm:inline text-[12px] font-medium">{label}</span>}
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
  onOpenSaveDialog,
  onPublish,
  isPublished,
  onShowPages,
  onShowTemplates,
  siteUrl,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: BuilderTopbarProps) {
  // Mode tampilan builder (sembunyikan/tampilkan chrome dashboard). Dipanggil
  // langsung dari context supaya tidak perlu di-drill sebagai prop dari layout.
  const { fullPage, toggle: toggleFullPage, available: fullPageAvailable } = useBuilderFullPage();

  return (
    <TooltipProvider delayDuration={300}>
      {/* `flex-nowrap` + grup yang boleh menyusut: sebelumnya `flex-wrap`
          membuat topbar jadi 2 baris di HP, sehingga separuh kanvas hilang
          layar dan tombol publish terpotong. Konteks halaman kini truncate. */}
      {/* Tanpa `sticky`: topbar ini anak dari kolom flex yang tidak pernah
            scroll (hanya kanvas yang scroll), jadi `sticky` hanya no-op
            yang menyesatkan — ia menyiratkan model scroll yang salah.
            Yang menjaga topbar tetap terlihat adalah `shrink-0`. */}
      <header className="relative border-b border-slate-200/70 bg-gradient-to-r from-slate-100 via-emerald-50/50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:border-slate-800 flex flex-nowrap items-center justify-between gap-2 px-3 sm:px-4 py-2 shrink-0 z-20">
        {/* Progress bar saat menyimpan */}
        {isSaving && (
          <span className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-emerald-100 dark:bg-slate-800">
            <span className="block h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 animate-[topbar-slide_1.1s_ease-in-out_infinite]" />
          </span>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Tombol "Kembali/Keluar" dihapus: builder kini menempel di halaman
              dashboard, jadi navigasi keluar ditangani sidebar/header dashboard
              yang sudah ada. Menyisakan `handleExit` membuat `router`,
              `useConfirm`, dan `exitHref` ikut tak terpakai. */}

          {/* Konteks halaman yang sedang diedit */}
          <div className="flex items-center gap-2 min-w-0 rounded-xl border border-emerald-200/70 bg-white/80 dark:bg-slate-800/80 dark:border-slate-700 pl-1.5 pr-2.5 py-1 shadow-sm">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Page Builder
              </span>
              <span className="block text-[12px] font-bold truncate max-w-32 sm:max-w-48">
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
            <PanelLeft className="w-4 h-4" />
          </BarButton>

          {onShowPages && (
            <BarButton title="Kelola Halaman" onClick={onShowPages} label="Halaman">
              <FileText className="w-4 h-4" />
            </BarButton>
          )}

          {onShowTemplates && (
            <BarButton title="Galeri Template" hint="Terapkan template siap pakai" onClick={onShowTemplates} label="Template">
              <LayoutTemplate className="w-4 h-4" />
            </BarButton>
          )}

          {/* Status simpan: dulunya `hidden md:inline-flex` sehingga hilang total di HP —
            user tidak punya cara tahu ada perubahan yang belum disimpan. Sekarang
            badge-nya selalu tampil, hanya TEKS-nya yang disembunyikan di layar kecil. */}
          <div
            className={`inline-flex items-center gap-1.5 ml-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border shrink-0 transition-colors ${
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
            {/* Label penuh disembunyikan di layar sempit, tapi TITIK statusnya
                tetap tampil — sebelumnya badge "tersimpan" ini hilang total
                di HP sehingga user tidak tahu ada perubahan yang belum disimpan. */}
            <span className="hidden sm:inline">
              {isSaving ? 'Menyimpan…' : saved ? 'Tersimpan' : 'Belum disimpan'}
            </span>
          </div>

          {/* Status tayang hanya relevan bila builder punya konsep publish
              (page-builder). Label "Tersimpan" di sebelahnya tidak menjawab
              hal ini: ia soal perubahan tersimpan ke DB, bukan halaman tayang.
              Tidak ada konsep "draft" — website publik tidak pernah 404 karena
              status; label ini murni informasi apakah template aktif sudah
              pernah ditayangkan. */}
          {typeof isPublished === 'boolean' && !isSaving && (
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${
                isPublished
                  ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
              }`}
              title={
                isPublished
                  ? 'Desain ini sudah pernah ditayangkan ke website publik.'
                  : 'Desain ini belum pernah ditayangkan. Tekan "Tayangkan" untuk memakai template ini di website publik.'
              }
            >
              {isPublished ? <Globe className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">
                {isPublished ? 'Tayang' : 'Belum ditayangkan'}
              </span>
              <span className="sr-only">
                {isPublished ? 'Sudah pernah ditayangkan' : 'Belum pernah ditayangkan'}
              </span>
            </div>
          )}
          {/* Perubahan kanvas (ganti skema, edit blok, ganti template) hanya
              hidup di builder sampai "Tayangkan" ditekan — live site selalu
              menampilkan status tayang terakhir. Badge ini mencegah kebingungan
              "kok live tidak ikut berubah". */}
          {isPublished && !saved && !isSaving && (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border shrink-0 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
              title="Kanvas punya perubahan yang belum ditayangkan. Live site masih menampilkan versi tayang terakhir."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="hidden lg:inline">Belum ditayangkan</span>
              <span className="sr-only">Ada perubahan yang belum ditayangkan</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Undo/Redo dulu ada: dulu tombolnya dihapus dan hanya menyisakan
              shortcut keyboard (Ctrl+Z). Sekarang store sudah menyediakan
              `past`/`future` sehingga status disable-nya bisa dihitung. */}
          <BarButton
            title="Urungkan perubahan terakhir"
            hint="Ctrl+Z"
            onClick={onUndo}
            disabled={!canUndo || isSaving}
            label="Urungkan"
          >
            <Undo2 className="w-4 h-4" />
          </BarButton>
          <BarButton
            title="Ulangi perubahan yang dibatalkan"
            hint="Ctrl+Shift+Z"
            onClick={onRedo}
            disabled={!canRedo || isSaving}
            label="Ulangi"
          >
            <Redo2 className="w-4 h-4" />
          </BarButton>

          <BarButton title="Preview website" hint="Lihat tampilan asli (Esc untuk keluar)" onClick={onPreview} label="Preview">
            <Eye className="w-4 h-4" />
          </BarButton>

          {/* Melepas builder dari halaman dashboard (sembunyikan sidebar +
              header dashboard) — kanvas dapat seluruh viewport. */}
          {fullPageAvailable && (
            <BarButton
              title={fullPage ? 'Tampilkan lagi menu dashboard' : 'Perluas ke layar penuh'}
              hint={fullPage ? 'Kembali ke tampilan menempel di halaman dashboard' : 'Sembunyikan menu dashboard'}
              onClick={toggleFullPage}
              label={fullPage ? 'Kecilkan' : 'Perluas'}
            >
              {fullPage ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </BarButton>
          )}

          {siteUrl && (
            <BarButton
              title="Lihat website"
              hint={`${siteUrl} — buka di tab baru`}
              onClick={() => window.open(siteUrl, '_blank', 'noopener,noreferrer')}
              label="Lihat Web"
            >
              <ExternalLink className="w-4 h-4" />
            </BarButton>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-emerald-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 text-emerald-800 dark:bg-slate-800 dark:text-emerald-200 dark:border-slate-700 font-semibold shadow-sm"
                onClick={onOpenSaveDialog ?? onSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                ) : (
                  <Save className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline text-[12px]">Simpan Template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">Simpan sebagai template</p>
              <p className="text-xs opacity-70">
                {onOpenSaveDialog
                  ? 'Tersimpan ke library-mu — website yang tayang tidak berubah. Ctrl+S untuk langsung simpan dengan nama default.'
                  : 'Ctrl+S'}
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Hanya dirender bila builder punya konsep publish sungguhan.
              Di builder lama publish = alias save, jadi tombolnya disembunyikan
              agar tidak menjanjikan sesuatu yang tidak terjadi. */}
          {onPublish && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/25 border border-emerald-400/40"
                  onClick={onPublish}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin sm:mr-2" />
                  ) : (
                    <Rocket className="w-4 h-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline text-[12px]">Tayangkan</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">Tayangkan desain ini</p>
                <p className="text-xs opacity-70">
                  Template aktif akan ditimpa oleh desain di editor, lalu langsung
                  tayang untuk pengunjung.
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <style>{`@keyframes topbar-slide { 0% { transform: translateX(-100%);} 100% { transform: translateX(220%);} }`}</style>
      </header>
    </TooltipProvider>
  );
}
