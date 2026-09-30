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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, template_data } = body;

    if (!name || !template_data) {
      return NextResponse.json({ success: false, error: "Name dan template_data wajib diisi" }, { status: 400 });
    }

    if (!template_data.layout?.rows || !template_data.core) {
      return NextResponse.json({ success: false, error: "Format template tidak valid" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .insert({
        user_id: sessionUser.id,
        name,
        description: body.description || "Imported template",
        thumbnail_url: "",
        template_data: template_data as BuilderConfig,
        scope: "user",
        imported_from: body.imported_from || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal mengimpor template" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: template, message: "Template berhasil diimpor" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
