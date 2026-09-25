"use client";

/**
 * Sprint 02 US-02/US-03/US-06 — Order list + filter + status + CSV.
 * Mobile: card list. Desktop: tabel. Export CSV dari data terfilter.
 */

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLang } from "@/lib/i18n";

interface Order {
  id: string;
  product_name: string;
  quantity: number;
  total_amount: number;
  status: string;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  payment_method: string;
}

const STATUSES = ["", "baru", "konfirmasi", "dikirim", "selesai"];

function badge(status: string): string {
  switch (status) {
    case "baru":
      return "bg-blue-100 text-blue-700";
    case "konfirmasi":
      return "bg-yellow-100 text-yellow-700";
    case "dikirim":
      return "bg-purple-100 text-purple-700";
    case "selesai":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function toCsv(rows: Order[]): string {
  const head = "id,customer,product,qty,total,status,date,phone";
  const lines = rows.map((o) =>
    [o.id, o.customer_name, o.product_name, o.quantity, o.total_amount, o.status, o.order_date, o.customer_phone]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [head, ...lines].join("\n");
}

function waUrl(phone: string, customer: string, product: string, total: number): string {
  let cleaned = (phone || "").replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
  if (!cleaned.startsWith("62")) cleaned = "62" + cleaned;
  const text = encodeURIComponent(
    `Halo kak ${customer}, terima kasih telah memesan!\n\nPesanan:\n- ${product}\nTotal: Rp ${total.toLocaleString("id-ID")}\n\nApakah pesanan ini ingin langsung diproses dan dikirim? Terima kasih 🙏`
  );
  return `https://wa.me/${cleaned}?text=${text}`;
}

export default function OrdersPage() {
  const { t, tr } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const stLabel = (s: string): string => {
    const m = tr("orders.st") as Record<string, string>;
    return m[s] ?? s;
  };

  const load = useCallback(async (p: number, st: string, q: string) => {
    setLoading(true);
    setError("");
    try {
      const sp = new URLSearchParams({ page: String(p), limit: "20" });
      if (st) sp.set("status", st);
      if (q.trim()) sp.set("search", q.trim());
      const res = await fetch(`/api/orders?${sp.toString()}`);
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      setOrders(json.data.orders);
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
    load(1, status, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  function applyFilter() {
    setPage(1);
    load(1, status, search);
  }

  async function changeStatus(o: Order, next: string) {
    if (next === o.status) return;
    setUpdatingId(o.id);
    setError("");
    try {
      const res = await fetch(`/api/orders/${o.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    } catch {
      setError(t("common.networkError"));
    } finally {
      setUpdatingId(null);
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(orders)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.href = url;
    a.download = `orders-${d}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("orders.title")}</h1>
          <p className="text-gray-500">
            {status ? t("orders.countFilter", { total, status: stLabel(status) }) : t("orders.countIn", { total })}
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={orders.length === 0}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {t("orders.export")}
        </button>
      </div>

      <Card>
        <CardContent className="pt-4 flex flex-col sm:flex-row gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s ? stLabel(s) : t("orders.filterAll")}
              </option>
            ))}
          </select>
          <input
            placeholder={t("orders.searchPh")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter()}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={applyFilter}
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
          <CardTitle>{t("orders.listTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : orders.length === 0 ? (
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
                      <th className="pb-2 font-medium">{t("orders.colProduct")}</th>
                      <th className="pb-2 font-medium text-right">{t("orders.colTotal")}</th>
                      <th className="pb-2 font-medium">{t("orders.colStatus")}</th>
                      <th className="pb-2 font-medium">{t("orders.colDate")}</th>
                      <th className="pb-2 font-medium">{t("orders.colChange")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="py-2">
                          <p className="font-medium">{o.customer_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-gray-500">{o.customer_phone}</span>
                            {o.customer_phone ? (
                              <a
                                href={waUrl(o.customer_phone, o.customer_name, o.product_name, o.total_amount)}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Hubungi Pembeli via WhatsApp"
                                className="inline-flex items-center gap-1 text-[11px] text-green-700 bg-green-50 hover:bg-green-100 px-1.5 py-0.5 rounded border border-green-200"
                              >
                                <MessageCircle className="h-3 w-3 text-green-600" />
                                Chat WA
                              </a>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2">
                          {o.product_name} × {o.quantity}
                        </td>
                        <td className="py-2 text-right font-medium">Rp {o.total_amount.toLocaleString("id-ID")}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge(o.status)}`}>
                            {stLabel(o.status)}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">{new Date(o.order_date).toLocaleDateString("id-ID")}</td>
                        <td className="py-2">
                          <select
                            value={o.status}
                            disabled={updatingId === o.id || o.status === "selesai"}
                            onChange={(e) => changeStatus(o, e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs"
                          >
                            {["baru", "konfirmasi", "dikirim", "selesai"].map((s) => (
                              <option key={s} value={s}>
                                {stLabel(s)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{o.customer_name}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge(o.status)}`}>
                        {stLabel(o.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {o.product_name} × {o.quantity} — Rp {o.total_amount.toLocaleString("id-ID")}
                    </p>
                    <button
                      onClick={() => setOpenId(openId === o.id ? null : o.id)}
                      className="text-xs text-primary-600 mt-1"
                    >
                      {openId === o.id ? t("orders.hideDetail") : t("orders.detail")}
                    </button>
                    {openId === o.id ? (
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-gray-500">📞 {o.customer_phone} • {o.payment_method.toUpperCase()}</p>
                          {o.customer_phone ? (
                            <a
                              href={waUrl(o.customer_phone, o.customer_name, o.product_name, o.total_amount)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-green-600" /> Chat WA
                            </a>
                          ) : null}
                        </div>
                        <select
                          value={o.status}
                          disabled={updatingId === o.id || o.status === "selesai"}
                          onChange={(e) => changeStatus(o, e.target.value)}
                          className="border rounded-lg px-2 py-1.5 text-sm w-full"
                        >
                          {["baru", "konfirmasi", "dikirim", "selesai"].map((s) => (
                            <option key={s} value={s}>
                              {stLabel(s)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => load(page - 1, status, search)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                >
                  {t("orders.prev")}
                </button>
                <span className="text-gray-500">{t("orders.page", { p: page, t: totalPages })}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => load(page + 1, status, search)}
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
