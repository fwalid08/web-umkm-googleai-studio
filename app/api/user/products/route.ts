import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getSessionUserId } from "@/lib/auth/utils";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getActiveWebsite } from "@/lib/websites/active";
import { checkProductLimit, checkProductImageLimit, getProductLimitInfo } from "@/lib/billing/limits";
import { isDemoUserId, getDemoProducts, addDemoProduct, updateDemoProduct, deleteDemoProduct, getDemoActiveWebsite } from "@/lib/mock/store";
import { productCreateSchema, productUpdateSchema } from "@/types/products";

function getWebsiteIdFromRequest(req: NextRequest): string | null {
  const url = new URL(req.url);
  return url.searchParams.get("websiteId");
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";
    const isActive = searchParams.get("is_active");
    const websiteId = getWebsiteIdFromRequest(req);

    // Demo users: use mock store
    if (isDemoUserId(userId)) {
      const active = websiteId ? { id: websiteId } : getDemoActiveWebsite(userId);
      if (!active) {
        return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
      }
      let products = getDemoProducts(active.id);

      // Apply filters
      if (search) {
        const q = search.toLowerCase();
        products = products.filter(
          (p: { name: string; description: string }) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }
      if (category) {
        products = products.filter((p: { category: string }) => p.category === category);
      }
      if (isActive !== null) {
        const activeFilter = isActive === "true";
        products = products.filter((p: { available: boolean }) => p.available === activeFilter);
      }

      // Pagination
      const total = products.length;
      const from = (page - 1) * limit;
      const paginated = products.slice(from, from + limit);

      // F3-3: kirim info limit tier supaya client tidak menghitung ulang batas.
      const limits = await getProductLimitInfo(userId, total, "free");

      return NextResponse.json({
        success: true,
        data: {
          website_id: active.id,
          website_name: "Demo Website",
          products: paginated,
          total,
          page,
          limit,
          total_pages: Math.max(1, Math.ceil(total / limit)),
          limits,
        },
      });
    }

    // Real users: use Supabase
    const supabase = createServiceSupabaseClient();

    // Get active website if not provided
    let targetWebsiteId = websiteId;
    if (!targetWebsiteId) {
      const site = await getActiveWebsite(userId);
      if (!site) {
        return NextResponse.json(
          { success: false, error: "Belum ada website. Buat dulu di panel Website." },
          { status: 404 }
        );
      }
      targetWebsiteId = site.id;
    }

    // Verify website ownership
    const { data: website } = await supabase
      .from("websites")
      .select("id, name")
      .eq("id", targetWebsiteId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!website) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from("products")
      .select(
        `
        id,
        website_id,
        name,
        description,
        price,
        category,
        stock,
        low_stock_threshold,
        is_active,
        sort_order,
        created_at,
        updated_at,
        product_images (
          id,
          storage_path,
          public_url,
          alt_text,
          sort_order,
          is_primary,
          width,
          height,
          file_size,
          mime_type,
          created_at
        )
      `,
        { count: "exact" }
      )
      .eq("website_id", targetWebsiteId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (search) {
      // F2-5: sanitize wildcard/special chars (same policy as orders search).
      const safeSearch = search.slice(0, 100).replace(/[%_(),\\]/g, "").replace(/[*/"']/g, "").trim();
      if (safeSearch) {
        query = query.or(`name.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
      }
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const from = (page - 1) * limit;
    const { data, error, count } = await query.range(from, from + limit - 1);

    if (error) {
      console.error("List products error:", error);
      return NextResponse.json({ success: false, error: "Gagal memuat produk" }, { status: 500 });
    }

    // Transform data
    const products = (data || []).map((p) => ({
      id: p.id,
      website_id: p.website_id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
      is_active: p.is_active,
      sort_order: p.sort_order,
      created_at: p.created_at,
      updated_at: p.updated_at,
      images: (p.product_images || []).map((img: any) => ({
        id: img.id,
        product_id: img.product_id,
        storage_path: img.storage_path,
        public_url: img.public_url,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        width: img.width,
        height: img.height,
        file_size: img.file_size,
        mime_type: img.mime_type,
        created_at: img.created_at,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        website_id: website.id,
        website_name: website.name,
        products,
        total: count ?? 0,
        page,
        limit,
        total_pages: Math.max(1, Math.ceil((count ?? 0) / limit)),
        // F3-3: batas tier efektif (plan override kalau ada) + kuota gambar/file.
        limits: await getProductLimitInfo(userId, count ?? 0),
      },
    });
  } catch (error) {
    console.error("GET products error:", error);
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

    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown>;
    // F1-2: formData() body can be consumed only once — parse once, reuse files below.
    let pendingImageFiles: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart (with images)
      const formData = await req.formData();
      pendingImageFiles = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
      body = {};
      for (const [key, value] of formData.entries()) {
        if (key === "images") continue; // Handled separately
        if (body[key] !== undefined) {
          // Convert to array if multiple values
          body[key] = Array.isArray(body[key]) ? [...body[key], value] : [body[key], value];
        } else {
          body[key] = value;
        }
      }
      // Parse numeric fields
      if (body.price) body.price = Number(body.price);
      if (body.stock) body.stock = Number(body.stock);
      if (body.low_stock_threshold) body.low_stock_threshold = Number(body.low_stock_threshold);
      if (body.sort_order) body.sort_order = Number(body.sort_order);
      if (body.is_active !== undefined) body.is_active = body.is_active === "true";
    } else {
      body = await req.json().catch(() => ({}));
    }

    // Validate input
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Validate image files early (before product insert) — F1-2
    if (pendingImageFiles.length > 0) {
      const { validateImageFile } = await import("@/lib/storage/products");
      for (const file of pendingImageFiles) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
        }
      }
    }

    const { name, price, description, category, stock, low_stock_threshold, is_active, sort_order } = parsed.data;

    // Demo users: use mock store
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

    // Real users: check tier limit
    const supabase = createServiceSupabaseClient();

    // Get active website
    const site = await getActiveWebsite(userId);
    if (!site) {
      return NextResponse.json(
        { success: false, error: "Belum ada website. Buat dulu di panel Website." },
        { status: 404 }
      );
    }

    const limitCheck = await checkProductLimit(userId, site.id);
    if (!limitCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas produk tercapai (${limitCheck.currentCount}/${limitCheck.maxLimit}). Upgrade untuk menambah lebih banyak.`,
          upgrade_url: limitCheck.upgradeUrl,
        },
        { status: 403 }
      );
    }

    // Get max sort_order for new product
    const { data: maxSort } = await supabase
      .from("products")
      .select("sort_order")
      .eq("website_id", site.id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const newSortOrder = (maxSort?.sort_order ?? -1) + 1;

    // Insert product
    const { data: product, error } = await supabase
      .from("products")
      .insert({
        website_id: site.id,
        name,
        price,
        description: description ?? null,
        category: category ?? "Umum",
        stock: stock ?? 0,
        low_stock_threshold: low_stock_threshold ?? 5,
        is_active: is_active ?? true,
        sort_order: sort_order ?? newSortOrder,
      })
      .select()
      .single();

    if (error || !product) {
      console.error("Create product error:", error);
      return NextResponse.json({ success: false, error: "Gagal membuat produk" }, { status: 500 });
    }

    // Handle image uploads if multipart (reuses files parsed above — F1-2)
    const imageFiles = pendingImageFiles;
    const images: any[] = [];
    if (imageFiles.length > 0) {
      // Check image limit
      const imageLimitCheck = await checkProductImageLimit(userId, product.id, imageFiles.length);
      if (!imageLimitCheck.ok) {
        // Product created but images rejected
        return NextResponse.json({
          success: true,
          message: "Produk dibuat, tapi gambar melebihi batas",
          data: { product: { ...product, images: [] }, warning: "Gambar melebihi batas tier" },
        });
      }

      // Process and upload images
      const { processProductImages, uploadProductImages, createProductImageRecord } = await import(
        "@/lib/storage/products"
      );

      const processed = await processProductImages(imageFiles);
      const uploadResults = await uploadProductImages(site.id, product.id, processed.map((p) => ({ buffer: p.buffer })));

      // Save image records to DB
      for (let i = 0; i < uploadResults.length; i++) {
        const result = uploadResults[i];
        if (result.success && result.file) {
          const record = createProductImageRecord(result, i, i === 0);
          if (record) {
            await supabase.from("product_images").insert({
              product_id: product.id,
              storage_path: record.storage_path,
              public_url: record.public_url,
              alt_text: record.alt_text,
              sort_order: record.sort_order,
              is_primary: record.is_primary,
              width: record.width,
              height: record.height,
              file_size: record.file_size,
              mime_type: record.mime_type,
            });
            images.push({ ...record, id: "temp", product_id: product.id });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil ditambahkan",
      data: { product: { ...product, images } },
    });
  } catch (error) {
    console.error("POST product error:", error);
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

    // F3-3: dukung JSON (toggle/bulk) DAN multipart (ProductForm kirim FormData + gambar).
    // Sebelumnya PUT hanya menerima JSON sehingga edit via ProductForm selalu 400.
    const contentType = req.headers.get("content-type") || "";
    let body: Record<string, unknown> | null = null;
    let pendingImageFiles: File[] = [];
    let removeImageIds: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {};
      for (const [key, value] of formData.entries()) {
        if (key === "images" || key === "remove_image_ids") continue; // handled separately
        if (body[key] !== undefined) {
          body[key] = Array.isArray(body[key]) ? [...body[key], value] : [body[key], value];
        } else {
          body[key] = value;
        }
      }
      // Parse numeric + boolean fields (konsisten dengan POST)
      if (body.price) body.price = Number(body.price);
      if (body.stock) body.stock = Number(body.stock);
      if (body.low_stock_threshold) body.low_stock_threshold = Number(body.low_stock_threshold);
      if (body.sort_order) body.sort_order = Number(body.sort_order);
      if (body.is_active !== undefined) body.is_active = body.is_active === "true";
      pendingImageFiles = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
      removeImageIds = formData.getAll("remove_image_ids").filter((v): v is string => typeof v === "string" && v.length > 0);
    } else {
      body = await req.json().catch(() => null);
    }

    const productId = body?.id as string | undefined;

    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID diperlukan" }, { status: 400 });
    }

    // Validate input
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Validate image files early (sebelum ada perubahan data) — konsisten dengan POST (F1-2)
    if (pendingImageFiles.length > 0) {
      const { validateImageFile } = await import("@/lib/storage/products");
      for (const file of pendingImageFiles) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
        }
      }
    }

    const { name, price, description, category, stock, low_stock_threshold, is_active, sort_order } = parsed.data;

    // Demo users: use mock store
    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });

      // Find product index
      const products = getDemoProducts(active.id);
      const idx = products.findIndex((p: { id: string }) => p.id === productId);
      if (idx === -1) return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });

      updateDemoProduct(active.id, idx, parsed.data as never);

      return NextResponse.json({
        success: true,
        message: "Produk berhasil diperbarui",
        // Demo store tidak punya storage sungguhan — beri tahu kalau ada gambar yang diabaikan.
        ...(pendingImageFiles.length > 0 ? { warning: "Upload gambar tidak tersedia untuk demo" } : {}),
        data: { products: getDemoProducts(active.id) },
      });
    }

    // Real users: use Supabase
    const supabase = createServiceSupabaseClient();

    // Verify ownership
    const { data: product } = await supabase
      .from("products")
      .select("id, website_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("id", product.website_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!website) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    // F3-3: hapus gambar yang diminta user (scoped ke product ini — ownership sudah diverifikasi)
    if (removeImageIds.length > 0) {
      const { data: toRemove } = await supabase
        .from("product_images")
        .select("id, storage_path")
        .eq("product_id", productId)
        .in("id", removeImageIds);

      if (toRemove && toRemove.length > 0) {
        const { deleteProductImages } = await import("@/lib/storage/products");
        await deleteProductImages(toRemove.map((r) => r.storage_path));

        const { error: removeError } = await supabase
          .from("product_images")
          .delete()
          .eq("product_id", productId)
          .in("id", toRemove.map((r) => r.id));

        if (removeError) {
          console.error("Remove product images error:", removeError);
          return NextResponse.json({ success: false, error: "Gagal menghapus gambar" }, { status: 500 });
        }
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = stock;
    if (low_stock_threshold !== undefined) updateData.low_stock_threshold = low_stock_threshold;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data: updated, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (error || !updated) {
      console.error("Update product error:", error);
      return NextResponse.json({ success: false, error: "Gagal memperbarui produk" }, { status: 500 });
    }

    // Upload gambar baru (multipart) — limit tier per produk dicek setelah penghapusan di atas
    let warning: string | undefined;
    if (pendingImageFiles.length > 0) {
      const imageLimitCheck = await checkProductImageLimit(userId, productId, pendingImageFiles.length);
      if (!imageLimitCheck.ok) {
        // Field sudah terupdate; gambar ditolak (konsisten dengan POST)
        warning = `Gambar melebihi batas tier (${imageLimitCheck.currentCount}/${imageLimitCheck.maxLimit})`;
      } else {
        const { data: existing } = await supabase
          .from("product_images")
          .select("is_primary")
          .eq("product_id", productId);
        const existingCount = existing?.length ?? 0;

        const { processProductImages, uploadProductImages, createProductImageRecord } = await import(
          "@/lib/storage/products"
        );
        const processed = await processProductImages(pendingImageFiles);
        const uploadResults = await uploadProductImages(website.id, productId, processed.map((p) => ({ buffer: p.buffer })));

        for (let i = 0; i < uploadResults.length; i++) {
          const record = createProductImageRecord(uploadResults[i], existingCount + i, existingCount === 0 && i === 0);
          if (!record) continue;
          await supabase.from("product_images").insert({
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
          });
        }
      }
    }

    // Fetch with images
    const { data: fullProduct } = await supabase
      .from("products")
      .select(
        `
        *,
        product_images (
          id,
          storage_path,
          public_url,
          alt_text,
          sort_order,
          is_primary,
          width,
          height,
          file_size,
          mime_type,
          created_at
        )
      `
      )
      .eq("id", productId)
      .single();

    return NextResponse.json({
      success: true,
      message: "Produk berhasil diperbarui",
      ...(warning ? { warning } : {}),
      data: {
        product: {
          ...fullProduct,
          images: (fullProduct?.product_images || []).map((img: any) => ({
            id: img.id,
            product_id: img.product_id,
            storage_path: img.storage_path,
            public_url: img.public_url,
            alt_text: img.alt_text,
            sort_order: img.sort_order,
            is_primary: img.is_primary,
            width: img.width,
            height: img.height,
            file_size: img.file_size,
            mime_type: img.mime_type,
            created_at: img.created_at,
          })),
        },
      },
    });
  } catch (error) {
    console.error("PUT product error:", error);
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
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID diperlukan" }, { status: 400 });
    }

    // Demo users: use mock store
    if (isDemoUserId(userId)) {
      const active = getDemoActiveWebsite(userId);
      if (!active) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });

      const products = getDemoProducts(active.id);
      const idx = products.findIndex((p: { id: string }) => p.id === productId);
      if (idx === -1) return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });

      deleteDemoProduct(active.id, idx);

      return NextResponse.json({
        success: true,
        message: "Produk berhasil dihapus",
        data: { products: getDemoProducts(active.id) },
      });
    }

    // Real users: use Supabase
    const supabase = createServiceSupabaseClient();

    // Verify ownership
    const { data: product } = await supabase
      .from("products")
      .select("id, website_id")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ success: false, error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("id", product.website_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!website) {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    // Delete product (cascades to product_images via FK)
    const { error } = await supabase.from("products").delete().eq("id", productId);

    if (error) {
      console.error("Delete product error:", error);
      return NextResponse.json({ success: false, error: "Gagal menghapus produk" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE product error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}