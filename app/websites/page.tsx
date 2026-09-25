"use client";

/**
 * Sprint 03 US-01/US-02 + revisi UX (lensa Bu Toni):
 * daftar website kaya konteks — tiap kartu menjawab "sudah live belum,
 * apa yang bisa saya lakukan" via thumbnail + chip status + 3 aksi cepat
 * (Lihat = link publik, Pesanan = activate + /dashboard/orders, Atur = workspace).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { WebsiteCard, type WebsiteCardSite } from "@/components/websites/website-card";

type Website = WebsiteCardSite;

export default function WebsitesPage() {
  const router = useRouter();
  const { t } = useLang();
  const [sites, setSites] = useState<Website[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [max, setMax] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limitHit, setLimitHit] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

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
      // User fresh (website auto, belum pilih template) → onboarding 3 langkah
      const active = json.data.websites.find(
        (w: Website) => w.id === (json.data.active_website_id ?? json.data.websites[0]?.id)
      ) as Website | undefined;
      if (json.data.count === 1 && active && !active.current_template_id) {
        router.push("/onboarding");
        return;
      }
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    setLimitHit(false);
    try {
      const res = await fetch("/api/websites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        setLimitHit(!!json.upgrade_url);
        return;
      }
      setName("");
      router.push(`/websites/${json.data.website.id}`);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  /** Jadikan aktif lalu ke builder website (tanpa mampir workspace). */
  async function atur(id: string) {
    await activateThen(id, `/dashboard/${id}/builder`);
  }

  /** Jadikan aktif lalu langsung ke pesanan website itu (tanpa mampir workspace). */
  async function kePesanan(id: string) {
    await activateThen(id, "/dashboard/orders");
  }

  async function activateThen(id: string, dest: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/websites/${id}/activate`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      router.push(dest);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-gray-500">{t("common.loading")}</p>;

  const full = count >= max;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("websites.title")}</h1>
          <p className="text-gray-500">{t("websites.subtitle", { count, max })}</p>
        </div>
        <div className="h-2 w-40 bg-gray-100 rounded-full overflow-hidden" title={`${count}/${max}`}>
          <div className="h-full bg-primary-600" style={{ width: `${Math.min(100, (count / Math.max(max, 1)) * 100)}%` }} />
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}{" "}
          {limitHit ? (
            <Link href="/dashboard/settings/billing" className="underline font-medium">
              {t("websites.viewPlans")}
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map((s) => (
          <WebsiteCard
            key={s.id}
            site={s}
            isActive={s.id === activeId}
            busy={busy}
            onAtur={atur}
            onPesanan={kePesanan}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> {t("websites.createTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {full ? (
            <p className="text-sm text-gray-500">
              {t("websites.limitFull", { max })}{" "}
              <Link href="/dashboard/settings/billing" className="text-primary-600 underline">
                {t("websites.upgradeLink")}
              </Link>
            </p>
          ) : (
            <form onSubmit={create} className="flex flex-col sm:flex-row gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("websites.createPh")}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={busy || !name.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {busy ? t("websites.creating") : t("websites.createBtn")}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
