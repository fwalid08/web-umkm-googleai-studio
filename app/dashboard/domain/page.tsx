"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  ExternalLink,
  Search,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { rootHost, tenantDisplay } from "@/lib/urls";

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

export default function DashboardDomainPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<"own" | "buy">("own");
  const [domain, setDomain] = useState<DomainState | null>(null);
  const [subInput, setSubInput] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [dns, setDns] = useState<{ code: string; instructions: DnsInstruction[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"sub" | "custom" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Beli domain simulation
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [orders, setOrders] = useState<DomainOrder[]>([]);

  async function loadDomain() {
    try {
      const res = await fetch("/api/user/domain-status");
      const json = await res.json();
      if (json.success && json.data) {
        setDomain(json.data);
        setSubInput(json.data.subdomain ?? "");
        setCustomInput(json.data.custom_domain ?? "");
      }
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch("/api/domains/order");
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data.orders || []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadDomain();
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedValue(text);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  async function saveSubdomain(e: React.FormEvent) {
    e.preventDefault();
    if (!subInput.trim()) return;
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
      setMsg({ ok: true, text: "Subdomain toko berhasil diperbarui!" });
      loadDomain();
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setBusy(null);
    }
  }

  async function saveCustomDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!customInput.trim()) return;
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
      setDns({
        code: json.data?.verification_code,
        instructions: json.data?.dns_instructions || [
          {
            type: "CNAME",
            name: "@ atau www",
            value: "cname.umkm.id",
            description: "Arahkan domain ke server UMKM SaaS",
          },
        ],
      });
      setMsg({
        ok: true,
        text: "Custom domain berhasil disimpan. Silakan pasang konfigurasi DNS di bawah.",
      });
      loadDomain();
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setBusy(null);
    }
  }

  async function searchDomain(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data.results || []);
      } else {
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
      }
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setSearching(false);
    }
  }

  async function buyDomain(name: string) {
    setBuying(name);
    setMsg(null);
    try {
      const res = await fetch("/api/domains/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: name }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
        return;
      }
      setMsg({ ok: true, text: json.message || `Domain ${name} berhasil dibeli & terhubung otomatis!` });
      await loadDomain();
      await loadOrders();
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setBuying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Memuat status domain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Domain & Alamat Toko
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Pengaturan alamat web untuk toko aktif Anda:{" "}
          <strong className="text-gray-900 font-semibold">{domain?.website_name || "Toko"}</strong>.
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            msg.ok
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {msg.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 text-sm">
        <button
          type="button"
          onClick={() => setTab("own")}
          className={`py-3 px-5 font-bold border-b-2 transition-colors ${
            tab === "own"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Domain & Subdomain Saya
        </button>
        <button
          type="button"
          onClick={() => setTab("buy")}
          className={`py-3 px-5 font-bold border-b-2 transition-colors ${
            tab === "buy"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          Beli Domain Baru (.com / .id)
        </button>
      </div>

      {/* Tab 1: Manage Existing Subdomain & Custom Domain */}
      {tab === "own" && (
        <div className="space-y-6">
          {/* Section 1: Subdomain */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">1. Subdomain Toko Gratis</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Alamat instan gratis yang langsung aktif untuk tokomu tanpa biaya tambahan.
              </p>
            </div>

            <form onSubmit={saveSubdomain} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <div className="flex-1 flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                  <input
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    placeholder="nama-toko-anda"
                    className="flex-1 outline-none text-xs font-mono bg-transparent"
                    required
                  />
                  <span className="text-xs text-gray-400 font-mono">.{rootHost()}</span>
                </div>

                <button
                  type="submit"
                  disabled={busy === "sub"}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs disabled:opacity-50 transition-colors"
                >
                  {busy === "sub" ? "Menyimpan..." : "Simpan Subdomain"}
                </button>
              </div>

              {domain?.subdomain && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>Alamat aktif:</span>
                  <a
                    href={domain.subdomain_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>{tenantDisplay(domain.subdomain)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </form>
          </div>

          {/* Section 2: Custom Domain */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">2. Hubungkan Domain Sendiri</h2>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Starter / Growth
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Gunakan alamat web profesional milik Anda sendiri seperti <code>tokokopi.com</code> atau <code>butik.id</code>.
              </p>
            </div>

            <form onSubmit={saveCustomDomain} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="contoh: tokokopi.com atau www.butik.id"
                  className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />

                <button
                  type="submit"
                  disabled={busy === "custom" || !customInput.trim()}
                  className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-2xs disabled:opacity-50 transition-colors"
                >
                  {busy === "custom" ? "Menghubungkan..." : "Hubungkan Domain"}
                </button>
              </div>

              {domain?.custom_domain && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Status domain:</span>
                  <span className="font-mono font-bold text-gray-900">{domain.custom_domain}</span>
                  {domain.custom_domain_verified ? (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      ✓ Terverifikasi & Aktif
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                      ⏳ Menunggu DNS
                    </span>
                  )}
                </div>
              )}
            </form>

            {/* DNS Instructions Card */}
            {(dns || (domain?.custom_domain && !domain.custom_domain_verified)) && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <p className="text-xs font-bold text-gray-800">
                  Instruksi DNS Registrar (Niagahoster, Domainesia, Rumahweb, Cloudflare, dll):
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left bg-white border rounded-lg">
                    <thead>
                      <tr className="border-b bg-gray-50 text-gray-500">
                        <th className="py-2 px-3">Tipe Record</th>
                        <th className="py-2 px-3">Nama Host</th>
                        <th className="py-2 px-3">Target Nilai</th>
                        <th className="py-2 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      <tr>
                        <td className="py-2.5 px-3 font-bold text-emerald-800">CNAME</td>
                        <td className="py-2.5 px-3">www</td>
                        <td className="py-2.5 px-3 text-gray-700">cname.umkm.id</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopy("cname.umkm.id")}
                            className="text-xs font-sans text-emerald-700 hover:underline"
                          >
                            {copiedValue === "cname.umkm.id" ? "Tersalin!" : "Salin"}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-gray-500">
                  Verifikasi otomatis berjalan di sistem. Begitu DNS terpasang, status akan berubah menjadi aktif otomatis.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Buy New Domain Simulation */}
      {tab === "buy" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Beli Domain Langsung</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cari dan aktifkan nama domain unik untuk tokomu. Terhubung otomatis tanpa perlu atur DNS manual.
            </p>
          </div>

          <form onSubmit={searchDomain} className="flex gap-2 max-w-xl">
            <div className="flex-1 flex items-center border border-gray-300 rounded-xl px-3.5 py-2 bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ketik nama tokomu (mis. kopibutoni)"
                className="w-full text-xs outline-none bg-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={searching || q.trim().length < 2}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs disabled:opacity-50 transition-colors"
            >
              {searching ? "Mencari..." : "Cek Domain"}
            </button>
          </form>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold text-gray-700">Hasil Pencarian Domain:</p>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {results.map((r) => (
                  <div
                    key={r.domain}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900 font-mono">{r.domain}</p>
                      <p className="text-[11px] text-gray-500">
                        {r.available ? "Tersedia untuk didaftarkan" : "Sudah dimiliki orang lain"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs text-gray-900">
                        Rp {r.price_yearly.toLocaleString("id-ID")}/thn
                      </span>

                      {r.available ? (
                        <button
                          type="button"
                          disabled={buying === r.domain}
                          onClick={() => buyDomain(r.domain)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs disabled:opacity-50"
                        >
                          {buying === r.domain ? "Memproses..." : "Beli & Pasang"}
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-gray-400 px-2 py-1 bg-gray-100 rounded">
                          Tidak Tersedia
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders History */}
          {orders.length > 0 && (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <p className="text-xs font-bold text-gray-700">Riwayat Pembelian Domain:</p>
              <div className="space-y-2">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-gray-900">{o.domain}</span>
                      <span className="text-gray-400 ml-2">
                        Rp {o.price_yearly.toLocaleString("id-ID")}/thn
                      </span>
                    </div>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Aktif Terhubung
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
