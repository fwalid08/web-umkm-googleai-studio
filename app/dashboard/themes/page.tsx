"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Palette,
  Check,
  Lock,
  Sparkles,
  ArrowRight,
  Eye,
  ExternalLink,
  Store,
  Layers,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantUrl, tenantDisplay } from "@/lib/urls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
  description: string;
  color_palette: { primary?: string; background?: string; text?: string };
  sections_config: { id: string }[];
  locked: boolean;
}

interface Site {
  id: string;
  name: string;
  subdomain: string;
  template_id?: string;
}

export default function ThemesPage() {
  const router = useRouter();
  const { t } = useLang();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeSite, setActiveSite] = useState<Site | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const [wRes, tRes] = await Promise.all([
          fetch("/api/websites"),
          fetch("/api/templates"),
        ]);
        const wJson = await wRes.json();
        const tJson = await tRes.json();

        if (wJson.success && wJson.data.websites?.length > 0) {
          const list = wJson.data.websites as Site[];
          const site =
            list.find((s) => s.id === wJson.data.active_website_id) ?? list[0];
          setActiveSite(site);

          if (site) {
            const detailRes = await fetch(`/api/websites/${site.id}/website`).catch(() => null);
            if (detailRes && detailRes.ok) {
              const detailJson = await detailRes.json();
              if (detailJson.success && !detailJson.data.is_default) {
                setCurrentTemplateId(detailJson.data.template_id);
              }
            }
          }
        }

        if (tJson.success) {
          setTemplates(tJson.data.templates);
          setTier(tJson.data.tier ?? "free");
        }
      } catch {
        setError(t("common.networkError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  async function applyTheme(tmpl: Template) {
    if (tmpl.locked || !activeSite) return;
    setBusyId(tmpl.id);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/websites/${activeSite.id}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: tmpl.id,
          custom_config: { sections: tmpl.sections_config.map((s) => ({ id: s.id })) },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      setCurrentTemplateId(tmpl.id);
      setSuccessMsg(`Tema "${tmpl.name}" berhasil diterapkan ke toko Anda!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusyId(null);
    }
  }

  const categoryMap: Record<string, string> = {
    food: "Kuliner & Cafe",
    fashion: "Fashion & Hijab",
    retail: "Retail & Kelontong",
    handicraft: "Kerajinan Tangan",
    services: "Jasa & Servis",
  };

  const filteredTemplates = templates.filter((tpl) => {
    if (filter === "all") return true;
    return tpl.name.toLowerCase().includes(filter);
  });

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto" aria-label="Memuat katalog tema toko">
        <Skeleton className="h-10 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const storeLiveUrl = activeSite?.subdomain ? tenantUrl(activeSite.subdomain) : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Pilihan Tema Toko
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Pilih konsep tampilan toko yang siap pakai sesuai jenis bisnis Anda. Ganti tema kapan
            pun tanpa menghapus produk atau data pesanan.
          </p>
        </div>

        {/* Store Context Button */}
        {activeSite && (
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3.5 py-2 rounded-2xl shrink-0">
            <Store className="w-4 h-4 text-emerald-700" />
            <div className="text-sm">
              <span className="text-gray-500 font-medium">Toko: </span>
              <span className="font-bold text-gray-900 dark:text-white">{activeSite.name}</span>
            </div>
            {storeLiveUrl && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-7 w-7 text-emerald-700 hover:text-emerald-900"
                title="Lihat website toko"
              >
                <a
                  href={storeLiveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Lihat website toko"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm flex items-center justify-between font-medium">
          <span>{successMsg}</span>
          <Link
            href="/dashboard/web-design"
            className="text-sm font-bold underline underline-offset-2 hover:text-emerald-950 ml-3"
          >
            Lanjut Desain →
          </Link>
        </div>
      )}

      {/* Active Theme Highlight Banner */}
      {currentTemplateId && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Tema Aktif Saat Ini
              </p>
              <h3 className="text-base font-bold text-gray-900 dark:text-white capitalize">
                {templates.find((t) => t.id === currentTemplateId)?.name ?? "Tema Kustom"}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="gap-1.5">
              <Link href="/dashboard/websites">
                <Palette className="w-3.5 h-3.5" />
                <span>Buka Desain</span>
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="rounded-full whitespace-nowrap"
        >
          Semua Tema ({templates.length})
        </Button>
        {["food", "fashion", "retail", "handicraft", "services"].map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat)}
            className="rounded-full whitespace-nowrap capitalize"
          >
            {categoryMap[cat] || cat}
          </Button>
        ))}
      </div>

      {/* Template Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          const isCurrent = template.id === currentTemplateId;
          const primary = template.color_palette?.primary || "#15803D";
          const bg = template.color_palette?.background || "#FFFFFF";
          const isBusy = busyId === template.id;

          return (
            <Card
              key={template.id}
              className={`flex flex-col justify-between overflow-hidden transition-all p-0 ${
                isCurrent
                  ? "border-2 border-emerald-600 shadow-md ring-4 ring-emerald-50"
                  : "hover:shadow-sm"
              }`}
            >
              {/* Preview Window Card */}
              <div
                className="h-44 p-4 flex flex-col justify-between relative"
                style={{ backgroundColor: bg }}
              >
                {/* Decorative Mock Wireframe of Store Header & Hero */}
                <div className="w-full bg-white/90 backdrop-blur-xs rounded-xl p-2.5 shadow-2xs border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md" style={{ backgroundColor: primary }} />
                    <div className="w-16 h-2 bg-gray-200 rounded" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-6 h-2 bg-gray-200 rounded" />
                    <div className="w-6 h-2 bg-gray-200 rounded" />
                  </div>
                </div>

                <div className="space-y-1.5 my-auto text-center px-4">
                  <div
                    className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center font-bold text-white shadow-xs"
                    style={{ backgroundColor: primary }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 capitalize">{template.name}</h4>
                  <div className="flex items-center justify-center gap-1 pt-0.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white shadow-2xs"
                      style={{ backgroundColor: primary }}
                      title="Warna Utama"
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300 shadow-2xs"
                      style={{ backgroundColor: bg }}
                      title="Warna Latar"
                    />
                    <span className="text-xs text-gray-500 font-mono ml-1">
                      {template.sections_config?.length ?? 5} Seksi Blok
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  {isCurrent ? (
                    <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white">
                      <Check className="w-3 h-3" />
                      <span>Sedang Digunakan</span>
                    </Badge>
                  ) : template.locked ? (
                    <Badge variant="warning" className="gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Paket Starter+</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Tersedia Gratis
                    </Badge>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <CardContent className="p-4 border-t border-gray-100 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white capitalize">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {template.description ||
                      "Template responsif mobile-first dirancang untuk konversi penjualan cepat via WhatsApp."}
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                  {isCurrent ? (
                    <Button asChild size="sm" className="flex-1 gap-1.5">
<Link href="/dashboard/web-design">
                        <Palette className="w-3.5 h-3.5" />
                        <span>Edit Tampilan</span>
                      </Link>
                    </Button>
                  ) : template.locked ? (
                    <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100">
                      <Link href="/dashboard/billing">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Upgrade untuk Membuka</span>
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isBusy}
                      onClick={() => applyTheme(template)}
                      className="flex-1"
                    >
                      {isBusy ? "Menerapkan..." : "Terapkan Tema Ini"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
