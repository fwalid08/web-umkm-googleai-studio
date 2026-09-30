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
import { dnsTarget, rootHost, tenantDisplay } from "@/lib/urls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  currency: string;
  buyable: boolean;
  requirement: string | null;
  premium: boolean;
  premium_price?: number;
}

interface DnsRecordEntry {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

interface DomainOrder {
  id: string;
  domain: string;
  tld: string;
  price_yearly: number;
  status: string;
  registrar: string;
  dns_records: DnsRecordEntry[];
  auto_renew: boolean;
  expires_at: string | null;
  created_at: string;
}

// Status final (polling berhenti): active/failed/expired/deleted.
const FINAL_ORDER_STATUSES = ["active", "failed", "expired", "deleted"];

function orderStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Aktif Terhubung</Badge>;
    case "registering":
      return <Badge variant="info">Didaftarkan...</Badge>;
    case "pending_payment":
      return <Badge variant="warning">Menunggu Bayar</Badge>;
    case "failed":
      return <Badge variant="destructive">Gagal</Badge>;
    case "expired":
      return <Badge variant="secondary">Kadaluarsa</Badge>;
    case "transfer_in":
      return <Badge variant="info">Transfer...</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDateId(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardDomainPage() {
  const { t } = useLang();
  const cnameTarget = dnsTarget();
  const [tab, setTab] = useState<"own" | "buy">("own");
  const [domain, setDomain] = useState<DomainState | null>(null);
  const [subInput, setSubInput] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [dns, setDns] = useState<{ code: string; instructions: DnsInstruction[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"sub" | "custom" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Beli domain (Sprint 2: checkout payment → redirect Snap/invoice)
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);

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
      const res = await fetch("/api/domains/orders");
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

  // Polling status order non-final (pending_payment/registering) tiap 5 dtk.
  const hasPendingOrder = orders.some((o) => !FINAL_ORDER_STATUSES.includes(o.status));
  useEffect(() => {
    if (!hasPendingOrder) return;
    const id = setInterval(() => {
      loadOrders();
      loadDomain();
    }, 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPendingOrder]);

  // Debounce 300ms: ketik → cari otomatis (min 2 huruf, sesuai API).
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setSearchWarning(null);
      return;
    }
    const timer = setTimeout(() => {
      searchDomain();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

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
            value: cnameTarget,
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
    const query = q.trim();
    if (query.length < 2) return;
    setSearching(true);
    setResults([]);
    setSearchWarning(null);
    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data.results || []);
        if (json.warning) setSearchWarning(json.warning);
      } else if (res.status === 429) {
        setMsg({ ok: false, text: "Terlalu sering mencari, coba lagi sebentar." });
      } else {
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
      }
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setSearching(false);
    }
  }

  // Checkout Sprint 2: POST /api/domains/checkout → redirect ke
  // Midtrans Snap / Xendit invoice (jangan hardcode Snap).
  async function buyDomain(name: string) {
    setBuying(name);
    setMsg(null);
    setUpgradeUrl(null);
    try {
      const res = await fetch("/api/domains/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: name }),
      });
      const json = await res.json();
      if (!json.success) {
        if (res.status === 403 && json.upgrade_url) setUpgradeUrl(json.upgrade_url);
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
        return;
      }
      const redirectUrl: string | undefined = json.data?.redirect_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      setMsg({ ok: false, text: "Link pembayaran tidak tersedia. Coba lagi." });
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setBuying(null);
    }
  }

