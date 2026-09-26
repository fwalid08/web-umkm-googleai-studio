"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  Clock,
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
  ExternalLink,
  Globe,
  Plus,
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

function MetricCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
  trendColor = "text-emerald-700",
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendColor?: string;
  href?: string;
}) {
  const content = (
    <Card className="hover:border-emerald-300 hover:shadow-md transition-all h-full flex flex-col justify-between group rounded-2xl bg-white border-gray-200/90 shadow-xs">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between text-gray-500 mb-3">
          <span className="text-xs font-bold text-gray-600">{title}</span>
          <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 font-mono tabular-nums">
            {value}
          </div>
          {trend && (
            <p className={`text-[11px] font-semibold mt-1.5 flex items-center gap-1 ${trendColor}`}>
              <span>{trend}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block group h-full">{content}</Link>;
  }
  return content;
}

function ActionCard({
  title,
  description,
  icon,
  iconBg,
  iconColor,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="p-5 bg-white border border-gray-200/90 hover:border-emerald-500 rounded-2xl hover:shadow-md transition-all group flex items-start gap-4 shadow-2xs"
    >
      <div className={`p-3 rounded-2xl ${iconBg} ${iconColor} shrink-0 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
          {title}
        </p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
    </Link>
  );
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
    const labels = tr("orders.st") as Record<string, string>;
    const variant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
      baru: "info",
      konfirmasi: "warning",
      dikirim: "default",
      selesai: "success",
    };
    return (
      <Badge variant={variant[status] || "default"}>
        {labels[status] || status}
      </Badge>
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
      {/* Welcome & Store Quick Share Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                Selamat Datang
              </span>
              <span className="text-xs text-emerald-200">·</span>
              <span className="text-xs text-emerald-100 font-medium">
                {user?.name || "Merchant UMKM"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{storeName}</h2>
            <div className="flex items-center gap-2 text-xs text-emerald-100 font-mono">
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span>{siteUrl || tenantDisplay(subdomain)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/25 rounded-xl text-xs font-bold gap-1.5"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Link Tersalin!" : "Salin Link"}</span>
            </Button>

            <Button
              type="button"
              onClick={shareViaWhatsApp}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-xs gap-1.5 shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Bagikan ke WA</span>
            </Button>

            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors shadow-md"
              >
                <span>Buka Toko</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Trial Countdown Warning */}
      {showTrialBanner && (
        <Card className="border-amber-300 bg-amber-50/90 shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5">
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
          </CardContent>
        </Card>
      )}

      {trialExpired && (
        <Card className="border-red-300 bg-red-50 shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5">
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
          </CardContent>
        </Card>
      )}

      {/* Activation Checklist (Dismissable/Collapsible) */}
      <ActivationChecklist />

      {dashError && (
        <Card className="border-red-200 bg-red-50 rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-red-700">{dashError}</p>
          </CardContent>
        </Card>
      )}

      {/* 4 Key Business Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Pesanan"
          value={dash ? dash.total_orders : "…"}
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend="Semua orderan toko"
          href="/dashboard/orders"
        />

        <MetricCard
          title="Pesanan Hari Ini"
          value={dash ? dash.today_orders : "…"}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend="Orderan masuk 24 jam"
          trendColor="text-emerald-700"
          href="/dashboard/orders"
        />

        <MetricCard
          title="Perlu Diproses"
          value={dash ? dash.pending_orders : "…"}
          icon={<Package className="w-5 h-5" />}
          iconBg={dash && dash.pending_orders > 0 ? "bg-amber-50" : "bg-gray-50"}
          iconColor={dash && dash.pending_orders > 0 ? "text-amber-800" : "text-gray-600"}
          trend={dash && dash.pending_orders > 0 ? "⚠️ Segera hubungi pembeli" : "Semua pesanan aman"}
          trendColor={dash && dash.pending_orders > 0 ? "text-amber-800" : "text-gray-400"}
          href="/dashboard/orders"
        />

        <MetricCard
          title="Estimasi Omset"
          value={dash ? `Rp ${dash.month_revenue.toLocaleString("id-ID")}` : "…"}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend="Bulan ini (0% komisi)"
          trendColor="text-gray-500"
        />
      </div>

      {/* Quick Operational Actions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <span>Aksi Cepat Toko</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <ActionCard
            title="Katalog Produk"
            description="Tambah menu, atur harga, stok & foto barang"
            icon={<Store className="w-5 h-5" />}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-700"
            href="/dashboard/products"
          />

          <ActionCard
            title="Kelola Pesanan"
            description="Cek detail status orderan & export rekap CSV"
            icon={<ShoppingBag className="w-5 h-5" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-700"
            href="/dashboard/orders"
          />

          <ActionCard
            title="Desain Toko"
            description="Ganti konsep bisnis, warna tema, banner hero & teks"
            icon={<Palette className="w-5 h-5" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-700"
            href="/dashboard/builder"
          />

          <ActionCard
            title="Website & Domain"
            description="Pasang domain sendiri (.com / .id) atau subdomain"
            icon={<Settings className="w-5 h-5" />}
            iconBg="bg-amber-100"
            iconColor="text-amber-700"
            href="/dashboard/domain"
          />
        </div>
      </div>

      {/* Recent Orders Section */}
      <Card className="border-gray-200/90 shadow-sm overflow-hidden rounded-3xl bg-white">
        <CardHeader className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">{t("dashboard.recentTitle")}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pesanan terbaru yang masuk dari checkout toko online</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
          >
            <span>Lihat Semua Pesanan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        {recentOrders.length === 0 ? (
          <CardContent className="py-14 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto">
              <p className="text-base font-bold text-gray-900">{t("dashboard.emptyTitle")}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{t("dashboard.emptyDesc")}</p>
            </div>
            <div className="pt-2 flex justify-center">
              <Button
                variant="default"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Share2 className="w-4 h-4" />
                <span>Salin & Bagikan Link Toko ke WhatsApp</span>
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            {/* Mobile Card List (< sm screens) */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-2.5 hover:bg-gray-50/50 transition-colors">
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1"
                          title="Hubungi pembeli di WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hubungi WA</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= sm screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/60 text-gray-500 font-bold text-xs">
                    <TableHead className="py-3.5 px-6">{t("orders.colCustomer")}</TableHead>
                    <TableHead className="py-3.5 px-4">{t("orders.colProduct")}</TableHead>
                    <TableHead className="py-3.5 px-4 text-right">{t("orders.colTotal")}</TableHead>
                    <TableHead className="py-3.5 px-4 text-center">{t("orders.colStatus")}</TableHead>
                    <TableHead className="py-3.5 px-4">{t("orders.colDate")}</TableHead>
                    <TableHead className="py-3.5 px-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <TableCell className="py-4 px-6 font-bold text-gray-900">
                        {order.customer_name}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-gray-700 text-xs font-medium">{order.product_name}</TableCell>
                      <TableCell className="py-4 px-4 text-right font-mono font-bold text-gray-900 text-xs">
                        Rp {order.total_amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="py-4 px-4 text-gray-500 text-xs">
                        {new Date(order.order_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
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
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Hubungi WA</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
