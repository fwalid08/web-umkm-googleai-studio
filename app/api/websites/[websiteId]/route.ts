import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { updateWebsiteSchema } from "@/types";
import { getOwnedWebsite } from "@/lib/websites/active";
import { isDemoUserId, updateDemoWebsite } from "@/lib/mock/store";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

async function owned(userId: string, id: string) {
  const site = await getOwnedWebsite(userId, id);
  if (!site) return null;
  return site;
}

// GET /api/websites/[websiteId] — detail website milik sendiri
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { websiteId } = await params;
    const site = await owned(userId, websiteId);
    if (!site) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { website: site } });
  } catch (error) {
    console.error("Get website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// PATCH /api/websites/[websiteId] — rename
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { websiteId } = await params;
    if (!(await owned(userId, websiteId))) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }
    const body = await request.json().catch(() => null);
    const parsed = updateWebsiteSchema.safeParse(body);
    if (!parsed.success || (!parsed.data.name && !parsed.data.business_type)) {
      return NextResponse.json({ success: false, error: "Tidak ada perubahan" }, { status: 400 });
    }

    if (isDemoUserId(userId)) {
      const updated = updateDemoWebsite(userId, websiteId, {
        name: parsed.data.name,
        business_type: parsed.data.business_type,
      });
      return NextResponse.json({ success: true, data: { website: updated } });
    }

    const supabase = createServiceSupabaseClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.name) patch.name = parsed.data.name;
    if (parsed.data.business_type) patch.business_type = parsed.data.business_type;
    const { data, error } = await supabase
      .from("websites")
      .update(patch)
      .eq("id", websiteId)
      .eq("user_id", userId)
      .select("id, name, subdomain")
      .single();
    if (error || !data) {
      return NextResponse.json({ success: false, error: "Gagal menyimpan" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: { website: data } });
  } catch (error) {
    console.error("Update website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE /api/websites/[websiteId] — hapus (tolak jika terakhir; cascade order+config)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { websiteId } = await params;
    if (!(await owned(userId, websiteId))) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }
    const supabase = createServiceSupabaseClient();
    const { count } = await supabase
      .from("websites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { success: false, error: "Tidak bisa menghapus satu-satunya website" },
        { status: 422 }
      );
    }
    const { error } = await supabase.from("websites").delete().eq("id", websiteId).eq("user_id", userId);
    if (error) {
      return NextResponse.json({ success: false, error: "Gagal menghapus" }, { status: 500 });
    }
    // Pindahkan aktif ke website tertua yang tersisa
    const { data: rest } = await supabase
      .from("websites")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (rest) await supabase.from("users").update({ active_website_id: rest.id }).eq("id", userId);
    return NextResponse.json({ success: true, message: "Website dihapus" });
  } catch (error) {
    console.error("Delete website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}