"use client";

/**
 * Sprint 05 Tahap 1 — Halaman domain 2 tab:
 * [Beli Baru] search TLD + beli (SIMULASI) + auto-connect + riwayat order
 * [Domain Sendiri] subdomain + custom domain manual (yang sudah ada)
 * Masuk halaman = website aktif; semua API ikut website aktif.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Search, ShoppingCart } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { rootHost } from "@/lib/urls";

interface DomainState {
  website_id: string;
  website_name: string;
  has_subdomain: boolean;
  subdomain: string | null;
  subdomain_url: string | null;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  status: "none" | "subdomain" | "custom_pending" | "custom_verified";
  full_url: string | null;
}

interface DnsInstruction {
  type: string;
  name: string;
  value: string;
  description: string;
}

interface SearchResult {
  domain: string;
  tld: string;
  available: boolean;
  price_yearly: number;
  buyable: boolean;
  requirement: string | null;
}

interface DomainOrder {
  id: string;
  domain: string;
  price_yearly: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

function rp(n: number): string {
  return `Rp${n.toLocaleString("id-ID")}/thn`;
}

export default function WebsiteDomainPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = use(params);
  const { t, tr } = useLang();
  const [tab, setTab] = useState<"buy" | "own">("buy");
  const [domain, setDomain] = useState<DomainState | null>(null);
  const [subInput, setSubInput] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [dns, setDns] = useState<{ code: string; instructions: DnsInstruction[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"sub" | "custom" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // Beli domain
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [orders, setOrders] = useState<DomainOrder[]>([]);

  async function muat() {
    try {
      const res = await fetch("/api/user/domain-status");
      const json = await res.json();
      if (json.success) {
        setDomain(json.data);
        setSubInput(json.data.subdomain ?? "");
      }
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setLoading(false);
    }
  }

  async function muatOrders() {
    try {
      const res = await fetch("/api/domains/order");
      const json = await res.json();
      if (json.success) setOrders(json.data.orders);
    } catch {
      /* riwayat opsional */
    }
  }

  useEffect(() => {
    (async () => {
      await fetch(`/api/websites/${websiteId}/activate`, { method: "POST" });
      await muat();
      await muatOrders();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId]);

  async function cari(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.success) setResults(json.data.results);
      else setMsg({ ok: false, text: json.error ?? t("common.networkError") });
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setSearching(false);
    }
  }

  async function beli(domainName: string) {
    setBuying(domainName);
    setMsg(null);
    try {
      const res = await fetch("/api/domains/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domainName }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
        return;
      }
      setMsg({ ok: true, text: json.message });
      await muat();
      await muatOrders();
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setBuying(null);
    }
  }

  async function simpanSubdomain() {
    setBusy("sub");
    setMsg(null);
    try {
      const res = await fetch("/api/user/subdomain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: subInput.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
        return;
      }
      setMsg({ ok: true, text: t("domain.subOk") });
      muat();
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setBusy(null);
    }
  }

  async function simpanCustom() {
    setBusy("custom");
    setMsg(null);
    setDns(null);
    try {
      const res = await fetch("/api/user/custom-domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: customInput.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
        return;
      }
      setDns({ code: json.data.verification_code, instructions: json.data.dns_instructions });
      setMsg({ ok: true, text: t("domain.savedMsg") });
      muat();
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p className="text-gray-500 p-4">{t("domain.loading")}</p>;

  const stLabel = (s: DomainState["status"]): string => {
    const m = tr("domain.status") as Record<string, string>;
    return m[s] ?? s;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm flex-wrap">
          <Link href="/websites" className="text-primary-600 hover:underline">
            {t("workspace.back")}
          </Link>
          <span className="text-gray-400">/</span>
          <Link href={`/websites/${websiteId}`} className="text-primary-600 hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {domain?.website_name ?? "-"}
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">{t("domain.title")}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{t("domain.title")}</h1>
        <p className="text-gray-500">{t("domain.subtitle", { name: domain?.website_name ?? "-" })}</p>
      </div>

      {/* Status */}
      <div className="border rounded-xl bg-white p-4">
        <p className="text-sm text-gray-500">{t("domain.statusLabel")}</p>
        <p className="font-semibold">{domain ? stLabel(domain.status) : "-"}</p>
        {domain?.full_url ? (
          <a href={domain.full_url} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm text-green-700 hover:underline">
            <ExternalLink className="h-4 w-4" /> {domain.full_url.replace("https://", "")}
          </a>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("buy")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "buy" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          🛒 Beli Domain Baru
        </button>
        <button
          onClick={() => setTab("own")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === "own" ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          Punya Domain Sendiri
        </button>
      </div>

      {msg ? (
        <div className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      ) : null}

      {tab === "buy" ? (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            🧪 Mode simulasi: checkout & registrasi diproses instan tanpa registrar & tanpa bayar.
            Domain yang dibeli otomatis tersambung (verified) ke website ini.
          </div>
          <form onSubmit={cari} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="tokoku"
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={searching || q.trim().length < 2}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {searching ? "..." : "Cek"}
            </button>
          </form>

          {results.map((r) => (
            <div key={r.domain} className="border rounded-xl bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold">{r.domain}</p>
                <p className="text-sm text-gray-500">
                  {rp(r.price_yearly)}
                  {!r.available ? " • sudah dipakai" : ""}
                  {r.requirement ? ` • ${r.requirement}` : ""}
                </p>
              </div>
              {!r.available ? (
                <span className="text-sm text-gray-400">Tidak tersedia</span>
              ) : !r.buyable ? (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">Segera hadir</span>
              ) : (
                <button
                  onClick={() => beli(r.domain)}
                  disabled={buying === r.domain}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {buying === r.domain ? "..." : `Beli ${rp(r.price_yearly)}`}
                </button>
              )}
            </div>
          ))}

          {orders.length > 0 ? (
            <div className="border rounded-xl bg-white p-4">
              <h2 className="font-semibold mb-2">Riwayat pembelian</h2>
              <div className="space-y-1 text-sm">
                {orders.map((o) => (
                  <div key={o.id} className="flex justify-between gap-2">
                    <span className="font-medium">{o.domain}</span>
                    <span className="text-gray-500">
                      {rp(o.price_yearly)} • {o.status}
                      {o.expires_at ? ` • s/d ${new Date(o.expires_at).toLocaleDateString("id-ID")}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Subdomain */}
          <div className="border rounded-xl bg-white p-4 space-y-3">
            <h2 className="font-semibold">{t("domain.subTitle")}</h2>
            <div className="flex gap-2">
              <input value={subInput} onChange={(e) => setSubInput(e.target.value)}
                placeholder="warung-bu-toni" minLength={3} maxLength={50}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={simpanSubdomain} disabled={busy === "sub"}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {busy === "sub" ? t("common.saving") : t("domain.subSave")}
              </button>
            </div>
            <p className="text-xs text-gray-400">{t("domain.subHint", { root: rootHost() })}</p>
          </div>

          {/* Custom domain */}
          <div className="border rounded-xl bg-white p-4 space-y-3">
            <h2 className="font-semibold">{t("domain.customTitle")}</h2>
            <div className="flex gap-2">
              <input value={customInput} onChange={(e) => setCustomInput(e.target.value)}
                placeholder="tokoku.com"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <button onClick={simpanCustom} disabled={busy === "custom"}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                {busy === "custom" ? t("common.saving") : t("domain.verifyBtn")}
              </button>
            </div>
            {domain?.custom_domain ? (
              <p className="text-xs text-gray-500">
                {t("domain.customTitle")}: <b>{domain.custom_domain}</b> — {domain.custom_domain_verified ? t("domain.verified") : t("domain.pending")}
              </p>
            ) : null}
            {dns ? (
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                <p className="font-medium">{t("domain.dnsTitle")}</p>
                {dns.instructions.map((d, i) => (
                  <div key={i} className="font-mono text-xs bg-white border rounded p-2">
                    <p><b>{d.type}</b> {d.name}</p>
                    <p className="break-all">= {d.value}</p>
                    <p className="font-sans text-gray-500">{d.description}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}