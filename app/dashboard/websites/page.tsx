"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  ExternalLink,
  Palette,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  template_slug?: string | null;
  current_template_id?: string | null;
}

export default function DashboardWebsitesPage() {
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
      <div className="space-y-6 max-w-6xl mx-auto" aria-label="Memuat daftar website">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-24 w-full sm:w-52" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Website Saya
          </h1>
          <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">
            Atur semua website toko online milik Anda dalam satu akun dashboard.
          </p>
        </div>

        {/* Quota Indicator */}
        <Card className="w-full sm:w-60 shrink-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500 font-medium dark:text-slate-400">Kapasitas Toko</span>
              <Badge variant="outline" className="font-mono">
                {count} / {max}
              </Badge>
            </div>
            <Progress value={Math.min(100, (count / Math.max(max, 1)) * 100)} className="h-2" aria-label={`Kapasitas toko ${count} dari ${max}`} />
            {isFull && (
              <Link
                href="/dashboard/billing"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline block text-right pt-2 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Tambah kuota toko →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card role="alert" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            {limitHit && (
              <Button asChild size="sm" variant="destructive" className="shrink-0">
                <Link href="/dashboard/billing">
                  Upgrade Paket
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!error && sites.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto dark:bg-emerald-900/30 dark:text-emerald-400">
              <Store className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto">
              <p className="text-base font-bold text-gray-900 dark:text-white">Belum ada website</p>
              <p className="text-sm text-gray-500 mt-1 dark:text-slate-400">
                Buat website toko pertama Anda lewat form di bawah — gratis dan langsung online.
              </p>
            </div>
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
                  ? "border-emerald-600 shadow-md ring-2 ring-emerald-100 dark:ring-emerald-900/50"
                  : "hover:shadow-sm dark:hover:border-slate-700"
              }`}
            >
              <CardContent className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight truncate">
                          {site.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate dark:text-slate-500">
                          {tenantDisplay(site.subdomain)}
                        </p>
                      </div>
                    </div>

                    {isActive ? (
                      <Badge className="text-xs shrink-0" variant="success">
                        Aktif
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => activateStore(site.id)}
                        className="text-xs shrink-0"
                      >
                        Pilih Toko
                      </Button>
                    )}
                  </div>

                  <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between text-xs dark:border-slate-800">
                    <span className="text-gray-500 dark:text-slate-400">Status Toko:</span>
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
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs dark:border-slate-800">
                      <span className="text-gray-500 shrink-0 dark:text-slate-400">Domain:</span>
                      <span className="font-medium text-gray-800 font-mono truncate dark:text-slate-200">
                        {site.custom_domain}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 dark:border-slate-800">
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <Link href="/dashboard/websites/customize">
                      <Palette className="w-3.5 h-3.5" />
                      <span>Desain</span>
                    </Link>
                  </Button>

                  {liveUrl ? (
                    <Button size="sm" asChild className="gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 shadow-none dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:border-emerald-800 dark:text-emerald-200">
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Buka Web</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" asChild>
                      <Link href="/dashboard/websites/customize">
                        Atur
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add New Store Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>Tambah Toko / Cabang Baru</span>
          </CardTitle>
          <CardDescription>
            Buat toko cabang baru dengan nama dan kategori bisnis sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFull ? (
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-100 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              <p>
                Kuota toko pada paket Anda sudah maksimal ({max} toko). Upgrade paket untuk
                menambah toko baru.
              </p>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/dashboard/billing">
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