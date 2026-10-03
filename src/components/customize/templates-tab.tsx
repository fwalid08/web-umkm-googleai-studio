"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, Sparkles, Home, Search, Settings, ExternalLink, Palette, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CATEGORY_LABELS, type BusinessCategory } from "@/lib/builder/templates/catalog";
import { DESIGN_STYLES } from "@/lib/builder/design-styles";
import { applyTemplateToWebsite, type ApplyableTemplate } from "@/lib/builder/apply-template";
import { useBuilderStore } from "@/lib/builder/store";
import { TemplateGallery } from "@/components/builder/template-gallery";

interface SystemTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template_data: any;
}

export function TemplatesTab({ websiteId, homepagePageId, isGalleryOpen = false, onGalleryClose, onTemplateApplied }: { websiteId: string; homepagePageId: string | null; isGalleryOpen?: boolean; onGalleryClose?: () => void; onTemplateApplied?: () => void }) {
  const [currentStyleId, setCurrentStyleId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<SystemTemplate | null>(null);

  // Template gallery modal state - controlled by parent or internal state
  const [showTemplateGallery, setShowTemplateGallery] = useState(isGalleryOpen);
  
  // Sync with parent
  useEffect(() => {
    setShowTemplateGallery(isGalleryOpen);
  }, [isGalleryOpen]);
  
  const handleGalleryClose = () => {
    setShowTemplateGallery(false);
    onGalleryClose?.();
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/websites/${websiteId}/website`);
        const json = await res.json();
        if (json.success) {
          const config = json.data.custom_config;
          setCurrentStyleId(config.design_style_id ?? null);
          if (typeof json.data.tier === "string") setUserTier(json.data.tier);
          // Cari template yang cocok via template_name (category) dari API
          const templateCategory = json.data.template_name ?? null;
          const matched = templateCategory
            ? (await fetch('/api/templates/library?scope=public&is_system_template=true').then(r => r.json()).then(j => j.data?.find((t: any) => t.category === templateCategory)))
            : (await fetch('/api/templates/library?scope=public&is_system_template=true').then(r => r.json()).then(j => j.data?.find((t: any) => t.template_data?.designStyleId === config.design_style_id)));
          if (matched) setCurrentTemplateId(matched.id);
        }
      } catch {
        // abaikan
      }
    })();
  }, [websiteId]);

  const currentTemplate = currentTemplateId
    ? (async () => {
        const res = await fetch(`/api/templates/library/${currentTemplateId}`);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
        return null;
      })()
    : null;
  const currentStyle = currentStyleId
    ? DESIGN_STYLES.find((s) => s.id === currentStyleId)
    : null;

  function openPreview(tpl: SystemTemplate) {
    setPreviewTemplate(tpl);
  }

  async function applyTemplate(tpl: SystemTemplate) {
    setBusyId(tpl.id);
    setError("");
    setNotice("");
    setPreviewTemplate(null);
    try {
      const result = await applyTemplateToWebsite({
        websiteId,
        template: {
          id: tpl.id,
          name: tpl.name,
          description: tpl.description,
          source: 'builtin',
          category: tpl.category,
          data: tpl.template_data ?? {},
        } as ApplyableTemplate,
      });
      if (!result.ok) {
        setError(result.error ?? "Gagal menerapkan template");
        return;
      }
      setCurrentStyleId(tpl.template_data?.designStyleId ?? null);
      setCurrentTemplateId(tpl.id);
      onTemplateApplied?.();
      setNotice(
        `Template "${tpl.name}" aktif. Warna, font, navigasi, footer, & layout ikut di semua halaman.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Template Gallery Modal */}
      <Dialog open={showTemplateGallery} onOpenChange={handleGalleryClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Pilih Template Website
              </DialogTitle>
              <DialogDescription>
                Satu template mengatur semuanya: style, warna, font, navigasi, footer, dan layout —
                berlaku di homepage, blog, checkout, dan halaman custom.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="mx-4 mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {notice && (
              <div className="mx-4 mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{notice}</span>
              </div>
            )}
            <TemplateGallery
              websiteId={websiteId}
              userTier={userTier ?? undefined}
              onApply={async (template: any) => {
                if (!template?.id) {
                  setError("Template tidak valid");
                  return;
                }
                // Satu-satunya jalur apply — `lib/builder/apply-template`.
                // Jangan diduplikasi: dua call site pernah punya versi berbeda
                // dan satu di antaranya tertinggal (bug template library).
                const applyable = template as ApplyableTemplate;
                const result = await applyTemplateToWebsite({ websiteId, template: applyable });
                if (result.ok) {
                  setCurrentStyleId(applyable.data?.designStyleId ?? null);
                  setCurrentTemplateId(result.templateId);
                  setNotice(`Template "${template.name}" berhasil diterapkan!`);
                  onTemplateApplied?.();
                  handleGalleryClose();
                } else {
                  setError(result.error ?? "Gagal menerapkan template");
                }
              }}
              onPreview={(template: any) => {
                if (!template?.id) return;
                window.open(`/preview/${template.id}`, '_blank');
              }}
            />
          </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Pratinjau Template: {previewTemplate.name}
                </DialogTitle>
                <DialogDescription>
                  Menerapkan template ini akan mengganti <strong>style global</strong> (warna, font, border-radius, shadow, nav style),
                  <strong>header</strong> (logo, navigasi, CTA), <strong>footer</strong>, dan <strong>layout homepage</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 border-y">
                <div className="rounded-xl border p-4 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm space-y-1">
                      <p className="font-semibold">Perubahan yang akan terjadi:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Warna, font, & komponen style diganti ke <strong>{DESIGN_STYLES.find((s) => s.id === previewTemplate.template_data?.designStyleId)?.name ?? previewTemplate.template_data?.designStyleId}</strong></li>
                        <li>Navigasi header & footer diganti ke bawaan template (link anchor ke section homepage)</li>
                        <li>Layout homepage diganti: <strong>{(previewTemplate.template_data?.sections ?? []).length} section</strong> (section lama dihapus)</li>
                        <li>SEO title & description diganti</li>
                        <li><strong>Halaman custom (store_pages) TIDAK terhapus</strong> — hanya style global & homepage yang berubah</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Kategori:</strong> {CATEGORY_LABELS[previewTemplate.category as BusinessCategory]}</p>
<p><strong>Style:</strong> {DESIGN_STYLES.find((s) => s.id === previewTemplate.template_data?.designStyleId)?.name ?? previewTemplate.template_data?.designStyleId}</p>
                      <p><strong>Section:</strong> {(previewTemplate.template_data?.sections ?? []).map((s: { type: string; variant: string }) => `${s.type}:${s.variant}`).join(", ")}</p>
                      <p><strong>Header CTA:</strong> {previewTemplate.template_data?.header?.ctaText ?? "—"} → {previewTemplate.template_data?.header?.ctaLink ?? "—"}</p>
                      <p><strong>Footer style:</strong> {previewTemplate.template_data?.footer?.style ?? "simple"}</p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Batal
                </Button>
                <Button
                  onClick={() => applyTemplate(previewTemplate)}
                  disabled={busyId === previewTemplate.id}
                >
                  {busyId === previewTemplate.id ? (
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
    </div>
  );
}