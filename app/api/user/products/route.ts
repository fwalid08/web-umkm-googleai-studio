import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { productSchema } from "@/types";
import {
  isDemoUserId,
  getDemoActiveWebsite,
  getDemoProducts,
  addDemoProduct,
  updateDemoProduct,
  deleteDemoProduct,
} from "@/lib/mock/store";

export async function GET() {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) {
        return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
      }
      const products = getDemoProducts(active.id);
      return NextResponse.json({
        success: true,
        data: {
          website_id: active.id,
          website_name: active.name,
          products,
        },
      });
    }

    // Default empty for non-demo if Supabase not configured
    return NextResponse.json({
      success: true,
      data: {
        website_id: "default",
        website_name: "Toko Utama",
        products: [],
      },
    });
  } catch (error) {
    console.error("GET products error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = productSchema.pick({ name: true, price: true, description: true, category: true }).safeParse({
      name: body?.name,
      price: typeof body?.price === "string" ? Number(body.price) : body?.price,
      description: body?.description,
      category: body?.category,
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, price, description, category } = parsed.data;

    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });

      addDemoProduct(active.id, {
        name,
        price,
        description: description ?? "",
        category: category ?? "Umum",
      });

      return NextResponse.json({
        success: true,
        message: "Produk berhasil ditambahkan",
        data: { products: getDemoProducts(active.id) },
      });
    }

    // Non-demo belum ada storage produk → jangan return sukses palsu
    return NextResponse.json({ success: false, error: "Manajemen produk non-demo belum tersedia" }, { status: 501 });
  } catch (error) {
    console.error("POST product error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const idx = Number(body?.index);
    if (!Number.isInteger(idx) || idx < 0) {
      return NextResponse.json({ success: false, error: "Index produk diperlukan" }, { status: 400 });
    }
    const patch: Record<string, unknown> = {};
    if (body?.name != null) {
      const v = String(body.name).slice(0, 100);
      if (!v.trim()) return NextResponse.json({ success: false, error: "Nama produk tidak valid" }, { status: 400 });
      patch.name = v;
    }
    if (body?.price != null) {
      const p = Number(body.price);
      if (!Number.isFinite(p) || p < 0 || p > 1_000_000_000) {
        return NextResponse.json({ success: false, error: "Harga tidak valid" }, { status: 400 });
      }
      patch.price = Math.floor(p);
    }
    if (body?.description != null) patch.description = String(body.description).slice(0, 1000);
    if (body?.category != null) patch.category = String(body.category).slice(0, 50);
    if (body?.available != null) patch.available = Boolean(body.available);

    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });

      updateDemoProduct(active.id, idx, patch as never);

      return NextResponse.json({
        success: true,
        message: "Produk berhasil diperbarui",
        data: { products: getDemoProducts(active.id) },
      });
    }

    return NextResponse.json({ success: false, error: "Manajemen produk non-demo belum tersedia" }, { status: 501 });
  } catch (error) {
    console.error("PUT product error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const index = searchParams.get("index");
    if (index == null) {
      return NextResponse.json({ success: false, error: "Index produk diperlukan" }, { status: 400 });
    }

    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });

      deleteDemoProduct(active.id, Number(index));
      return NextResponse.json({
        success: true,
        message: "Produk berhasil dihapus",
        data: { products: getDemoProducts(active.id) },
      });
    }

    return NextResponse.json({ success: false, error: "Manajemen produk non-demo belum tersedia" }, { status: 501 });
  } catch (error) {
    console.error("DELETE product error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
