import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { isDemoUserId } from "@/lib/mock/store";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const productIds = body?.productIds as string[] | undefined;
    // F2-6: optional websiteId pins the reorder to one website (prevents cross-site mix).
    const websiteId = typeof body?.websiteId === "string" ? body.websiteId : null;

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ success: false, error: "productIds array diperlukan" }, { status: 400 });
    }
    if (productIds.length > 500 || !productIds.every((id) => typeof id === "string" && UUID_RE.test(id))) {
      return NextResponse.json({ success: false, error: "productIds harus array UUID (maks 500)" }, { status: 400 });
    }
    if (new Set(productIds).size !== productIds.length) {
      return NextResponse.json({ success: false, error: "productIds mengandung duplikat" }, { status: 400 });
    }
    if (websiteId && !UUID_RE.test(websiteId)) {
      return NextResponse.json({ success: false, error: "websiteId tidak valid" }, { status: 400 });
    }

    // Demo users: not supported for reorder
    if (isDemoUserId(userId)) {
      return NextResponse.json({ success: false, error: "Reorder tidak tersedia untuk demo" }, { status: 501 });
    }

    const supabase = createServiceSupabaseClient();

    // Verify all products belong to user's websites
    const { data: products } = await supabase
      .from("products")
      .select("id, website_id")
      .in("id", productIds);

    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ success: false, error: "Beberapa produk tidak ditemukan" }, { status: 404 });
    }

    // F2-6: all products must belong to a single website (no cross-site reorder).
    const websiteIds = [...new Set(products.map((p) => p.website_id))];
    if (websiteIds.length !== 1) {
      return NextResponse.json({ success: false, error: "Produk harus dari satu website yang sama" }, { status: 400 });
    }
    if (websiteId && websiteIds[0] !== websiteId) {
      return NextResponse.json({ success: false, error: "Produk tidak termasuk website tersebut" }, { status: 400 });
    }
    const { data: websites } = await supabase
      .from("websites")
      .select("id")
      .in("id", websiteIds)
      .eq("user_id", userId);

    if (!websites || websites.length !== websiteIds.length) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    // F2-6: atomic reorder via RPC (single CASE-based UPDATE); falls back to
    // sequential updates if the RPC is unavailable (pre-016-repair DBs).
    const orderMap: Record<string, number> = {};
    productIds.forEach((id, index) => {
      orderMap[id] = index;
    });
    const { error: rpcError } = await supabase.rpc("reorder_products", {
      p_product_ids: productIds,
      p_orders: productIds.map((_, index) => index),
    });
    if (rpcError) {
      // Fallback: sequential updates (ownership already verified, single website).
      for (let index = 0; index < productIds.length; index++) {
        const { error } = await supabase
          .from("products")
          .update({ sort_order: orderMap[productIds[index]], updated_at: new Date().toISOString() })
          .eq("id", productIds[index]);
        if (error) {
          console.error("Reorder products error:", error);
          return NextResponse.json({ success: false, error: "Gagal memperbarui urutan" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Urutan produk berhasil diperbarui",
    });
  } catch (error) {
    console.error("Reorder products error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}