import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
// Service-role + filter user_id eksplisit (pola sama seperti GET /api/orders).
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getActiveWebsite } from "@/lib/websites/active";
import { getDemoOrders, isDemoUserId } from "@/lib/mock/store";
import { escapeCsvCell } from "@/lib/analytics/aggregate";

interface SessionUser {
  id: string;
}

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  return user?.id ?? null;
}

function escapePostgrestSearch(value: string): string {
  return value.slice(0, 100).replace(/[%_(),\\]/g, "").replace(/[*"']/g, "").trim();
}

interface ExportOrder {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: string;
  order_date: string;
}

function toCsv(rows: ExportOrder[]): string {
  const header = "ID,Pelanggan,Telepon,Produk,Harga,Qty,Total,Status,Tanggal";
  const lines = rows.map((o) =>
    [
      o.id,
      o.customer_name,
      o.customer_phone,
      o.product_name,
      o.product_price,
      o.quantity,
      o.total_amount,
      o.status,
      o.order_date,
    ]
      .map(escapeCsvCell)
      .join(",")
  );
  // BOM agar Excel Indonesia membuka UTF-8 dengan benar.
  return `﻿${[header, ...lines].join("\n")}`;
}

// GET /api/orders/export — CSV semua order terfilter (tanpa pagination, cap 5000).
// Filter sama seperti GET /api/orders: ?status=&search=&date_from=&date_to=
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

    if (status && !["baru", "konfirmasi", "dikirim", "selesai"].includes(status)) {
      return NextResponse.json({ success: false, error: "Status tidak valid" }, { status: 400 });
    }

    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Belum ada website. Buat dulu di panel Website." },
        { status: 404 }
      );
    }

    let rows: ExportOrder[];
    if (isDemoUserId(userId)) {
      const demo = getDemoOrders(site.id, {
        status: status || undefined,
        search,
        page: 1,
        limit: 5000,
      });
      rows = demo.orders as unknown as ExportOrder[];
    } else {
      const supabase = createServiceSupabaseClient();
      let query = supabase
        .from("orders")
        .select("id, customer_name, customer_phone, product_name, product_price, quantity, total_amount, status, order_date")
        .eq("user_id", userId)
        .eq("website_id", site.id);

      if (status) query = query.eq("status", status);
      const safeSearch = search ? escapePostgrestSearch(search) : "";
      if (safeSearch) query = query.or(`customer_name.ilike.%${safeSearch}%,product_name.ilike.%${safeSearch}%`);
      if (dateFrom) query = query.gte("order_date", dateFrom);
      if (dateTo) query = query.lte("order_date", dateTo);

      const { data, error } = await query.order("order_date", { ascending: false }).range(0, 4999);
      if (error) {
        console.error("Export orders error:", error);
        return NextResponse.json({ success: false, error: "Gagal mengekspor order" }, { status: 500 });
      }
      rows = (data ?? []) as ExportOrder[];
    }

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${stamp}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export orders error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
