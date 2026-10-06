"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";
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
import { resolveTemplateId } from "@/lib/builder/apply-template";
import { getTemplate } from "@/lib/builder/template-store";
import type { Template } from "@/lib/builder/template-types";

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
 * Page builder single-page (lihat 044_single_page_user_templates.sql).
 *
 * Tidak ada lagi `pageId`: satu-satunya halaman lives di
 * `user_templates.custom_config` (sections + status tayang + meta), jadi
 * builder memuat dan menyimpan lewat SATU endpoint /api/websites/[id]/website.
 * Header/footer/design-style/SEO ikut di config yang sama.
 */
export default function PageBuilderPage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  // Status tayang halaman. undefined selama loading.
  const [isPublished, setIsPublished] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadConfig = useBuilderStore((s) => s.loadConfig);
  const globalRef = useRef<Record<string, unknown> | null>(null);
  // Template library aktif website (sumber ID + template_source saat save).
  // Tanpa ini save mengirim t.template.id yang kosong → PUT 404.
  const libMetaRef = useRef<{ id: string; source: 'saved' | 'builtin' } | null>(null);
  // Slug `saved-<uuid>` yang SEDANG dibuka di kanvas (aturan library):
  // - diisi saat load dari baris library terbaru (GET tidak mengembalikannya,
  //   jadi diambil dari ?library=1 — lihat effect di bawah),
  // - Tayangkan mengupdate baris ini (sync_library: "update"),
  // - Simpan-sebagai-template / Terapkan-pertama-kali memindahkannya ke slug
  //   baru dari respons server.
  // Ref (bukan state): hanya dibaca di dalam handler PUT, tidak merender.
  const activeLibraryRef = useRef<string | null>(null);

  // Galeri builder (builder-sidebar) memberi tahu kanvas pindah ke baris
  // library baru setelah "pertama kali terapkan" — tanpa ini Tayangkan
  // berikutnya fallback "create" dan membuat duplikat.
  useEffect(() => {
    const onLibraryChanged = (e: Event) => {
      const slug = (e as CustomEvent<{ template_slug?: unknown }>).detail?.template_slug;
      if (typeof slug === "string" && slug.length > 0) {
        activeLibraryRef.current = slug;
      }
    };
    window.addEventListener('active-library-changed', onLibraryChanged);
    return () => window.removeEventListener('active-library-changed', onLibraryChanged);
  }, []);

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

        // Baris library terbaru milik website ini = "yang sedang dibuka" bila
        // kanvas berasal dari library. GET website tidak mengembalikan slug
        // library, jadi diambil dari daftar library (sudah ada endpoint-nya).
        // Gagal fetch di sini tidak fatal: Tayangkan fallback "create".
        try {
          const libRes = await fetch("/api/templates?library=1");
          const libJson = await libRes.json();
          const first = Array.isArray(libJson?.data?.saved)
            ? (libJson.data.saved as Array<{ template_slug?: unknown }>)[0]
            : undefined;
          if (!cancelled && first && typeof first.template_slug === "string") {
            activeLibraryRef.current = first.template_slug;
          }
        } catch {
          // Abaikan — kanvas tetap bisa dibuka, Tayangkan fallback create.
        }
        if (cancelled) return;

        const cfgRes = await fetch(`/api/websites/${id}/website`);
        if (!cfgRes.ok) throw new Error("Gagal memuat data halaman");
        const cfgJson = await cfgRes.json();
        if (cancelled) return;
        if (!cfgJson.success) {
          setError(cfgJson.error ?? "Gagal memuat konfigurasi");
          return;
        }
        const config = cfgJson.data.custom_config;
        globalRef.current = config;
        if (typeof cfgJson.data.subdomain_url === 'string' && cfgJson.data.subdomain_url.length > 0) {
          setSiteUrl(cfgJson.data.subdomain_url);
        }
        setPageTitle("Halaman Utama");
        // Status tayang dinormalisasi ke boolean. Sebelumnya `undefined` dibiarkan
        // apa adanya sehingga badge disembunyikan dan tidak pernah menjelaskan
        // apa pun ke user. `=== true` aman untuk data lama: migrasi 044 sudah
        // mem-backfill is_published untuk setiap baris yang ada.
        if (!cancelled) setIsPublished(config.is_published === true);
        // Kanvas kosong (mis. website baru) tidak punya sections tersimpan.
        // Seed dari sections TEMPLATE, bukan config.sections global yang bisa
        // jadi snapshot basi.
        const savedPageSections = (Array.isArray(config.sections) ? config.sections : []) as unknown[];
        // `catalog_template_id` ada DI DALAM custom_config (hasil PUT whitelist),
        // bukan di `data` tingkat atas — membacanya dari `cfgJson.data` selalu
        // undefined sehingga seed sections template tidak pernah kepakai.
        const catalogTemplateId =
          typeof (config as Record<string, unknown>).catalog_template_id === "string"
            ? ((config as Record<string, unknown>).catalog_template_id as string)
            : null;
        const templateSections =
          (BUILT_IN_CATALOG.find((t) => t.id === catalogTemplateId)?.data?.sections ??
            (config as Record<string, unknown>).template_sections ??
            []) as unknown[];
        const pageSections =
          savedPageSections.length > 0 ? savedPageSections : templateSections;
        loadConfig({
          // Layout per-halaman; global (header/footer/style) dari website.
          core: config.core,
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
        // Katalog statis adalah satu-satunya sumber template (tanpa fetch
        // library). Urutan: nama API -> kategori -> template_id tersimpan
        // (normalisasi prefix legacy) -> template pertama.
        const rawTemplateId =
          typeof cfgJson.data.template_id === "string" ? cfgJson.data.template_id : "";
        const normalizedId = rawTemplateId ? resolveTemplateId(rawTemplateId) : "";
        const templateId =
          templateIdForApiName(cfgJson.data.template_name, BUILT_IN_TEMPLATES_FOR_LOOKUP) ??
          getTemplateIdByCategory(cfgJson.data.template_name as BusinessCategory) ??
          (normalizedId && getTemplateByIdSafe(normalizedId) ? normalizedId : null) ??
          BUILT_IN_CATALOG[0]?.id ??
          null;
        const templateStore = useTemplateStore.getState();
        if (templateId) templateStore.setTemplate(templateId);
        const seedTemplate: Template | undefined =
          templateId ? getTemplateByIdSafe(templateId) : undefined;
        if (seedTemplate) {
          libMetaRef.current = { id: seedTemplate.id, source: "builtin" };
          const cfgRec = config as Record<string, unknown>;
          const storedHeader = cfgRec.header as Record<string, unknown> | undefined;
          const storedFooter = cfgRec.footer as Record<string, unknown> | undefined;
          const headerVariantId =
            seedTemplate.headers.find((h) => h.id === storedHeader?.variant)?.id ??
            seedTemplate.headers[0]?.id ??
            "";
          const footerVariantId =
            seedTemplate.footers.find(
              (f) => f.id === storedFooter?.variant || f.id === storedFooter?.style,
            )?.id ??
            seedTemplate.footers[0]?.id ??
            "";
          useTemplateStore.setState({
            template: seedTemplate,
            headerVariantId,
            footerVariantId,
            // Warna tema tersimpan hanya hidup di `palette_override`
            // (builder-store). Tanpa mirror ke `themeOverride` di sini, kanvas
            // masih benar karena `paletteOverride` ikut di-merge, TAPI
            // StyleSelector menghitung "N diubah" dari `themeOverride` — jadi
            // panel Tema tampak kosong padahal warnanya sudah tersimpan.
            // Efek sampingnya: preset warna aktif tidak terdeteksi.
            themeOverride: (cfgRec.palette_override ?? {}) as Record<string, string>,
            ...(typeof cfgRec.customCss !== "string" || !cfgRec.customCss
              ? { customCss: (seedTemplate as { customCss?: string }).customCss ?? "" }
              : {}),
            ...(!Array.isArray(cfgRec.animations) || cfgRec.animations.length === 0
              ? { animations: seedTemplate.animations ?? [] }
              : {}),
            ...(!Array.isArray(cfgRec.behaviours) || cfgRec.behaviours.length === 0
              ? { behaviours: seedTemplate.behaviours ?? [] }
              : {}),
            ...(!Array.isArray(cfgRec.assets) || cfgRec.assets.length === 0
              ? { assets: seedTemplate.assets ?? [] }
              : {}),
          });
        }
        // Seed hanya bila template punya headers+footers (resolveChromeConfig
        // membaca .id varian pertama; array kosong = crash). Kanvas tetap
        // dimuat dari sections halaman tersimpan walau seed dilewati.
        const hasUsableChrome =
          !!seedTemplate &&
          Array.isArray(seedTemplate.headers) &&
          seedTemplate.headers.length > 0 &&
          Array.isArray(seedTemplate.footers) &&
          seedTemplate.footers.length > 0;
        if (seedTemplate && hasUsableChrome) {
          templateStore.replaceSections(seedTemplateSections(seedTemplate, pageSections as never));
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
  }, [loadConfig]);

  /** Simpan: layout -> halaman, header/footer/style -> global website.
   *  `opts.saveAsTemplate` menyalin config ke library alih-alih menimpa
   *  template aktif (lihat 045 + helper `saveAsLibraryTemplate`). */
  const handleSavePage = useCallback(async (opts?: { saveAsTemplate?: boolean; libraryName?: string }) => {
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
    // Single-page: sections halaman = sections global, keduanya satu config.
    const customConfig = buildWebsiteCustomConfig({
      base: global as Record<string, unknown>,
      sections: liveSections as never,
      header: { ...chromeHeader.config, variant: chromeHeader.variantId },
      footer: { ...chromeFooter.config, variant: chromeFooter.variantId, style: chromeFooter.variantId },
      paletteOverride: s.paletteOverride,
      typographyOverride: s.typographyOverride as Record<string, string>,
      animations: t.animations as unknown[],
      behaviours: t.behaviours as unknown[],
      assets: t.assets as unknown[],
      // Persist CSS efektif (template bawaan bila simpanan belum punya).
      // Tanpa ini customCss hilang saat save pertama dan tak pernah kembali.
      customCss: t.customCss,
      seo: s.seo,
      core: (s.core ?? {}) as unknown as Record<string, unknown>,
    });
    // ID template yang dikirim = template AKTIF SAAT INI dari template-store.
    // `libMetaRef` hanya diisi saat load sehingga BASI setelah user ganti
    // template via galeri — inilah yang membuat Tayangkan mengembalikan
    // live ke template lama (kasus nyata: food kembali jadi emerald).
    // Fallback ke libMeta untuk data lama yang store-nya masih kosong.
    const libMeta = libMetaRef.current;
    const activeTemplateId =
      resolveTemplateId(typeof t.template?.id === "string" ? t.template.id : "") ||
      libMeta?.id ||
      "";
    // TIDAK mengirim `is_published` sama sekali. Builder tidak punya konsep
    // draft: "Simpan" hanya menulis ke library, jadi live site tidak boleh
    // tersentuh. Server mempertahankan status yang ada (lihat
    // `resolveNextIsPublished`). Hanya tombol "Tayangkan" yang menayangkannya.
    const saveAsTemplate = opts?.saveAsTemplate === true;
    const globalRes = await fetch(`/api/websites/${websiteId}/website`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        custom_config: customConfig,
        ...(saveAsTemplate
          ? { save_as_template: true, library_name: opts?.libraryName ?? "" }
          : {}),
        template_id: activeTemplateId,
        ...(libMeta ? { template_source: libMeta.source } : {}),
      }),
    });
    const globalJson = await globalRes.json();
    if (!globalJson.success) throw new Error(globalJson.error ?? "Gagal menyimpan");
    // "Simpan sebagai template" SEKARANG memindahkan kanvas ke baris baru:
    // slug dari respons disimpan agar Tayangkan berikutnya mengupdate baris
    // ini (bukan membuat lagi). Template aktif tetap tidak tersentuh, jadi
    // `globalRef`/status tayang tetap tidak boleh ditimpa di sini.
    //
    // Cabang di bawah tetap dijaga untuk panggilan tanpa flag: kalau ada
    // payload yang benar-benar menimpa template aktif, `globalRef` harus ikut
    // disegarkan agar publish berikutnya tidak memakai base basi.
    if (saveAsTemplate) {
      const newSlug = (globalJson.data as { library?: { template_slug?: unknown } })
        ?.library?.template_slug;
      if (typeof newSlug === "string" && newSlug.length > 0) {
        activeLibraryRef.current = newSlug;
      }
    } else {
      globalRef.current = globalJson.data.custom_config;
      // Segarkan status tayang dari respons server. Tanpa ini badge di topbar
      // menampilkan nilai basi setelah Simpan/Tayangkan.
      setIsPublished(globalJson.data.custom_config?.is_published === true);
    }
    // Sinkronkan kembali builder-store (sumber payload bottom-bar/topbar)
    // dengan konten live agar indikator sesudah-save konsisten.
    useBuilderStore.setState({ sections: liveSections as never, saved: true });
    useTemplateStore.setState({ saved: true });
  }, [websiteId]);

  const handlePublishPage = useCallback(async () => {
    if (!websiteId) throw new Error("Website belum siap");
    // Tidak memanggil handleSavePage() lagi: "Simpan" sekarang hanya menulis ke
    // library, sehingga memanggilnya di sini tidak ada gunanya. Satu PUT ini
    // menimpa template aktif sekaligus menayangkannya.
    const s = useBuilderStore.getState();
    const t = useTemplateStore.getState();
    const libMeta = libMetaRef.current;
    // Sama seperti jalur Simpan: ID dari template-store aktif, bukan
    // snapshot load (lihat komentar di handleSavePage).
    const activeTemplateId =
      resolveTemplateId(typeof t.template?.id === "string" ? t.template.id : "") ||
      libMeta?.id ||
      "";
    const global = globalRef.current ?? {};
    const liveSections = t.sections.map((sec) => instanceToBuilderSection(sec));
    // Chrome WAJIB dari template-store (sumber kanvas) — bukan builder-store
    // generik. Tanpa ini live header/footer kembali ke default lama walau
    // kanvas menampilkan chrome template (kasus nyata: template emerald).
    // Sama persis dengan jalur Simpan di atas.
    const template = t.template;
    const pubHeader =
      t.headerConfig && Object.keys(t.headerConfig).length > 0
        ? t.headerConfig
        : resolveChromeConfig(template, (s.header ?? {}) as unknown as Record<string, unknown>, 'header').config;
    const pubFooter =
      t.footerConfig && Object.keys(t.footerConfig).length > 0
        ? t.footerConfig
        : resolveChromeConfig(template, (s.footer ?? {}) as unknown as Record<string, unknown>, 'footer').config;
    // Publish = satu-satunya halaman jadi tayang (lihat 044).
    // `buildWebsiteCustomConfig` menyalin `base`, jadi is_published dari
    // config tersimpan ikut terbawa; di-set eksplisit agar pasti true.
    const customConfig = {
      ...buildWebsiteCustomConfig({
        base: global as Record<string, unknown>,
        sections: liveSections as never,
        header: { ...pubHeader, variant: t.headerVariantId },
        footer: { ...pubFooter, variant: t.footerVariantId, style: t.footerVariantId },
        paletteOverride: s.paletteOverride,
        typographyOverride: s.typographyOverride as Record<string, string>,
        animations: t.animations as unknown[],
        behaviours: t.behaviours as unknown[],
        assets: t.assets as unknown[],
        customCss: t.customCss,
        seo: s.seo,
        core: (s.core ?? {}) as unknown as Record<string, unknown>,
      }),
      is_published: true,
    };
    const res = await fetch(`/api/websites/${websiteId}/website`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        custom_config: customConfig,
        template_id: activeTemplateId,
        ...(libMeta ? { template_source: libMeta.source } : {}),
        // Aturan: Tayangkan TIDAK PERNAH membuat baris library baru.
        // Tanpa baris aktif → cukup upsert template aktif.
        ...(activeLibraryRef.current
          ? { sync_library: 'update', library_slug: activeLibraryRef.current }
          : {}),
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Gagal publish halaman");
    globalRef.current = json.data.custom_config;
    // Server bisa fallback membuat baris baru (baris lama terhapus) — kanvas
    // pindah mengikuti slug di respons.
    const syncedSlug = (json.data as { library?: { template_slug?: unknown } })
      ?.library?.template_slug;
    if (typeof syncedSlug === "string" && syncedSlug.length > 0) {
      activeLibraryRef.current = syncedSlug;
    }
    // Badge Tayang/Draft di topbar harus langsungsinkron setelah publish.
    setIsPublished(true);
  }, [websiteId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-0 w-full bg-gradient-to-br from-slate-50 via-emerald-50/40 to-amber-50/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 overflow-hidden">
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
            <p className="text-center text-sm font-bold text-emerald-700">Menyiapkan kanvas tokomu…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !websiteId) {
    return (
      <div className="flex items-center justify-center h-full min-h-0 bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 p-4">
        <div className="text-center max-w-md w-full rounded-3xl border border-amber-200/70 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <Store className="w-12 h-12 mx-auto mb-3 text-emerald-400 dark:text-emerald-500" />
          <h1 className="font-extrabold text-lg">Ups, halaman belum bisa dibuka</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{error || "Halaman tidak ditemukan"}</p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button asChild className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold">
              <Link href="/dashboard/web-design">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Desain Website
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
    />
  );
}
