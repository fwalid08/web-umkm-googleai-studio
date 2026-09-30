import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { isDemoUserId } from "@/lib/mock/store";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getActiveWebsite } from "@/lib/websites/active";
import { checkCustomDomainLimit } from "@/lib/billing/limits";
import { normalizeSearch, TLD_CATALOG } from "@/lib/domains/catalog";
import { retailPriceForProvider } from "@/lib/domains/pricing";
import { getRegistrarProvider } from "@/lib/registrar/factory";
import {
  buildDomainOrderId,
  type PaymentProviderId,
} from "@/lib/payments/types";
import { getPaymentProvider, MockPaymentProvider } from "@/lib/payments/factory";
import { checkRateLimit } from "@/lib/rate/limit";
import { domainCheckoutSchema, type DomainCheckoutResponse } from "@/types/domains";

/**
 * POST /api/domains/checkout — buat order domain + transaksi payment.
 * Body: { domain: "tokoku.com", cycle: "yearly" } (domainCheckoutSchema).
 * Response: { success: true, data: DomainCheckoutResponse }.
 *
 * Flow (§4.2): auth → gate tier → re-check registrar → harga calcDomainPrice →
 * insert pending_payment (payment_reference = order_id "domain-...") →
 * payment driver (Midtrans Snap / Xendit invoice / mock).
 * Registrasi domain TIDAK di sini — webhook `paid` yang memicu orchestrator.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit checkout (lebih ketat dari search): 10 req/menit/user.
    const limit = await checkRateLimit(`domain-checkout:${userId}`, 10, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Terlalu sering, coba lagi sebentar" },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = domainCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Domain tidak valid" },
        { status: 400 }
      );
    }
    const domain = parsed.data.domain;

    const supabase = createServiceSupabaseClient();

    // Website aktif + tier user (untuk gate custom domain).
    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json({ success: false, error: "Belum ada website" }, { status: 404 });
    }
    let tier = "free";
    try {
      const { data: user } = await supabase
        .from("users")
        .select("tier")
        .eq("id", userId)
        .maybeSingle();
      tier = (user as { tier?: string } | null)?.tier || "free";
    } catch (err) {
      console.error("[domains/checkout] tier lookup gagal:", err);
    }

    // Gate: Free tidak boleh checkout custom domain (403 + upgrade_url).
    const gate = await checkCustomDomainLimit(userId, tier);
    if (!gate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: gate.message ?? "Custom domain tidak tersedia di paket ini",
          upgrade_url: gate.upgradeUrl ?? "/dashboard/billing",
        },
        { status: 403 }
      );
    }

    // TLD harus didukung + buyable (dokumen .id manual → 422 + requirement).
    const tld = domain.split(".").slice(1).join(".");
    const info = TLD_CATALOG.find((t) => t.tld === tld);
    if (!info || normalizeSearch(domain, tld) !== domain) {
      return NextResponse.json({ success: false, error: "Domain/TLD tidak didukung" }, { status: 400 });
    }
    if (!info.buyable) {
      return NextResponse.json(
        { success: false, error: info.requirement ?? "TLD belum tersedia" },
        { status: 422 }
      );
    }

    // Resolve registrar driver (factory throw bila kredensial real belum diset).
    let registrar;
    try {
      registrar = getRegistrarProvider();
    } catch (err) {
      console.error("[domains/checkout] registrar misconfigured:", err);
      return NextResponse.json(
        { success: false, error: "Layanan domain belum dikonfigurasi. Coba lagi nanti." },
        { status: 502 }
      );
    }
    const registrarId = registrar.id;

    // Re-check availability real (tolak bila sudah laku sejak search).
    // Satu call dipakai juga untuk harga (hemat 1 round-trip registrar).
    let wholesaleIdr = 0;
    try {
      const check = await registrar.checkAvailability(domain);
      if (!check.available) {
        return NextResponse.json(
          { success: false, error: `${domain} sudah dipakai orang lain` },
          { status: 409 }
        );
      }
      wholesaleIdr = check.priceYearly;
    } catch (err) {
      // Re-check gagal (registrar down) → blokir checkout (jangan jual yang tak bisa dicek).
      console.error(`[domains/checkout] re-check gagal untuk ${domain}:`, err);
      return NextResponse.json(
        { success: false, error: "Tidak bisa memastikan ketersediaan domain saat ini. Coba lagi nanti." },
        { status: 502 }
      );
    }

    // Harga jual (IDR utuh): mock = katalog; real = grosir + margin + fee.
    // Fail-closed untuk provider real: jangan jual bila harga grosir tak terbaca.
    let grossAmount = retailPriceForProvider(registrarId, wholesaleIdr);
    if (!Number.isInteger(grossAmount) || grossAmount <= 0) {
      if (registrarId !== "mock") {
        console.error(`[domains/checkout] harga grosir tak terbaca untuk ${domain} (provider=${registrarId})`);
        return NextResponse.json(
          { success: false, error: "Tidak bisa menghitung harga domain saat ini. Coba lagi nanti." },
          { status: 502 }
        );
      }
      grossAmount = info.priceYearly;
    }

    // Clash: domain sudah dipakai website lain / order aktif.
    const { data: clashSite } = await supabase
      .from("websites")
      .select("id")
      .eq("custom_domain", domain)
      .neq("id", site.id)
      .maybeSingle();
    if (clashSite) {
      return NextResponse.json({ success: false, error: "Domain sudah dipakai website lain" }, { status: 409 });
    }
    const { data: taken } = await supabase
      .from("domain_orders")
      .select("id")
      .eq("domain", domain)
      .eq("status", "active")
      .maybeSingle();
    if (taken) {
      return NextResponse.json({ success: false, error: "Domain sudah dibeli sebelumnya" }, { status: 409 });
    }

    // order_id unik prefix "domain-" (terpisah dari "umkm-" subscription).
    const orderId = buildDomainOrderId(userId);
    const sandbox = registrarId === "mock";

    // Resolve payment driver — fallback mock di dev tanpa kredensial
    // (preseden billing/checkout: jangan 500 hanya karena key belum diset).
    let paymentProvider;
    let paymentProviderId: PaymentProviderId;
    try {
      paymentProvider = getPaymentProvider();
      paymentProviderId = paymentProvider.id;
    } catch (err) {
      console.warn("[domains/checkout] payment provider fallback ke mock (dev):", err);
      paymentProvider = new MockPaymentProvider();
      paymentProviderId = "mock";
    }

    // Demo user: tanpa DB (FK UUID), langsung mock agar frontend tetap jalan.
    if (isDemoUserId(userId)) {
      const mock = new MockPaymentProvider();
      const tx = await mock.createTransaction({
        orderId,
        grossAmount,
        itemName: `Domain ${domain} (1 tahun)`,
      });
      const data: DomainCheckoutResponse = {
        provider: tx.provider,
        order_id: tx.orderId,
        redirect_url: tx.redirectUrl,
        token: tx.token,
        gross_amount: tx.grossAmount,
        mock: true,
      };
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    // Insert order pending_payment (idempotency key = payment_reference).
    const { data: order, error: orderError } = await supabase
      .from("domain_orders")
      .insert({
        user_id: userId,
        website_id: site.id,
        domain,
        tld,
        price_yearly: grossAmount,
        status: "pending_payment",
        registrar: registrarId,
        payment_reference: orderId,
        payment_provider: paymentProviderId,
        sandbox,
      })
      .select("id")
      .single();
    if (orderError || !order) {
      console.error("[domains/checkout] insert order gagal:", orderError);
      return NextResponse.json({ success: false, error: "Gagal membuat order domain" }, { status: 500 });
    }

    // Buat transaksi payment (Snap / invoice / mock).
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    try {
      const tx = await paymentProvider.createTransaction({
        orderId,
        grossAmount,
        itemName: `Domain ${domain} (1 tahun)`,
        ...(appUrl ? { successRedirectUrl: `${appUrl}/billing/domain-success?order_id=${orderId}` } : {}),
      });
      const data: DomainCheckoutResponse = {
        provider: tx.provider,
        order_id: tx.orderId,
        redirect_url: tx.redirectUrl,
        token: tx.token,
        gross_amount: tx.grossAmount,
        mock: tx.mock,
      };
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (err) {
      // Transaksi payment gagal → tandai order expired agar tak menggantung pending selamanya.
      console.error("[domains/checkout] createTransaction gagal:", err);
      await supabase
        .from("domain_orders")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", (order as { id: string }).id);
      return NextResponse.json(
        { success: false, error: "Gagal membuat transaksi pembayaran. Coba lagi nanti." },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("POST domains checkout error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
