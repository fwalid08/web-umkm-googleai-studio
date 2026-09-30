import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { updateBookingStatusSchema } from "@/types";
import { getOwnedWebsite } from "@/lib/websites/active";

function getSessionUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: string } } | null)?.user;
  return user?.id ?? null;
}

// PATCH /api/bookings/[id]?website_id= — ubah status booking (owner only).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = getSessionUserId(session);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const websiteId = request.nextUrl.searchParams.get("website_id") ?? "";
    if (!websiteId) {
      return NextResponse.json({ success: false, error: "website_id wajib diisi" }, { status: 400 });
    }
    const site = await getOwnedWebsite(userId, websiteId);
    if (!site) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }
    const body = await request.json().catch(() => null);
    const parsed = updateBookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("bookings")
      .update({ status: parsed.data.status })
      .eq("id", id)
      .eq("website_id", websiteId)
      .select("id, status")
      .single();
    if (error || !data) {
      return NextResponse.json({ success: false, error: "Booking tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[bookings] PATCH error:", err);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
