import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { allowedTierRequirements, sessionTier } from "@/lib/builder/template-access";

interface SessionUser {
  id: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const systemOnly = searchParams.get("is_system_template") === "true";

    const supabase = await createServerSupabaseClient();

    // Katalog public (dipakai tab katalog galeri, active-template-card,
    // templates-tab): template sistem yang di-upload admin.
    if (scope !== "public" && !systemOnly) {
      return NextResponse.json(
        { success: false, error: "Parameter scope=public wajib diisi" },
        { status: 400 }
      );
    }
    {
      const tier = sessionTier(session);
      const allowed = allowedTierRequirements(tier);
      let query = supabase
        .from("templates_library")
        .select("*")
        .eq("scope", "public")
        .eq("is_system_template", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (allowed !== null) {
        query = query.or(`tier_requirement.is.null,tier_requirement.in.(${allowed.join(",")})`);
      }
      const { data: templates, error } = await query;
      if (error) {
        return NextResponse.json({ success: false, error: "Gagal memuat template" }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: templates ?? [] });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
