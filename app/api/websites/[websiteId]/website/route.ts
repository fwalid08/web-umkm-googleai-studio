import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FREE_PRODUCT_MAX, websiteConfigSchema } from "@/types";
import {
  countProductItems,
  getAllowedTemplateNames,
  isTrialActive,
  mergeAndValidateSections,
  type MergedSection,
} from "@/lib/builder/validation";
import { getActiveWebsite } from "@/lib/websites/active";
import { tenantUrl } from "@/lib/urls";
import {
  getDemoOwnedWebsite,
  getDemoUser,
  getDemoWebsiteConfig,
  isDemoUserId,
  saveDemoWebsiteConfig,
  STATIC_TEMPLATES,
} from "@/lib/mock/store";

const TEMPLATE_FIELDS =
  "id, name, description, color_palette, typography_config, sections_config, is_active";

interface SessionUser {
  id: string;
  tier?: string;
  trial_ends_at?: string | null;
  business_type?: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

function subdomainUrl(subdomain: string | null): string | null {
  return tenantUrl(subdomain);
}

/** Default template dari jenis bisnis (fallback jika user belum pilih). */
function suggestedTemplate(businessType: string | undefined, names: string[]): string {
  if (businessType && names.includes(businessType)) return businessType;
  return names.includes("food") ? "food" : names[0] ?? "food";
}

// GET /api/websites/[websiteId]/website — konfigurasi website AKTIF (merged dengan defaults template)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (isDemoUserId(sessionUser.id)) {
      const demoUser = getDemoUser(sessionUser.id);
      const demoSite = getDemoOwnedWebsite(sessionUser.id, websiteId);
      if (!demoSite) return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
      const cfg = getDemoWebsiteConfig(websiteId);
      const tpl = STATIC_TEMPLATES.find((t) => t.id === demoSite.current_template_id) || STATIC_TEMPLATES[0];
      return NextResponse.json({
        success: true,
        data: {
          website_id: demoSite.id,
          website_name: demoSite.name,
          template_id: tpl.id,
          template_name: tpl.name,
          template_locked: false,
          custom_config: cfg || {
            theme: { palette: tpl.color_palette, typography: tpl.typography_config },
            sections: tpl.sections_config.map((s) => ({ ...s, enabled: true, style: {}, content: { ...s.default_props } })),
            seo: { title: `${demoSite.name} — Toko Online`, description: tpl.description },
          },
          is_default: !cfg,
          tier: demoUser?.tier ?? "free",
          trial_active: true,
          subdomain_url: subdomainUrl(demoSite.subdomain),
        },
      });
    }

    // Verifikasi website milik user
    const site = await getActiveWebsite(sessionUser.id);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("tier, trial_ends_at, business_type")
      .eq("id", sessionUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    const { data: templates } = await supabase
      .from("templates")
      .select(TEMPLATE_FIELDS)
      .eq("is_active", true)
      .order("name");
    const list = templates ?? [];
    if (list.length === 0) {
      return NextResponse.json({ success: false, error: "Template belum tersedia" }, { status: 503 });
    }

    const allowed = getAllowedTemplateNames(
      user.tier,
      user.trial_ends_at,
      list.map((t) => t.name as string)
    );

    // Config tersimpan: prioritaskan current_template_id, fallback baris terbaru
    const { data: rows } = await supabase
      .from("user_templates")
      .select("template_id, custom_config, updated_at")
      .eq("website_id", websiteId)
      .order("updated_at", { ascending: false });

    let template = site.current_template_id
      ? list.find((t) => t.id === site.current_template_id) ?? null
      : null;
    let stored: { template_id: string; custom_config: unknown } | null =
      (rows ?? []).find((r) => r.template_id === site.current_template_id) ??
      (rows ?? [])[0] ??
      null;
    if (!template && stored) template = list.find((t) => t.id === stored?.template_id) ?? null;
    if (!template) {
      const name = suggestedTemplate(site.business_type ?? user.business_type, allowed.length > 0 ? allowed : list.map((t) => t.name as string));
      template = list.find((t) => t.name === name) ?? list[0];
      stored = null;
    }

    const templateSections = (template.sections_config ?? []) as Parameters<
      typeof mergeAndValidateSections
    >[0];
    const storedConfig = (stored?.custom_config ?? null) as {
      theme?: Record<string, unknown>;
      sections?: MergedSection[];
      seo?: { title?: string; description?: string };
    } | null;

    // Jika sudah ada config tersimpan untuk template ini → pakai langsung.
    // Jika belum → defaults (semua section enabled).
    let customConfig: { theme: Record<string, unknown>; sections: MergedSection[]; seo: Record<string, string> };
    let isDefault: boolean;
    if (stored && stored.template_id === template.id && Array.isArray(storedConfig?.sections)) {
      customConfig = {
        theme: storedConfig?.theme ?? {},
        sections: storedConfig?.sections ?? [],
        seo: { ...(storedConfig?.seo ?? {}) },
      };
      isDefault = false;
    } else {
      const merged = mergeAndValidateSections(templateSections, []);
      if (!merged.ok) {
        return NextResponse.json({ success: false, error: "Konfigurasi template rusak" }, { status: 500 });
      }
      customConfig = { theme: {}, sections: merged.sections, seo: {} };
      isDefault = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        website_id: site.id,
        website_name: site.name,
        template_id: template.id,
        template_name: template.name,
        template_locked: !allowed.includes(template.name as string),
        custom_config: customConfig,
        is_default: isDefault,
        tier: user.tier,
        trial_active: isTrialActive(user.trial_ends_at),
        subdomain_url: subdomainUrl(site.subdomain),
      },
    });
  } catch (error) {
    console.error("Get website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// PUT /api/websites/[websiteId]/website — simpan konfigurasi (whitelist + tier gating + limit Free)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> }
) {
  try {
    const { websiteId } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = websiteConfigSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const { template_id, custom_config } = validation.data;

    if (isDemoUserId(sessionUser.id)) {
      saveDemoWebsiteConfig(sessionUser.id, websiteId, template_id, custom_config);
      const tpl = STATIC_TEMPLATES.find((t) => t.id === template_id) || STATIC_TEMPLATES[0];
      return NextResponse.json({
        success: true,
        data: { website_id: websiteId, template_id: template_id, template_name: tpl.name, custom_config },
        message: "Website berhasil disimpan",
      });
    }

    // Verifikasi website milik user
    const site = await getActiveWebsite(sessionUser.id);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("tier, trial_ends_at")
      .eq("id", sessionUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select(TEMPLATE_FIELDS)
      .eq("id", template_id)
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    // Tier gating: Free (trial habis) hanya boleh 3 template dasar
    const { data: allTemplates } = await supabase
      .from("templates")
      .select("name")
      .eq("is_active", true);
    const allowed = getAllowedTemplateNames(
      user.tier,
      user.trial_ends_at,
      (allTemplates ?? []).map((t) => t.name as string)
    );
    if (!allowed.includes(template.name as string)) {
      return NextResponse.json(
        {
          success: false,
          error: `Template ${template.name} hanya untuk paket Starter ke atas. Upgrade untuk membuka semua template.`,
          upgrade_url: "/dashboard/settings/billing",
        },
        { status: 403 }
      );
    }

    // Whitelist section + required tidak boleh mati
    const merged = mergeAndValidateSections(
      (template.sections_config ?? []) as Parameters<typeof mergeAndValidateSections>[0],
      (custom_config.sections ?? []) as Parameters<typeof mergeAndValidateSections>[1]
    );
    if (!merged.ok) {
      return NextResponse.json({ success: false, error: merged.error }, { status: 400 });
    }

    // Limit Free: maksimal 5 item produk
    const trialActive = isTrialActive(user.trial_ends_at);
    if (user.tier === "free" && !trialActive && countProductItems(merged.sections) > FREE_PRODUCT_MAX) {
      return NextResponse.json(
        {
          success: false,
          error: `Paket Free maksimal ${FREE_PRODUCT_MAX} produk. Upgrade ke Starter untuk produk unlimited.`,
          upgrade_url: "/dashboard/settings/billing",
        },
        { status: 403 }
      );
    }

    const toStore = {
      theme: custom_config.theme ?? {},
      sections: merged.sections,
      seo: custom_config.seo ?? {},
    };

    const { error: upsertError } = await supabase.from("user_templates").upsert(
      {
        user_id: sessionUser.id,
        website_id: websiteId,
        template_id: template.id,
        custom_config: toStore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "website_id,template_id" }
    );
    if (upsertError) {
      console.error("Upsert website config error:", upsertError);
      return NextResponse.json({ success: false, error: "Gagal menyimpan konfigurasi" }, { status: 500 });
    }

    await supabase
      .from("websites")
      .update({ current_template_id: template.id, updated_at: new Date().toISOString() })
      .eq("id", websiteId)
      .eq("user_id", sessionUser.id);

    return NextResponse.json({
      success: true,
      data: { website_id: websiteId, template_id: template.id, template_name: template.name, custom_config: toStore },
      message: "Website berhasil disimpan",
    });
  } catch (error) {
    console.error("Save website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}