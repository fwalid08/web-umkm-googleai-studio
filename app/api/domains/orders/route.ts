import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate/limit";
import { domainStatusSchema, type DomainOrder } from "@/types/domains";

// Kolom eksplisit (tanpa select *) — sesuai 008 + 020.
const ORDER_COLUMNS =
  "id, user_id, website_id, domain, tld, price_yearly, status, registrar, " +
  "registrar_domain_id, nameservers, dns_records, verification_token, auto_renew, " +
  "reseller_tier, payment_reference, expires_at, sandbox, created_at, updated_at";

// GET /api/domains/orders — riwayat order domain milik sendiri.
// Response: { success: true, data: { orders: DomainOrder[] } } (terbaru dulu).
export async function GET() {
  const session = await auth();
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const limit = await checkRateLimit(`domain-orders:${userId}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: "Terlalu sering, coba lagi sebentar" },
      { status: 429 }
    );
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("domain_orders")
      .select(ORDER_COLUMNS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[domains/orders] fetch gagal:", error);
      return NextResponse.json({ success: false, error: "Gagal memuat order domain" }, { status: 500 });
    }

    // Normalisasi ke DomainOrder (status legacy di luar enum → "failed" aman).
    const orders: DomainOrder[] = ((data ?? []) as unknown[]).map((row) => {
      const r = row as Record<string, unknown>;
      const statusParsed = domainStatusSchema.safeParse(r.status);
      return {
        id: String(r.id),
        user_id: String(r.user_id),
        website_id: String(r.website_id),
        domain: String(r.domain),
        tld: String(r.tld ?? ""),
        price_yearly: Number(r.price_yearly ?? 0),
        status: statusParsed.success ? statusParsed.data : "failed",
        registrar: typeof r.registrar === "string" ? r.registrar : "mock",
        registrar_domain_id: (r.registrar_domain_id as string | null) ?? null,
        nameservers: Array.isArray(r.nameservers) ? (r.nameservers as string[]) : [],
        dns_records: Array.isArray(r.dns_records) ? (r.dns_records as DomainOrder["dns_records"]) : [],
        verification_token: (r.verification_token as string | null) ?? null,
        auto_renew: r.auto_renew !== false,
        reseller_tier: (r.reseller_tier as string | null) ?? null,
        payment_reference: (r.payment_reference as string | null) ?? null,
        expires_at: (r.expires_at as string | null) ?? null,
        sandbox: r.sandbox !== false,
        created_at: String(r.created_at ?? ""),
        updated_at: String(r.updated_at ?? ""),
      };
    });

    return NextResponse.json({ success: true, data: { orders } });
  } catch (error) {
    console.error("GET domains orders error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
