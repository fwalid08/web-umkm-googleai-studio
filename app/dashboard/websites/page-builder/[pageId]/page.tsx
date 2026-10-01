"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuilderShell } from "@/components/builder/builder-shell";
import { useBuilderStore } from "@/lib/builder/store";
import { useTemplateStore } from "@/lib/builder/template-store";
import { BUILT_IN_CATALOG, getTemplateIdByCategory, type BusinessCategory } from "@/lib/builder/templates/catalog";
import {
  buildWebsiteCustomConfig,
  instanceToBuilderSection,
  resolveChromeConfig,
  seedTemplateSections,
  templateIdForApiName,
} from "@/lib/builder/migration";
import { getTemplate } from "@/lib/builder/template-store";

/** Daftar id+kategori katalog untuk memetakan nama template API -> template-store. */
const BUILT_IN_TEMPLATES_FOR_LOOKUP = BUILT_IN_CATALOG.map((t) => ({ id: t.id, category: t.category }));

function getTemplateByIdSafe(templateId: string) {
  try {
    return getTemplate(templateId);
  } catch {
    return undefined;
  }
}

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
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  // Status tayang halaman. undefined selama loading / builder tanpa konsep.
  const [isPublished, setIsPublished] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadConfig = useBuilderStore((s) => s.loadConfig);
  const globalRef = useRef<Record<string, unknown> | null>(null);
  const pageMetaRef = useRef<{ is_homepage?: boolean; slug?: string } | null>(null);

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
        if (typeof cfgJson.data.subdomain_url === 'string' && cfgJson.data.subdomain_url.length > 0) {
          setSiteUrl(cfgJson.data.subdomain_url);
        }
        const layout = (pageJson.data.layout ?? {}) as { rows?: unknown[]; sections?: unknown[] };
        setPageTitle(pageJson.data.title ?? "");
        pageMetaRef.current = {
          is_homepage: pageJson.data.is_homepage === true,
          slug: typeof pageJson.data.slug === "string" ? pageJson.data.slug : undefined,
        };
        // Status tayang dari server — jadi topbar bisa menampilkan Tayang/Draft.
        if (typeof pageJson.data.is_published === "boolean") {
          if (!cancelled) setIsPublished(pageJson.data.is_published);
        }
        // Halaman kosong (mis. "Tentang" baru dibuat) tidak punya layout.
        // Seed dari sections TEMPLATE, bukan custom_config.sections: sections
        // global sudah tidak lagi menjadi sumber kebenaran (homepage kini
        // milik baris page-builder), jadi mewarisinya justru membuat kanvas
        // halaman baru isinya sama dengan homepage.
        const savedPageSections = (layout.sections ?? []) as unknown[];
        const templateSections =
          (BUILT_IN_CATALOG.find((t) => t.id === cfgJson.data.catalog_template_id)?.data?.sections ??
            (config as Record<string, unknown>).template_sections ??
            []) as unknown[];
        const pageSections =
          savedPageSections.length > 0 ? savedPageSections : templateSections;
        loadConfig({
          // Layout per-halaman; global (header/footer/style) dari website.
          core: config.core,
          designStyleId: config.design_style_id,
          palette_override: config.palette_override,
          sections: pageSections as never,
          header: config.header,
          footer: config.footer,
          theme: config.theme,
        });
        // PENTING (fix store ganda): seed kanvas/template-store dari sections
        // tersimpan. Urutan: setTemplate dulu (reset), lalu seed sections —
        // tanpa ini kanvas selalu kosong karena template-store tak pernah
        // menerima data load, dan sebaliknya edit kanvas tidak pernah ke-save.
        const templateId =
          templateIdForApiName(cfgJson.data.template_name, BUILT_IN_TEMPLATES_FOR_LOOKUP) ??
          getTemplateIdByCategory(cfgJson.data.template_name as BusinessCategory) ??
          null;
        const templateStore = useTemplateStore.getState();
        if (templateId) templateStore.setTemplate(templateId);
        // setTemplate() sinkron mengganti template; baca ulang state terbaru
        // supaya seed memakai template yang benar (bukan template lama).
        const freshTemplateStore = useTemplateStore.getState();
        const seedTemplate =
          freshTemplateStore.template ?? (templateId ? getTemplateByIdSafe(templateId) : undefined);
        if (seedTemplate) {
          freshTemplateStore.replaceSections(seedTemplateSections(seedTemplate, pageSections as never));
          // Seed konten header/footer efektif (default varian + tersimpan)
          // agar form sidebar & kanvas menampilkan nilai sebenarnya, bukan
          // sekadar default template.
          const effHeader = resolveChromeConfig(seedTemplate, config.header as Record<string, unknown> | undefined, 'header');
          const effFooter = resolveChromeConfig(seedTemplate, config.footer as Record<string, unknown> | undefined, 'footer');
          useTemplateStore.setState({
            headerConfig: effHeader.config,
            footerConfig: effFooter.config,
            headerVariantId: effHeader.variantId,
            footerVariantId: effFooter.variantId,
            animations: Array.isArray((config as Record<string, unknown>).animations)
              ? (config as Record<string, unknown>).animations as never
              : [],
            behaviours: Array.isArray((config as Record<string, unknown>).behaviours)
              ? (config as Record<string, unknown>).behaviours as never
              : [],
            assets: Array.isArray((config as Record<string, unknown>).assets)
              ? (config as Record<string, unknown>).assets as never
              : [],
            saved: true,
          });
        }
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
    const t = useTemplateStore.getState();
    const global = globalRef.current ?? {};
    // Sections diambil dari template-store (sumber edit kanvas), BUKAN dari
    // builder-store agar edit blok benar-benar tersimpan (fix store ganda).
    // Header/footer/varian mengikuti template-store yang sedang aktif.
    // Pakai konverter resmi agar anchorId & field style baru ikut tersimpan.
    const liveSections = t.sections.map((sec) => instanceToBuilderSection(sec));
    const template = t.template;
    const baseHeader =
      t.headerConfig && Object.keys(t.headerConfig).length > 0
        ? t.headerConfig
        : resolveChromeConfig(template, (s.header ?? {}) as unknown as Record<string, unknown>, 'header').config;
    const baseFooter =
      t.footerConfig && Object.keys(t.footerConfig).length > 0
        ? t.footerConfig
        : resolveChromeConfig(template, (s.footer ?? {}) as unknown as Record<string, unknown>, 'footer').config;
    const chromeHeader = { variantId: t.headerVariantId, config: baseHeader };
    const chromeFooter = { variantId: t.footerVariantId, config: baseFooter };
    // Homepage adalah satu-satunya halaman yang sections-nya ikut menjadi
    // sections global (sumber render homepage publik). Untuk halaman lain,
    // sections global DIJAGA dari snapshot awal agar konten antar-halaman
    // tidak saling menimpa (fix kebocoran lintas halaman).
    const initialGlobalSections = Array.isArray((global as Record<string, unknown>).sections)
      ? ((global as Record<string, unknown>).sections as unknown[])
      : [];
    const pageMeta = pageMetaRef.current;
    const isHomepage = pageMeta?.is_homepage === true;
    const sectionsForGlobal = (isHomepage ? liveSections : initialGlobalSections) as never;
    const customConfig = buildWebsiteCustomConfig({
      base: global as Record<string, unknown>,
      sections: sectionsForGlobal,
      header: { ...chromeHeader.config, variant: chromeHeader.variantId },
      footer: { ...chromeFooter.config, variant: chromeFooter.variantId, style: chromeFooter.variantId },
      designStyleId: s.designStyleId,
      paletteOverride: s.paletteOverride,
      typographyOverride: s.typographyOverride as Record<string, string>,
      animations: t.animations as unknown[],
      behaviours: t.behaviours as unknown[],
      assets: t.assets as unknown[],
      seo: s.seo,
      core: (s.core ?? {}) as unknown as Record<string, unknown>,
    });
    const globalRes = await fetch(`/api/websites/${websiteId}/website`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ custom_config: customConfig, template_id: t.template.id, is_homepage: isHomepage }),
    });
    const globalJson = await globalRes.json();
    if (!globalJson.success) throw new Error(globalJson.error ?? "Gagal menyimpan global");
    globalRef.current = globalJson.data.custom_config;

    const pageRes = await fetch(`/api/websites/${websiteId}/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout: { sections: liveSections } }),
    });
    const pageJson = await pageRes.json();
    if (!pageJson.success) throw new Error(pageJson.error ?? "Gagal menyimpan halaman");
    // Sinkronkan kembali builder-store (sumber payload bottom-bar/topbar)
    // dengan konten live agar indikator sesudah-save konsisten.
    useBuilderStore.setState({ sections: liveSections as never, saved: true });
    useTemplateStore.setState({ saved: true });
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
    // Badge Tayang/Draft di topbar harus langsungsinkron setelah publish.
    setIsPublished(true);
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
      siteUrl={siteUrl}
      onSaveOverride={handleSavePage}
      onPublishOverride={handlePublishPage}
      isPublished={isPublished}
      exitHref="/dashboard/websites/customize?tab=halaman"
    />
  );
}
