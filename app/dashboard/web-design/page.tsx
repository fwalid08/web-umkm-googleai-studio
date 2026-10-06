"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActiveTemplateCard } from "@/components/customize/active-template-card";
import { TemplatePicker } from "@/components/customize/template-picker";
import { ToastProvider } from "@/components/ui/toast";

interface ActiveSite {
  id: string;
  name: string;
  subdomain: string | null;
}

function CustomizeInner() {
  const router = useRouter();

  const [site, setSite] = useState<ActiveSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);
  // Identitas template aktif untuk ActiveTemplateCard + TemplatePicker (hindari double-fetch).
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/websites");
      const json = await res.json();
      if (!json.success || !json.data?.websites?.length) {
        setError("Belum ada website. Buat website dulu.");
        return;
      }
      const list = json.data.websites as ActiveSite[];
      const activeSite = list.find((s) => s.id === json.data.active_website_id) ?? list[0] ?? null;
      setSite(activeSite);

      if (activeSite) {
        // Load identitas template aktif (template_id dari API).
        const configRes = await fetch(`/api/websites/${activeSite.id}/website`);
        const configJson = await configRes.json();
        if (configJson.success) {
          setActiveTemplateId(
            typeof configJson.data?.template_id === "string"
              ? configJson.data.template_id
              : null,
          );
        }
      }
    } catch {
      setError("Gagal memuat website. Periksa koneksi Anda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tombol "Customize" di kartu template aktif. Single-page (lihat 044):
  // editor tidak lagi butuh pageId store_pages.
  useEffect(() => {
    const handleOpenPageBuilder = () => {
      router.push("/dashboard/web-design/customize");
    };
    window.addEventListener('open-page-builder', handleOpenPageBuilder as EventListener);
    return () => {
      window.removeEventListener('open-page-builder', handleOpenPageBuilder as EventListener);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto" aria-label="Memuat kustomisasi website">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full max-w-md" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="max-w-xl mx-auto text-center rounded-2xl border bg-card p-8 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Store className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="font-bold text-lg">Belum bisa kustomisasi</h1>
        <p className="text-sm text-muted-foreground mt-2">{error || "Website tidak ditemukan"}</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/websites">Ke Websites</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Desain Website</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toko: <span className="font-semibold text-foreground">{site.name}</span> {"\u2014"} pilih
            template di bawah untuk mengganti template aktif, lalu kustomisasi warna, font,
            dan section lewat tombol Customize Homepage.
          </p>
        </div>
      </div>

      {/* Template aktif + tombol Customize Homepage */}
      <ActiveTemplateCard
        key={site.id}
        websiteId={site.id}
        onOpenTemplateGallery={() => {
          document
            .getElementById("template-picker")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        refreshKey={templateRefreshKey}
        initialTemplateId={activeTemplateId}
      />

      {/* Daftar template yang bisa dipilih — mengganti template di kartu aktif */}
      <div id="template-picker" className="scroll-mt-4">
        <TemplatePicker
          websiteId={site.id}
          activeTemplateId={activeTemplateId}
          redirectAfterApply="/dashboard/web-design/customize"
          onTemplateApplied={(templateId) => {
            // Refresh kartu template aktif: identitas dari server bila tersedia.
            setTemplateRefreshKey((k) => k + 1);
            if (typeof templateId === "string" && templateId.length > 0) {
              setActiveTemplateId(templateId);
            }
          }}
        />
      </div>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <ToastProvider>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CustomizeInner />
      </Suspense>
    </ToastProvider>
  );
}