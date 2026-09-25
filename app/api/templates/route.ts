import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAllowedTemplateNames } from "@/lib/builder/validation";
import { STATIC_TEMPLATES } from "@/lib/mock/store";

// GET /api/templates — daftar template aktif + flag locked per tier (public, gating jika login)
export async function GET() {
  try {
    let templates: any[] = [];
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("templates")
        .select("id, name, description, color_palette, typography_config, sections_config, is_active")
        .eq("is_active", true)
        .order("name");
      if (!error && data && data.length > 0) {
        templates = data;
      }
    } catch {
      // Fallback to static mock templates
    }

    if (templates.length === 0) {
      templates = STATIC_TEMPLATES;
    }

    const session = await auth().catch(() => null);
    const tier = (session?.user as { tier?: string })?.tier ?? "free";
    const trialEndsAt =
      (session?.user as { trial_ends_at?: string | null })?.trial_ends_at ?? null;
    const names = (templates ?? []).map((t) => t.name as string);
    const allowed = getAllowedTemplateNames(tier, trialEndsAt, names);

    return NextResponse.json({
      success: true,
      data: {
        templates: (templates ?? []).map((t) => ({
          ...t,
          locked: !allowed.includes(t.name as string),
        })),
        tier,
        allowed_templates: allowed,
      },
    });
  } catch (error) {
    console.error("Templates error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
