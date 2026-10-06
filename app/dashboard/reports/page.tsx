"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLang } from "@/lib/i18n";

const ORDER_STATUSES = ["baru", "konfirmasi", "dikirim", "selesai"] as const;

export default function ReportsPage() {
  const { t } = useLang();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  async function exportReport() {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError(t("reports.invalidRange"));
      return;
    }

    setError("");
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      if (status !== "all") params.set("status", status);

      const response = await fetch(`/api/orders/export?${params.toString()}`);
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? t("common.networkError"));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `order-report-${dateFrom || "all"}-${dateTo || "all"}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t("reports.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{t("reports.description")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("reports.ordersTitle")}</CardTitle>
          <CardDescription>{t("reports.ordersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="report-date-from">{t("reports.dateFrom")}</Label>
              <Input
                id="report-date-from"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-date-to">{t("reports.dateTo")}</Label>
              <Input
                id="report-date-to"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("reports.status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label={t("reports.status")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("reports.allStatuses")}</SelectItem>
                  {ORDER_STATUSES.map((orderStatus) => (
                    <SelectItem key={orderStatus} value={orderStatus}>
                      {t(`orders.st.${orderStatus}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportReport} disabled={exporting} className="gap-2">
              <Download className="h-4 w-4" />
              {exporting ? t("common.loading") : t("reports.export")}
            </Button>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}