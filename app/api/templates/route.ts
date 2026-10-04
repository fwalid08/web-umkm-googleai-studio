import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { isCatalogTemplateAllowedForTier } from "@/lib/builder/templates/catalog";
import { DEFAULT_LIBRARY_NAME } from "@/lib/builder/template-library";

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
        .from("user_templates")
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
