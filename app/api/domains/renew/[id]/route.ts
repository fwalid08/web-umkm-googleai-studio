import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { isDemoUserId } from "@/lib/mock/store";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { buildDomainOrderId, type PaymentProviderId } from "@/lib/payments/types";
import { getPaymentProvider, MockPaymentProvider } from "@/lib/payments/factory";
import { checkRateLimit } from "@/lib/rate/limit";
import { domainRenewSchema, type DomainCheckoutResponse } from "@/types/domains";

// Status yang boleh diperpanjang: aktif (+ grace renewal bila expired).
const RENEWABLE_STATUSES = ["active", "expired"] as const;

interface RenewOrderRow {
  id: string;
  user_id: string;
  domain: string;
  status: string;
  price_yearly: number;
  payment_reference: string | null;
  payment_provider: string | null;
  paid_at: string | null;
}

/**
 * POST /api/domains/renew/[id] — perpanjang domain 1 tahun.
 * Body: { cycle: "yearly" } (domainRenewSchema).
 * Response: { success: true, data: DomainCheckoutResponse } (payment BARU).
 *
 * Flow (§4.2): ownership → hanya active/expired → payment_reference BARU
 * (order_id "domain-...") + `paid_at = NULL` (menunggu bayar, status TAK
 * diubah agar domain tetap jalan) → payment driver → webhook `paid`
 * memanggil `registrar.renewDomain()` → `expires_at` += 1 tahun.
 *
 * Harga dikunci `price_yearly` saat beli (repricing dinamis = future work).
 *
 * [Deviasi spec]: tanpa blokir tier Free — renewal mempertahankan aset yang
 * sudah dimiliki (blokir = domain hangus). Gate Free tetap berlaku untuk
 * pembelian domain BARU (checkout).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const limit = await checkRateLimit(`domain-renew:${userId}`, 10, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Terlalu sering, coba lagi sebentar" },
        { status: 429 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = domainRenewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Body tidak valid" },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const { data } = await supabase
      .from("dom_orders")
      .select("id, user_id, domain, status, price_yearly, payment_reference, payment_provider, paid_at")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    const order = data as RenewOrderRow | null;
    if (!order) {
      return NextResponse.json({ success: false, error: "Order domain tidak ditemukan" }, { status: 404 });
    }
    if (!(RENEWABLE_STATUSES as readonly string[]).includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            order.status === "pending_payment"
              ? "Selesaikan pembayaran pertama dulu sebelum perpanjang"
              : `Domain status ${order.status} tidak bisa diperpanjang. Hubungi support.`,
        },
        { status: 409 }
      );
    }

    const grossAmount = order.price_yearly;
    if (!Number.isInteger(grossAmount) || grossAmount <= 0) {
      return NextResponse.json({ success: false, error: "Harga order tidak valid" }, { status: 500 });
    }

    // Payment driver (fallback mock di dev tanpa kredensial — preseden checkout).
    let paymentProvider;
    let paymentProviderId: PaymentProviderId;
    try {
      paymentProvider = getPaymentProvider();
      paymentProviderId = paymentProvider.id;
    } catch (err) {
      console.warn("[domains/renew] payment provider fallback ke mock (dev):", err);
      paymentProvider = new MockPaymentProvider();
      paymentProviderId = "mock";
    }

    const orderId = buildDomainOrderId(userId);

    // Demo user: tanpa DB, langsung mock.
    if (isDemoUserId(userId)) {
      const mock = new MockPaymentProvider();
      const tx = await mock.createTransaction({
        orderId,
        grossAmount,
        itemName: `Perpanjang ${order.domain} (1 tahun)`,
      });
      const demoData: DomainCheckoutResponse = {
        provider: tx.provider,
        order_id: tx.orderId,
        redirect_url: tx.redirectUrl,
        token: tx.token,
        gross_amount: tx.grossAmount,
        mock: true,
      };
      return NextResponse.json({ success: true, data: demoData }, { status: 201 });
    }

    // Tandai menunggu pembayaran renewal (status TAK diubah — domain tetap jalan).
    const prevRef = order.payment_reference;
    const prevPaidAt = order.paid_at;
    const { error: markError } = await supabase
      .from("dom_orders")
      .update({
        payment_reference: orderId,
        payment_provider: paymentProviderId,
        paid_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    if (markError) {
      console.error("[domains/renew] tandai renewal gagal:", markError);
      return NextResponse.json({ success: false, error: "Gagal membuat renewal" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    try {
      const tx = await paymentProvider.createTransaction({
        orderId,
        grossAmount,
        itemName: `Perpanjang ${order.domain} (1 tahun)`,
        ...(appUrl ? { successRedirectUrl: `${appUrl}/billing/domain-success?order_id=${orderId}` } : {}),
      });
      const resData: DomainCheckoutResponse = {
        provider: tx.provider,
        order_id: tx.orderId,
        redirect_url: tx.redirectUrl,
        token: tx.token,
        gross_amount: tx.grossAmount,
        mock: tx.mock,
      };
      return NextResponse.json({ success: true, data: resData }, { status: 201 });
    } catch (err) {
      // Kembalikan penanda lama (best-effort) agar webhook payment lama tetap valid.
      console.error("[domains/renew] createTransaction gagal:", err);
      await supabase
        .from("dom_orders")
        .update({
          payment_reference: prevRef,
          paid_at: prevPaidAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
      return NextResponse.json(
        { success: false, error: "Gagal membuat transaksi pembayaran. Coba lagi nanti." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("POST domains renew error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
