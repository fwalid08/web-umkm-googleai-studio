"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, LayoutTemplate } from "lucide-react";
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
import { DESIGN_STYLES } from "@/lib/builder/design-styles";
import {
  applyTemplateToWebsite,
  resolveTemplateId,
  type ApplyableTemplate,
} from "@/lib/builder/apply-template";

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
}: {
  websiteId: string;
  activeTemplateId?: string | null;
  onTemplateApplied?: (templateId: string) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Dialog konfirmasi sebelum template diterapkan.
  const [pending, setPending] = useState<CatalogEntry | null>(null);

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
    try {
      // Satu-satunya jalur apply — `lib/builder/apply-template`.
      // Jangan diduplikasi: dua call site pernah punya versi berbeda
      // dan satu di antaranya tertinggal (bug template library).
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
        `Template "${tpl.name}" aktif. Warna, font, navigasi, footer, & layout homepage ikut diganti.`,
      );
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
        <GridSection
          normalizedActiveId={normalizedActiveId}
          busyId={busyId}
          onSelect={(tpl) => setPending(tpl)}
        />
        {/* Dialog konfirmasi sebelum apply */}
        <PendingDialog
          pending={pending}
          applying={!!pending && busyId === pending.id}
          onClose={() => setPending(null)}
          onConfirm={(tpl) => void confirmApply(tpl)}
        />
      </CardContent>
    </Card>
  );
}

function GridSection({
  normalizedActiveId,
  busyId,
  onSelect,
}: {
  normalizedActiveId: string | null;
  busyId: string | null;
  onSelect: (tpl: CatalogEntry) => void;
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
        />
      ))}
    </div>
  );
}

function styleName(tpl: CatalogEntry): string {
  const designStyleId = tpl.data?.designStyleId ?? tpl.data?.design_style_id;
  return DESIGN_STYLES.find((s) => s.id === designStyleId)?.name ?? designStyleId ?? "—";
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
  onSelect,
}: {
  tpl: CatalogEntry;
  isActive: boolean;
  applying: boolean;
  onSelect: () => void;
}) {
  const designStyleId = tpl.data?.designStyleId ?? tpl.data?.design_style_id;
  const style = DESIGN_STYLES.find((s) => s.id === designStyleId) ?? null;
  const styleColors = style?.palette ?? { primary: "#15803D", secondary: "#0d9488" };
  return (
    <button
      type="button"
      onClick={() => {
        if (!isActive && !applying) onSelect();
      }}
      disabled={applying}
      className="group text-left rounded-2xl border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border-border hover:border-primary/50 hover:shadow-md data-[active=true]:border-primary data-[active=true]:shadow-md data-[busy=true]:opacity-70 data-[busy=true]:pointer-events-none"
      data-active={isActive}
      data-busy={applying}
    >
      <div
        className="aspect-video relative flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${styleColors.primary}, ${styleColors.secondary})`,
        }}
      >
        <span className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl border border-white/30">
          {tpl.name.charAt(0)}
        </span>
        {isActive && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold px-2.5 py-1">
            <Check className="w-3 h-3" /> Aktif
          </span>
        )}
        {applying && (
          <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </span>
        )}
      </div>
      <div className="p-4 space-y-1.5 bg-card">
        <p className="font-semibold leading-tight">{tpl.name}</p>
        <p className="text-xs text-muted-foreground">
          {CATEGORY_LABELS[tpl.category as BusinessCategory]} · {styleName(tpl)} ·{" "}
          {(tpl.data?.sections ?? []).length} section
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
        <p className="text-xs font-semibold text-primary pt-1">
          {isActive ? "Template yang sedang dipakai" : "Klik untuk menerapkan"}
        </p>
      </div>
    </button>
  );
}
