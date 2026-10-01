import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FREE_PRODUCT_MAX, websiteConfigSchema } from "@/types";
import {
  countProductItems,
  getAllowedTemplateNames,
  isCatalogTemplateAllowedForTier,
  isTrialActive,
  mergeAndValidateSections,
  sanitizePaletteOverride,
  type MergedSection,
} from "@/lib/builder/validation";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { ensureSectionIdentities } from "@/lib/builder/migration";
import { getOwnedWebsite } from "@/lib/websites/active";
import { tenantUrl } from "@/lib/urls";
import {
  getDemoOwnedWebsite,
  getDemoUser,
  getDemoWebsiteConfig,
  isDemoUserId,
  saveDemoWebsiteConfig,
  STATIC_TEMPLATES,
} from "@/lib/mock/store";
import { cookies } from "next/headers";

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

function suggestedTemplate(businessType: string | undefined, names: string[]): string {
  if (businessType && names.includes(businessType)) return businessType;
  return names.includes("food") ? "food" : names[0] ?? "food";
}

async function getNextAuthToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("authjs.session-token")?.value;
    return token || undefined;
  } catch {
    return undefined;
  }
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

    console.log("[DEBUG] User ID:", sessionUser.id);
    console.log("[DEBUG] Website ID:", websiteId);

    const site = await getOwnedWebsite(sessionUser.id, websiteId);
    console.log("[DEBUG] Site found:", !!site, site?.id);
    if (!site || site.id !== websiteId) {
      console.log("[DEBUG] 404: Site not found or not owned by user");
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("tier, business_type")
      .eq("id", sessionUser.id)
      .maybeSingle();
    
    console.log("[DEBUG] GET website - user:", user, "error:", userError?.message);
    
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: sessionUser.id,
          email: (sessionUser as unknown as { email?: string }).email ?? "",
          name: (sessionUser as unknown as { name?: string }).name ?? "",
          tier: "free",
        })
        .select("tier, business_type")
        .maybeSingle();
      
      console.log("[DEBUG] GET website - created user:", newUser, "error:", createError?.message);
      user = newUser;
    }

    if (!user) {
      const email = (sessionUser as unknown as { email?: string }).email ?? "";
      const name = (sessionUser as unknown as { name?: string }).name ?? "";

      const { data: existingByEmail } = await supabase
        .from("users")
        .select("id, tier, business_type")
        .eq("email", email)
        .maybeSingle();

      if (existingByEmail) {
        user = existingByEmail;
      } else {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: sessionUser.id,
            email,
            name,
            tier: "free",
          })
          .select("tier, business_type")
          .maybeSingle();

        if (createError) {
          return NextResponse.json({ success: false, error: "Gagal membuat user" }, { status: 500 });
        }
        user = newUser;
      }
    }

    if (!user) {
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
      null,
      list.map((t) => t.name as string)
    );

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
      design_style_id?: string;
      sections?: unknown[];
      header?: Record<string, unknown>;
      footer?: Record<string, unknown>;
      theme?: Record<string, unknown>;
      core?: Record<string, unknown>;
      seo?: { title?: string; description?: string };
    } | null;

    let customConfig: {
      design_style_id?: string;
      sections?: unknown[];
      header?: Record<string, unknown>;
      footer?: Record<string, unknown>;
      theme: Record<string, unknown>;
      core?: Record<string, unknown>;
      seo: Record<string, string>;
    };
    let isDefault: boolean;
    if (stored && stored.template_id === template.id && storedConfig?.design_style_id) {
      customConfig = {
        design_style_id: storedConfig.design_style_id,
        sections: storedConfig.sections ?? [],
        header: storedConfig.header ?? {},
        footer: storedConfig.footer ?? {},
        theme: storedConfig.theme ?? {},
        core: storedConfig.core ?? {},
        seo: { ...(storedConfig.seo ?? {}) },
      };
      isDefault = false;
    } else {
      const merged = mergeAndValidateSections(templateSections, []);
      if (!merged.ok) {
        return NextResponse.json({ success: false, error: "Konfigurasi template rusak" }, { status: 500 });
      }
      customConfig = {
        design_style_id: (site as unknown as { design_style_id?: string }).design_style_id ?? 'minimalist',
        sections: [],
        header: {},
        footer: {},
        theme: {},
        core: {},
        seo: {},
      };
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
        trial_active: false,
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

    const hasNewFormat = body?.custom_config?.design_style_id !== undefined || body?.custom_config?.sections !== undefined;

    console.log('[DEBUG PUT] body keys:', Object.keys(body));
    console.log('[DEBUG PUT] template_id from body:', body.template_id);
    console.log('[DEBUG PUT] hasNewFormat:', hasNewFormat);

    const nextAuthToken = await getNextAuthToken();

    const site = await getOwnedWebsite(sessionUser.id, websiteId);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient(nextAuthToken);

    if (hasNewFormat) {
      const { template_id: raw_template_id, custom_config } = body;
      let template_id = raw_template_id as string | undefined;
      console.log('[DEBUG PUT] raw_template_id:', raw_template_id, 'template_id:', template_id);

      if (isDemoUserId(sessionUser.id)) {
        const demoTemplateId = template_id ?? STATIC_TEMPLATES[0]?.id ?? 'food';
        saveDemoWebsiteConfig(sessionUser.id, websiteId, demoTemplateId, custom_config);
        const tpl = STATIC_TEMPLATES.find((t) => t.id === demoTemplateId) || STATIC_TEMPLATES[0];
        return NextResponse.json({
          success: true,
          data: { website_id: websiteId, template_id: demoTemplateId, template_name: tpl.name, custom_config },
          message: "Website berhasil disimpan",
        });
      }

      let { data: user } = await supabase
        .from("users")
        .select("tier")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (!user) {
        const { data: newUser } = await supabase
          .from("users")
          .insert({
            id: sessionUser.id,
            email: (sessionUser as unknown as Record<string, unknown>).email as string ?? "",
            name: (sessionUser as unknown as Record<string, unknown>).name as string ?? "",
            tier: "free",
          })
          .select("tier")
          .maybeSingle();
        user = newUser;
      }

      if (!user) {
        return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
      }

      // Template builtin dari kode (catalog.ts) - bukan baris database.
      // ID & kategori diturunkan dari katalog agar tambah template baru
      // otomatis dikenali tanpa edit route ini.
      const BUILTIN_BY_ID = new Map(BUILT_IN_CATALOG.map((t) => [t.id, t]));

      // Normalize template_id: strip 'builtin-' prefix if present
      const normalizedTemplateId = template_id?.startsWith('builtin-') ? template_id.slice(8) : template_id;
      const builtinEntry = (normalizedTemplateId && BUILTIN_BY_ID.get(normalizedTemplateId)) || null;
      const isBuiltinTemplate = !!builtinEntry;

      console.log('[DEBUG] template_id:', template_id, 'normalized:', normalizedTemplateId, 'isBuiltinTemplate:', isBuiltinTemplate);

      // Gate tier per-template (sumber: CatalogTemplate.tiers; undefined = semua tier).
      if (builtinEntry && !isCatalogTemplateAllowedForTier(builtinEntry.tiers, user.tier)) {
        return NextResponse.json(
          {
            success: false,
            error: `Template ${builtinEntry.name} hanya untuk paket ${(builtinEntry.tiers ?? []).join(", ")}. Upgrade untuk membukanya.`,
            upgrade_url: "/dashboard/billing",
          },
          { status: 403 }
        );
      }

      // Builder/page-builder mengirim custom_config saja (template builtin dari kode).
      // Fallback: pakai template aktif website, lalu template aktif pertama.
      if (!template_id) {
        const { data: allTemplatesForFallback } = await supabase
          .from("templates")
          .select("id")
          .eq("is_active", true);
        template_id =
          (site.current_template_id as string | null) ?? (allTemplatesForFallback?.[0]?.id as string | undefined);
      }

      const { data: allTemplates } = await supabase
        .from("templates")
        .select("id, name")
        .eq("is_active", true);

      console.log('[DEBUG] allTemplates:', allTemplates);

      let dbTemplateId = isBuiltinTemplate ? normalizedTemplateId : template_id;
      let dbTemplate: { id: string; name: string } | null = null;

      if (isBuiltinTemplate) {
        // Map builtin template to database template by direct ID match.
        // Avoids category-name matching dependency entirely.
        const templateRows = allTemplates ?? [];
        const dbTemplateById = templateRows.find((t) => t.id === normalizedTemplateId) ?? null;
        if (dbTemplateById) {
          dbTemplate = dbTemplateById;
        } else {
          // Fallback: find by category name (original logic, now more reliable after DB category fix)
          const builtinById = new Map(BUILT_IN_CATALOG.map((t) => [t.id, t])).get(normalizedTemplateId ?? "") || null;
          if (builtinById) {
            dbTemplate = templateRows.find((t) => t.name === builtinById.category) ?? null;
          }
        }
        dbTemplateId = dbTemplate?.id ?? normalizedTemplateId;
      } else {
        // Regular database template lookup
        const { data: template, error: templateError } = await supabase
          .from("templates")
          .select(TEMPLATE_FIELDS)
          .eq("id", template_id)
          .eq("is_active", true)
          .maybeSingle();

        if (templateError || !template) {
          return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
        }
        dbTemplate = { id: template.id, name: template.name };
      }

      // Gate tier legacy (baris DB) hanya untuk template database.
      // Template builtin sudah dicek via CatalogTemplate.tiers di atas —
      // dbTemplate di sana hanya anchor FK, bukan template sebenarnya.
      if (!isBuiltinTemplate) {
        const allowed = getAllowedTemplateNames(
          user.tier,
          null,
          (allTemplates ?? []).map((t) => t.name as string)
        );
        if (!allowed.includes(dbTemplate?.name as string)) {
          return NextResponse.json(
            {
              success: false,
              error: `Template ${dbTemplate?.name} hanya untuk paket Starter ke atas. Upgrade untuk membuka semua template.`,
              upgrade_url: "/dashboard/billing",
            },
            { status: 403 }
          );
        }
      }

      // Normalisasi identitas sections di server: client lama / baris lama
      // bisa menyimpan tanpa variant+anchorId sehingga section hilang di live.
      // Aturan sama dengan seed kanvas & render publik → ketiganya sepakat.
      const sectionTemplateRef =
        (typeof body.template_id === 'string' && body.template_id.length > 0
          ? body.template_id
          : undefined) ??
        (typeof custom_config.catalog_template_id === 'string'
          ? (custom_config.catalog_template_id as string)
          : undefined);
      const toStore = {
        design_style_id: custom_config.design_style_id ?? 'minimalist',
        // Jangan buang skema warna user: tanpanya live site selalu
        // kembali ke warna bawaan template walau kanvas sudah diganti.
        palette_override: custom_config.palette_override ?? {},
        sections: ensureSectionIdentities(custom_config.sections ?? [], sectionTemplateRef),
        header: custom_config.header ?? {},
        footer: custom_config.footer ?? {},
        theme: custom_config.theme ?? {},
        core: custom_config.core ?? {},
        seo: custom_config.seo ?? {},
        catalog_template_id: body.template_id ?? undefined,
      };

      const { error: upsertError } = await supabase.from("user_templates").upsert(
        {
          user_id: sessionUser.id,
          website_id: websiteId,
          template_id: dbTemplateId,
          custom_config: toStore,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "website_id,template_id" }
      );
      if (upsertError) {
        console.error("Upsert website config error:", upsertError);
        return NextResponse.json({ success: false, error: "Gagal menyimpan konfigurasi" }, { status: 500 });
      }

      // Apply template sections to homepage (store_pages with is_homepage=true)
      // Upsert: create if not exists, update if exists.
      // PENTING: hanya sync bila yang disimpan memang homepage. Tanpa gate ini,
      // menyimpan halaman lain (sections global = snapshot basi) akan menimpa
      // layout homepage asli di store_pages. Page-builder mengirim is_homepage
      // eksplisit; builder lama tidak mengirim (undefined) → perilaku lama dijaga.
      const homepageSections = custom_config.sections ?? [];
      if (homepageSections.length > 0 && body.is_homepage !== false) {
        // First check if homepage exists
        const { data: existingHomepage } = await supabase
          .from("store_pages")
          .select("id")
          .eq("website_id", websiteId)
          .eq("is_homepage", true)
          .maybeSingle();

        if (existingHomepage) {
          // Update existing
          const { error: pageError } = await supabase
            .from("store_pages")
            .update({
              layout: { sections: homepageSections },
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingHomepage.id);
          if (pageError) {
            console.error("Update homepage layout error:", pageError);
          }
        } else {
          // Create new homepage with template sections
          const { error: pageError } = await supabase
            .from("store_pages")
            .insert({
              website_id: websiteId,
              title: "Halaman Utama",
              slug: "home",
              type: "custom",
              is_published: true,
              is_homepage: true,
              layout: { sections: homepageSections },
              content: "",
            });
          if (pageError) {
            console.error("Create homepage with template error:", pageError);
          }
        }
      }

      await supabase
        .from("websites")
        .update({ current_template_id: dbTemplateId, updated_at: new Date().toISOString() })
        .eq("id", websiteId)
        .eq("user_id", sessionUser.id);

      revalidatePath("/", "layout");

      return NextResponse.json({
        success: true,
        data: { website_id: websiteId, template_id: dbTemplateId, template_name: dbTemplate?.name ?? 'Custom', custom_config: toStore },
        message: "Website berhasil disimpan",
      });
    }

    // Old format: validate with existing schema (supports partial updates)
    const { template_id: bodyTemplateId, custom_config: bodyCustomConfig } = body as {
      template_id?: string;
      custom_config?: Record<string, unknown>;
    };

    // If partial update (only seo, etc), fetch existing and merge
    let template_id = bodyTemplateId;
    let custom_config = bodyCustomConfig ?? {};

    if (!template_id || !bodyCustomConfig?.sections) {
      // Fetch existing config to get template_id and merge
      const { data: existing } = await supabase
        .from("user_templates")
        .select("template_id, custom_config")
        .eq("website_id", websiteId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        template_id = template_id ?? existing.template_id;
        if (bodyCustomConfig) {
          custom_config = { ...(existing.custom_config as Record<string, unknown>), ...bodyCustomConfig };
        }
      }
    }

    const validation = websiteConfigSchema.safeParse({ template_id, custom_config });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    const { template_id: validatedTemplateId, custom_config: validatedConfig } = validation.data;

    if (isDemoUserId(sessionUser.id)) {
      saveDemoWebsiteConfig(sessionUser.id, websiteId, validatedTemplateId, custom_config);
      const tpl = STATIC_TEMPLATES.find((t) => t.id === validatedTemplateId) || STATIC_TEMPLATES[0];
      return NextResponse.json({
        success: true,
        data: { website_id: websiteId, template_id: validatedTemplateId, template_name: tpl.name, custom_config },
        message: "Website berhasil disimpan",
      });
    }

    // Save partial update to user_templates
    const toStore = {
      design_style_id: custom_config.design_style_id ?? 'minimalist',
      palette_override: sanitizePaletteOverride(custom_config.palette_override),
      sections: custom_config.sections ?? [],
      header: custom_config.header ?? {},
      footer: custom_config.footer ?? {},
      theme: custom_config.theme ?? {},
      core: custom_config.core ?? {},
      seo: custom_config.seo ?? {},
    };

    const { error: upsertError } = await supabase.from("user_templates").upsert(
      {
        user_id: sessionUser.id,
        website_id: websiteId,
        template_id: validatedTemplateId,
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
      .update({ current_template_id: validatedTemplateId, updated_at: new Date().toISOString() })
      .eq("id", websiteId)
      .eq("user_id", sessionUser.id);

    return NextResponse.json({
      success: true,
      data: { website_id: websiteId, template_id: validatedTemplateId, template_name: 'Custom', custom_config: toStore },
      message: "Website berhasil disimpan",
    });
  } catch (error) {
    console.error("Save website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}