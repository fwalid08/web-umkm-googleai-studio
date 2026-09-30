"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderShell } from "@/components/builder/builder-shell";
import { useBuilderStore } from "@/lib/builder/store";

/**
 * Page builder per-halaman: reuse BuilderShell + store yang sama.
 * - Layout (rows + sections) bersifat per-halaman -> store_pages.layout.
 * - Header/footer/design-style/SEO bersifat global -> user_templates.custom_config,
 *   sehingga ganti template di tab Templates mewarnai semua halaman.
 */
export default function PageBuilderPage() {
  const params = useParams<{ pageId: string }>();
  const pageId = params.pageId;
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadConfig = useBuilderStore((s) => s.loadConfig);
  const globalRef = useRef<Record<string, unknown> | null>(null);

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
        const id = sitesJson.data.active_website_id as string;
        if (cancelled) return;
        setWebsiteId(id);

        const [cfgRes, pageRes] = await Promise.all([
          fetch(`/api/websites/${id}/website`),
          fetch(`/api/websites/${id}/pages/${pageId}`),
        ]);
        if (!cfgRes.ok || !pageRes.ok) throw new Error("Gagal memuat data halaman");
        const cfgJson = await cfgRes.json();
        const pageJson = await pageRes.json();
        if (cancelled) return;
        if (!cfgJson.success || !pageJson.success) {
          setError(cfgJson.error ?? pageJson.error ?? "Gagal memuat konfigurasi");
          return;
        }
        const config = cfgJson.data.custom_config;
        globalRef.current = config;
        const layout = (pageJson.data.layout ?? {}) as { rows?: unknown[]; sections?: unknown[] };
        setPageTitle(pageJson.data.title ?? "");
        // Fallback: jika page layout kosong, pakai sections dari global config (template)
        const pageSections = (layout.sections ?? []).length > 0 
          ? (layout.sections ?? []) 
          : (config.sections ?? []);
        loadConfig({
          // Layout per-halaman; global (header/footer/style) dari website.
          core: config.core,
          designStyleId: config.design_style_id,
          palette_override: config.palette_override,
          sections: pageSections as never,
          header: config.header,
          footer: config.footer,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat halaman");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageId, loadConfig]);

  /** Simpan: layout -> halaman, header/footer/style -> global website. */
  const handleSavePage = useCallback(async () => {
    if (!websiteId) throw new Error("Website belum siap");
    const s = useBuilderStore.getState();
    const global = globalRef.current ?? {};
    const globalRes = await fetch(`/api/websites/${websiteId}/website`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        custom_config: {
          ...(global as Record<string, unknown>),
          design_style_id: s.designStyleId,
          palette_override: s.paletteOverride,
          header: s.header,
          footer: s.footer,
          seo: s.seo,
          sections: s.sections,
        },
      }),
    });
    const globalJson = await globalRes.json();
    if (!globalJson.success) throw new Error(globalJson.error ?? "Gagal menyimpan global");
    globalRef.current = globalJson.data.custom_config;

    const pageRes = await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: { sections: s.sections } }),
    });
    const pageJson = await pageRes.json();
    if (!pageJson.success) throw new Error(pageJson.error ?? "Gagal menyimpan halaman");
  }, [websiteId, pageId]);

  const handlePublishPage = useCallback(async () => {
    if (!websiteId) throw new Error("Website belum siap");
    await handleSavePage();
    const res = await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: true }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Gagal publish halaman");
  }, [websiteId, pageId, handleSavePage]);

  if (loading) {
    return (
      <div className="flex flex-col h-dvh w-full bg-gradient-to-br from-slate-50 via-emerald-50/40 to-amber-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 overflow-hidden">
        {/* Skeleton topbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-100/70 bg-white/80 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="w-40 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="w-24 h-9 rounded-xl bg-emerald-200 dark:bg-slate-800 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex min-h-0">
          <div className="w-80 hidden sm:block border-r border-emerald-100/60 bg-white/70 dark:bg-slate-900 p-4 space-y-3">
            <div className="h-20 rounded-2xl bg-emerald-100/70 dark:bg-slate-800 animate-pulse" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
          <div className="flex-1 p-4 sm:p-6 space-y-3">
            <div className="max-w-3xl mx-auto rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-8 w-2/3 rounded-full bg-emerald-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-1/2 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-10 w-28 rounded-xl bg-emerald-200 dark:bg-slate-800 animate-pulse" />
                  <div className="h-10 w-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 p-6">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            </div>
            <p className="text-center text-sm font-bold text-emerald-700">🎨 Menyiapkan kanvas tokomu…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !websiteId) {
    return (
      <div className="flex items-center justify-center h-dvh bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 p-4">
        <div className="text-center max-w-md w-full rounded-3xl border border-amber-200/70 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <div className="text-5xl mb-3">🏪😢</div>
          <h1 className="font-extrabold text-lg">Ups, halaman belum bisa dibuka</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{error || "Halaman tidak ditemukan"}</p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button asChild className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold">
              <Link href="/dashboard/websites/customize?tab=halaman">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Halaman
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BuilderShell
      websiteId={websiteId}
      pageTitle={pageTitle || 'Halaman toko'}
      onSaveOverride={handleSavePage}
      onPublishOverride={handlePublishPage}
      exitHref="/dashboard/websites/customize?tab=halaman"
    />
  );
}
