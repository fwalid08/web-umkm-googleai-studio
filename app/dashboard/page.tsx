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
  Store,
  Copy,
  Check,
  MessageCircle,
  Share2,
  DollarSign,
  TrendingUp,
  Package,
  ExternalLink,
  Globe,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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

function Sparkline({ data, color = "emerald" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const colorMap: Record<string, string> = {
    emerald: "stroke-emerald-500",
    blue: "stroke-blue-500",
    amber: "stroke-amber-500",
    red: "stroke-red-500",
  };

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        strokeWidth="2"
        className={colorMap[color] || colorMap.emerald}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
  sparklineData,
  sparklineColor,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendColor?: string;
  href?: string;
  sparklineData?: number[];
  sparklineColor?: string;
}) {
  const content = (
    <Card className="hover:border-emerald-300 hover:shadow-md transition-all h-full flex flex-col justify-between group rounded-2xl bg-white border-gray-200/90 shadow-xs dark:bg-slate-900 dark:border-slate-800 dark:hover:border-emerald-700">
      <CardContent className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between text-gray-500 mb-3">
          <span className="text-xs font-bold text-gray-600 dark:text-slate-400">{title}</span>
          <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor} group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 font-mono tabular-nums dark:text-white">
              {value}
            </div>
            {trend && (
              <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${trendColor}`}>
                <span>{trend}</span>
              </p>
            )}
          </div>
          {sparklineData && <Sparkline data={sparklineData} color={sparklineColor} />}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block group h-full">{content}</Link>;
  }
  return content;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t, tr } = useLang();
  const user = session?.user as unknown as {
    name?: string | null;
    tier?: string;
    subdomain?: string | null;
  } | undefined;

  const [dash, setDash] = useState<DashData | null>(null);
  const [dashError, setDashError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

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

  // Mock sparkline data (bisa diganti dengan data real dari API)
  const sparklineOrders = [3, 5, 2, 8, 6, 9, 4, 7, 5, 10, 8, 12];
  const sparklineRevenue = [120, 180, 90, 250, 200, 300, 150, 280, 220, 350, 300, 400];
  const sparklinePending = [2, 1, 3, 2, 4, 1, 2, 3, 2, 1, 2, 1];
  const sparklineToday = [1, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7];

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

      {dashError && (
        <Card className="border-red-200 bg-red-50 rounded-2xl dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400">{dashError}</p>
          </CardContent>
        </Card>
      )}

      {/* 4 Key Business Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Pesanan"
          value={dash ? dash.total_orders : "…"}
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          trend="Semua orderan toko"
          href="/dashboard/orders"
          sparklineData={sparklineOrders}
          sparklineColor="blue"
        />

        <MetricCard
          title="Pesanan Hari Ini"
          value={dash ? dash.today_orders : "…"}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          trend="Orderan masuk 24 jam"
          trendColor="text-emerald-700 dark:text-emerald-400"
          href="/dashboard/orders"
          sparklineData={sparklineToday}
          sparklineColor="emerald"
        />

        <MetricCard
          title="Perlu Diproses"
          value={dash ? dash.pending_orders : "…"}
          icon={<Package className="w-5 h-5" />}
          iconBg={dash && dash.pending_orders > 0 ? "bg-amber-50 dark:bg-amber-900/30" : "bg-gray-50 dark:bg-slate-800"}
          iconColor={dash && dash.pending_orders > 0 ? "text-amber-800 dark:text-amber-400" : "text-gray-600 dark:text-slate-400"}
          trend={dash && dash.pending_orders > 0 ? "⚠️ Segera hubungi pembeli" : "Semua pesanan aman"}
          trendColor={dash && dash.pending_orders > 0 ? "text-amber-800 dark:text-amber-400" : "text-gray-400 dark:text-slate-500"}
          href="/dashboard/orders"
          sparklineData={sparklinePending}
          sparklineColor="amber"
        />

        <MetricCard
          title="Estimasi Omset"
          value={dash ? `Rp ${dash.month_revenue.toLocaleString("id-ID")}` : "…"}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          trend="Bulan ini (0% komisi)"
          trendColor="text-gray-500 dark:text-slate-400"
          sparklineData={sparklineRevenue}
          sparklineColor="emerald"
        />
      </div>

      {/* Recent Orders Section */}
      <Card className="border-gray-200/90 shadow-sm overflow-hidden rounded-3xl bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="p-5 sm:p-6 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{t("dashboard.recentTitle")}</h3>
          <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">Pesanan terbaru yang masuk dari checkout toko online</p>
        </CardHeader>

        {recentOrders.length === 0 ? (
          <CardContent className="py-14 px-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="max-w-sm mx-auto">
              <p className="text-base font-bold text-gray-900 dark:text-white">{t("dashboard.emptyTitle")}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed dark:text-slate-400">{t("dashboard.emptyDesc")}</p>
            </div>
            <div className="pt-2 flex justify-center">
              <Button
                variant="default"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                <Share2 className="w-4 h-4" />
                <span>Salin & Bagikan Link Toko ke WhatsApp</span>
              </Button>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            {/* Mobile Card List (< sm screens) */}
            <div className="divide-y divide-gray-100 sm:hidden dark:divide-slate-800">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-2.5 hover:bg-gray-50/50 transition-colors dark:hover:bg-slate-800/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{order.customer_name}</p>
                      <p className="text-xs text-gray-600 mt-0.5 dark:text-slate-400">{order.product_name}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">
                      Rp {order.total_amount.toLocaleString("id-ID")}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-slate-500">
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
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
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
                  <TableRow className="border-b border-gray-100 bg-gray-50/60 text-gray-500 font-bold text-xs dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                    <TableHead className="py-3.5 px-6">{t("orders.colCustomer")}</TableHead>
                    <TableHead className="py-3.5 px-4">{t("orders.colProduct")}</TableHead>
                    <TableHead className="py-3.5 px-4 text-right">{t("orders.colTotal")}</TableHead>
                    <TableHead className="py-3.5 px-4 text-center">{t("orders.colStatus")}</TableHead>
                    <TableHead className="py-3.5 px-4">{t("orders.colDate")}</TableHead>
                    <TableHead className="py-3.5 px-6 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/80 transition-colors dark:hover:bg-slate-800/50">
                      <TableCell className="py-4 px-6 font-bold text-gray-900 dark:text-white">
                        {order.customer_name}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-gray-700 text-xs font-medium dark:text-slate-300">{order.product_name}</TableCell>
                      <TableCell className="py-4 px-4 text-right font-mono font-bold text-gray-900 text-xs dark:text-white">
                        Rp {order.total_amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="py-4 px-4 text-gray-500 text-xs dark:text-slate-400">
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
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-2xs dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800 dark:hover:bg-emerald-900/50"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Hubungi WA</span>
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs dark:text-slate-500">—</span>
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
