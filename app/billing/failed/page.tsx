"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BillingCycle, BillingTier } from "@/lib/billing/pricing";

const VALID_TIERS = ["free", "starter", "growth", "enterprise"] as const;
const VALID_CYCLES = ["monthly", "yearly"] as const;

function FailedContent() {
  const params = useSearchParams();
  const rawTier = (params.get("tier") || "").toLowerCase();
  const rawCycle = (params.get("cycle") || "").toLowerCase();
  const tier: BillingTier = (VALID_TIERS as readonly string[]).includes(rawTier)
    ? (rawTier as BillingTier)
    : "starter";
  const cycle: BillingCycle = (VALID_CYCLES as readonly string[]).includes(rawCycle)
    ? (rawCycle as BillingCycle)
    : "monthly";

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            Pembayaran Gagal / Dibatalkan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Pembayaran paket <strong className="uppercase">{tier}</strong> (
            {cycle === "yearly" ? "tahunan" : "bulanan"}) belum selesai. Tidak ada
            dana yang ditarik dan paket Anda tidak berubah.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Link
              href="/dashboard/settings/billing"
              className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Coba Lagi / Pilih Paket Lain
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 border border-gray-200"
            >
              Kembali ke Dashboard
            </Link>
          </div>
          <p className="text-[11px] text-gray-400">
            Butuh bantuan? Hubungi CS via WhatsApp dari halaman billing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingFailedPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto py-10 px-4 text-sm text-gray-500">Memuat…</div>}>
      <FailedContent />
    </Suspense>
  );
}
