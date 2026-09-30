"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OrderStatusData {
  id: string;
  domain: string;
  status: string;
  expires_at: string | null;
  price_yearly: number;
  registrar: string;
  auto_renew: boolean;
}

function formatDateId(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

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

const FINAL_ORDER_STATUSES = ["active", "failed", "expired", "deleted"];

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id") || "";
  const [order, setOrder] = useState<OrderStatusData | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch("/api/domains/orders");
      const json = await res.json();
      if (json.success && json.data) {
        const found = (json.data.orders as OrderStatusData[]).find((o) => o.id === orderId);
        if (found) setOrder(found);
        else setCheckError("Order tidak ditemukan");
      } else {
        setCheckError(json.error || "Gagal memeriksa status");
      }
    } catch {
      setCheckError("Terjadi gangguan koneksi");
    } finally {
      setChecking(false);
    }
  };

  // Auto-check on mount
  const [mounted, setMounted] = useState(false);
  if (!mounted) {
    setMounted(true);
    handleCheckStatus();
  }

  // Polling while not final
  const isFinal = order ? FINAL_ORDER_STATUSES.includes(order.status) : false;
  if (!isFinal && order) {
    setTimeout(() => handleCheckStatus(), 5000);
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            Pembayaran Domain Berhasil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Terima kasih! Pesanan domain Anda telah diterima. Status:
          </p>

          {order && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Domain:</span>
                <span className="font-bold text-gray-900 font-mono">{order.domain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status:</span>
                <span>{orderStatusBadge(order.status)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Registrar:</span>
                <span className="font-semibold text-gray-900">{order.registrar}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Harga/Tahun:</span>
                <span className="font-bold text-emerald-700 font-mono">Rp {order.price_yearly.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Berlaku Hingga:</span>
                <span className="font-semibold text-gray-900">{formatDateId(order.expires_at)}</span>
              </div>
              {order.auto_renew && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Auto-renew:</span>
                  <Badge variant="info" className="text-[10px]">Aktif</Badge>
                </div>
              )}
            </div>
          )}

          {!order && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memeriksa status order...</span>
            </div>
          )}

          {checkError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {checkError}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 text-sm">
            <Link href="/dashboard/domain" className="font-semibold text-emerald-700 hover:underline">
              → Kelola Domain
            </Link>
            <Link href="/dashboard/billing" className="text-gray-500 hover:text-gray-800 hover:underline">
              Kelola Billing
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DomainSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto py-10 px-4 text-sm text-gray-500">Memuat ringkasan pembayaran…</div>}>
      <SuccessContent />
    </Suspense>
  );
}