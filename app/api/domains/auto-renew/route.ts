import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isAuthorizedCronRequest } from "@/lib/cron/secret";
import { buildDomainOrderId } from "@/lib/payments/types";
import { getPaymentProvider } from "@/lib/payments/factory";

interface AutoRenewOrderRow {
  id: string;
  user_id: string;
  domain: string;
  price_yearly: number;
  paid_at: string | null;
  expires_at: string | null;
}

/**
 * POST /api/domains/auto-renew — cron harian 19:00 UTC (02:00 WIB).
 *
 * Untuk order `active` + `auto_renew=true` yang expiry ≤ 14 hari:
 * buat payment via payment driver (Midtrans Snap / Xendit invoice) —
 * webhook `paid` yang mengeksekusi `registrar.renewDomain()`
 * (cabang renewal Batch 2) → `expires_at` += 1 tahun.
 *
 * Guard:
 * - `paid_at` NULL = payment renewal SUDAH menunggu (cron kemarin / renew
 *   manual) → skip (anti-duplikat invoice).
 * - Provider `mock` → skip (tanpa gateway tak ada yang membayar invoice;
 *   cron ini bermakna untuk midtrans/xendit).
 * - Cek saldo reseller: driver `RegistrarProvider` tak expose API saldo
 *   → cek dilewati + alert log (§8.3 "bila tidak support → skip + alert").
 *   Kegagalan dana terdeteksi saat `renewDomain()` (webhook 500 → retry)
 *   + error tercatat di log untuk top-up manual.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let paymentProvider;
    try {
      paymentProvider = getPaymentProvider();
    } catch (err) {
      console.error("[domains/auto-renew] payment provider tak terkonfigurasi:", err);
      return NextResponse.json(
        { success: false, error: "Payment provider belum dikonfigurasi" },
        { status: 500 }
      );
    }
    if (paymentProvider.id === "mock") {
      console.log("[domains/auto-renew] dilewati: provider mock (tanpa gateway)");
      return NextResponse.json({
        success: true,
        data: { invoiced: 0, skipped: 0, failed: 0, reason: "mock-provider" },
      });
    }

    const supabase = createServiceSupabaseClient();
    const now = new Date();
    const in14d = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = now.toISOString();

    const { data: due, error: fetchError } = await supabase
      .from("dom_orders")
      .select("id, user_id, domain, price_yearly, paid_at, expires_at")
      .eq("status", "active")
      .eq("auto_renew", true)
      .lte("expires_at", in14d)
      .order("expires_at", { ascending: true })
      .limit(50);
    if (fetchError) {
      console.error("[domains/auto-renew] fetch gagal:", fetchError);
      return NextResponse.json({ success: false, error: "Gagal memuat order" }, { status: 500 });
    }

    let invoiced = 0;
    let skipped = 0;
    let failed = 0;
    const results: Array<{ domain: string; status: string; order_id?: string }> = [];

    for (const o of (due ?? []) as AutoRenewOrderRow[]) {
      // Payment renewal sudah menunggu (paid_at NULL eksplisit dari renew
      // POST / cron kemarin) → jangan buat invoice ganda.
      if (o.paid_at === null) {
        skipped++;
        results.push({ domain: o.domain, status: "skipped-pending-payment" });
        continue;
      }
      if (!Number.isInteger(o.price_yearly) || o.price_yearly <= 0) {
        console.warn(`[domains/auto-renew] harga invalid ${o.domain}, dilewati`);
        skipped++;
        results.push({ domain: o.domain, status: "skipped-bad-price" });
        continue;
      }

      const orderId = buildDomainOrderId(o.user_id);
      const { error: markError } = await supabase
        .from("dom_orders")
        .update({
          payment_reference: orderId,
          payment_provider: paymentProvider.id,
          paid_at: null,
          updated_at: nowIso,
        })
        .eq("id", o.id);
      if (markError) {
        console.error(`[domains/auto-renew] tandai gagal ${o.domain}:`, markError);
        failed++;
        results.push({ domain: o.domain, status: "failed-mark" });
        continue;
      }

      try {
        await paymentProvider.createTransaction({
          orderId,
          grossAmount: o.price_yearly,
          itemName: `Auto-renew ${o.domain} (1 tahun)`,
        });
        invoiced++;
        results.push({ domain: o.domain, status: "invoiced", order_id: orderId });
      } catch (err) {
        console.error(`[domains/auto-renew] invoice gagal ${o.domain}:`, err);
        failed++;
        results.push({ domain: o.domain, status: "failed-invoice" });
      }
    }

    return NextResponse.json({
      success: true,
      data: { invoiced, skipped, failed, results },
    });
  } catch (error) {
    console.error("POST domains auto-renew error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
