import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveWebsite } from "@/lib/websites/active";

interface SessionUser {
  id: string;
}

const RESERVED_SLUGS = new Set([
  "home",
  "checkout",
  "blog",
  "cart",
  "p",
  "api",
  "dashboard",
  "auth",
  "login",
  "produk",
  "order",
  "builder",
  "customize",
  "page-builder",
]);

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

    if (is_homepage) {
      await supabase
        .from("store_pages")
        .update({ is_homepage: false })
        .eq("website_id", websiteId);

      await supabase
        .from("website_settings")
        .update({ homepage_type: "page", homepage_page_id: pageId })
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
        ...(layout !== undefined && { layout }),
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

    return NextResponse.json({ success: true, message: "Halaman berhasil dihapus" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
