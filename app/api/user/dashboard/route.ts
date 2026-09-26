import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
// Sprint 04 fix: service-role + filter user_id eksplisit (session NextAuth sudah
// terautentikasi). Anon client + RLS auth.uid() gagal untuk Google user
// (tanpa Supabase Auth session) → "User tidak ditemukan".
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getActiveWebsite } from "@/lib/websites/active";
import { buildDailyTrend, buildTopProducts, type AnalyticsOrderRow } from "@/lib/analytics/aggregate";
import { getDemoDashboardStats, isDemoUserId } from "@/lib/mock/store";

interface SessionUser {
  id: string;
}

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  return user?.id ?? null;
}

// GET /api/user/dashboard — stats real toko sendiri (pengganti mock Sprint 01).
export async function GET() {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Sprint 03: stats milik website aktif (isolasi per website)
    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json(
        {
          success: true,
          data: {
            website_id: null,
            total_orders: 0,
            today_orders: 0,
            pending_orders: 0,
            month_revenue: 0,
            recent_orders: [],
            top_products: [],
            daily_trend: [],
          },
        }
      );
    }

    if (isDemoUserId(userId)) {
      const stats = getDemoDashboardStats(site.id);
      return NextResponse.json({ success: true, data: stats });
    }

    const supabase = createServiceSupabaseClient();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ count: total }, { count: today }, { count: pending }, { data: monthRows }, { data: recent }, { data: analyticsRows }] =
      await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("website_id", site.id),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("website_id", site.id)
          .gte("order_date", startOfDay.toISOString()),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("website_id", site.id)
          .eq("status", "baru"),
        supabase
          .from("orders")
          .select("total_amount")
          .eq("user_id", userId)
          .eq("website_id", site.id)
          .gte("order_date", startOfMonth.toISOString()),
        supabase
          .from("orders")
          .select("id, customer_name, product_name, total_amount, status, order_date")
          .eq("user_id", userId)
          .eq("website_id", site.id)
          .order("order_date", { ascending: false })
          .limit(5),
        // N9: agregasi analytics (top produk + tren harian) dari max 2000 order terbaru.
        supabase
          .from("orders")
          .select("product_name, quantity, total_amount, order_date")
          .eq("user_id", userId)
          .eq("website_id", site.id)
          .order("order_date", { ascending: false })
          .limit(2000),
      ]);

    const monthRevenue = (monthRows ?? []).reduce(
      (sum: number, r: { total_amount: number }) => sum + (Number(r.total_amount) || 0),
      0
    );

    const aggRows = (analyticsRows ?? []) as AnalyticsOrderRow[];

    return NextResponse.json({
      success: true,
      data: {
        website_id: site.id,
        website_name: site.name,
        total_orders: total ?? 0,
        today_orders: today ?? 0,
        pending_orders: pending ?? 0,
        month_revenue: monthRevenue,
        recent_orders: recent ?? [],
        top_products: buildTopProducts(aggRows, 5),
        daily_trend: buildDailyTrend(aggRows, 14),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
