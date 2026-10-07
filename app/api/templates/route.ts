import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { isCatalogTemplateAllowedForTier } from "@/lib/builder/templates/catalog";
import { DEFAULT_LIBRARY_NAME, isLibrarySlug } from "@/lib/builder/template-library";

/**
 * GET /api/templates — daftar template statis + flag locked per tier.
 * Bentuk item disesuaikan konsumen lama (onboarding, themes):
 * { id, name, description, color_palette, sections_config[{id}], locked }.
 *
 * `?library=1` menambah template milik user sendiri — disimpan lewat
 * "Simpan sebagai Template" (lihat 045_user_template_library.sql) — ke field
 * `saved`, terpisah dari `templates` katalog. Galeri builder memakai keduanya.
 * Tanpa parameter, respons TIDAK berubah sama sekali supaya konsumen lama
 * (onboarding, themes) tidak ikut terpengaruh.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const tier = (session?.user as { tier?: string })?.tier ?? "free";
    const userId = (session?.user as { id?: string })?.id;

    const templates = BUILT_IN_CATALOG.map((t) => {
      const allowed = isCatalogTemplateAllowedForTier(t.tiers, tier || null);
      return {
        id: t.id,
        name: t.category,
        description: t.description,
        color_palette: {
          primary: t.theme.palette.primary,
          background: t.theme.palette.background,
          text: t.theme.palette.text,
        },
        sections_config: (t.data.sections ?? []).map((s) => ({ id: s.type })),
        locked: !allowed,
      };
    });

    const allowedAll = BUILT_IN_CATALOG.filter((t) =>
      isCatalogTemplateAllowedForTier(t.tiers, tier || null),
    ).map((t) => t.category);

    let saved: unknown[] = [];
    if (request.nextUrl.searchParams.get("library") === "1" && userId) {
      const jar = await cookies();
      const authToken =
        jar.get("authjs.session-token")?.value ??
        jar.get("__Secure-authjs.session-token")?.value;
      const supabase = await createServerSupabaseClient(authToken);
      // Filter `user_id` WAJIB: RLS dimatikan di 026_fix_rls_nextauth.sql,
      // jadi seluruh pembatasan akses bergantung pada scoping di sini.
      const { data: rows } = await supabase
        .from("bld_user_templates")
        .select("template_slug, base_slug, name, custom_config, created_at, updated_at")
        .eq("user_id", userId)
        .eq("is_library", true)
        .order("updated_at", { ascending: false });

      // `custom_config` ikut dikirim: galeri butuh isinya untuk mengganti
      // template aktif saat item library dipilih. Library user biasanya
      // sedikit (puluhan), jadi masih wajar di-return sekaligus — dan
      // ini menghindari fetch kedua per apply.
      saved = (rows ?? []).map((row) => {
        const config = (row.custom_config ?? {}) as Record<string, unknown>;
        const sections = Array.isArray(config.sections) ? config.sections : [];
        return {
          id: row.template_slug,
          base_slug: row.base_slug,
          name: row.name || DEFAULT_LIBRARY_NAME,
          sections_count: sections.length,
          custom_config: config,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: { templates, saved, tier, allowed_templates: allowedAll },
    });
  } catch (error) {
    console.error("Templates error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

/**
 * DELETE /api/templates?libraryId=saved-<uuid> — hapus template library user.
 *
 * Kenapa `libraryId` harus prefix `saved-`: `user_templates` dipakai dua
 * peran — baris `is_library = true` (aset yang bisa dipilih ulang) dan
 * `is_library = false` (template AKTIF website). Kalau filter `is_library`
 * dilepas, user bisa menghapus desain yang sedang dipakai hanya dengan
 * mengetik slug katalog ('food') — website jadi kehilangan config-nya.
 *
 * Validasi berlapis, semua wajib:
 *   1. `isLibrarySlug` — tolak slug katalog sebelum menyentuh DB.
 *   2. `.eq("user_id", userId)` — RLS dimatikan di 026, jadi scoping hanya
 *      bisa dilakukan di sini. Tanpa ini satu user bisa hapus library user lain.
 *   3. `.eq("is_library", true)` — hanya baris aset library.
 * Baris yang tidak ketemu mengembalikan 404, bukan sukses diam-diam, supaya
 * UI bisa membedakan "hapus gagal" dari "sudah terhapus".
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const libraryId = request.nextUrl.searchParams.get("libraryId") ?? "";
    if (!isLibrarySlug(libraryId)) {
      return NextResponse.json({ success: false, error: "Template tidak valid" }, { status: 400 });
    }

    const jar = await cookies();
    const authToken =
      jar.get("authjs.session-token")?.value ??
      jar.get("__Secure-authjs.session-token")?.value;
    const supabase = await createServerSupabaseClient(authToken);

    const { data: rows, error: selectError } = await supabase
      .from("bld_user_templates")
      .select("template_slug, name")
      .eq("user_id", userId)
      .eq("template_slug", libraryId)
      .eq("is_library", true)
      .limit(1);

    if (selectError) {
      console.error("Select library template error:", selectError);
      return NextResponse.json({ success: false, error: "Gagal menghapus template" }, { status: 500 });
    }
    const row = (rows ?? [])[0] as { template_slug?: string; name?: string } | undefined;
    if (!row) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("bld_user_templates")
      .delete()
      .eq("user_id", userId)
      .eq("template_slug", libraryId)
      .eq("is_library", true);

    if (deleteError) {
      console.error("Delete library template error:", deleteError);
      return NextResponse.json({ success: false, error: "Gagal menghapus template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: { library: { template_slug: libraryId } },
      message: `Template "${row.name || DEFAULT_LIBRARY_NAME}" dihapus dari library`,
    });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
