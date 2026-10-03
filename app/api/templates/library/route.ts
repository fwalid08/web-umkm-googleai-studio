import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/storage";
import { refreshTemplateUrls, URL_REFRESH_EXPIRES_SECS } from "@/lib/builder/template-urls";
import { allowedTierRequirements, sessionTier } from "@/lib/builder/template-access";
import type { BuilderConfig } from "@/lib/builder/types";

interface SessionUser {
  id: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const systemOnly = searchParams.get("is_system_template") === "true";

    const supabase = await createServerSupabaseClient();

    // Katalog public (dipakai tab builtin galeri, active-template-card,
    // templates-tab): template sistem yang di-upload admin. Sebelumnya
    // parameter ini DIABAIKAN dan query selalu user_id = sendiri, sehingga
    // template public tidak pernah sampai ke tenant.
    if (scope === "public" || systemOnly) {
      const tier = sessionTier(session);
      const allowed = allowedTierRequirements(tier);
      let query = supabase
        .from("templates_library")
        .select("*")
        .eq("scope", "public")
        .eq("is_system_template", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (allowed !== null) {
        query = query.or(`tier_requirement.is.null,tier_requirement.in.(${allowed.join(",")})`);
      }
      const { data: templates, error } = await query;
      if (error) {
        return NextResponse.json({ success: false, error: "Gagal memuat template" }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: templates ?? [] });
    }

    const { data: templates, error } = await supabase
      .from("templates_library")
      .select("*")
      .eq("user_id", sessionUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal memuat template" }, { status: 500 });
    }

    // Self-healing thumbnail: signed URL 7 hari — refresh yang hampir
    // kedaluwarsa agar kartu galeri tidak mati seminggu setelah import.
    // Fail-soft: bila gagal, daftar apa adanya tetap dikembalikan.
    let rows = templates ?? [];
    try {
      const storage = getStorageProvider();
      const signer = async (storagePath: string): Promise<string | null> => {
        const r = await storage.getSignedUrl({ path: storagePath, expiresIn: URL_REFRESH_EXPIRES_SECS });
        return r.success && r.url ? r.url : null;
      };
      const refreshed = await Promise.all(
        rows.map((t) =>
          // Hanya thumbnail yang dipakai daftar galeri — template_data &
          // assets di-refresh saat item dibuka (GET [id]).
          refreshTemplateUrls({ thumbnail_url: (t as Record<string, unknown>).thumbnail_url }, signer).then((r) => ({
            row: t,
            thumb: (r.row.thumbnail_url as string | undefined) ?? (t as Record<string, unknown>).thumbnail_url,
            changed: r.changed,
          })),
        ),
      );
      const updates = refreshed.filter((r) => r.changed);
      rows = refreshed.map((r, i) =>
        r.changed ? { ...(rows[i] as object), thumbnail_url: r.thumb } : rows[i],
      );
      // Simpan kembali thumbnail yang di-refresh (best-effort, satu per satu).
      for (const u of updates) {
        const t = u.row as Record<string, unknown>;
        if (!t.id) continue;
        await supabase
          .from("templates_library")
          .update({ thumbnail_url: u.thumb, updated_at: new Date().toISOString() })
          .eq("id", t.id)
          .eq("user_id", sessionUser.id);
      }
    } catch {
      // Abaikan — daftar apa adanya tetap valid.
    }

    return NextResponse.json({ success: true, data: rows });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Body JSON tidak valid" }, { status: 400 });
    }
    const rawName = (body as Record<string, unknown>).name;
    const { description, thumbnail_url, template_data } = body as {
      description?: unknown;
      thumbnail_url?: unknown;
      template_data?: unknown;
    };
    const name = typeof rawName === "string" ? rawName.trim().slice(0, 200) : "";

    if (!name || !template_data) {
      return NextResponse.json({ success: false, error: "Name dan template_data wajib diisi" }, { status: 400 });
    }

    if (name.length < 3) {
      return NextResponse.json({ success: false, error: "Nama template minimal 3 karakter" }, { status: 400 });
    }

    if (!template_data || typeof template_data !== "object" || Array.isArray(template_data)) {
      return NextResponse.json({ success: false, error: "Format template tidak valid" }, { status: 400 });
    }

    const td = template_data as Record<string, unknown>;
    const inner =
      td.template && typeof td.template === "object" && !Array.isArray(td.template)
        ? (td.template as Record<string, unknown>)
        : td;
    const hasTheme = !!inner.theme && typeof inner.theme === "object";
    const layout = td.layout as Record<string, unknown> | undefined;
    const hasLegacy = Array.isArray(layout?.rows) && !!td.core && typeof td.core === "object";
    if (!hasTheme && !hasLegacy) {
      return NextResponse.json(
        { success: false, error: "Format template tidak valid: wajib punya \"theme\" atau \"layout.rows\" + \"core\"" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: existing } = await supabase
      .from("templates_library")
      .select("id")
      .eq("user_id", sessionUser.id)
      .eq("name", name)
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, error: "Nama template sudah digunakan" }, { status: 409 });
    }

    const safeThumbnail =
      typeof thumbnail_url === "string" && /^https?:\/\//.test(thumbnail_url)
        ? thumbnail_url.slice(0, 500)
        : "";
    const safeDescription =
      typeof description === "string" && description.trim()
        ? description.trim().slice(0, 2000)
        : "";

    const { data: template, error } = await supabase
      .from("templates_library")
      .insert({
        user_id: sessionUser.id,
        name,
        description: safeDescription,
        thumbnail_url: safeThumbnail,
        template_data: template_data as BuilderConfig,
        scope: "user",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal menyimpan template" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: template, message: "Template berhasil disimpan" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
