import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getActiveWebsite } from "@/lib/websites/active";
import { normalizeSearch, simulateAvailability, TLD_CATALOG } from "@/lib/domains/catalog";
import { z } from "zod";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

const orderSchema = z.object({
  domain: z.string().min(4).max(255),
});

// POST /api/domains/order — beli domain (SIMULASI) + auto-connect ke website aktif.
// Tahap 2: ganti blok simulasi dengan API registrar (checkAvailability real +
// register + set nameserver), status jadi registering → webhook → active.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Domain tidak valid" }, { status: 400 });
    }
    const domain = parsed.data.domain.trim().toLowerCase();
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
    if (!simulateAvailability(domain)) {
      return NextResponse.json({ success: false, error: `${domain} sudah dipakai orang lain` }, { status: 409 });
    }

    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json({ success: false, error: "Belum ada website" }, { status: 404 });
    }

    const supabase = createServiceSupabaseClient();

    // Sudah dipakai website lain (termasuk order sandbox sebelumnya)?
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

    // Simulasi pembayaran + registrasi instan (Tahap 2: Midtrans + API registrar di sini)
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    const { data: order, error: orderError } = await supabase
      .from("domain_orders")
      .insert({
        user_id: userId,
        website_id: site.id,
        domain,
        tld,
        price_yearly: info.priceYearly,
        status: "active",
        sandbox: true,
        expires_at: expires.toISOString(),
      })
      .select("id, domain, price_yearly, expires_at")
      .single();
    if (orderError || !order) {
      console.error("Domain order error:", orderError);
      return NextResponse.json({ success: false, error: "Gagal memproses order" }, { status: 500 });
    }

    // Auto-connect: domain lahir di sistem kita → langsung verified, tanpa DNS manual
    await supabase
      .from("websites")
      .update({
        custom_domain: domain,
        custom_domain_verified: true,
        custom_domain_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", site.id)
      .eq("user_id", userId);

    console.log(`[domain-order] user=${userId} site=${site.id} domain=${domain} (sandbox)`);
    return NextResponse.json(
      {
        success: true,
        data: { order, website_id: site.id, sandbox: true },
        message: `${domain} aktif dan otomatis tersambung ke website ini (simulasi).`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Domain order error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// GET /api/domains/order — riwayat order domain milik sendiri
export async function GET() {
  const session = await auth();
  const userId = getSessionUserId(session);
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("domain_orders")
    .select("id, domain, tld, price_yearly, status, sandbox, expires_at, created_at, website_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return NextResponse.json({ success: true, data: { orders: data ?? [] } });
}
