"use client";

/**
 * N10 — Daftar pelanggan real dari /api/customers (agregasi orders website aktif).
 * Mobile: card list. Desktop: tabel. Search + pagination.
 */

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Customer {
  name: string;
  phone: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order: string;
}

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams({ page: String(p), limit: "20" });
      if (q.trim()) sp.set("search", q.trim());
      const res = await fetch(`/api/customers?${sp.toString()}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      setCustomers(json.data.customers);
      setTotal(json.data.total);
      setPage(json.data.page);
      setTotalPages(json.data.total_pages);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function applySearch() {
    load(1, search);
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t("soonPages.customersTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} {t("soonPages.customersSub")}
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={t("orders.searchPh")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="flex-1"
            aria-label={t("orders.searchPh")}
          />
          <Button onClick={applySearch}>
            {t("orders.searchBtn")}
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("soonPages.customersTitle")}</CardTitle>
          <CardDescription>
            {total} {t("soonPages.customersSub")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2" aria-label={t("common.loading")}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-medium text-gray-900 dark:text-white">{t("orders.emptyTitle")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("orders.emptyDesc")}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("orders.colCustomer")}</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">{t("orders.colTotal")}</TableHead>
                      <TableHead>{t("orders.colDate")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow key={`${c.phone || c.email || c.name}`}>
                        <TableCell>
                          <p className="font-medium">{c.name || "—"}</p>
                          <p className="text-xs text-gray-500">
                            {[c.phone, c.email].filter(Boolean).join(" • ") || "—"}
                          </p>
                        </TableCell>
                        <TableCell>{c.total_orders}×</TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {c.total_spent.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {c.last_order ? new Date(c.last_order).toLocaleDateString("id-ID") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-3">
                {customers.map((c) => (
                  <Card key={`${c.phone || c.email || c.name}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{c.name || "—"}</p>
                        <span className="text-xs text-gray-500">{c.total_orders}× order</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {[c.phone, c.email].filter(Boolean).join(" • ") || "—"}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="font-semibold">Rp {c.total_spent.toLocaleString("id-ID")}</span>
                        <span className="text-xs text-gray-500">
                          {c.last_order ? new Date(c.last_order).toLocaleDateString("id-ID") : "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => load(page - 1, search)}
                >
                  {t("orders.prev")}
                </Button>
                <span className="text-sm text-gray-500">{t("orders.page", { p: page, t: totalPages })}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => load(page + 1, search)}
                >
                  {t("orders.next")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
