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
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-xs text-gray-500">Memuat daftar toko...</p>
        </div>
      </div>
    );
  }

  const isFull = count >= max;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Website saya
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Atur semua website toko online milik Anda dalam satu akun dashboard.
          </p>
        </div>

        {/* Quota Indicator */}
        <Card className="min-w-[200px]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 font-medium">Kapasitas Toko</span>
              <Badge variant="outline" className="font-mono">
                {count} / {max}
              </Badge>
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
                className="text-[11px] font-semibold text-emerald-700 hover:underline block text-right pt-2"
              >
                Tambah kuota toko →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs text-red-700">{error}</span>
            {limitHit && (
              <Link
                href="/dashboard/settings/billing"
                className="font-bold text-red-800 underline underline-offset-2 ml-2 text-xs"
              >
                Upgrade Paket
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Store Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sites.map((site) => {
          const isActive = site.id === activeId;
          const liveUrl = tenantUrl(site.subdomain);
          const isPublished = websiteStatus(site) === "publish";

          return (
            <Card
              key={site.id}
              className={`flex flex-col justify-between transition-all ${
                isActive
                  ? "border-2 border-emerald-600 shadow-md ring-4 ring-emerald-50"
                  : "border-gray-200 hover:border-gray-300 shadow-sm"
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
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
                      <Badge className="text-[11px] shrink-0" variant="success">
                        Aktif
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => activateStore(site.id)}
                        className="text-[11px] shrink-0"
                      >
                        Pilih Toko
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status Toko:</span>
                    <Badge
                      variant={isPublished ? "success" : "warning"}
                      className="gap-1"
                    >
                      {isPublished ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Live Siap Jual
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Draft Tampilan
                        </>
                      )}
                    </Badge>
                  </div>

                  {site.custom_domain && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Domain:</span>
                      <span className="font-medium text-gray-800 font-mono">
                        {site.custom_domain}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add New Store Form */}
      <Card className="border-gray-200/90 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-emerald-600" />
            <span>Tambah Toko / Cabang Baru</span>
          </CardTitle>
          <CardDescription>
            Buat toko cabang baru dengan nama dan kategori bisnis sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFull ? (
            <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100">
              <p>
                Kuota toko pada paket Anda sudah maksimal ({max} toko). Upgrade ke paket Starter atau
                Growth untuk menambah hingga 10 toko baru.
              </p>
              <Button asChild size="sm">
                <Link href="/dashboard/settings/billing">
                  Lihat Paket & Upgrade
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={createStore} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="store-name">Nama Toko Baru</Label>
                  <Input
                    id="store-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Warung Cabang Dago, Hijab Store 2"
                    required
                    disabled={busy}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-type">Kategori Bisnis</Label>
                  <Select value={bizType} onValueChange={setBizType} disabled={busy}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">🍽️ Kuliner & Minuman</SelectItem>
                      <SelectItem value="fashion">👗 Fashion & Hijab</SelectItem>
                      <SelectItem value="retail">🏪 Toko Retail / Kelontong</SelectItem>
                      <SelectItem value="handicraft">🏺 Kerajinan Tangan</SelectItem>
                      <SelectItem value="services">💼 Jasa & Servis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={busy || !name.trim()} className="gap-2">
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membuat Toko...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Buat Toko Sekarang
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}