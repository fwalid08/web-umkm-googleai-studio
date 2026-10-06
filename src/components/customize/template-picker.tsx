"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Eye, Library, Loader2, LayoutTemplate, Trash2 } from "lucide-react";
import {
  PENDING_TEMPLATE_KEY,
  applySavedTemplate,
  deleteSavedTemplate,
  savedToCatalogEntry,
  type SavedTemplateEntry,
} from "@/lib/builder/apply-template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BUILT_IN_CATALOG,
  CATEGORY_LABELS,
  type BusinessCategory,
} from "@/lib/builder/templates/catalog";
import {
  applyTemplateToWebsite,
  resolveTemplateId,
  type ApplyableTemplate,
} from "@/lib/builder/apply-template";
import { TemplatePreviewDialog } from "@/components/builder/template-preview-dialog";

type CatalogEntry = (typeof BUILT_IN_CATALOG)[number];

/**
 * Daftar template yang bisa dipilih di halaman /dashboard/customize.
 *
 * Memilih salah satu template menerapkan (apply) ke website lewat SATU jalur —
 * `applyTemplateToWebsite` — lalu parent me-refresh kartu template aktif di
 * atas. Test regresi `apply-template.test.ts` menjaga invariant ini.
 */
export function TemplatePicker({
  websiteId,
  activeTemplateId,
  onTemplateApplied,
  redirectAfterApply,
}: {
  websiteId: string;
  activeTemplateId?: string | null;
  onTemplateApplied?: (templateId: string) => void;
  /** Bila diisi, setelah template berhasil diterapkan user langsung
   *  diarahkan ke route ini (mis. halaman customize). */
  redirectAfterApply?: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Tab Katalog | Library — sama dengan galeri di dalam builder, dan memakai
  // helper konversi yang sama (`savedToCatalogEntry`) supaya kartu keduanya
  // identik.
  const [tab, setTab] = useState<"catalog" | "library">("catalog");
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplateEntry[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  // Dialog konfirmasi sebelum template diterapkan.
  const [pending, setPending] = useState<CatalogEntry | null>(null);
  // Id template library yang sedang dihapus (spinner hanya di kartu itu).
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Template library yang menunggu konfirmasi hapus.
  const [pendingDelete, setPendingDelete] = useState<SavedTemplateEntry | null>(null);
  // Pratinjau in-modal: render situs asli (bukan tab baru ke /preview —
  // route itu tidak ada di build yang belum di-deploy sehingga jatuh ke home).
  const [previewTpl, setPreviewTpl] = useState<CatalogEntry | null>(null);

  /** Muat ulang daftar library — dipakai setelah hapus. */
  const loadSavedTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates?library=1");
      const json = await res.json();
      if (json?.success && Array.isArray(json.data?.saved)) {
        setSavedTemplates(json.data.saved as SavedTemplateEntry[]);
      }
    } catch {
      // Gagal memuat library tidak boleh memblokir pilihan katalog.
    }
  }, []);

  // Library design milik user (disimpan lewat "Simpan sebagai Template").
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/templates?library=1");
        const json = await res.json();
        if (!cancelled && json?.success && Array.isArray(json.data?.saved)) {
          setSavedTemplates(json.data.saved as SavedTemplateEntry[]);
        }
      } catch {
        // Gagal memuat library tidak boleh memblokir pilihan katalog.
      } finally {
        if (!cancelled) setSavedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Hapus salinan library. Template aktif website tidak tersentuh, jadi
   * kartu "Aktif" di atas dan tampilan website tetap sama.
   */
  const confirmDeleteSaved = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    setDeletingId(target.id);
    setError("");
    setNotice("");
    try {
      const result = await deleteSavedTemplate({ libraryId: target.id });
      if (result.ok) {
        setNotice(`Template "${target.name}" dihapus dari library.`);
      } else {
        setError(result.error ?? "Gagal menghapus template");
      }
      // Muat ulang dari server: kalau hapus ternyata gagal, daftar tetap sama
      // sehingga kartu tidak hilang palsu.
      await loadSavedTemplates();
    } finally {
      setDeletingId(null);
    }
  };

  /** Entri library + template katalog dasarnya, untuk dirender kartu sama. */
  const savedEntries = useMemo(
    () =>
      savedTemplates
        .map((saved) => ({ saved, entry: savedToCatalogEntry(saved, BUILT_IN_CATALOG) }))
        .filter((x): x is { saved: SavedTemplateEntry; entry: CatalogEntry } => x.entry !== null),
    [savedTemplates],
  );

  // Reset pesan bila website berubah. Guard ref agar tidak setState
  // di effect mount pertama (menghindari cascading renders).
  const prevWebsiteId = useRef(websiteId);
  useEffect(() => {
    if (prevWebsiteId.current === websiteId) return;
    prevWebsiteId.current = websiteId;
    setError("");
    setNotice("");
    setPending(null);
  }, [websiteId]);

  // Id template aktif dinormalisasi supaya cocok dengan id katalog statis
  // (template_id tersimpan bisa berprefix legacy `system-` / `builtin-`).
  const normalizedActiveId = activeTemplateId ? resolveTemplateId(activeTemplateId) : null;

  async function confirmApply(tpl: CatalogEntry) {
    setBusyId(tpl.id);
    setError("");
    setNotice("");
    // Staging-kanvas: template BELUM di-PUT ke server — live site tidak
    // berubah. Penanda disimpan ke sessionStorage, lalu customize page
    // men-staging-nya ke kanvas saat load (meniru galeri builder). Tayangkan
    // yang baru menulis live. Tanpa redirectAfterApply, fallback ke PUT lama.
    try {
      if (redirectAfterApply) {
        sessionStorage.setItem(
          PENDING_TEMPLATE_KEY,
          JSON.stringify({ kind: "builtin", id: tpl.id }),
        );
        setPending(null);
        setNotice(`Template "${tpl.name}" dimuat ke kanvas. Tekan "Tayangkan" di editor untuk mengubah live site.`);
        router.push(redirectAfterApply);
        return;
      }
      // Satu-satunya jalur apply — `lib/builder/apply-template`.
      // Jangan diduplikasi: dua call site pernah punya versi berbeda
      // dan satu di antaranya tertinggal (bug template library).
      // Aturan library: pertama kali terapkan → server INSERT salinan baru
      // (sync_library: "create" di dalam helper) sekaligus mengupsert aktif.
      // Daftar library dimuat ulang agar kartu baru langsung tampil.
      const result = await applyTemplateToWebsite({
        websiteId,
        template: {
          id: tpl.id,
          name: tpl.name,
          description: tpl.description,
          source: "builtin",
          category: tpl.category,
          data: (tpl.data ?? {}) as ApplyableTemplate["data"],
        },
      });
      if (!result.ok) {
        setError(result.error ?? "Gagal menerapkan template");
        return;
      }
      setPending(null);
      setNotice(
        result.library
          ? `Template "${tpl.name}" aktif & tersimpan sebagai "${result.library.name}" di Template Saya.`
          : `Template "${tpl.name}" aktif. Warna, font, navigasi, footer, & layout homepage ikut diganti.`,
      );
      await loadSavedTemplates();
      onTemplateApplied?.(result.templateId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <LayoutTemplate className="w-4 h-4" />
          </span>
          Pilih Template
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Memilih template mengganti <strong>template di kartu aktif</strong> di atas: style
          global (warna, font), header, footer, dan layout homepage. Halaman lain tidak
          terhapus — hanya gaya & homepage yang berubah.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{notice}</span>
          </div>
        )}
                {/* ============ Tab: Katalog | Library ============ */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted w-fit" role="tablist">
          {(["catalog", "library"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-bold transition-colors ${
                tab === key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {key === "catalog" ? (
                <>
                  <LayoutTemplate className="w-3.5 h-3.5" /> Katalog
                </>
              ) : (
                <>
                  <Library className="w-3.5 h-3.5" /> Template Saya
                  {savedTemplates.length > 0 && (
                    <span className="text-[10px] font-bold bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200 px-1.5 rounded-full tabular-nums">
                      {savedTemplates.length}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {tab === "catalog" ? (
          <GridSection
            normalizedActiveId={normalizedActiveId}
            busyId={busyId}
            onSelect={(tpl) => setPending(tpl)}
            onPreview={(tpl) => setPreviewTpl(tpl)}
          />
        ) : savedLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : savedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Library className="w-14 h-14 text-muted-foreground/30 mb-3" />
            <p className="font-semibold">Template Saya masih kosong</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Tekan &quot;Simpan&quot; di dalam editor lalu pilih &quot;Simpan sebagai
              template&quot; supaya desainmu muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedEntries.map(({ saved, entry }) => (
                <PickerCard
                  key={saved.id}
                  tpl={{ ...entry, id: saved.id, name: saved.name } as CatalogEntry}
                  isActive={false}
                  applying={busyId === saved.id}
                  isSaved
                  onDelete={() => {
                    setError("");
                    setNotice("");
                    setPendingDelete(saved);
                  }}
                  deleting={deletingId === saved.id}
                  onSelect={() => {
                    setError("");
                    setNotice("");
                    setBusyId(saved.id);
                    void (async () => {
                      if (redirectAfterApply) {
                        // Staging-kanvas: config library ditulis ke kanvas
                        // oleh customize page saat load — live site baru
                        // berubah setelah "Tayangkan".
                        sessionStorage.setItem(
                          PENDING_TEMPLATE_KEY,
                          JSON.stringify({ kind: "library", saved }),
                        );
                        setNotice(`Template "${saved.name}" dimuat ke kanvas. Tekan "Tayangkan" di editor untuk mengubah live site.`);
                        setBusyId(null);
                        router.push(redirectAfterApply);
                        return;
                      }
                      // Aturan library: menerapkan library LAIN pertama kali →
                      // server INSERT salinan baru sekaligus mengupsert aktif.
                      // Daftar dimuat ulang agar kartu baru langsung tampil.
                      const result = await applySavedTemplate({ websiteId, saved });
                      if (result.ok) {
                        setNotice(result.library
                          ? `Template "${saved.name}" dipakai & tersimpan sebagai "${result.library.name}" di Template Saya.`
                          : `Template "${saved.name}" sekarang dipakai website kamu.`);
                        await loadSavedTemplates();
                        onTemplateApplied?.(saved.base_slug ?? saved.id);
                      } else {
                        setError(result.error ?? "Gagal memakai template");
                      }
                      setBusyId(null);
                    })();
                  }}
                />
            ))}
          </div>
        )}
        <TemplatePreviewDialog
          template={previewTpl}
          onClose={() => setPreviewTpl(null)}
        />
        {/* Dialog konfirmasi sebelum apply */}
        <PendingDialog
          pending={pending}
          applying={!!pending && busyId === pending.id}
          onClose={() => setPending(null)}
          onConfirm={(tpl) => void confirmApply(tpl)}
        />
        {/* Dialog konfirmasi hapus template library. */}
        <Dialog
          open={!!pendingDelete}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" /> Hapus template tersimpan?
              </DialogTitle>
              <DialogDescription>
                Template <strong>{pendingDelete?.name}</strong> akan dihapus permanen dari
                Template Saya. Website yang sedang dipakai <strong>tidak</strong> ikut berubah — hanya
                salinan desainnya yang hilang.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPendingDelete(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => void confirmDeleteSaved()}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghapus…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" /> Ya, Hapus
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function GridSection({
  normalizedActiveId,
  busyId,
  onSelect,
  onPreview,
}: {
  normalizedActiveId: string | null;
  busyId: string | null;
  onSelect: (tpl: CatalogEntry) => void;
  onPreview: (tpl: CatalogEntry) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {BUILT_IN_CATALOG.map((tpl) => (
        <PickerCard
          key={tpl.id}
          tpl={tpl}
          isActive={normalizedActiveId === tpl.id}
          applying={busyId === tpl.id}
          onSelect={() => onSelect(tpl)}
          onPreview={() => onPreview(tpl)}
          thumbnailSrc={`/thumbnails/${tpl.id}.jpg`}
        />
      ))}
    </div>
  );
}

function styleName(tpl: CatalogEntry): string {
  // Label kategori adalah penanda yang tersisa di galeri — konsep design
  // style & design type sudah dihapus (migrasi 046).
  return CATEGORY_LABELS[tpl.category as BusinessCategory] ?? tpl.category;
}

function PendingDialog({
  pending,
  applying,
  onClose,
  onConfirm,
}: {
  pending: CatalogEntry | null;
  applying: boolean;
  onClose: () => void;
  onConfirm: (tpl: CatalogEntry) => void;
}) {
  return (
    <Dialog open={!!pending} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {pending && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Terapkan Template: {pending.name}
              </DialogTitle>
              <DialogDescription>
                Menerapkan template ini akan mengganti <strong>style global</strong> (warna, font,
                border-radius, shadow, nav style), <strong>header</strong> (logo, navigasi, CTA),{" "}
                <strong>footer</strong>, dan <strong>layout homepage</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 border-y">
              <div className="rounded-xl border p-4 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">Perubahan yang akan terjadi:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>
                        Warna, font, & komponen style diganti ke{" "}
                        <strong>{styleName(pending)}</strong>
                      </li>
                      <li>Navigasi header & footer diganti ke bawaan template</li>
                      <li>
                        Layout homepage diganti:{" "}
                        <strong>{(pending.data?.sections ?? []).length} section</strong> (section
                        lama dihapus)
                      </li>
                      <li>SEO title & description diganti</li>
                      <li>
                        <strong>Halaman lain TIDAK terhapus</strong> — hanya style global & homepage
                        yang berubah
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Kategori:</strong>{" "}
                  {CATEGORY_LABELS[pending.category as BusinessCategory]}
                </p>
                <p>
                  <strong>Section:</strong>{" "}
                  {(pending.data?.sections ?? [])
                    .map((s: { type: string; variant: string }) => `${s.type}:${s.variant}`)
                    .join(", ")}
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button onClick={() => onConfirm(pending)} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menerapkan…
                  </>
                ) : (
                  "Ya, Terapkan Template Ini"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PickerCard({
  tpl,
  isActive,
  applying,
  isSaved = false,
  onSelect,
  onPreview,
  thumbnailSrc,
  onDelete,
  deleting = false,
}: {
  tpl: CatalogEntry;
  isActive: boolean;
  applying: boolean;
  /** Item library user — badge & indikator menyesuaikan. */
  isSaved?: boolean;
  onSelect: () => void;
  /** Pratinjau in-modal (khusus katalog) — tombol di footer kartu. */
  onPreview?: () => void;
  /** Screenshot template (`/thumbnails/<id>.jpg`); kosong = gradien. */
  thumbnailSrc?: string | null;
  /** Aksi hapus (khusus Template Saya) — tombol ikon di baris judul kartu. */
  onDelete?: () => void;
  /** True saat baris ini sedang dihapus (spinner di tombol ikon). */
  deleting?: boolean;
}) {
  // Warna kartu sekarang dari palet template itu sendiri — katalog
  // DESIGN_STYLES yang sebelumnya supplying warna sudah dihapus (migrasi 046).
  const styleColors = {
    primary: tpl.theme?.palette?.primary ?? "#15803D",
    secondary: tpl.theme?.palette?.secondary ?? "#0d9488",
  };
  // Huruf inisial hanya fallback: disembunyikan sejak awal bila ada
  // thumbnailSrc, dimunculkan lagi bila gambar gagal dimuat. Jadi saat
  // thumbnail tampil, tidak ada huruf yang menutupinya.
  const [thumbFailed, setThumbFailed] = useState(false);
  const showInitial = !thumbnailSrc || thumbFailed;
  return (
    <div
      className="group text-left rounded-2xl border-2 overflow-hidden transition-all border-border hover:border-primary/50 hover:shadow-md data-[active=true]:border-primary data-[active=true]:shadow-md data-[busy=true]:opacity-70 data-[busy=true]:pointer-events-none"
      data-active={isActive}
      data-busy={applying}
    >
      <div
        className="aspect-video relative flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${styleColors.primary}, ${styleColors.secondary})`,
        }}
      >
        {thumbnailSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailSrc}
            alt={`Pratinjau ${tpl.name}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
            onError={(e) => { e.currentTarget.style.display = 'none'; setThumbFailed(true); }}
          />
        )}
        {showInitial && (
          <span className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl border border-white/30">
            {tpl.name.charAt(0)}
          </span>
        )}
        {isActive && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1">
            <Check className="w-3 h-3" /> Aktif
          </span>
        )}
        {isSaved && !isActive && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-pink-500 text-white text-[11px] font-semibold px-2.5 py-1">
            <Library className="w-3 h-3" /> Tersimpan
          </span>
        )}
        {applying && (
          <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </span>
        )}
      </div>
      <div className="p-4 space-y-1.5 bg-card">
        <div className="flex items-center gap-2">
          <p className="font-semibold leading-tight flex-1 min-w-0 truncate">{tpl.name}</p>
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              disabled={deleting}
              title="Hapus template ini dari Template Saya"
              aria-label={`Hapus template ${tpl.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {CATEGORY_LABELS[tpl.category as BusinessCategory]} · {styleName(tpl)} ·{" "}
          {(tpl.data?.sections ?? []).length} section
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
        <p className="text-xs font-semibold text-primary pt-1">
          {isActive ? "Template yang sedang dipakai" : "Belum dipakai"}
        </p>
        <Button
          type="button"
          size="sm"
          disabled={applying || isActive}
          className="h-8 w-full"
          onClick={onSelect}
          aria-label={`Terapkan ${tpl.name}`}
        >
          {applying ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Menerapkan…
            </>
          ) : (
            "Terapkan"
          )}
        </Button>
        {onPreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={applying}
            className="h-8 w-full"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            aria-label={`Pratinjau ${tpl.name}`}
          >
            <Eye className="w-3.5 h-3.5 mr-1" /> Pratinjau
          </Button>
        )}
      </div>
    </div>
  );
}
