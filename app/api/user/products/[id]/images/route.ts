import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { checkProductImageLimit } from "@/lib/billing/limits";
import { isDemoUserId } from "@/lib/mock/store";
import { processProductImages, uploadProductImages, createProductImageRecord, validateImageFile } from "@/lib/storage/products";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ success: false, error: "Content-Type harus multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();
    const imageFiles = formData.getAll("images") as File[];

    if (imageFiles.length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada file gambar" }, { status: 400 });
    }

    // Validate each file
    for (const file of imageFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
    }

    // Demo users: not supported for image upload (mock only)
    if (isDemoUserId(userId)) {
      return NextResponse.json({ success: false, error: "Upload gambar tidak tersedia untuk demo" }, { status: 501 });
    }

    // Real users: verify ownership and check limits
    const supabase = createServiceSupabaseClient();

    // Get product with website
    const { data: product } = await supabase
      .from("products")
      .select("id, website_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Verify website ownership
    const { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("id", product.website_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!website) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    // Check image limit
    const limitCheck = await checkProductImageLimit(userId, productId, imageFiles.length);
    if (!limitCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas gambar per produk tercapai (${limitCheck.currentCount}/${limitCheck.maxLimit})`,
        },
        { status: 403 }
      );
    }

    // Process images
    const processed = await processProductImages(imageFiles);

    // Upload to storage
    const uploadResults = await uploadProductImages(website.id, productId, processed.map((p) => ({ buffer: p.buffer })));

    // Save to database
    const savedImages = [];
    for (let i = 0; i < uploadResults.length; i++) {
      const result = uploadResults[i];
      if (result.success && result.file) {
        const sortOrder = i; // Will be adjusted based on existing images
        const isPrimary = i === 0 && limitCheck.currentCount === 0; // First image is primary if no existing

        const record = createProductImageRecord(result, sortOrder, isPrimary);
        if (record) {
          const { data: saved, error } = await supabase
            .from("product_images")
            .insert({
              product_id: productId,
              storage_path: record.storage_path,
              public_url: record.public_url,
              alt_text: record.alt_text,
              sort_order: record.sort_order,
              is_primary: record.is_primary,
              width: record.width,
              height: record.height,
              file_size: record.file_size,
              mime_type: record.mime_type,
            })
            .select()
            .single();

          if (!error && saved) {
            savedImages.push(saved);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${savedImages.length} gambar berhasil diupload`,
      data: { images: savedImages },
    });
  } catch (error) {
    console.error("POST product images error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json({ success: false, error: "Image ID diperlukan" }, { status: 400 });
    }

    // Demo users: not supported
    if (isDemoUserId(userId)) {
      return NextResponse.json({ success: false, error: "Hapus gambar tidak tersedia untuk demo" }, { status: 501 });
    }

    const supabase = createServiceSupabaseClient();

    // Verify ownership
    const { data: image } = await supabase
      .from("product_images")
      .select("id, product_id, storage_path, product:products!inner(website_id)")
      .eq("id", imageId)
      .maybeSingle();

    if (!image) {
      return NextResponse.json({ success: false, error: "Gambar tidak ditemukan" }, { status: 404 });
    }

    const product = (image.product as { website_id: string }[])[0];
    const { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("id", product.website_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!website) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    // Delete from storage
    const { deleteProductImages } = await import("@/lib/storage/products");
    await deleteProductImages([image.storage_path]);

    // Delete from database
    const { error } = await supabase.from("product_images").delete().eq("id", imageId);

    if (error) {
      console.error("Delete product image error:", error);
      return NextResponse.json({ success: false, error: "Gagal menghapus gambar" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Gambar berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE product image error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}