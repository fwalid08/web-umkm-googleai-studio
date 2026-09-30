import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createPaymentProviderFromEnv } from "@/lib/payments/factory";
import { createRegistrarProviderFromEnv, getRegistrarProvider } from "@/lib/registrar/factory";
import { processDomainRegistration } from "@/lib/domains/register";
import type { PaymentProviderId } from "@/lib/payments/types";

interface DomainOrderRow {
  id: string;
  user_id: string;
  website_id: string;
  domain: string;
  status: string;
  price_yearly: number;
  registrar: string | null;
  expires_at: string | null;
  payment_provider: string | null;
  paid_at: string | null;
}

function headerMap(req: NextRequest): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  req.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

/**
 * POST /api/domains/webhook — callback Midtrans/Xendit (public, tanpa auth).
 *
 * Flow (§4.2):
 * 1. Ekstrak kandidat order_id (`order_id` midtrans/mock, `external_id` xendit)
 *    → lookup `domain_orders` by `payment_reference` (UNIQUE partial, 020).
 *    Tak dikenal (mis. notif subscription "umkm-...") → 200 + log (gateway tak retry).
 * 2. `verifyWebhook()` dengan provider TERCATAT di baris (order lama tetap
 *    pakai provider awal walau env berganti) → invalid → 403, DB tak berubah.
 * 3. `parseNotification()` → status ternormalisasi.
 * 4. Idempotency: `active && paid_at` → `deduped:true` (retry aman).
 * 5. `paid` → dua jalur:
 *    a. Pembelian awal (`pending_payment`/`registering`): set `registering` +
 *       `paid_at` → `processDomainRegistration()` (orchestrator yang mengubah
 *       ke `active`; webhook JANGAN langsung active). Gagal → 500 agar gateway
 *       retry (re-entry aman: orchestrator idempoten untuk `active`; domain
 *       unik di registrar → tak ada double-charge). Setelah 3x gagal →
 *       operator tandai `failed` + kredit manual (TANPA auto-refund;
 *       lihat follow-up retry-counter 021).
 *    b. Renewal (`active`/`expired` + `paid_at` NULL dari renew POST):
 *       `registrar.renewDomain()` (registrar TERCATAT di order) →
 *       `expires_at` += 1 tahun + `paid_at`, status kembali `active`.
 * 6. `challenged` (CC) → tetap status untuk review manual.
 * 7. `canceled`/`failed` → `expired` HANYA bila `pending_payment` (pembelian
 *    awal); payment renewal yang gagal TAK menyentuh domain aktif.
 * 8. `unknown`/`pending` → log + 200, status tak berubah.
 */