  // Perpanjang: POST /api/domains/renew/:id → redirect payment baru.
  async function renewOrder(id: string) {
    setRenewing(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/domains/renew/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle: "yearly" }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.error ?? t("common.networkError") });
        return;
      }
      const redirectUrl: string | undefined = json.data?.redirect_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      setMsg({ ok: false, text: "Link pembayaran tidak tersedia. Coba lagi." });
      await loadOrders();
    } catch {
      setMsg({ ok: false, text: t("common.networkError") });
    } finally {
      setRenewing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto" aria-label="Memuat status domain">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Domain & Alamat Toko
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pengaturan alamat web untuk toko aktif Anda:{" "}
          <strong className="text-gray-900 dark:text-white font-semibold">{domain?.website_name || "Toko"}</strong>.
        </p>
      </div>

      {msg && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
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
          {!msg.ok && upgradeUrl && (
            <Link href={upgradeUrl} className="underline font-bold ml-1 shrink-0">
              Upgrade Paket
            </Link>
          )}
        </div>
      )}

      {/* Tabs Switcher */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "own" | "buy")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="own">Domain & Subdomain Saya</TabsTrigger>
          <TabsTrigger value="buy">Beli Domain Baru</TabsTrigger>
        </TabsList>

      {/* Tab 1: Manage Existing Subdomain & Custom Domain */}
      <TabsContent value="own" className="space-y-6 mt-6">
          {/* Section 1: Subdomain */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Subdomain Toko Gratis</CardTitle>
              <CardDescription>
                Alamat instan gratis yang langsung aktif untuk tokomu tanpa biaya tambahan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

            <form onSubmit={saveSubdomain} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <div className="flex-1 flex items-center gap-1">
                  <Input
                    value={subInput}
                    onChange={(e) => setSubInput(e.target.value)}
                    placeholder="nama-toko-anda"
                    className="flex-1 font-mono"
                    required
                    aria-label="Subdomain toko"
                  />
                  <span className="text-sm text-gray-400 font-mono shrink-0">.{rootHost()}</span>
                </div>

                <Button type="submit" disabled={busy === "sub"}>
                  {busy === "sub" ? "Menyimpan..." : "Simpan Subdomain"}
                </Button>
              </div>

              {domain?.subdomain && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
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
            </CardContent>
          </Card>

          {/* Section 2: Custom Domain */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">2. Hubungkan Domain Sendiri</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  Starter / Growth
                </Badge>
              </div>
              <CardDescription>
                Gunakan alamat web profesional milik Anda sendiri seperti <code>tokokopi.com</code> atau <code>butik.id</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

            <form onSubmit={saveCustomDomain} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
                <Input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="contoh: tokokopi.com atau www.butik.id"
                  className="flex-1 font-mono"
                  aria-label="Domain sendiri"
                />

                <Button
                  type="submit"
                  variant="secondary"
                  disabled={busy === "custom" || !customInput.trim()}
                >
                  {busy === "custom" ? "Menghubungkan..." : "Hubungkan Domain"}
                </Button>
              </div>

              {domain?.custom_domain && (
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-gray-500">Status domain:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{domain.custom_domain}</span>
                  {domain.custom_domain_verified ? (
                    <Badge variant="success">
                      ✓ Terverifikasi & Aktif
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      ⏳ Menunggu DNS
                    </Badge>
                  )}
                </div>
              )}
            </form>

            {/* DNS Instructions Card */}
            {(dns || (domain?.custom_domain && !domain.custom_domain_verified)) && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <p className="text-sm font-bold text-gray-800">
                  Instruksi DNS Registrar (Niagahoster, Domainesia, Rumahweb, Cloudflare, dll):
                </p>
                <div className="overflow-x-auto rounded-lg border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipe Record</TableHead>
                        <TableHead>Nama Host</TableHead>
                        <TableHead>Target Nilai</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="font-mono">
                      {(dns?.instructions && dns.instructions.length > 0
                        ? dns.instructions
                        : [{ type: "CNAME", name: "www", value: cnameTarget, description: "" }]
                      ).map((row, i) => (
                        <TableRow key={`${row.type}-${row.name}-${i}`}>
                          <TableCell className="font-bold text-emerald-800">{row.type}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="text-gray-700 break-all">{row.value}</TableCell>
                          <TableCell className="text-right font-sans">
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              onClick={() => handleCopy(row.value)}
                              className="text-emerald-700 h-auto p-0"
                            >
                              {copiedValue === row.value ? "Tersalin!" : "Salin"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-gray-500">
                  Verifikasi otomatis berjalan di sistem. Begitu DNS terpasang, status akan berubah menjadi aktif otomatis.
                </p>
                {dns?.code && (
                  <p className="text-xs text-gray-600">
                    Kode verifikasi TXT Anda:{" "}
                    <code className="font-mono font-bold text-gray-900 dark:text-white break-all">{dns.code}</code>{" "}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => handleCopy(dns.code)}
                      className="text-emerald-700 h-auto p-0 text-xs"
                    >
                      {copiedValue === dns.code ? "Tersalin!" : "Salin"}
                    </Button>
                  </p>
                )}
              </div>
            )}
            </CardContent>
          </Card>
      </TabsContent>

      {/* Tab 2: Buy New Domain — Sprint 2 real checkout */}
      <TabsContent value="buy" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Beli Domain Langsung</CardTitle>
            <CardDescription>
              Cari dan aktifkan nama domain unik untuk tokomu. Terhubung otomatis tanpa perlu atur DNS manual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

          <form onSubmit={searchDomain} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ketik nama tokomu (mis. kopibutoni)"
                className="pl-9"
                aria-label="Cari domain"
              />
            </div>
            <Button type="submit" disabled={searching || q.trim().length < 2}>
              {searching ? "Mencari..." : "Cek Domain"}
            </Button>
          </form>

          {searchWarning && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
              {searchWarning}
            </p>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-bold text-gray-700">Hasil Pencarian Domain:</p>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                {results.map((r) => (
                  <div
                    key={r.domain}
                    className={`p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors ${
                      !r.buyable ? "opacity-50 bg-gray-50" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{r.domain}</p>
                      <p className="text-xs text-gray-500">
                        {r.available ? "Tersedia untuk didaftarkan" : "Sudah dimiliki orang lain"}
                        {r.requirement && ` — ${r.requirement}`}
                        {r.premium && ` — Premium`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                        {r.premium_price ? `Rp ${r.premium_price.toLocaleString("id-ID")}/thn` : `Rp ${r.price_yearly.toLocaleString("id-ID")}/thn`}
                      </span>

                      {r.available && r.buyable ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={buying === r.domain}
                          onClick={() => buyDomain(r.domain)}
                        >
                          {buying === r.domain ? "Memproses..." : "Beli & Pasang"}
                        </Button>
                      ) : (
                        <Badge variant="secondary">
                          {r.available ? (r.buyable ? "Tidak Tersedia" : "Sudah Terpakai") : "Tidak Tersedia"}
                        </Badge>
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
              <p className="text-sm font-bold text-gray-700">Riwayat Pembelian Domain:</p>
              <div className="space-y-2">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{o.domain}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Rp {o.price_yearly.toLocaleString("id-ID")}/thn</span>
                        <span>•</span>
                        <span>{o.registrar}</span>
                        <span>•</span>
                        <span>Berlaku: {formatDateId(o.expires_at)}</span>
                        {o.auto_renew && <Badge variant="info" className="text-[10px]">Auto-renew</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {orderStatusBadge(o.status)}
                      {o.status === "active" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={renewing === o.id}
                          onClick={() => renewOrder(o.id)}
                        >
                          {renewing === o.id ? "Memproses..." : "Perpanjang"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}
