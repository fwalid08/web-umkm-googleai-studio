import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAllowedTemplateNames } from "@/lib/builder/validation";
import { STATIC_TEMPLATES } from "@/lib/mock/store";

const FIELDS =
  "id, name, description, color_palette, typography_config, sections_config, is_active";

// GET /api/templates/:id — :id bisa uuid ATAU nama (food/fashion/handicraft/retail/services)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Template tidak valid" }, { status: 400 });
    }

    let template: any = null;
    try {
      const supabase = await createServerSupabaseClient();
      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
      const base = supabase.from("templates").select(FIELDS).eq("is_active", true);
      const { data } = await (isUuid
        ? base.eq("id", id).maybeSingle()
        : base.eq("name", id).maybeSingle());
      if (data) template = data;
    } catch {
      // Fallback to static mock templates
    }

    if (!template) {
      template = STATIC_TEMPLATES.find((t) => t.id === id || t.name === id) || null;
    }

    if (!template) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    const session = await auth().catch(() => null);
    const tier = (session?.user as { tier?: string })?.tier ?? "free";
    const trialEndsAt =
      (session?.user as { trial_ends_at?: string | null })?.trial_ends_at ?? null;
    const allowed = getAllowedTemplateNames(tier, trialEndsAt, [template.name as string]);

    return NextResponse.json({
      success: true,
      data: {
        template: { ...template, locked: !allowed.includes(template.name as string) },
        tier,
      },
    });
  } catch (error) {
    console.error("Template detail error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
