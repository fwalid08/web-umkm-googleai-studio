"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeoConfigPanel } from "@/components/seo/seo-config-panel";
import { useBuilderStore } from "@/lib/builder/store";
import { useTemplateStore } from "@/lib/builder/template-store";
import { toast } from "sonner";

/**
 * Halaman SEO (dashboard, bukan builder).
 *
 * SEO dipindah keluar dari panel builder ke menu sidebar tersendiri karena
 * pengaturan ini bukan bagian dari template — dia milik website, dan tetap
 * relevan meski user sedang tidak designing.
 *
 * Panel-nya (`SeoConfigPanel`) membaca `useBuilderStore().seo`, jadi halaman
 * ini wajib memuat config website lebih dulu — kalau tidak, form akan
 * menampilkan nilai default store dan menimpa meta title yang sebenarnya.
 */
export default function SeoPage() {
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sitesRes = await fetch("/api/websites");
        if (!sitesRes.ok) throw new Error(`HTTP ${sitesRes.status}`);
        const sitesJson = await sitesRes.json();
        const id = sitesJson?.data?.active_website_id as string | undefined;
        if (!id) {
          if (!cancelled) {
            setError("Tidak ada website aktif. Buat website dulu di panel Websites.");
            setLoading(false);
          }
          return;
        }
        if (cancelled) return;
        setWebsiteId(id);

        const cfgRes = await fetch(`/api/websites/${id}/website`);
        if (!cfgRes.ok) throw new Error("Gagal memuat pengaturan SEO");
        const cfgJson = await cfgRes.json();
        if (cancelled) return;
        if (!cfgJson.success) {
          setError(cfgJson.error ?? "Gagal memuat konfigurasi");
          setLoading(false);
          return;
        }
        const config = (cfgJson.data.custom_config ?? {}) as Record<string, unknown>;
        configRef.current = config;
        // Cukup seo + jumlah blok untuk panel. Template tidak dimuat penuh —
        // halaman ini tidak butuh pratinjau kanvas.
        // Catatan: `loadConfig` tidak menerima `seo` (itu perubahan level
        // config global), jadi seo dipasang lewat setState langsung.
        const seo = (config.seo ?? {}) as { title?: string; description?: string };
        useBuilderStore.setState({
          seo: { title: seo.title ?? "", description: seo.description ?? "" },
          saved: true,
        });
        const sections = Array.isArray(config.sections) ? config.sections : [];
        useTemplateStore.setState({ sections: sections as never });
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Gagal memuat halaman");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!websiteId) return;
    setSaving(true);
    try {
      const seo = useBuilderStore.getState().seo;
      const base = configRef.current ?? {};
      const res = await fetch(`/api/websites/${websiteId}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Hanya seo + status tayang yang dikirim. `buildWebsiteCustomConfig`
          // di server menyalin `base` dari config tersimpan, jadi sections/
          // header/footer tidak ikut tertimpa.
          custom_config: {
            ...base,
            seo,
            is_published: base.is_published === true,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Gagal menyimpan SEO");
      configRef.current = json.data.custom_config;
      useBuilderStore.setState({ saved: true });
      toast.success("Pengaturan SEO tersimpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan SEO");
    } finally {
      setSaving(false);
    }
  }, [websiteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Memuat pengaturan SEO…
      </div>
    );
  }

  if (error || !websiteId) {
    return (
      <div className="rounded-3xl border border-amber-200/70 bg-white dark:bg-slate-900 p-8 shadow-xl text-center max-w-md mx-auto">
        <h1 className="font-extrabold text-lg">Belum bisa memuat SEO</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {error ?? "Website tidak ditemukan"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm shrink-0">
          <Search className="w-5 h-5 text-white" />
        </span>
        <div className="min-w-0">
          <h1 className="font-extrabold text-xl">SEO</h1>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
            Judul &amp; deskripsi yang muncul di tab browser dan hasil pencarian Google.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white dark:bg-white/[0.03] p-5 shadow-sm">
        <SeoConfigPanel />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Simpan SEO
        </Button>
      </div>
    </div>
  );
}