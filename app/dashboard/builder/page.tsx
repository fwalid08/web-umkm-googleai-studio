"use client";

import { useEffect, useState } from "react";
import { BuilderShell } from "@/components/builder/builder-shell";
import { useBuilderStore } from "@/lib/builder/store";
import { PageManager } from "@/components/builder/page-manager";
import { TemplateGallery } from "@/components/builder/template-gallery";
import type { TemplateLibraryItem } from "@/lib/builder/types";
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

export default function BuilderPage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null);
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
          loadConfig({
            core: config.core,
            designStyleId: config.design_style_id,
            palette_override: config.palette_override,
            sections: config.sections,
            header: config.header,
            footer: config.footer,
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
            onApply={async (template: TemplateLibraryItem) => {
              // Normalisasi format library (snake_case dari DB) & bawaan (camelCase)
              // menjadi template utuh: style + navigasi + footer + section + seo.
              const td = template.template_data as unknown as import('@/lib/builder/types').FullTemplateData;
              useBuilderStore.getState().applyFullTemplate({
                designStyleId: td.designStyleId ?? td.design_style_id,
                paletteOverride: td.paletteOverride ?? td.palette_override,
                sections: td.sections ?? [],
                header: td.header,
                footer: td.footer,
                seo: td.seo,
                core: td.core,
              });
              // Simpan ke database agar tab halaman & publik langsung ter-update
              try {
                await useBuilderStore.getState().save(websiteId);
              } catch (e) {
                console.error('Gagal simpan template:', e);
              }
              setShowTemplates(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
