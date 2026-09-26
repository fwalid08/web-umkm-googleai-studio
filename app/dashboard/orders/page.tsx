"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

function statusBadge(status: string): React.ReactNode {
  const variant: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
    baru: "info",
    konfirmasi: "warning",
    dikirim: "default",
    selesai: "success",
  };
  const labels: Record<string, string> = {
    baru: "Baru",
    konfirmasi: "Konfirmasi",
    dikirim: "Dikirim",
    selesai: "Selesai",
  };
  return (
    <Badge variant={variant[status] || "default"}>
      {labels[status] || status}
    </Badge>
  );
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
  const [exporting, setExporting] = useState(false);

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

  async function exportCsv() {
    setExporting(true);
    setError("");
    try {
      const sp = new URLSearchParams();
      if (status) sp.set("status", status);
      if (search.trim()) sp.set("search", search.trim());
      const res = await fetch(`/api/orders/export?${sp.toString()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? t("common.networkError"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url;
      a.download = `orders-${d}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("orders.title")}</h1>
          <p className="text-gray-500">
            {status ? t("orders.countFilter", { total, status: status || "Semua" }) : t("orders.countIn", { total })}
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={orders.length === 0 || exporting} className="gap-2">
          <span>{exporting ? t("common.loading") : t("orders.export")}</span>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 max-w-xs sm:max-w-md">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Status</SelectItem>
                  {STATUSES.filter(Boolean).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "baru" ? "Baru" : s === "konfirmasi" ? "Konfirmasi" : s === "dikirim" ? "Dikirim" : "Selesai"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  placeholder={t("orders.searchPh") || "Cari pelanggan, produk..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={applyFilter} className="gap-2 whitespace-nowrap">
              <span>Terapkan</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <p className="text-xs text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("orders.listTitle") || "Daftar Pesanan"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-lg font-medium text-gray-900">{t("orders.emptyTitle") || "Belum ada pesanan"}</p>
              <p className="text-sm text-gray-500 mt-1">{t("orders.emptyDesc") || "Pesanan akan muncul di sini setelah pelanggan checkout"}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-100 bg-gray-50/50 text-gray-500 font-semibold">
                      <TableHead className="py-3 px-5">{t("orders.colCustomer") || "Pelanggan"}</TableHead>
                      <TableHead className="py-3 px-4">{t("orders.colProduct") || "Produk"}</TableHead>
                      <TableHead className="py-3 px-4 text-right">{t("orders.colTotal") || "Total"}</TableHead>
                      <TableHead className="py-3 px-4 text-center">{t("orders.colStatus") || "Status"}</TableHead>
                      <TableHead className="py-3 px-4">{t("orders.colDate") || "Tanggal"}</TableHead>
                      <TableHead className="py-3 px-4 text-center">{t("orders.colChange") || "Aksi"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <TableRow key={o.id} className="hover:bg-gray-50/80 transition-colors">
                        <TableCell className="py-3 px-5">
                          <div>
                            <p className="font-medium text-gray-900">{o.customer_name}</p>
                            <p className="text-xs text-gray-500">{o.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4">
                          <p className="text-gray-900">{o.product_name}</p>
                          <p className="text-xs text-gray-500">× {o.quantity}</p>
                        </TableCell>
                        <TableCell className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                          Rp {o.total_amount.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          {statusBadge(o.status)}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-gray-500">
                          {new Date(o.order_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-center">
                          <Select value={o.status} onValueChange={(v) => changeStatus(o, v)} disabled={updatingId === o.id || o.status === "selesai"}>
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["baru", "konfirmasi", "dikirim", "selesai"].map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s === "baru" ? "Baru" : s === "konfirmasi" ? "Konfirmasi" : s === "dikirim" ? "Dikirim" : "Selesai"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="border rounded-xl p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{o.customer_name}</p>
                      {statusBadge(o.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {o.product_name} × {o.quantity} — <span className="font-bold text-emerald-800">Rp {o.total_amount.toLocaleString("id-ID")}</span>
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(o.order_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenId(openId === o.id ? null : o.id)}
                      className="w-full gap-2"
                    >
                      {openId === o.id ? "Sembunyikan" : "Detail"}
                    </Button>

                    {openId === o.id && (
                      <div className="mt-2 space-y-2 text-sm pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <p className="text-gray-500">📞 {o.customer_phone} • {o.payment_method.toUpperCase()}</p>
                          {o.customer_phone && (
                            <a
                              href={waUrl(o.customer_phone, o.customer_name, o.product_name, o.total_amount)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Chat WA
                            </a>
                          )}
                        </div>
                        <Select value={o.status} onValueChange={(v) => changeStatus(o, v)} disabled={updatingId === o.id || o.status === "selesai"}>
                          <SelectTrigger className="w-full h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["baru", "konfirmasi", "dikirim", "selesai"].map((s) => (
                              <SelectItem key={s} value={s}>
                                {s === "baru" ? "Baru" : s === "konfirmasi" ? "Konfirmasi" : s === "dikirim" ? "Dikirim" : "Selesai"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 text-sm">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1, status, search)}>
                  {t("orders.prev") || "Sebelumnya"}
                </Button>
                <span className="text-gray-500">{t("orders.page") || "Halaman"} {page} {t("orders.of") || "dari"} {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1, status, search)}>
                  {t("orders.next") || "Selanjutnya"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}