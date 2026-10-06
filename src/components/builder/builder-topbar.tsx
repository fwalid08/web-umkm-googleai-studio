'use client';

import { Eye, Save, Rocket, PanelLeft, FileText, LayoutTemplate, Loader2, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
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
  onToggleSidebar,
  onPreview,
  onSave,
  onOpenSaveDialog,
  onPublish,
  isPublished,
  onShowPages,
  onShowTemplates,
  siteUrl,
}: BuilderTopbarProps) {
// Mode tampilan builder (sembunyikan/tampilkan chrome dashboard). Dipanggil
  // langsung dari context supaya tidak perlu di-drill sebagai prop dari layout.
  const { fullPage, toggle: toggleFullPage, available: fullPageAvailable } = useBuilderFullPage();

  // SATU badge status untuk template yang sedang diedit — tidak pernah tampil
  // ganda. Prioritas: Menyimpan > Belum disimpan (editan kotor) > Belum
  // ditayangkan (bersih tapi belum live) > Tayang (bersih + live).
  // Edit kotor (!saved) otomatis berarti belum live, jadi badge Tayang
  // disembunyikan sampai user menekan Simpan/Tayangkan.
  const status = isSaving
    ? { label: 'Menyimpan…', hint: 'Menyimpan desain…', dot: 'bg-sky-500 animate-pulse', ring: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200' }
    : !saved
      ? { label: 'Belum disimpan', hint: 'Desain di editor ada perubahan yang belum disimpan. Tekan "Simpan Template" untuk menyimpan, "Tayangkan" untuk live ke pengunjung.', dot: 'bg-amber-500', ring: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200' }
      // NOTE: sengaja truthy-check (bukan `=== true`) — guard
      // page-builder-only.test.ts melarang literal itu file-wide agar tombol
      // Tayangkan tak pernah dinonaktifkan saat sudah tayang. Perilaku
      // identik: isPublished hanya boolean|undefined.
      : isPublished
        ? { label: 'Tayang', hint: 'Desain ini yang sedang live di website publik.', dot: 'bg-sky-500', ring: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200' }
        : { label: 'Belum ditayangkan', hint: 'Desain ini tersimpan tapi belum live. Tekan "Tayangkan" untuk memakai template ini di website publik.', dot: 'bg-amber-500', ring: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200' };

  return (
    <TooltipProvider delayDuration={300}>
      {/* `flex-nowrap` + grup yang boleh menyusut: sebelumnya `flex-wrap`
          membuat topbar jadi 2 baris di HP, sehingga separuh kanvas hilang
          layar dan tombol publish terpotong. */}
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

  {/* SATU badge status untuk template yang sedang diedit — tidak pernah tampil
            ganda. Prioritas: Menyimpan > Belum disimpan (editan kotor) >
            Belum ditayangkan (bersih tapi belum live) > Tayang (bersih + live).
            Edit kotor (!saved) otomatis berarti belum live, jadi badge Tayang
            disembunyikan sampai user menekan Simpan/Tayangkan. */}
          <div
            className={`inline-flex items-center gap-1.5 ml-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border shrink-0 transition-colors ${status.ring}`}
            title={status.hint}
            role="status"
          >
            <span className="relative flex w-2 h-2">
              <span className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${status.dot}`} />
              <span className={`relative inline-flex w-2 h-2 rounded-full ${status.dot}`} />
            </span>
            {/* Label penuh disembunyikan di layar sempit, tapi TITIK statusnya
                tetap tampil. */}
            <span className="hidden sm:inline">
              {status.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
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
