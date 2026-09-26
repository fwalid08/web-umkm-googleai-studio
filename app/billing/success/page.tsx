"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TIER_PRICE_FALLBACK,
  calcGross,
  type BillingCycle,
  type BillingTier,
} from "@/lib/billing/pricing";

const VALID_TIERS: BillingTier[] = ["free", "starter", "growth", "enterprise"];
const VALID_CYCLES: BillingCycle[] = ["monthly", "yearly"];

function formatIDR(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

interface StatusData {
  tier: string;
  status: string;
  current_period_end: string | null;
  billing_cycle: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const rawTier = (params.get("tier") || "").toLowerCase();
  const rawCycle = (params.get("cycle") || "").toLowerCase();
  const tier: BillingTier = VALID_TIERS.includes(rawTier as BillingTier)
    ? (rawTier as BillingTier)
    : "starter";
  const cycle: BillingCycle = VALID_CYCLES.includes(rawCycle as BillingCycle)
    ? (rawCycle as BillingCycle)
    : "monthly";

  const price = TIER_PRICE_FALLBACK[tier];
  const gross = calcGross(tier, cycle);

  const [status, setStatus] = useState<StatusData | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setCheckError(null);
    try {
      const res = await fetch("/api/billing/status");
      const json = (await res.json()) as {
        success: boolean;
        data?: StatusData;
        error?: string;
      };
      if (json.success && json.data) {
        setStatus(json.data);
      } else {
        setCheckError(json.error || "Gagal memeriksa status");
      }
    } catch {
      setCheckError("Terjadi gangguan koneksi");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            Pembayaran Berhasil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Terima kasih! Pesanan paket Anda telah diterima. Ringkasan:
          </p>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Paket:</span>
              <span className="font-bold text-gray-900 uppercase">{tier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Siklus:</span>
              <span className="font-semibold text-gray-900">
                {cycle === "yearly" ? "Tahunan (hemat 20%)" : "Bulanan"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {cycle === "yearly"
                  ? `${formatIDR(gross)} / tahun`
                  : `${formatIDR(price.monthly)} / bulan`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            {checking ? "Memeriksa..." : "Cek Status Pembayaran"}
          </button>

          {checkError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {checkError}
            </p>
          )}
          {status && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
              <p>
                <span className="text-gray-500">Tier aktif: </span>
                <strong className="uppercase">{status.tier}</strong>
              </p>
              <p>
                <span className="text-gray-500">Status: </span>
                <strong>{status.status}</strong>
              </p>
              {status.current_period_end && (
                <p>
                  <span className="text-gray-500">Berlaku hingga: </span>
                  <strong>
                    {new Date(status.current_period_end).toLocaleDateString("id-ID")}
                  </strong>
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-sm">
            <Link href="/dashboard" className="font-semibold text-emerald-700 hover:underline">
              → Ke Dashboard
            </Link>
            <Link
              href="/dashboard/settings/billing"
              className="text-gray-500 hover:text-gray-800 hover:underline"
            >
              Kelola Billing
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto py-10 px-4 text-sm text-gray-500">Memuat ringkasan pembayaran…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
