import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { isDemoUserId, setDemoUserTier } from "@/lib/mock/store";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import {
  TIER_PRICE_FALLBACK,
  calcGross,
  type BillingCycle,
  type PaidTier,
} from "@/lib/billing/pricing";

// Fallback disamakan dengan 012_pricing_unify.sql + billing-panel.tsx PLANS
// (starter 99000/79000, growth 249000/199000, enterprise 599000/479000).
// Harga utama dibaca dari DB `plans` via getPlanPriceFromDb() di bawah.
const TIER_MONTHLY_FALLBACK = {
  starter: TIER_PRICE_FALLBACK.starter,
  growth: TIER_PRICE_FALLBACK.growth,
  enterprise: TIER_PRICE_FALLBACK.enterprise,
} as const;

/** Baca harga dari DB plans (service-role); null bila tak ada / kolom belum migrasi. */
async function getPlanPriceFromDb(
  tier: PaidTier
): Promise<{ monthly: number; yearly_monthly: number } | null> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("plans")
      .select("price_monthly, price_yearly_monthly")
      .eq("slug", tier)
      .maybeSingle();
    if (error || !data) return null;
    const monthly = Number(
      (data as { price_monthly?: unknown }).price_monthly
    );
    const yearlyMonthly = Number(
      (data as { price_yearly_monthly?: unknown }).price_yearly_monthly
    );
    if (!Number.isFinite(monthly) || monthly < 0) return null;
    // Kolom price_yearly_monthly mungkin belum ada (pre-012) → fallback konstanta.
    const ym =
      Number.isFinite(yearlyMonthly) && yearlyMonthly > 0
        ? yearlyMonthly
        : TIER_MONTHLY_FALLBACK[tier].yearly_monthly;
    return { monthly, yearly_monthly: ym };
  } catch {
    return null;
  }
}

/** Gross IDR: utamakan DB plans, fallback ke konstanta 012. */
async function resolveGrossAmount(
  tier: PaidTier,
  billingCycle: BillingCycle
): Promise<number> {
  const db = await getPlanPriceFromDb(tier);
  if (db) return billingCycle === "yearly" ? db.yearly_monthly * 12 : db.monthly;
  return calcGross(tier, billingCycle);
}

const checkoutSchema = z.object({
  tier: z.enum(["starter", "growth", "enterprise"]),
  billing_cycle: z.enum(["monthly", "yearly"]).default("monthly"),
  website_id: z.string().uuid().optional(),
});

function periodEnd(from: Date, billingCycle: "monthly" | "yearly"): Date {  const d = new Date(from);
  if (billingCycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "tier harus starter|growth|enterprise" },
        { status: 400 }
      );
    }
    const { tier, billing_cycle, website_id } = parsed.data;
    // Harga utama dari DB plans (012); fallback konstanta bila DB tak terjangkau.
    const grossAmount = await resolveGrossAmount(tier, billing_cycle);
    const orderId = `umkm-${userId.slice(0, 8)}-${Date.now()}`;
    const now = new Date();
    const currentPeriodEnd = periodEnd(now, billing_cycle);

    // Demo user: tanpa DB, langsung mock agar frontend tetap jalan.
    if (isDemoUserId(userId)) {
      setDemoUserTier(userId, tier);
      return NextResponse.json({
        success: true,
        data: {
          snap_token: `mock-token-${orderId}`,
          redirect_url: `/dashboard/settings/billing?mock=1&order_id=${orderId}`,
          order_id: orderId,
          gross_amount: grossAmount,
          tier,
          billing_cycle,
          mock: true,
        },
      });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // Mode dev tanpa key: simpan subscription pending (best-effort) + mock token.
    if (!serverKey) {
      try {
        const supabase = createServiceSupabaseClient();
        await supabase.from("subscriptions").insert({
          user_id: userId,
          tier,
          status: "trialing",
          current_period_start: now.toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
          payment_gateway: "midtrans",
          payment_reference: orderId,
          snap_token: `mock-token-${orderId}`,
          billing_cycle,
        });
      } catch (e) {
        console.warn("[billing/checkout] mock subscription save skipped:", e);
      }
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      return NextResponse.json({
        success: true,
        data: {
          snap_token: `mock-token-${orderId}`,
          redirect_url: appUrl
            ? `${appUrl}/dashboard/settings/billing?mock=1&order_id=${orderId}`
            : `/dashboard/settings/billing?mock=1&order_id=${orderId}`,
          order_id: orderId,
          gross_amount: grossAmount,
          tier,
          billing_cycle,
          mock: true,
        },
      });
    }

    // Real Snap API (sandbox).
    const userEmail = (session?.user as { email?: string } | undefined)?.email || "";
    const userName = (session?.user as { name?: string } | undefined)?.name || "Pelanggan UMKM";
    let snapToken = "";
    let redirectUrl = "";
    try {
      const snapRes = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        },
        body: JSON.stringify({
          transaction_details: { order_id: orderId, gross_amount: grossAmount },
          item_details: [
            {
              id: `${tier}-${billing_cycle}`,
              price: grossAmount,
              quantity: 1,
              name: `Paket ${tier.toUpperCase()} (${billing_cycle === "yearly" ? "Tahunan" : "Bulanan"})`,
            },
          ],
          customer_details: { first_name: userName, email: userEmail || undefined },
          callbacks: website_id ? { finish: website_id } : undefined,
        }),
      });
      const snapJson = (await snapRes.json().catch(() => ({}))) as {
        token?: string;
        redirect_url?: string;
        error_messages?: string[];
      };
      if (!snapRes.ok || !snapJson.token) {
        console.error("[billing/checkout] midtrans error:", snapJson);
        return NextResponse.json(
          { success: false, error: "Gagal membuat transaksi Midtrans" },
          { status: 502 }
        );
      }
      snapToken = snapJson.token;
      redirectUrl = snapJson.redirect_url || "";
    } catch (e) {
      console.error("[billing/checkout] snap fetch error:", e);
      return NextResponse.json(
        { success: false, error: "Gagal terhubung ke Midtrans" },
        { status: 502 }
      );
    }

    // Simpan subscription (upsert per user: update pending lama atau insert baru).
    try {
      const supabase = createServiceSupabaseClient();
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const row = {
        user_id: userId,
        tier,
        status: "trialing",
        current_period_start: now.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        payment_gateway: "midtrans",
        payment_reference: orderId,
        snap_token: snapToken,
        billing_cycle,
      };
      if (existing?.id) {
        await supabase.from("subscriptions").update(row).eq("id", existing.id);
      } else {
        await supabase.from("subscriptions").insert(row);
      }
    } catch (e) {
      console.warn("[billing/checkout] subscription save skipped:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        snap_token: snapToken,
        redirect_url: redirectUrl,
        order_id: orderId,
        gross_amount: grossAmount,
        tier,
        billing_cycle,
        mock: false,
      },
    });
  } catch (error) {
    console.error("POST billing checkout error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
