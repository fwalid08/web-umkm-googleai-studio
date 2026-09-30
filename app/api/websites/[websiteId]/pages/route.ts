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

function slugError(slug: string): string | null {
  if (!slug) return "Slug wajib diisi";
  if (slug.length > 200) return "Slug maksimal 200 karakter";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug hanya boleh huruf kecil, angka, dan tanda -";
  }
  if (RESERVED_SLUGS.has(slug)) return `Slug "${slug}" dilindungi sistem`;
  return null;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
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
    const { data: pages, error } = await supabase
      .from("store_pages")
      .select("*")
      .eq("website_id", websiteId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal memuat halaman" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: pages ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
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
    const { title, slug: rawSlug, type = "custom", content = "" } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json({ success: false, error: "Judul minimal 3 karakter" }, { status: 400 });
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ success: false, error: "Judul maksimal 200 karakter" }, { status: 400 });
    }
    if (type !== undefined && !["custom", "about", "contact", "faq", "terms", "privacy"].includes(type)) {
      return NextResponse.json({ success: false, error: "Tipe halaman tidak valid" }, { status: 400 });
    }
    // Homepage selalu berslug "home" (URL /) dan dibuat sekali via backfill — tolak di sini.
    const slug = normalizeSlug(String(rawSlug ?? title));
    const err = slugError(slug);
    if (err) {
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: existing } = await supabase
      .from("store_pages")
      .select("id")
      .eq("website_id", websiteId)
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: "Slug sudah digunakan" }, { status: 409 });
    }

    const { data: page, error } = await supabase
      .from("store_pages")
      .insert({
        website_id: websiteId,
        title: title.trim(),
        slug,
        type,
        content,
        is_published: true,
        is_homepage: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal membuat halaman" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: page, message: "Halaman berhasil dibuat" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