export async function POST(req: NextRequest) {
  try {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    // Kandidat order_id lintas provider (midtrans: order_id, xendit: external_id).
    const candidates = [json.order_id, json.external_id].filter(
      (v): v is string => typeof v === "string" && v.length > 0
    );
    if (candidates.length === 0) {
      return NextResponse.json({ success: false, error: "order_id hilang di notifikasi" }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();

    // Lookup order (coba tiap kandidat; yang cocok pertama menang).
    let order: DomainOrderRow | null = null;
    for (const ref of candidates) {
      const { data } = await supabase
        .from("domain_orders")
        .select("id, user_id, website_id, domain, status, price_yearly, registrar, expires_at, payment_provider, paid_at")
        .eq("payment_reference", ref)
        .maybeSingle();
      if (data) {
        order = data as DomainOrderRow;
        break;
      }
    }
    if (!order) {
      // Order tak dikenal — balas 200 agar gateway tidak retry tanpa akhir.
      console.warn("[domains/webhook] payment_reference tidak dikenal:", candidates[0]);
      return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 200 });
    }

    // Provider TERCATAT di baris (bukan env aktif) — switch provider tengah jalan aman.
    const providerId = (order.payment_provider || "midtrans") as PaymentProviderId;
    let provider;
    try {
      provider = createPaymentProviderFromEnv(providerId);
    } catch (err) {
      console.error(`[domains/webhook] provider ${providerId} tak terkonfigurasi:`, err);
      return NextResponse.json(
        { success: false, error: "Payment provider belum dikonfigurasi" },
        { status: 500 }
      );
    }

    // 1. Verifikasi signature/token — fail-closed (403, DB tak berubah).
    const rawBody = JSON.stringify(json);
    if (!provider.verifyWebhook({ headers: headerMap(req), rawBody, json })) {
      console.warn(`[domains/webhook] signature invalid untuk ${order.domain} (provider=${providerId})`);
      return NextResponse.json({ success: false, error: "Signature tidak valid" }, { status: 403 });
    }

    // 2. Normalisasi status.
    let notif;
    try {
      notif = provider.parseNotification(json);
    } catch (err) {
      console.error("[domains/webhook] parse notifikasi gagal:", err);
      return NextResponse.json({ success: false, error: "Payload tidak valid" }, { status: 400 });
    }

    // Hardening: nominal gateway vs order (signature sudah valid; beda = anomali catat saja).
    if (
      typeof notif.grossAmount === "number" &&
      Number.isFinite(notif.grossAmount) &&
      notif.grossAmount !== order.price_yearly
    ) {
      console.warn(
        `[domains/webhook] nominal beda: gateway=${notif.grossAmount} order=${order.price_yearly} (${order.domain})`
      );
    }

    // 3. Idempotency: sudah lunas untuk payment_reference ini.
    if (order.status === "active" && order.paid_at) {
      return NextResponse.json({
        success: true,
        data: { order_id: notif.orderId, status: "active", deduped: true },
      });
    }

    const now = new Date().toISOString();

    if (notif.status === "paid") {
      // Renewal: order active/expired + paid_at NULL (renew POST menukar
      // payment_reference baru). Perpanjang via registrar TERCATAT di order
      // (§12: order lama tetap pakai registrar awal walau env berganti).
      if ((order.status === "active" || order.status === "expired") && !order.paid_at) {
        let registrar;
        try {
          registrar =
            order.registrar && order.registrar !== "mock"
              ? createRegistrarProviderFromEnv(
                  order.registrar as "porkbun" | "mock"
                )
              : getRegistrarProvider();
        } catch (err) {
          console.error(`[domains/webhook] registrar tak terkonfigurasi untuk renewal ${order.domain}:`, err);
          return NextResponse.json(
            { success: false, error: "Registrar belum dikonfigurasi" },
            { status: 500 }
          );
        }
        const renewed = await registrar.renewDomain(order.domain, 1);
        if (!renewed.success) {
          console.error(`[domains/webhook] renew gagal untuk ${order.domain} (retry via gateway):`, renewed.error);
          return NextResponse.json(
            { success: false, error: "Perpanjangan domain gagal, akan dicoba lagi" },
            { status: 500 }
          );
        }
        // expires_at: pakai jawaban registrar; fallback +1 tahun dari lama/now.
        let expiresAt = renewed.expiresAt ?? null;
        if (!expiresAt) {
          const base = order.expires_at ? new Date(order.expires_at) : new Date();
          if (Number.isNaN(base.getTime())) base.setTime(Date.now());
          base.setFullYear(base.getFullYear() + 1);
          expiresAt = base.toISOString();
        }
        await supabase
          .from("domain_orders")
          .update({ status: "active", expires_at: expiresAt, paid_at: now, updated_at: now })
          .eq("id", order.id);
        return NextResponse.json({
          success: true,
          data: { order_id: notif.orderId, status: "active", renewed: true, expires_at: expiresAt },
        });
      }

      await supabase
        .from("domain_orders")
        .update({ status: "registering", paid_at: now, updated_at: now })
        .eq("id", order.id);
      try {
        await processDomainRegistration(order.id);
      } catch (err) {
        // Biarkan gateway retry (re-entry: orchestrator idempoten; domain unik).
        console.error(`[domains/webhook] registrasi gagal untuk ${order.domain} (retry via gateway):`, err);
        return NextResponse.json(
          { success: false, error: "Registrasi domain gagal, akan dicoba lagi" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { order_id: notif.orderId, status: "active" },
      });
    }

    if (notif.status === "challenged") {
      // CC perlu review manual — biarkan pending_payment, tandai di log.
      console.warn(`[domains/webhook] pembayaran challenged (review manual): ${order.domain}`);
      return NextResponse.json({
        success: true,
        data: { order_id: notif.orderId, status: order.status, challenged: true },
      });
    }

    if (notif.status === "canceled" || notif.status === "failed") {
      // Hanya pembelian AWAL (pending_payment) yang hangus → expired.
      // Payment RENEWAL yang gagal JANGAN menyentuh domain aktif (tetap jalan).
      if (order.status !== "pending_payment") {
        console.warn(
          `[domains/webhook] payment ${notif.status} untuk order ${order.status} (${order.domain}) — domain tak diubah`
        );
        return NextResponse.json({
          success: true,
          data: { order_id: notif.orderId, status: order.status, ignored: notif.rawStatus ?? notif.status },
        });
      }
      await supabase
        .from("domain_orders")
        .update({ status: "expired", updated_at: now })
        .eq("id", order.id);
      return NextResponse.json({
        success: true,
        data: { order_id: notif.orderId, status: "expired" },
      });
    }

    // pending / unknown: biarkan status, tetap 200.
    return NextResponse.json({
      success: true,
      data: { order_id: notif.orderId, status: order.status, ignored: notif.rawStatus ?? notif.status },
    });
  } catch (error) {
    console.error("POST domains webhook error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
