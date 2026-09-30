import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: styles, error } = await supabase
      .from("design_styles")
      .select("id, name, description, palette, typography, components, effects, thumbnail_url")
      .eq("is_active", true)
      .order("name");

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal memuat design styles" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: styles ?? [] });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
