import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
// Sprint 04 fix: service-role + filter user_id eksplisit (session NextAuth sudah
// terautentikasi). Anon client + RLS auth.uid() gagal untuk Google user
// (tanpa Supabase Auth session) → "User tidak ditemukan".
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { createOrderSchema } from "@/types";
import { calcTotal, isRateLimited } from "@/lib/orders/validation";
import { resolveTenantId } from "@/lib/orders/tenant";
import { getActiveWebsite } from "@/lib/websites/active";
import { getDemoOrders, isDemoUserId } from "@/lib/mock/store";

interface SessionUser {
  id: string;
}

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  return user?.id ?? null;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// POST /api/orders — guest checkout PUBLIK (tanpa auth).
// Tenant di-resolve server-side dari body.subdomain; insert via service-role.
// Response pesan auto F5: "Terima kasih order! Kami akan konfirmasi dalam 24 jam".
export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(`order:${clientIp(request)}`)) {
      return NextResponse.json(
        { success: false, error: "Terlalu banyak order. Coba lagi 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const tenant = await resolveTenantId(input.subdomain);
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Toko tidak ditemukan" }, { status: 404 });
    }

    const total = calcTotal(input.product_price, input.quantity);
    if (total < 0) {
      return NextResponse.json({ success: false, error: "Harga/jumlah tidak valid" }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: tenant.userId,
        website_id: tenant.websiteId,
        product_name: input.product_name,
        product_price: input.product_price,
        quantity: input.quantity,
        total_amount: total,
        status: "baru",
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email || null,
        payment_method: input.payment_method,
        payment_status: "pending",
        delivery_address: input.delivery_address || null,
        notes: input.notes || null,
      })
      .select("id")
      .single();

    if (error || !order) {
      console.error("Create order error:", error);
      return NextResponse.json({ success: false, error: "Gagal membuat order" }, { status: 500 });
    }

    // Notifikasi owner Sprint 02 = log server (email/Telegram → Sprint 03 jika env ada)
    console.log(`[new-order] tenant=${tenant.subdomain} order=${order.id} total=${total}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          order_id: order.id,
          message: "Terima kasih order! Kami akan konfirmasi dalam 24 jam",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// GET /api/orders — list milik sendiri (auth + RLS). Filter + search + pagination.
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const status = sp.get("status");
    const search = (sp.get("search") ?? "").trim();
    const dateFrom = sp.get("date_from");
    const dateTo = sp.get("date_to");
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));

    if (status && !["baru", "konfirmasi", "dikirim", "selesai"].includes(status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400 });
    }

    // Sprint 03: isolasi per website aktif
    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Belum ada website. Buat dulu di panel Website." },
        { status: 404 }
      );
    }

    if (isDemoUserId(userId)) {
      const demoRes = getDemoOrders(site.id, {
        status: status || undefined,
        search,
        page,
        limit,
      });
      return NextResponse.json({
        success: true,
        data: demoRes,
      });
    }

    const supabase = createServiceSupabaseClient();
    let query = supabase
      .from("orders")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("website_id", site.id);

    if (status) query = query.eq("status", status);
    if (search) query = query.or(`customer_name.ilike.%${search}%,product_name.ilike.%${search}%`);
    if (dateFrom) query = query.gte("order_date", dateFrom);
    if (dateTo) query = query.lte("order_date", dateTo);

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order("order_date", { ascending: false })
      .range(from, from + limit - 1);

    if (error) {
      console.error("List orders error:", error);
      return NextResponse.json({ success: false, error: "Gagal memuat order" }, { status: 500 });
    }

    const total = count ?? 0;
    return NextResponse.json({
      success: true,
      data: {
        orders: data ?? [],
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("List orders error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
