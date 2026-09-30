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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .select("*")
      .eq("id", id)
      .eq("user_id", sessionUser.id)
      .single();

    if (error || !template) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: template });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, thumbnail_url, template_data } = body;

    const supabase = await createServerSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(thumbnail_url !== undefined && { thumbnail_url }),
        ...(template_data !== undefined && { template_data: template_data as BuilderConfig }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", sessionUser.id)
      .select()
      .single();

    if (error || !template) {
      return NextResponse.json({ success: false, error: "Gagal memperbarui template" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: template, message: "Template berhasil diperbarui" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("templates_library")
      .delete()
      .eq("id", id)
      .eq("user_id", sessionUser.id);

    if (error) {
      return NextResponse.json({ success: false, error: "Gagal menghapus template" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Template berhasil dihapus" });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
