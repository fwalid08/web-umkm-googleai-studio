import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveWebsite } from "@/lib/websites/active";
import { normalizeSlug, RESERVED_SLUGS } from "@/lib/pages/slug";

interface SessionUser {
  id: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; pageId: string }> }
) {
  try {
    const { websiteId, pageId } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const site = await getActiveWebsite(sessionUser.id);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: page, error } = await supabase
      .from("store_pages")
      .select("*")
      .eq("id", pageId)
      .eq("website_id", websiteId)
      .single();

    if (error || !page) {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; pageId: string }> }
) {
  try {
    const { websiteId, pageId } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const site = await getActiveWebsite(sessionUser.id);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const { title, slug: rawSlug, type, content, is_published, is_homepage, layout, meta_title, meta_description, og_image_url } = body;

    const supabase = await createServerSupabaseClient();

    // Muat halaman dulu untuk guard homepage
    const { data: existing } = await supabase
      .from("store_pages")
      .select("id, slug, is_homepage")
      .eq("id", pageId)
      .eq("website_id", websiteId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan" }, { status: 404 });
    }

    let slug: string | undefined;
    if (rawSlug !== undefined) {
      if (existing.is_homepage) {
        return NextResponse.json(
          { success: false, error: "Homepage selalu di URL / — slug tidak bisa diubah" },
          { status: 403 },
        );
      }
      slug = normalizeSlug(String(rawSlug));
      if (!slug) {
        return NextResponse.json({ success: false, error: "Slug wajib diisi" }, { status: 400 });
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 200) {
        return NextResponse.json({ success: false, error: "Slug tidak valid" }, { status: 400 });
      }
      if (RESERVED_SLUGS.has(slug)) {
        return NextResponse.json({ success: false, error: `Slug "${slug}" dilindungi sistem` }, { status: 400 });
      }
      const { data: clash } = await supabase
        .from("store_pages")
        .select("id")
        .eq("website_id", websiteId)
        .eq("slug", slug)
        .neq("id", pageId)
        .maybeSingle();
      if (clash) {
        return NextResponse.json({ success: false, error: "Slug sudah digunakan" }, { status: 409 });
      }
    }

    if (title !== undefined && (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 200)) {
      return NextResponse.json({ success: false, error: "Judul 3–200 karakter" }, { status: 400 });
    }
    if (type !== undefined && !["custom", "about", "contact", "faq", "terms", "privacy"].includes(type)) {
      return NextResponse.json({ success: false, error: "Tipe halaman tidak valid" }, { status: 400 });
    }

    // Validasi bentuk layout (JSONB): hanya terima objek dengan `sections` array.
    // Mencegah sampah (string/array/objek raksasa) masuk DB & merusak render.
    let safeLayout: Record<string, unknown> | undefined;
    if (layout !== undefined) {
      if (!layout || typeof layout !== "object" || Array.isArray(layout)) {
        return NextResponse.json({ success: false, error: "Layout tidak valid" }, { status: 400 });
      }
      const rawSections = (layout as { sections?: unknown }).sections;
      if (rawSections !== undefined && !Array.isArray(rawSections)) {
        return NextResponse.json({ success: false, error: "Layout.sections harus array" }, { status: 400 });
      }
      const sections = Array.isArray(rawSections) ? rawSections : [];
      if (sections.length > 200) {
        return NextResponse.json({ success: false, error: "Terlalu banyak section (maks 200)" }, { status: 400 });
      }
      safeLayout = { ...(layout as Record<string, unknown>), sections };
    }

    if (is_homepage) {
      // Hanya satu halaman boleh jadi homepage — turunkan flag di semua baris
      // lain, lalu naikkan yang ini (di bawah pada update baris pageId).
      //
      // CATATAN: website_settings.homepage_page_id/homepage_type TIDAK lagi
      // ditulis di sini. Homepage ditentukan murni dari baris store_pages
      // dengan is_homepage = true (lihat 033_page_builder_only.sql), jadi
      // kolomnya hanya sisa historis yang bisa di-drop terpisah nanti.
      await supabase
        .from("store_pages")
        .update({ is_homepage: false })
        .eq("website_id", websiteId);
    }

    const { data: page, error } = await supabase
      .from("store_pages")
      .update({
        ...(title !== undefined && { title: String(title).trim() }),
        ...(slug !== undefined && { slug }),
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(is_published !== undefined && { is_published }),
        ...(is_homepage !== undefined && { is_homepage }),
        ...(safeLayout !== undefined && { layout: safeLayout }),
        ...(meta_title !== undefined && { meta_title }),
        ...(meta_description !== undefined && { meta_description }),
        ...(og_image_url !== undefined && { og_image_url }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .eq("website_id", websiteId)
      .select()
      .single();

    if (error || !page) {
      return NextResponse.json({ success: false, error: "Gagal memperbarui halaman" }, { status: 500 });
    }

    // Publish = halaman bisa diakses: pastikan live site baca data terbaru.
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, data: page, message: "Halaman berhasil diperbarui" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string; pageId: string }> }
) {
  try {
    const { websiteId, pageId } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const site = await getActiveWebsite(sessionUser.id);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from("store_pages")
      .select("id, is_homepage")
      .eq("id", pageId)
      .eq("website_id", websiteId)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan" }, { status: 404 });
    }
    if (existing.is_homepage) {
      return NextResponse.json(
        { success: false, error: "Homepage tidak bisa dihapus — jadikan halaman lain sebagai Home dulu" },
        { status: 403 },
      );
    }
    const { error } = await supabase
      .from("store_pages")
      .delete()
      .eq("id", pageId)
      .eq("website_id", websiteId);

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal menghapus halaman" }, { status: 500 });
    }

    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, message: "Halaman berhasil dihapus" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
