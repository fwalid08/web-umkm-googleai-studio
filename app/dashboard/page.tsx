"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag,
  Clock,
  ExternalLink,
  AlertTriangle,
  Settings,
  Store,
  Palette,
  Copy,
  Check,
  MessageCircle,
  Share2,
  DollarSign,
  TrendingUp,
  Package,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ActivationChecklist } from "@/components/dashboard/activation-checklist";
import { useLang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";

interface RecentOrder {
  id: string;
  customer_name: string;
  customer_phone?: string;
  product_name: string;
  total_amount: number;
  status: string;
  order_date: string;
}

interface DashData {
  website_id: string | null;
  website_name?: string;
  business_type?: string;
  subdomain?: string;
  total_orders: number;
  today_orders: number;
  pending_orders: number;
  month_revenue: number;
  recent_orders: RecentOrder[];
}

function waContactLink(phone: string | undefined, customer: string, product: string, total: number): string {
  let cleaned = (phone || "").replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  if (!cleaned.startsWith("62")) cleaned = "62" + cleaned;
  const msg = encodeURIComponent(
    `Halo kak ${customer}, terima kasih telah memesan ${product} (Total Rp ${total.toLocaleString(
      "id-ID"
    )}). Apakah pesanannya ingin langsung kami proses? 🙏`
  );
  return `https://wa.me/${cleaned}?text=${msg}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t, tr } = useLang();
  const user = session?.user as unknown as {
    name?: string | null;
    tier?: string;
    subdomain?: string | null;
    trial_ends_at?: string | null;
  } | undefined;

  const [dash, setDash] = useState<DashData | null>(null);
  const [dashError, setDashError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (user?.trial_ends_at) {
      const ends = new Date(user.trial_ends_at).getTime();
      const diff = Math.ceil((ends - Date.now()) / (1000 * 60 * 60 * 24));
      setDaysLeft(diff);
    }
  }, [user?.trial_ends_at]);

  const isFreeTier = !user?.tier || user.tier === "free";
  const showTrialBanner = isFreeTier && daysLeft != null && daysLeft >= 0 && daysLeft <= 14;
  const trialExpired = isFreeTier && daysLeft != null && daysLeft < 0;

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch("/api/user/dashboard");
        const json = await res.json();
        if (json.success) setDash(json.data);
        else setDashError(json.error ?? "Dashboard error");
      } catch {
        setDashError(t("common.networkError"));
      }
    })();
  }, [session, t]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      baru: "bg-blue-100 text-blue-800 border-blue-200",
      konfirmasi: "bg-amber-100 text-amber-800 border-amber-200",
      dikirim: "bg-purple-100 text-purple-800 border-purple-200",
      selesai: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    const labels = tr("orders.st") as Record<string, string>;
    return (
      <span
        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
          styles[status] || "bg-gray-100 text-gray-700 border-gray-200"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const subdomain = dash?.subdomain || user?.subdomain || "tenant-demo";
  const siteUrl = tenantUrl(subdomain);
  const storeName = dash?.website_name || "Toko Saya";

  const handleCopyLink = () => {
    if (!siteUrl) return;
    navigator.clipboard?.writeText(siteUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!siteUrl) return;
    const text = encodeURIComponent(
      `Halo! Kunjungi katalog toko online resmi kami di ${siteUrl} untuk melihat produk terbaru dan order langsung via WhatsApp. Selamat berbelanja! 🙏`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const recentOrders = dash?.recent_orders ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Trial Countdown Warning */}
      {showTrialBanner && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-amber-900 text-sm">{t("dashboard.trialTitle")}</p>
                <p className="text-xs text-amber-800">
                  {t("dashboard.trialDesc", { days: daysLeft ?? 0 })}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings/billing"
              className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 text-xs font-bold whitespace-nowrap self-start sm:self-auto shadow-2xs"
            >
              {t("dashboard.upgradeNow")}
            </Link>
          </div>
        </div>
      )}

      {trialExpired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-red-900 text-sm">{t("dashboard.trialOverTitle")}</p>
                <p className="text-xs text-red-800">{t("dashboard.trialOverDesc")}</p>
              </div>
            </div>
            <Link
              href="/dashboard/settings/billing"
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-xs font-bold whitespace-nowrap self-start sm:self-auto shadow-2xs"
            >
              {t("dashboard.upgradeNow")}
            </Link>
          </div>
        </div>
      )}

      {/* Activation Checklist (Dismissable/Collapsible) */}
      <ActivationChecklist />

      {/* Hero Store Command Card */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {storeName}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Toko Aktif</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
              <span>Alamat Toko:</span>
              <code className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono text-xs">
                {tenantDisplay(subdomain)}
              </code>
            </p>
          </div>

          {/* Quick Share & Live Store Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-2xs transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-gray-500" />
                  <span>Salin Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={shareViaWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 shadow-2xs transition-colors"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>Share ke WA</span>
            </button>

            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>Buka Toko</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {dashError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs">
          {dashError}
        </div>
      )}

      {/* 4 Key Business Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Orders */}
        <Link href="/dashboard/orders" className="block group">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 hover:border-emerald-300 hover:shadow-md transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold text-gray-600">Total Pesanan</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tabular-nums">
                {dash ? dash.total_orders : "…"}
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                <span>Lihat riwayat</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          </div>
        </Link>

        {/* Metric 2: Today's Orders */}
        <Link href="/dashboard/orders" className="block group">
          <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 hover:border-emerald-300 hover:shadow-md transition-all h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold text-gray-600">Pesanan Hari Ini</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tabular-nums">
                {dash ? dash.today_orders : "…"}
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">Orderan masuk 24 jam</p>
            </div>
          </div>
        </Link>

        {/* Metric 3: Pending Orders (Needs Attention) */}
        <Link href="/dashboard/orders" className="block group">
          <div
            className={`border rounded-2xl p-4 sm:p-5 transition-all h-full flex flex-col justify-between ${
              dash && dash.pending_orders > 0
                ? "bg-amber-50/50 border-amber-300 hover:shadow-md ring-2 ring-amber-100"
                : "bg-white border-gray-200/90 hover:border-emerald-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-semibold text-gray-700">Perlu Diproses</span>
              <div
                className={`p-2 rounded-xl ${
                  dash && dash.pending_orders > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-gray-100 text-gray-600"
                } group-hover:scale-105 transition-transform`}
              >
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tabular-nums">
                {dash ? dash.pending_orders : "…"}
              </div>
              <p
                className={`text-[11px] mt-1 font-semibold ${
                  dash && dash.pending_orders > 0 ? "text-amber-800" : "text-gray-400"
                }`}
              >
                {dash && dash.pending_orders > 0 ? "⚠️ Segera hubungi pembeli" : "Semua pesanan aman"}
              </p>
            </div>
          </div>
        </Link>

        {/* Metric 4: Estimated Revenue */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-sm h-full flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-gray-600">Estimasi Omset</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 font-mono tabular-nums truncate">
              {dash ? `Rp ${dash.month_revenue.toLocaleString("id-ID")}` : "…"}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Bulan ini (0% komisi)</p>
          </div>
        </div>
      </div>

      {/* Quick Operational Actions Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>Aksi Cepat Pengelolaan Toko</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Action 1: Products */}
          <Link
            href="/dashboard/products"
            className="p-4 bg-white border border-gray-200/90 hover:border-emerald-500 rounded-2xl hover:shadow-md transition-all group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                Katalog Produk
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Tambah menu, harga & foto barang</p>
            </div>
          </Link>

          {/* Action 2: Orders */}
          <Link
            href="/dashboard/orders"
            className="p-4 bg-white border border-gray-200/90 hover:border-emerald-500 rounded-2xl hover:shadow-md transition-all group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                Kelola Pesanan
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Cek detail status & export CSV</p>
            </div>
          </Link>

          {/* Action 3: Website Builder */}
          <Link
            href="/dashboard/builder"
            className="p-4 bg-white border border-gray-200/90 hover:border-emerald-500 rounded-2xl hover:shadow-md transition-all group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0 group-hover:scale-105 transition-transform">
              <Palette className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                Desain Toko
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Ganti banner, warna tema & teks</p>
            </div>
          </Link>

          {/* Action 4: My Websites / Domain */}
          <Link
            href="/dashboard/domain"
            className="p-4 bg-white border border-gray-200/90 hover:border-emerald-500 rounded-2xl hover:shadow-md transition-all group flex items-start gap-3.5"
          >
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                Website & Domain
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Pasang custom domain .com / .id</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="border border-gray-200/90 rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">{t("dashboard.recentTitle")}</h3>
            <p className="text-xs text-gray-500">Pesanan terbaru yang masuk dari checkout toko</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="max-w-sm mx-auto">
              <p className="text-sm font-bold text-gray-900">{t("dashboard.emptyTitle")}</p>
              <p className="text-xs text-gray-500 mt-1">{t("dashboard.emptyDesc")}</p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin & Bagikan Link Toko</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Mobile Card List (< sm screens) */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{order.product_name}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-mono font-bold text-emerald-800">
                      Rp {order.total_amount.toLocaleString("id-ID")}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">
                        {new Date(order.order_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      {order.customer_phone && (
                        <a
                          href={waContactLink(
                            order.customer_phone,
                            order.customer_name,
                            order.product_name,
                            order.total_amount
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium"
                          title="Hubungi pembeli di WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= sm screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 font-semibold">
                    <th className="py-3 px-5">{t("orders.colCustomer")}</th>
                    <th className="py-3 px-4">{t("orders.colProduct")}</th>
                    <th className="py-3 px-4 text-right">{t("orders.colTotal")}</th>
                    <th className="py-3 px-4 text-center">{t("orders.colStatus")}</th>
                    <th className="py-3 px-4">{t("orders.colDate")}</th>
                    <th className="py-3 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-gray-900">
                        {order.customer_name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{order.product_name}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                        Rp {order.total_amount.toLocaleString("id-ID")}
                      </td>
                      <td className="py-3.5 px-4 text-center">{getStatusBadge(order.status)}</td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(order.order_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {order.customer_phone ? (
                          <a
                            href={waContactLink(
                              order.customer_phone,
                              order.customer_name,
                              order.product_name,
                              order.total_amount
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>Hubungi WA</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
