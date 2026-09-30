"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatIdr } from "@/lib/domains/pricing";

interface DnsRecordEntry {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

interface DomainOrder {
  id: string;
  domain: string;
  tld: string;
  price_yearly: number;
  status: string;
  registrar: string;
  dns_records: DnsRecordEntry[];
  auto_renew: boolean;
  expires_at: string | null;
  created_at: string;
}

const FINAL_ORDER_STATUSES = ["active", "failed", "expired", "deleted"];

function orderStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Aktif Terhubung</Badge>;
    case "registering":
      return <Badge variant="info">Didaftarkan...</Badge>;
    case "pending_payment":
      return <Badge variant="warning">Menunggu Bayar</Badge>;
    case "failed":
      return <Badge variant="destructive">Gagal</Badge>;
    case "expired":
      return <Badge variant="secondary">Kadaluarsa</Badge>;
    case "transfer_in":
      return <Badge variant="info">Transfer...</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDateId(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

export default function DomainOrdersPage() {
  const { t } = useLang();
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  async function loadOrders() {
    try {
      setError(null);
      const res = await fetch("/api/domains/orders");
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data.orders || []);
      } else {
        setError(json.error ?? "Gagal memuat order domain");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // Polling untuk order non-final
  const hasPendingOrder = orders.some((o) => !FINAL_ORDER_STATUSES.includes(o.status));
  useEffect(() => {
    if (!hasPendingOrder) return;
    const id = setInterval(() => loadOrders(), 5000);
    return () => clearInterval(id);
  }, [hasPendingOrder]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto" aria-label="Memuat order domain">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Gagal Memuat Order
            </h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={loadOrders} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-gray-100 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Order Domain Saya
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola domain yang sudah dibeli: perpanjang, lihat DNS, atur auto-renew.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Belum Ada Order Domain
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Beli domain custom untuk toko Anda agar terlihat lebih profesional.
            </p>
            <Link href="/dashboard/domain?tab=buy">
              <Button>
                <Globe className="w-4 h-4 mr-2" />
                Beli Domain Baru
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daftar Order Domain ({orders.length})</CardTitle>
            <CardDescription>
              Status <Badge variant="info">Didaftarkan...</Badge> akan berubah otomatis menjadi
              <Badge variant="success">Aktif Terhubung</Badge> setelah DNS terverifikasi (maks 60 detik).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Harga/Tahun</TableHead>
                    <TableHead>Berlaku Hingga</TableHead>
                    <TableHead>Auto-renew</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono font-bold text-gray-900 dark:text-white">
                        {o.domain}
                      </TableCell>
                      <TableCell>{orderStatusBadge(o.status)}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-900 dark:text-white">
                        {formatIdr(o.price_yearly)}/thn
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDateId(o.expires_at)}</TableCell>
                      <TableCell>
                        {o.auto_renew ? (
                          <Badge variant="info" className="text-[10px]">Aktif</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Mati</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {o.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link href={`/api/domains/renew/${o.id}`}>
                                Perpanjang
                              </Link>
                            </Button>
                          )}
                          {o.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(o.domain)}
                              className="h-8 w-8 p-0"
                              aria-label="Salin domain"
                            >
                              {copiedValue === o.domain ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          {o.dns_records && o.dns_records.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/dashboard/domain?dns=${o.domain}`}>
                                <Globe className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}