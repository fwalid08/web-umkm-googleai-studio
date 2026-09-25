import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
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

    const body = await req.json();
    const { name, price, description, category } = body;
    if (!name || price == null) {
      return NextResponse.json({ success: false, error: "Nama dan harga produk wajib diisi" }, { status: 400 });
    }

    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });

      addDemoProduct(active.id, {
        name: String(name),
        price: Number(price),
        description: description ? String(description) : "",
        category: category ? String(category) : "Umum",
      });

      return NextResponse.json({
        success: true,
        message: "Produk berhasil ditambahkan",
        data: { products: getDemoProducts(active.id) },
      });
    }

    return NextResponse.json({ success: true, message: "Produk berhasil ditambahkan" });
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

    const body = await req.json();
    const { index, name, price, description, category, available } = body;
    if (index == null) {
      return NextResponse.json({ success: false, error: "Index produk diperlukan" }, { status: 400 });
    }

    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });

      updateDemoProduct(active.id, Number(index), {
        ...(name != null && { name: String(name) }),
        ...(price != null && { price: Number(price) }),
        ...(description != null && { description: String(description) }),
        ...(category != null && { category: String(category) }),
        ...(available != null && { available: Boolean(available) }),
      });

      return NextResponse.json({
        success: true,
        message: "Produk berhasil diperbarui",
        data: { products: getDemoProducts(active.id) },
      });
    }

    return NextResponse.json({ success: true, message: "Produk diperbarui" });
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

    return NextResponse.json({ success: true, message: "Produk dihapus" });
  } catch (error) {
    console.error("DELETE product error", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
