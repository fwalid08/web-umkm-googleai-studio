"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Plus,
  ExternalLink,
  ShoppingBag,
  Palette,
  Globe,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";
import { websiteStatus } from "@/lib/websites/status";

interface Website {
  id: string;
  name: string;
  business_type?: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  current_template_id?: string | null;
}

export default function DashboardStoresPage() {
  const router = useRouter();
  const { t } = useLang();
  const [sites, setSites] = useState<Website[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [max, setMax] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [bizType, setBizType] = useState<string>("food");
  const [busy, setBusy] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/websites");
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      setSites(json.data.websites);
      setActiveId(json.data.active_website_id);
      setCount(json.data.count);
      setMax(json.data.max);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function activateStore(id: string) {
    if (id === activeId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/websites/${id}/activate`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActiveId(id);
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  async function createStore(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    setLimitHit(false);
    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          business_type: bizType,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        setLimitHit(!!json.upgrade_url);
        return;
      }
      setName("");
      await load();
      window.location.reload();
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Memuat daftar toko...</p>
        </div>
      </div>
    );
  }

  const isFull = count >= max;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Kelola Toko & Cabang
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Atur semua website toko online milik Anda dalam satu akun dashboard.
          </p>
        </div>

        {/* Quota Indicator */}
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Kapasitas Toko:</span>
            <span className="font-bold text-gray-900 font-mono">
              {count} / {max} Toko
            </span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${Math.min(100, (count / Math.max(max, 1)) * 100)}%` }}
            />
          </div>
          {isFull && (
            <Link
              href="/dashboard/settings/billing"
              className="text-[11px] font-semibold text-emerald-700 hover:underline block text-right pt-0.5"
            >
              Tambah kuota toko →
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs flex items-center justify-between">
          <span>{error}</span>
          {limitHit && (
            <Link
              href="/dashboard/settings/billing"
              className="font-bold text-red-800 underline underline-offset-2 ml-2"
            >
              Upgrade Paket
            </Link>
          )}
        </div>
      )}

      {/* Store Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sites.map((site) => {
          const isActive = site.id === activeId;
          const liveUrl = tenantUrl(site.subdomain);
          const isPublished = websiteStatus(site) === "publish";

          return (
            <div
              key={site.id}
              className={`rounded-2xl bg-white p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? "border-2 border-emerald-600 shadow-md ring-4 ring-emerald-50"
                  : "border border-gray-200 hover:border-gray-300 shadow-2xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base ${
                        isActive
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 leading-tight">
                        {site.name}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5 truncate max-w-[170px]">
                        {tenantDisplay(site.subdomain)}
                      </p>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      Aktif
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => activateStore(site.id)}
                      className="text-[11px] font-semibold text-gray-600 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                    >
                      Pilih Toko
                    </button>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Status Toko:</span>
                  <span
                    className={`font-semibold ${
                      isPublished ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {isPublished ? "● Live Siap Jual" : "○ Draft Tampilan"}
                  </span>
                </div>

                {site.custom_domain && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Domain:</span>
                    <span className="font-medium text-gray-800 font-mono">
                      {site.custom_domain}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <Link
                  href={`/dashboard/${site.id}/builder`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-800 transition-colors"
                >
                  <Palette className="w-3.5 h-3.5 text-gray-500" />
                  <span>Desain Toko</span>
                </Link>

                {liveUrl ? (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition-colors"
                  >
                    <span>Buka Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    href={`/dashboard/${site.id}/builder`}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-50 text-xs font-semibold text-gray-600"
                  >
                    Atur
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Store Form */}
      <Card className="border-gray-200/90 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" />
            <span>Tambah Toko / Cabang Baru</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isFull ? (
            <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100">
              <p>
                Kuota toko pada paket Anda sudah maksimal ({max} toko). Upgrade ke paket Starter atau
                Growth untuk menambah hingga 10 toko baru.
              </p>
              <Link
                href="/dashboard/settings/billing"
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold whitespace-nowrap hover:bg-emerald-700 shadow-2xs text-center"
              >
                Lihat Paket & Upgrade
              </Link>
            </div>
          ) : (
            <form onSubmit={createStore} className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nama Toko Baru:
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Warung Cabang Dago, Hijab Store 2"
                    required
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kategori Bisnis:
                  </label>
                  <select
                    value={bizType}
                    onChange={(e) => setBizType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="food">🍽️ Kuliner & Minuman</option>
                    <option value="fashion">👗 Fashion & Hijab</option>
                    <option value="retail">🏪 Toko Retail / Kelontong</option>
                    <option value="handicraft">🏺 Kerajinan Tangan</option>
                    <option value="services">💼 Jasa & Servis</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={busy || !name.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all disabled:opacity-50"
                >
                  {busy ? "Membuat Toko..." : "+ Buat Toko Sekarang"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
