import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { updateOrderStatusSchema, type OrderStatus } from "@/types";
import { canTransition } from "@/lib/orders/validation";
import { getActiveWebsite } from "@/lib/websites/active";
import { isDemoUserId, updateDemoOrderStatus } from "@/lib/mock/store";

interface SessionUser {
  id: string;
}

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  return user?.id ?? null;
}

// PUT /api/orders/[id]/status — update workflow (auth, milik sendiri).
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Order id wajib diisi" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (isDemoUserId(userId)) {
      updateDemoOrderStatus(id, parsed.data.status);
      return NextResponse.json({ success: true, data: { order: { id, status: parsed.data.status } } });
    }

    const supabase = createServiceSupabaseClient();
    // Sprint 03: order harus milik website aktif (isolasi per website)
    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }
    const { data: existing } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("website_id", site.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ success: false, error: "Order tidak ditemukan" }, { status: 404 });
    }

    const from = existing.status as OrderStatus;
    const to = parsed.data.status;
    if (!canTransition(from, to)) {
      return NextResponse.json(
        { success: false, error: `Transisi ${from} → ${to} tidak diizinkan` },
        { status: 422 }
      );
    }

    // updated_at di-set eksplisit sebagai fallback jika trigger
    // update_orders_updated_at (004/005) belum dijalankan di Supabase.
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status: to, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .eq("website_id", site.id)
      .select("*")
      .single();

    if (error || !updated) {
      console.error("Update order status error:", error);
      return NextResponse.json({ success: false, error: "Gagal update status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { order: updated } });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
