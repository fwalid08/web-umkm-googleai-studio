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
import { BUILT_IN_CATALOG, CATEGORY_LABELS, type BusinessCategory } from "@/lib/builder/templates/catalog";
import { DESIGN_STYLES } from "@/lib/builder/design-styles";
import { getSectionVariant } from "@/lib/builder/sections/registry";
import { applySectionAssets } from "@/lib/builder/template-assets";
import { useBuilderStore } from "@/lib/builder/store";
import { TemplateGallery } from "@/components/builder/template-gallery";

function resolveSections(tpl: (typeof BUILT_IN_CATALOG)[number]) {
  return (tpl.data?.sections ?? []).map((s) => {
    const variant = getSectionVariant(s.type, s.variant);
    const base = variant?.defaultConfig ?? {};
    const override = (s.config ?? {}) as Record<string, unknown>;
    const styleBase = variant?.defaultStyle ?? {};
    const styleOverride = (s.style ?? {}) as Record<string, unknown>;
    // Foto bawaan per-niche dilepas di sini (bukan hanya di kanvas) supaya
    // hasil apply template di API/live site ikut punya aset yang sama.
    const merged = applySectionAssets(
      { ...base, ...override } as Record<string, unknown>,
      tpl.category,
    );
    return {
      id: crypto.randomUUID(),
      type: s.type,
      variant: s.variant,
      config: JSON.parse(JSON.stringify(merged)),
      style: {
        padding: { top: 64, right: 24, bottom: 64, left: 24 },
        background: "transparent" as const,
        ...JSON.parse(JSON.stringify(styleBase)),
        ...JSON.parse(JSON.stringify(styleOverride)),
      },
      responsive: {},
    };
  });
}

export function TemplatesTab({ websiteId, homepagePageId, isGalleryOpen = false, onGalleryClose, onTemplateApplied }: { websiteId: string; homepagePageId: string | null; isGalleryOpen?: boolean; onGalleryClose?: () => void; onTemplateApplied?: () => void }) {
  const [currentStyleId, setCurrentStyleId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Preview modal state
  const [previewTemplate, setPreviewTemplate] = useState<typeof BUILT_IN_CATALOG[number] | null>(null);

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
            ? BUILT_IN_CATALOG.find((t) => t.category === templateCategory)
            : BUILT_IN_CATALOG.find((t) => t.designStyleId === config.design_style_id);
          if (matched) setCurrentTemplateId(matched.id);
        }
      } catch {
        // abaikan
      }
    })();
  }, [websiteId]);

  const currentTemplate = currentTemplateId
    ? BUILT_IN_CATALOG.find((t) => t.id === currentTemplateId)
    : null;
  const currentStyle = currentStyleId
    ? DESIGN_STYLES.find((s) => s.id === currentStyleId)
    : null;

  function openPreview(tpl: (typeof BUILT_IN_CATALOG)[number]) {
    setPreviewTemplate(tpl);
  }

  async function applyTemplate(tpl: (typeof BUILT_IN_CATALOG)[number]) {
    setBusyId(tpl.id);
    setError("");
    setNotice("");
    setPreviewTemplate(null);
    try {
      const res = await fetch(`/api/websites/${websiteId}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: tpl.id,
          custom_config: {
            design_style_id: tpl.data?.designStyleId ?? "minimalist",
            palette_override: tpl.data?.paletteOverride ?? {},
            sections: resolveSections(tpl),
            header: tpl.data?.header ?? {},
            footer: tpl.data?.footer ?? {},
            layout: { rows: [] },
            core: tpl.data?.core ?? {},
            seo: tpl.data?.seo ?? {},
            theme: {},
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Gagal menerapkan template");
        return;
      }
      setCurrentStyleId(tpl.data?.designStyleId ?? null);
      setCurrentTemplateId(tpl.id);
      onTemplateApplied?.();
      setNotice(
        `Template "${tpl.name}" aktif. Warna, font, navigasi, footer, & layout ikut di semua halaman.`,
      );
    } catch {
      setError("Gagal menerapkan template. Periksa koneksi Anda.");
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
                  console.error('Template is undefined or missing id:', template);
                  return;
                }
                // template is UnifiedTemplate
                // Strip "builtin-" prefix for API
                const templateId = template.id.startsWith('builtin-') ? template.id.slice(8) : template.id;
                const res = await fetch(`/api/websites/${websiteId}/website`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    template_id: templateId,
                    custom_config: {
                      design_style_id: template.data?.designStyleId ?? template.designStyleId ?? "minimalist",
                      palette_override: template.data?.paletteOverride ?? template.paletteOverride ?? {},
                      sections: resolveSections(template),
                      header: template.data?.header ?? template.header ?? {},
                      footer: template.data?.footer ?? template.footer ?? {},
                      layout: { rows: [] },
                      core: template.data?.core ?? template.core ?? {},
                      seo: template.data?.seo ?? template.seo ?? {},
                      theme: {},
                    },
                  }),
                });
                const json = await res.json();
                if (json.success) {
                  setCurrentStyleId(template.data?.designStyleId ?? template.designStyleId ?? null);
                  // Strip 'builtin-' prefix from template ID
                  const templateId = template.id.startsWith('builtin-') ? template.id.slice(8) : template.id;
                  setCurrentTemplateId(templateId);
                  setNotice(`Template "${template.name}" berhasil diterapkan!`);
                  onTemplateApplied?.();
                  handleGalleryClose();
                } else {
                  setError(json.error ?? "Gagal menerapkan template");
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
                        <li>Warna, font, & komponen style diganti ke <strong>{DESIGN_STYLES.find((s) => s.id === previewTemplate.data?.designStyleId)?.name ?? previewTemplate.data?.designStyleId}</strong></li>
                        <li>Navigasi header & footer diganti ke bawaan template (link anchor ke section homepage)</li>
                        <li>Layout homepage diganti: <strong>{(previewTemplate.data?.sections ?? []).length} section</strong> (section lama dihapus)</li>
                        <li>SEO title & description diganti</li>
                        <li><strong>Halaman custom (store_pages) TIDAK terhapus</strong> — hanya style global & homepage yang berubah</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Kategori:</strong> {CATEGORY_LABELS[previewTemplate.category]}</p>
                  <p><strong>Style:</strong> {DESIGN_STYLES.find((s) => s.id === previewTemplate.data?.designStyleId)?.name ?? previewTemplate.data?.designStyleId}</p>
                  <p><strong>Section:</strong> {(previewTemplate.data?.sections ?? []).map((s) => `${s.type}:${s.variant}`).join(", ")}</p>
                  <p><strong>Header CTA:</strong> {previewTemplate.data?.header?.ctaText ?? "—"} → {previewTemplate.data?.header?.ctaLink ?? "—"}</p>
                  <p><strong>Footer style:</strong> {previewTemplate.data?.footer?.style ?? "simple"}</p>
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