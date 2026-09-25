import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { getOwnedWebsite } from "@/lib/websites/active";
import { isDemoUserId, setDemoActiveWebsite } from "@/lib/mock/store";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

// POST /api/websites/[websiteId]/activate — jadikan website aktif (konteks semua panel)
export async function POST(_request: NextRequest, { params }: { params: Promise<{ websiteId: string }> }) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { websiteId } = await params;
    if (!(await getOwnedWebsite(userId, websiteId))) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    if (isDemoUserId(userId)) {
      setDemoActiveWebsite(userId, websiteId);
      return NextResponse.json({ success: true, data: { active_website_id: websiteId } });
    }

    const supabase = createServiceSupabaseClient();
    await supabase.from("users").update({ active_website_id: websiteId }).eq("id", userId);
    return NextResponse.json({ success: true, data: { active_website_id: websiteId } });
  } catch (error) {
    console.error("Activate website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}