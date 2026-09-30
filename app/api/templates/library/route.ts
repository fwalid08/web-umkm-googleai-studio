import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BuilderConfig } from "@/lib/builder/types";

interface SessionUser {
  id: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

export async function GET() {
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: templates, error } = await supabase
      .from("templates_library")
      .select("*")
      .eq("user_id", sessionUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal memuat template" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: templates ?? [] });
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

    const body = await request.json();
    const { name, description, thumbnail_url, template_data } = body;

    if (!name || !template_data) {
      return NextResponse.json({ success: false, error: "Name dan template_data wajib diisi" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .insert({
        user_id: sessionUser.id,
        name,
        description: description || "",
        thumbnail_url: thumbnail_url || "",
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
