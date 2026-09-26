"use client";

/**
 * N10 — Daftar pelanggan real dari /api/customers (agregasi orders website aktif).
 * Mobile: card list. Desktop: tabel. Search + pagination.
 */

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("soonPages.customersTitle")}</h1>
        <p className="text-gray-500">
          {total} {t("soonPages.customersSub")}
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-col sm:flex-row gap-2">
          <input
            placeholder={t("orders.searchPh")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={applySearch}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            {t("orders.searchBtn")}
          </button>
        </CardContent>
      </Card>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("soonPages.customersTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : customers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-medium text-gray-900">{t("orders.emptyTitle")}</p>
              <p className="text-sm text-gray-500 mt-1">{t("orders.emptyDesc")}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">{t("orders.colCustomer")}</th>
                      <th className="pb-2 font-medium">Order</th>
                      <th className="pb-2 font-medium text-right">{t("orders.colTotal")}</th>
                      <th className="pb-2 font-medium">{t("orders.colDate")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {customers.map((c) => (
                      <tr key={`${c.phone || c.email || c.name}`} className="hover:bg-gray-50">
                        <td className="py-2">
                          <p className="font-medium">{c.name || "—"}</p>
                          <p className="text-xs text-gray-500">
                            {[c.phone, c.email].filter(Boolean).join(" • ") || "—"}
                          </p>
                        </td>
                        <td className="py-2">{c.total_orders}×</td>
                        <td className="py-2 text-right font-medium">
                          Rp {c.total_spent.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2 text-gray-500">
                          {c.last_order ? new Date(c.last_order).toLocaleDateString("id-ID") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {customers.map((c) => (
                  <div key={`${c.phone || c.email || c.name}`} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{c.name || "—"}</p>
                      <span className="text-xs text-gray-500">{c.total_orders}× order</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[c.phone, c.email].filter(Boolean).join(" • ") || "—"}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-sm">
                      <span className="font-medium">Rp {c.total_spent.toLocaleString("id-ID")}</span>
                      <span className="text-xs text-gray-500">
                        {c.last_order ? new Date(c.last_order).toLocaleDateString("id-ID") : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => load(page - 1, search)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                >
                  {t("orders.prev")}
                </button>
                <span className="text-gray-500">{t("orders.page", { p: page, t: totalPages })}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => load(page + 1, search)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                >
                  {t("orders.next")}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
