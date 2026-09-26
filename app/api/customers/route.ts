import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
// Service-role + filter user_id eksplisit (pola sama seperti /api/orders):
// session NextAuth sudah terautentikasi, anon client + RLS gagal untuk Google user.
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getActiveWebsite } from "@/lib/websites/active";
import { getDemoCustomers, isDemoUserId } from "@/lib/mock/store";
import { buildCustomers, type AnalyticsOrderRow } from "@/lib/analytics/aggregate";

interface SessionUser {
  id: string;
}

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  return user?.id ?? null;
}

// GET /api/customers — daftar customer unik milik website aktif.
// Agregasi dari orders: name, phone, email, total_orders, total_spent, last_order.
// Query: ?search=&page=&limit=
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sp = request.nextUrl.searchParams;
    const search = (sp.get("search") ?? "").trim().slice(0, 100);
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(sp.get("limit")) || 20));

    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Belum ada website. Buat dulu di panel Website." },
        { status: 404 }
      );
    }

    if (isDemoUserId(userId)) {
      return NextResponse.json({
        success: true,
        data: getDemoCustomers(site.id, { search, page, limit }),
      });
    }

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("customer_name, customer_phone, customer_email, total_amount, order_date")
      .eq("user_id", userId)
      .eq("website_id", site.id)
      .order("order_date", { ascending: false })
      .limit(5000);

    if (error) {
      console.error("List customers error:", error);
      return NextResponse.json({ success: false, error: "Gagal memuat pelanggan" }, { status: 500 });
    }

    let customers = buildCustomers((data ?? []) as AnalyticsOrderRow[]);
    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    const total = customers.length;
    const from = (page - 1) * limit;
    return NextResponse.json({
      success: true,
      data: {
        customers: customers.slice(from, from + limit),
        total,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("List customers error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
