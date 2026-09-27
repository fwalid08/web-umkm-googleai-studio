"use client";

/**
 * N9 — Analytics real dari /api/user/dashboard (website aktif):
 * metrik dasar + produk terlaris + tren harian 14 hari.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLang } from "@/lib/i18n";

interface TopProduct {
  product_name: string;
  total_qty: number;
  total_revenue: number;
  orders_count: number;
}

interface DailyPoint {
  date: string;
  orders: number;
  revenue: number;
}

interface DashData {
  website_id: string | null;
  website_name?: string;
  total_orders: number;
  today_orders: number;
  pending_orders: number;
  month_revenue: number;
  top_products: TopProduct[];
  daily_trend: DailyPoint[];
}

export default function AnalyticsPage() {
  const { t } = useLang();
  const [dash, setDash] = useState<DashData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/dashboard");
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? t("common.networkError"));
          return;
        }
        setDash(json.data);
      } catch {
        setError(t("common.networkError"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const top = dash?.top_products ?? [];
  const trend = dash?.daily_trend ?? [];
  const maxRevenue = Math.max(1, ...trend.map((p) => p.revenue));

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t("soonPages.analyticsTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("soonPages.analyticsSub")}</p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="space-y-3" aria-label={t("common.loading")}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total order", value: String(dash?.total_orders ?? 0) },
              { label: "Order hari ini", value: String(dash?.today_orders ?? 0) },
              { label: "Perlu diproses", value: String(dash?.pending_orders ?? 0) },
              {
                label: "Omset bulan ini",
                value: `Rp ${(dash?.month_revenue ?? 0).toLocaleString("id-ID")}`,
              },
            ].map((m) => (
              <Card key={m.label}>
                <CardContent className="py-4">
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 truncate">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Produk terlaris</CardTitle>
              <CardDescription>Produk dengan penjualan tertinggi di toko Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {top.length === 0 ? (
                <p className="text-sm text-gray-500">{t("orders.emptyDesc")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("orders.colProduct")}</TableHead>
                        <TableHead className="text-right">Terjual</TableHead>
                        <TableHead className="text-right">{t("orders.colTotal")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {top.map((p) => (
                        <TableRow key={p.product_name}>
                          <TableCell>
                            <p className="font-medium">{p.product_name}</p>
                            <p className="text-xs text-gray-500">{p.orders_count} order</p>
                          </TableCell>
                          <TableCell className="text-right">{p.total_qty}×</TableCell>
                          <TableCell className="text-right font-medium">
                            Rp {p.total_revenue.toLocaleString("id-ID")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tren harian (14 hari)</CardTitle>
              <CardDescription>Perkembangan omset harian toko Anda</CardDescription>
            </CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <p className="text-sm text-gray-500">{t("orders.emptyDesc")}</p>
              ) : (
                <div className="space-y-3">
                  {trend.map((p) => (
                    <div key={p.date} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs text-gray-500">
                        {new Date(`${p.date}T00:00:00`).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <Progress
                        value={Math.round((p.revenue / maxRevenue) * 100)}
                        className="flex-1 h-2.5"
                        aria-label={`Omset ${p.date}: Rp ${p.revenue.toLocaleString("id-ID")}`}
                      />
                      <span className="w-16 shrink-0 text-right text-xs font-medium">{p.orders} order</span>
                      <span className="w-28 shrink-0 text-right text-xs text-gray-600 hidden sm:block">
                        Rp {p.revenue.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
