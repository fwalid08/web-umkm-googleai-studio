"use client";
/* eslint-disable react-hooks/purity */
// Trial countdown butuh Date.now() di client — aman, hanya untuk display banner.

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag,
  Users,
  DollarSign,
  Clock,
  Package,
  ExternalLink,
  AlertTriangle,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivationChecklist } from "@/components/dashboard/activation-checklist";
import { useLang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  soon?: boolean;
}

function StatCard({ title, value, icon, href, soon }: StatCardProps) {
  const { t } = useLang();
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {soon ? (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t("common.soonFull")}</span>
        ) : href ? (
          <a href={href} className="text-primary-600 hover:underline text-xs">
            {t("common.viewAll")}
          </a>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          <div className="p-3 bg-primary-50 rounded-xl text-primary-600">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecentOrder {
  id: string;
  customer_name: string;
  product_name: string;
  total_amount: number;
  status: string;
  order_date: string;
}

interface DashData {
  website_id: string | null;
  website_name?: string;
  total_orders: number;
  today_orders: number;
  pending_orders: number;
  month_revenue: number;
  recent_orders: RecentOrder[];
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

  const trialEndsAtStr = user?.trial_ends_at ?? null;
  const daysLeft = useMemo(() => {
    if (!trialEndsAtStr) return null;
    const ends = new Date(trialEndsAtStr).getTime();
    return Math.ceil((ends - Date.now()) / (1000 * 60 * 60 * 24));
  }, [trialEndsAtStr]);
  const isFreeTier = !user?.tier || user.tier === "free";
  const showTrialBanner =
    isFreeTier && daysLeft != null && daysLeft >= 0 && daysLeft <= 14;
  const trialExpired = isFreeTier && daysLeft != null && daysLeft < 0;

  const [dash, setDash] = useState<DashData | null>(null);
  const [dashError, setDashError] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const getStatusBadge = (status: string) => {
    const styles = {
      baru: "bg-blue-100 text-blue-700",
      konfirmasi: "bg-yellow-100 text-yellow-700",
      dikirim: "bg-purple-100 text-purple-700",
      selesai: "bg-green-100 text-green-700",
    };
    const labels = tr("orders.st") as Record<string, string>;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const subdomain = user?.subdomain || "tenant-abc12345";

  const stats = [
    { title: t("dashboard.statTotal"), value: dash ? dash.total_orders : "…", icon: <ShoppingBag className="h-6 w-6" />, href: "/dashboard/orders" },
    { title: t("dashboard.statToday"), value: dash ? dash.today_orders : "…", icon: <Clock className="h-6 w-6" />, href: "/dashboard/orders" },
    { title: t("dashboard.statNew"), value: dash ? dash.pending_orders : "…", icon: <Users className="h-6 w-6" />, href: "/dashboard/orders" },
    { title: t("dashboard.statRevenue"), value: dash ? `Rp ${dash.month_revenue.toLocaleString("id-ID")}` : "…", icon: <DollarSign className="h-6 w-6" />, soon: true },
  ];

  const recentOrders = dash?.recent_orders ?? [];

  return (
    <div className="space-y-6">
      <ActivationChecklist />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.title")}</h1>
          <p className="text-gray-500">
            {t("dashboard.welcome", { name: session?.user?.name || "Pengguna" })}
            {dash?.website_name ? (
              <span className="ml-2 inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                🏪 {dash.website_name}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/builder" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2">
            <span>{t("dashboard.qaBuilder")}</span>
          </Link>
        </div>
      </div>

      {showTrialBanner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">{t("dashboard.trialTitle")}</p>
                <p className="text-sm text-yellow-700">{t("dashboard.trialDesc", { days: daysLeft ?? 0 })}</p>
              </div>
            </div>
            <Link
              href="/dashboard/settings/billing"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium whitespace-nowrap"
            >
              {t("dashboard.upgradeNow")}
            </Link>
          </div>
        </div>
      )}
      {trialExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-800">{t("dashboard.trialOverTitle")}</p>
                <p className="text-sm text-red-700">{t("dashboard.trialOverDesc")}</p>
              </div>
            </div>
            <Link
              href="/dashboard/settings/billing"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium whitespace-nowrap"
            >
              {t("dashboard.upgradeNow")}
            </Link>
          </div>
        </div>
      )}

      {dashError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{dashError}</div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="p-2 bg-primary-100 rounded-lg">
                <span className="text-2xl">⚡</span>
              </span>
              {t("dashboard.quickTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/builder" className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              <span className="p-2 bg-primary-100 rounded-lg text-primary-600">
                <span className="text-xl">🎨</span>
              </span>
              <div>
                <p className="font-medium text-gray-900">{t("dashboard.qaBuilder")}</p>
                <p className="text-sm text-gray-500">{t("dashboard.qaBuilderDesc")}</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 p-3 rounded-lg opacity-60">
              <span className="p-2 bg-green-100 rounded-lg text-green-600">
                <Package className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{t("dashboard.qaProduct")}</p>
                <p className="text-sm text-gray-500">{t("dashboard.qaProductDesc")}</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t("common.soonFull")}</span>
            </div>
            <Link href="/dashboard/orders" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-gray-900">{t("dashboard.qaOrders")}</p>
                <p className="text-sm text-gray-500">{t("dashboard.qaOrdersDesc")}</p>
              </div>
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="p-2 bg-gray-100 rounded-lg text-gray-600">
                <Settings className="h-5 w-5" />
              </span>
              <div>
                <p className="font-medium text-gray-900">{t("dashboard.qaSettings")}</p>
                <p className="text-sm text-gray-500">{t("dashboard.qaSettingsDesc")}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.recentTitle")}</CardTitle>
            <Link href="/dashboard/orders" className="text-sm text-primary-600 hover:underline">
              {t("common.viewAll")}
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-medium text-gray-900">{t("dashboard.emptyTitle")}</p>
                <p className="text-sm text-gray-500 mt-1">{t("dashboard.emptyDesc")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">{t("orders.colCustomer")}</th>
                      <th className="pb-3 font-medium">{t("orders.colProduct")}</th>
                      <th className="pb-3 font-medium text-right">{t("orders.colTotal")}</th>
                      <th className="pb-3 font-medium">{t("orders.colStatus")}</th>
                      <th className="pb-3 font-medium">{t("orders.colDate")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-3 font-medium">{order.customer_name}</td>
                        <td className="py-3 text-gray-600">{order.product_name}</td>
                        <td className="py-3 text-right font-medium">Rp {order.total_amount.toLocaleString("id-ID")}</td>
                        <td className="py-3">{getStatusBadge(order.status)}</td>
                        <td className="py-3 text-sm text-gray-500">{new Date(order.order_date).toLocaleDateString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            {t("dashboard.siteTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <ExternalLink className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t("dashboard.siteReady")}</h3>
            <p className="text-gray-500 mb-4">
              {t("dashboard.siteSub")}{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {tenantDisplay(subdomain)}
              </code>
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href={tenantUrl(subdomain) ?? "/dashboard/builder"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {t("dashboard.viewSite")}
              </Link>
              <Link href="/dashboard/builder" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
                {t("dashboard.editSite")}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
