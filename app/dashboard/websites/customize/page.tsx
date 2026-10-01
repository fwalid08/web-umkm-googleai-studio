"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PagesTab } from "@/components/customize/pages-tab";
import { GeneralTab } from "@/components/customize/general-tab";
import { ActiveTemplateCard } from "@/components/customize/active-template-card";
import { TemplatesTab } from "@/components/customize/templates-tab";
import { SeoTab } from "@/components/customize/seo-tab";
import { useBuilderStore } from "@/lib/builder/store";
import type { StorePage } from "@/lib/builder/types";
import { ToastProvider } from "@/components/ui/toast";

interface ActiveSite {
  id: string;
  name: string;
  subdomain: string | null;
}

// Pakai type bersama (src/lib/builder/types.ts) agar selaras dengan store_pages.
type StorePageRef = Pick<StorePage, "id" | "title" | "slug" | "is_homepage">;

const VALID_TABS = ["umum", "halaman", "seo"] as const;
type TabKey = (typeof VALID_TABS)[number];

function CustomizeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabKey = VALID_TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : "umum";

  const [site, setSite] = useState<ActiveSite | null>(null);
  const [homepagePageId, setHomepagePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);
  // Identitas template aktif untuk ActiveTemplateCard (hindari double-fetch).
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeStyleId, setActiveStyleId] = useState<string | null>(null);
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string | null>(null);

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
        const pagesRes = await fetch(`/api/websites/${activeSite.id}/pages`);
        const pagesJson = await pagesRes.json();
        if (pagesJson.success) {
          const pages = pagesJson.data as StorePageRef[];
          const homepage = pages.find((p) => p.is_homepage);
          if (homepage) setHomepagePageId(homepage.id);
        }

        // Load website config into builder store
        const configRes = await fetch(`/api/websites/${activeSite.id}/website`);
        const configJson = await configRes.json();
        if (configJson.success && configJson.data?.custom_config) {
          useBuilderStore.getState().loadConfig(configJson.data.custom_config);
        }
        if (configJson.success) {
          setActiveTemplateId(configJson.data?.template_id ?? null);
          setActiveStyleId(configJson.data?.custom_config?.design_style_id ?? null);
          setActiveTemplateCategory(configJson.data?.template_name ?? null);
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

  // Listen for custom events from TemplatesTab quick actions
  useEffect(() => {
    const handleOpenPageBuilder = (e: CustomEvent<{ pageId: string }>) => {
      if (e.detail?.pageId && homepagePageId) {
        router.push(`/dashboard/websites/page-builder/${homepagePageId}`);
      }
    };
    const handleOpenCustomizeTab = (e: CustomEvent<{ tab: string }>) => {
      if (e.detail?.tab && VALID_TABS.includes(e.detail.tab as TabKey)) {
        switchTab(e.detail.tab);
      }
    };
    window.addEventListener('open-page-builder', handleOpenPageBuilder as EventListener);
    window.addEventListener('open-customize-tab', handleOpenCustomizeTab as EventListener);
    return () => {
      window.removeEventListener('open-page-builder', handleOpenPageBuilder as EventListener);
      window.removeEventListener('open-customize-tab', handleOpenCustomizeTab as EventListener);
    };
  }, [router, homepagePageId]);

  function switchTab(v: string) {
    router.replace(`/dashboard/websites/customize?tab=${v}`, { scroll: false });
  }

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
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link href="/dashboard/websites">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Websites
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Desain Website</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Toko: <span className="font-semibold text-foreground">{site.name}</span> {"\u2014"} template,
            halaman, dan pengaturan umum dalam satu tempat. Menu navigasi diatur
            di Page Builder ({'\u2192'} blok Header).
          </p>
        </div>
      </div>

{/* Active Template Card - Above Tabs */}
      <ActiveTemplateCard
        key={site.id}
        websiteId={site.id}
        homepagePageId={homepagePageId}
        onOpenTemplateGallery={() => setShowTemplateGallery(true)}
        refreshKey={templateRefreshKey}
        initialTemplateId={activeTemplateId}
        initialStyleId={activeStyleId}
        initialTemplateCategory={activeTemplateCategory}
      />

      {/* Tabs - Full Width Equal Width */}
      <Tabs value={tab} onValueChange={switchTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="umum">Umum</TabsTrigger>
          <TabsTrigger value="halaman">Halaman</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="umum" className="mt-6">
          <GeneralTab websiteId={site.id} />
        </TabsContent>
        <TabsContent value="halaman" className="mt-6">
          <PagesTab websiteId={site.id} />
        </TabsContent>
<TabsContent value="seo" className="mt-6">
          <SeoTab websiteId={site.id} />
        </TabsContent>
      </Tabs>

      {/* Template Gallery Modal - using TemplatesTab's internal dialog */}
      <TemplatesTab
        websiteId={site.id}
        homepagePageId={homepagePageId}
        isGalleryOpen={showTemplateGallery}
        onGalleryClose={() => setShowTemplateGallery(false)}
        onTemplateApplied={() => setTemplateRefreshKey((k) => k + 1)}
      />
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