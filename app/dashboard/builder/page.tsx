"use client";

import { useEffect, useState } from "react";
import { BuilderShell } from "@/components/builder/builder-shell";
import { useBuilderStore } from "@/lib/builder/store";
import { useTemplateStore } from "@/lib/builder/template-store";
import { PageManager } from "@/components/builder/page-manager";
import { TemplateGallery } from "@/components/builder/template-gallery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Store, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { getSectionVariant } from "@/lib/builder/sections/registry";
import { applySectionAssets } from "@/lib/builder/template-assets";

export default function BuilderPage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPages, setShowPages] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const loadConfig = useBuilderStore((s) => s.loadConfig);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sitesRes = await fetch("/api/websites");
        if (!sitesRes.ok) throw new Error(`HTTP ${sitesRes.status}`);
        const sitesJson = await sitesRes.json();
        if (!sitesJson.success || !sitesJson.data?.active_website_id) {
          if (!cancelled) {
            setError("Tidak ada website aktif. Buat website dulu di panel Websites.");
            setLoading(false);
          }
          return;
        }
        const id = sitesJson.data.active_website_id;
        if (cancelled) return;
        setWebsiteId(id);

        const res = await fetch(`/api/websites/${id}/website`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          const config = json.data.custom_config;
          if (typeof json.data.subdomain_url === 'string' && json.data.subdomain_url.length > 0) {
            setSiteUrl(json.data.subdomain_url);
          }
          loadConfig({
            core: config.core,
            designStyleId: config.design_style_id,
            palette_override: config.palette_override,
            sections: config.sections,
            header: config.header,
            footer: config.footer,
            theme: config.theme,
          });
        } else {
          setError(json.error || "Gagal memuat konfigurasi");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat konfigurasi website");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-slate-100 dark:bg-slate-950 p-4">
        <div className="text-center max-w-sm w-full rounded-2xl border bg-card p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <p className="font-semibold">Memuat Website Builder…</p>
          <p className="text-sm text-muted-foreground mt-1">Mengambil konfigurasi toko aktif Anda</p>
          <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !websiteId) {
    return (
      <div className="flex items-center justify-center h-dvh bg-slate-100 dark:bg-slate-950 p-4">
        <div className="text-center max-w-md w-full rounded-2xl border bg-card p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            {error?.includes("Tidak ada website") ? (
              <Store className="w-6 h-6 text-amber-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            )}
          </div>
          <h1 className="font-bold text-lg">Builder belum bisa dibuka</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {error || "Website tidak ditemukan"}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button asChild>
              <Link href="/dashboard/websites">
                <Store className="w-4 h-4 mr-2" />
                Ke Websites
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Coba lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <BuilderShell
        websiteId={websiteId}
        siteUrl={siteUrl}
        onShowPages={() => setShowPages(true)}
        onShowTemplates={() => setShowTemplates(true)}
      />

      {/* Pages & Templates sebagai dialog overlay — state builder tetap terjaga */}
      <Dialog open={showPages} onOpenChange={setShowPages}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPages(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              Kelola Halaman
            </DialogTitle>
            <DialogDescription>
              Tambah, ubah, atau atur halaman website toko Anda.
            </DialogDescription>
          </DialogHeader>
          <PageManager websiteId={websiteId} />
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowTemplates(false)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              Galeri Template
            </DialogTitle>
            <DialogDescription>
              Terapkan template siap pakai ke website Anda. Perubahan bisa di-undo.
            </DialogDescription>
          </DialogHeader>
          <TemplateGallery
            websiteId={websiteId}
            onApply={async (template: any) => {
              if (!template?.id) {
                console.error('Template is undefined or missing id:', template);
                return;
              }
              // template is UnifiedTemplate, strip 'builtin-' prefix for API
              const templateId = template.id.startsWith('builtin-') ? template.id.slice(8) : template.id;
              // Find the full template data from catalog
              const catalogTemplate = BUILT_IN_CATALOG.find((t) => t.id === templateId);
              if (!catalogTemplate) {
                console.error('Template not found in catalog:', templateId);
                return;
              }
              // Resolve sections to API format
              const resolvedSections = (catalogTemplate.data?.sections ?? []).map((s) => {
                const variant = getSectionVariant(s.type, s.variant);
                const base = variant?.defaultConfig ?? {};
                const override = (s.config ?? {}) as Record<string, unknown>;
                const styleBase = variant?.defaultStyle ?? {};
                const styleOverride = (s.style ?? {}) as Record<string, unknown>;
                // Foto bawaan per-niche ikut tersimpan ke API, bukan hanya kanvas.
                const merged = applySectionAssets(
                  { ...base, ...override } as Record<string, unknown>,
                  catalogTemplate.category,
                );
                return {
                  id: crypto.randomUUID(),
                  type: s.type,
                  variant: s.variant,
                  config: JSON.parse(JSON.stringify(merged)),
                  style: {
                    padding: { top: 64, right: 24, bottom: 64, left: 24 },
                    background: 'transparent' as const,
                    ...JSON.parse(JSON.stringify(styleBase)),
                    ...JSON.parse(JSON.stringify(styleOverride)),
                  },
                  responsive: {},
                };
              });
              try {
                const res = await fetch(`/api/websites/${websiteId}/website`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    template_id: templateId,
                    custom_config: {
                      design_style_id: catalogTemplate.data?.designStyleId ?? 'minimalist',
                      palette_override: catalogTemplate.data?.paletteOverride ?? {},
                      sections: resolvedSections,
                      header: catalogTemplate.data?.header ?? {},
                      footer: catalogTemplate.data?.footer ?? {},
                      layout: { rows: [] },
                      core: catalogTemplate.data?.core ?? {},
                      seo: catalogTemplate.data?.seo ?? {},
                      theme: {},
                    },
                  }),
                });
                const json = await res.json();
                if (!json.success) {
                  console.error('Gagal menerapkan template:', json.error);
                  return;
                }
                // Terapkan template: theme/palette/header/footer ikut berganti dan
                // kanvas diisi section bawaan + aset foto per-bisnis.
                useTemplateStore.getState().applyTemplate(templateId);
                useBuilderStore.getState().resetPaletteOverride();
                setShowTemplates(false);
              } catch (e) {
                console.error('Gagal menerapkan template:', e);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
