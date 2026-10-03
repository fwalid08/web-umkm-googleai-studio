import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 401 });
  }

  const { id } = await params;

  // Tolak ID tidak valid lebih awal (mis. "undefined" akibat bug client)
  // supaya tidak menjadi 500 dari query Supabase.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ success: false, error: "Invalid template ID" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data: template, error } = await supabase
    .from("templates_library")
    .select(
      `
      *,
      user:users!templates_library_user_id_fkey(id, email, name, tier)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
    }
    console.error("Admin get template error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch template" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: template });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 401 });
  }

  const { id } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ success: false, error: "Invalid template ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data: existing } = await supabase.from("templates_library").select("id, name").eq("id", id).single();
  if (!existing) {
    return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  const {
    name,
    description,
    category,
    tier_requirement,
    thumbnail_url,
    template_data,
    scope,
    is_system_template,
    sort_order,
  } = body as {
    name?: string;
    description?: string;
    category?: string;
    tier_requirement?: string;
    thumbnail_url?: string;
    template_data?: unknown;
    scope?: "user" | "public";
    is_system_template?: boolean;
    sort_order?: number;
  };

  if (name !== undefined) {
    if (!name || name.trim().length < 3) {
      return NextResponse.json({ success: false, error: "Name must be at least 3 characters" }, { status: 400 });
    }
    if (name !== existing.name) {
      const { data: dup } = await supabase
        .from("templates_library")
        .select("id")
        .eq("name", name.trim())
        .eq("scope", "public")
        .neq("id", id)
        .limit(1);
      if (dup && dup.length > 0) {
        return NextResponse.json({ success: false, error: "Template name already exists" }, { status: 409 });
      }
    }
    updates.name = name.trim().slice(0, 200);
  }

  if (description !== undefined) {
    updates.description = typeof description === "string" ? description.trim().slice(0, 2000) : "";
  }

  if (category !== undefined) {
    const validCategories = ["food", "fashion", "handicraft", "retail", "services", "marketplace"];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
    }
    updates.category = category;
  }

  if (tier_requirement !== undefined) {
    const validTiers = ["free", "starter", "growth", "enterprise", null];
    if (tier_requirement && !validTiers.includes(tier_requirement)) {
      return NextResponse.json({ success: false, error: "Invalid tier requirement" }, { status: 400 });
    }
    updates.tier_requirement = tier_requirement;
  }

  if (thumbnail_url !== undefined) {
    updates.thumbnail_url = typeof thumbnail_url === "string" && /^https?:\/\//.test(thumbnail_url) ? thumbnail_url.slice(0, 2000) : "";
  }

  if (template_data !== undefined) {
    if (!template_data || typeof template_data !== "object" || Array.isArray(template_data)) {
      return NextResponse.json({ success: false, error: "Invalid template_data format" }, { status: 400 });
    }
    const td = template_data as Record<string, unknown>;
    const inner = td.template && typeof td.template === "object" && !Array.isArray(td.template) ? (td.template as Record<string, unknown>) : td;
    const hasTheme = !!inner.theme && typeof inner.theme === "object";
    const layout = td.layout as Record<string, unknown> | undefined;
    const hasLegacy = Array.isArray(layout?.rows) && !!td.core && typeof td.core === "object";
    if (!hasTheme && !hasLegacy) {
      return NextResponse.json({ success: false, error: "Template must have theme or layout.rows + core" }, { status: 400 });
    }
    updates.template_data = template_data;
  }

  if (scope !== undefined) {
    if (!["user", "public"].includes(scope)) {
      return NextResponse.json({ success: false, error: "Invalid scope" }, { status: 400 });
    }
    updates.scope = scope;
  }

  if (is_system_template !== undefined) {
    updates.is_system_template = is_system_template;
  }

  if (sort_order !== undefined) {
    updates.sort_order = typeof sort_order === "number" ? sort_order : 0;
  }

  updates.updated_at = new Date().toISOString();

  const { data: template, error } = await supabase
    .from("templates_library")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Admin update template error:", error);
    return NextResponse.json({ success: false, error: "Failed to update template" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: template, message: "Template updated successfully" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 401 });
  }

  const { id } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ success: false, error: "Invalid template ID" }, { status: 400 });
  }

  const supabase = createServiceSupabaseClient();

  const { data: existing } = await supabase.from("templates_library").select("id, name, thumbnail_url, assets").eq("id", id).single();
  if (!existing) {
    return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
  }

  // Lepaskan referensi dulu — FK NO ACTION memblokir DELETE:
  // - user_templates.template_library_id (di-backfill migrasi 036)
  // - store_pages.template_library_id
  // - websites.current_template_id (FK-less, tapi di-null-kan agar GET
  //   fallback ke kategori/template pertama dengan bersih, bukan UUID yatim).
  // Tidak ada kode yang membaca template_library_id (hanya custom_config
  // yang dipakai), jadi nullify aman. Satu query update+select per tabel
  // (tanpa count terpisah yang rapuh), toleran bila kolom/tabel tidak ada
  // di DB (drift skema) — dilewati dengan warning, bukan gagal total.
  const detached = { userTemplates: 0, pages: 0, websites: 0 };
  const detach = async (
    table: "user_templates" | "store_pages" | "websites",
    column: "template_library_id" | "current_template_id",
  ): Promise<number> => {
    const { data, error } = await supabase
      .from(table)
      .update({ [column]: null, updated_at: new Date().toISOString() })
      .eq(column, id)
      .select("id");
    if (error) {
      const code = (error as { code?: string | null }).code ?? null;
      // Kolom/tabel tidak ada di DB (drift skema vs migrasi lokal):
      // - 42703 / 42P01 = error Postgres (kolom/tabel tak dikenal)
      // - PGRST204 = PostgREST menolak duluan (kolom tak ada di schema cache)
      // Keduanya berarti tidak ada FK yang bisa memblokir → lewati.
      if (code === "42703" || code === "42P01" || code === "PGRST204") {
        console.warn(`Admin detach skipped ${table}.${column}: schema missing (${code})`);
        return 0;
      }
      const detail =
        [error.message, (error as { details?: string }).details, (error as { hint?: string }).hint, code]
          .filter(Boolean)
          .join(" | ") || JSON.stringify(error);
      throw new Error(`Failed to detach ${table}: ${detail}`);
    }
    return data?.length ?? 0;
  };

  try {
    detached.userTemplates = await detach("user_templates", "template_library_id");
    detached.pages = await detach("store_pages", "template_library_id");
    detached.websites = await detach("websites", "current_template_id");
  } catch (e) {
    console.error("Admin detach template error:", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to detach template" },
      { status: 500 },
    );
  }

  const { error } = await supabase.from("templates_library").delete().eq("id", id);

  if (error) {
    console.error("Admin delete template error:", error);
    return NextResponse.json(
      { success: false, error: `Failed to delete template: ${String(error.message || error).slice(0, 300)}` },
      { status: 500 },
    );
  }

  if (existing.thumbnail_url || (existing.assets as any[])?.length) {
    try {
      const { getStorageProvider } = await import("@/lib/storage");
      const storage = getStorageProvider();
      const pathsToDelete: string[] = [];

      if (existing.thumbnail_url) {
        try {
          const url = new URL(existing.thumbnail_url);
          const pathMatch = url.pathname.match(/\/object\/(.+)$/);
          if (pathMatch) pathsToDelete.push(pathMatch[1]);
        } catch {}
      }

      if (Array.isArray(existing.assets)) {
        for (const asset of existing.assets) {
          if (asset.storagePath) pathsToDelete.push(asset.storagePath);
        }
      }

      if (pathsToDelete.length > 0) {
        await storage.deleteMultiple(pathsToDelete);
      }
    } catch (cleanupErr) {
      console.warn("Template asset cleanup failed:", cleanupErr);
    }
  }

  return NextResponse.json({
    success: true,
    message: "Template deleted successfully",
    detached,
  });
}