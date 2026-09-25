"use client";

/**
 * Sprint 03 US-03 + revisi UX (lensa Bu Toni) — Workspace sebagai HUB:
 * breadcrumb "saya di mana" + preview live wujud website + tombol
 * Lihat Website menonjol + ringkasan angka website ini + 4 menu sebagai
 * list rapi berdeskripsi. Route tidak berubah.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  Globe,
  Palette,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";
import { websiteStatus } from "@/lib/websites/status";

interface Website {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  current_template_id?: string | null;
}

interface DashStats {
  total_orders: number;
  today_orders: number;
  pending_orders: number;
}

export default function WebsiteWorkspacePage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const { t } = useLang();
  const [site, setSite] = useState<Website | null>(null);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Jadikan aktif dulu, lalu ambil detail + ringkasan website aktif
        await fetch(`/api/websites/${websiteId}/activate`, { method: "POST" });
        const res = await fetch(`/api/websites/${websiteId}`);
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? t("workspace.notFound"));
          return;
        }
        setSite(json.data.website);
        try {
          const dRes = await fetch("/api/user/dashboard");
          const dJson = await dRes.json();
          if (dJson.success && dJson.data.website_id === websiteId) {
            setStats({
              total_orders: dJson.data.total_orders ?? 0,
              today_orders: dJson.data.today_orders ?? 0,
              pending_orders: dJson.data.pending_orders ?? 0,
            });
          }
        } catch {
          /* ringkasan opsional — hub tetap berguna tanpa angka */
        }
      } catch {
        setError(t("common.networkError"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId]);

  if (loading) return <p className="text-gray-500 p-4">{t("workspace.loading")}</p>;
  if (error || !site) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error || t("workspace.notFound")}</div>
        <Link href="/websites" className="text-sm text-primary-600 hover:underline">
          ← {t("workspace.back")}
        </Link>
      </div>
    );
  }

  const liveUrl = tenantUrl(site.subdomain);
  const published = websiteStatus(site) === "publish";

  const menus = [
    {
      href: `/websites/${websiteId}/domain`,
      icon: <Globe className="h-5 w-5" />,
      title: t("workspace.mDomain"),
      desc: `${t("domain.subTitle")}: ${site.subdomain ?? "-"}${site.custom_domain ? ` • ${site.custom_domain}${site.custom_domain_verified ? " ✓" : ""}` : ""}`,
    },
    {
      href: `/dashboard/${websiteId}/builder`,
      icon: <Palette className="h-5 w-5" />,
      title: t("workspace.mConfig"),
      desc: t("workspace.mConfigDesc"),
    },
    {
      href: "/dashboard/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
      title: t("workspace.mBusiness"),
      desc: t("workspace.mBusinessDesc"),
    },
    {
      href: "/websites/billing",
      icon: <CreditCard className="h-5 w-5" />,
      title: t("workspace.mBilling"),
      desc: t("workspace.mBillingDesc"),
    },
  ];

  const statItems = stats
    ? [
        { icon: <ShoppingBag className="h-4 w-4" />, label: t("dashboard.statTotal"), value: stats.total_orders },
        { icon: <Clock className="h-4 w-4" />, label: t("dashboard.statToday"), value: stats.today_orders },
        { icon: <Users className="h-4 w-4" />, label: t("dashboard.statNew"), value: stats.pending_orders },
      ]
    : [];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Breadcrumb: saya di mana */}
      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link href="/websites" className="text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {t("workspace.back")}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium truncate">{site.name}</span>
      </nav>

      {/* Header + aksi utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                published
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {published ? t("websites.statusPublish") : t("websites.statusDraft")}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {t("workspace.contextNote", { url: tenantDisplay(site.subdomain) })}
          </p>
        </div>
        {liveUrl ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shrink-0"
          >
            <ExternalLink className="h-4 w-4" /> {t("workspace.viewSite")}
          </a>
        ) : null}
      </div>

      {/* Preview live: mengelola sambil melihat wujudnya */}
      <section className="border rounded-xl bg-white overflow-hidden">
        <p className="px-4 py-3 font-semibold text-sm border-b">{t("workspace.previewTitle")}</p>
        {liveUrl && published ? (
          <iframe
            src={liveUrl}
            title={site.name}
            loading="lazy"
            className="w-full border-0 h-[320px] sm:h-[420px] bg-white"
          />
        ) : (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">{t("workspace.previewEmpty")}</p>
        )}
      </section>

      {/* Ringkasan website ini */}
      {statItems.length > 0 ? (
        <section aria-label={t("workspace.statsTitle")}>
          <p className="font-semibold text-sm mb-2">{t("workspace.statsTitle")}</p>
          <div className="grid grid-cols-3 gap-3">
            {statItems.map((s) => (
              <div key={s.label} className="border rounded-xl bg-white px-3 py-3 text-center">
                <span className="inline-flex p-1.5 bg-primary-50 rounded-lg text-primary-600">{s.icon}</span>
                <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 4 menu sebagai list rapi: apa yang bisa saya lakukan, apa selanjutnya */}
      <section>
        <p className="font-semibold text-sm mb-2">{t("workspace.stepsTitle")}</p>
        <div className="border rounded-xl bg-white divide-y divide-gray-100 overflow-hidden">
          {menus.map((m) => (
            <Link
              key={m.title}
              href={m.href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="p-2 bg-primary-50 rounded-lg text-primary-600 shrink-0">{m.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-medium text-gray-900 text-sm">{m.title}</span>
                <span className="block text-xs sm:text-sm text-gray-500 truncate">{m.desc}</span>
              </span>
              <ChevronRight className="h-5 w-5 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}