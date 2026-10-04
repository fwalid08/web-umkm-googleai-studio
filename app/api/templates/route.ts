import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { isCatalogTemplateAllowedForTier } from "@/lib/builder/templates/catalog";

// GET /api/templates — daftar template statis + flag locked per tier.
// Bentuk item disesuaikan konsumen lama (onboarding, themes):
// { id, name, description, color_palette, sections_config[{id}], locked }.
export async function GET() {
  try {
    const session = await auth().catch(() => null);
    const tier = (session?.user as { tier?: string })?.tier ?? "free";

    const templates = BUILT_IN_CATALOG.map((t) => {
      const allowed = isCatalogTemplateAllowedForTier(t.tiers, tier || null);
      return {
        id: t.id,
        name: t.category,
        description: t.description,
        color_palette: {
          primary: t.theme.palette.primary,
          background: t.theme.palette.background,
          text: t.theme.palette.text,
        },
        sections_config: (t.data.sections ?? []).map((s) => ({ id: s.type })),
        locked: !allowed,
      };
    });

    const allowedAll = BUILT_IN_CATALOG.filter((t) =>
      isCatalogTemplateAllowedForTier(t.tiers, tier || null),
    ).map((t) => t.category);

    return NextResponse.json({
      success: true,
      data: { templates, tier, allowed_templates: allowedAll },
    });
  } catch (error) {
    console.error("Templates error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
