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
import { resolveTemplateId } from "@/lib/builder/apply-template";
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

    const site = await getOwnedWebsite(sessionUser.id, websiteId);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient();
    // Pisahkan: hanya `user` yang di-reassign (fallback auto-create di bawah),
    // `userError` hanya dibaca untuk logging.
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("tier, business_type")
      .eq("id", sessionUser.id)
      .maybeSingle();
    let user = userRow;

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

    // Katalog statis dari kode — satu-satunya sumber template
    // (templates_library dihapus, migrasi 039-040).
    const list = BUILT_IN_CATALOG;
    if (list.length === 0) {
      return NextResponse.json({ success: false, error: "Template belum tersedia" }, { status: 503 });
    }

    const { data: rows } = await supabase
      .from("user_templates")
      .select("template_slug, custom_config, updated_at")
      .eq("website_id", websiteId)
      .order("updated_at", { ascending: false });

    // Template aktif: template_slug website → cocok kategori bisnis →
    // template pertama. `template_name` dikembalikan sebagai category
    // karena frontend mencocokkannya ke katalog (t.category === template_name).
    const siteSlug =
      typeof (site as unknown as { template_slug?: unknown }).template_slug === "string"
        ? resolveTemplateId(
            (site as unknown as { template_slug?: string }).template_slug as string,
          )
        : null;
    const template =
      (siteSlug ? list.find((t) => t.id === siteSlug) : undefined) ??
      (site.business_type ? list.find((t) => t.category === site.business_type) : undefined) ??
      (user.business_type ? list.find((t) => t.category === user.business_type) : undefined) ??
      list[0];
    const stored =
      (rows ?? []).find((r) => (r.template_slug as string | null) === template.id) ??
      (rows ?? [])[0] ??
      null;

    type StoredConfig = {
      design_style_id?: string;
      sections?: unknown[];
      header?: Record<string, unknown>;
      footer?: Record<string, unknown>;
      theme?: Record<string, unknown>;
      core?: Record<string, unknown>;
      seo?: { title?: string; description?: string };
      // Single-page (044): status tayang + meta halaman.
      is_published?: boolean;
      meta_title?: string;
      meta_description?: string;
      og_image_url?: string;
    };
    const storedConfig = (stored?.custom_config ?? null) as StoredConfig | null;

    let customConfig: {
      design_style_id?: string;
      sections?: unknown[];
      header?: Record<string, unknown>;
      footer?: Record<string, unknown>;
      theme?: Record<string, unknown>;
      core?: Record<string, unknown>;
      seo?: { title?: string; description?: string };
      is_published?: boolean;
      meta_title?: string;
      meta_description?: string;
      og_image_url?: string;
    };
    let isDefault: boolean;
    if (stored && storedConfig?.design_style_id) {
      customConfig = {
        design_style_id: storedConfig.design_style_id,
        sections: storedConfig.sections ?? [],
        header: storedConfig.header ?? {},
        footer: storedConfig.footer ?? {},
        theme: storedConfig.theme ?? {},
        core: storedConfig.core ?? {},
        seo: { ...(storedConfig.seo ?? {}) },
        // Single-page (044): status tayang & meta dibawa ke builder.
        is_published: storedConfig.is_published !== false,
        meta_title: storedConfig.meta_title,
        meta_description: storedConfig.meta_description,
        og_image_url: storedConfig.og_image_url,
      };
      isDefault = false;
    } else {
      customConfig = {
        design_style_id: (site as unknown as { design_style_id?: string }).design_style_id ?? 'minimalist',
        sections: [],
        header: {},
        footer: {},
        theme: {},
        core: {},
        seo: {},
        is_published: true,
      };
      isDefault = true;
    }

    // Gate tier kumulatif (paket atas bisa memakai template paket bawahnya).
    // template_name = category agar frontend bisa match ke katalog public.
    const templateLocked = !isCatalogTemplateAllowedForTier(template.tiers, user.tier);

    return NextResponse.json({
      success: true,
      data: {
        website_id: site.id,
        website_name: site.name,
        template_id: template.id,
        template_name: template.category,
        template_locked: templateLocked,
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

    const nextAuthToken = await getNextAuthToken();

    const site = await getOwnedWebsite(sessionUser.id, websiteId);
    if (!site || site.id !== websiteId) {
      return NextResponse.json({ success: false, error: "Website tidak ditemukan" }, { status: 404 });
    }

    const supabase = await createServerSupabaseClient(nextAuthToken);

    if (hasNewFormat) {
      const { template_id: raw_template_id, custom_config } = body;
      // Normalisasi ID: prefix legacy system-/builtin- dibuang. Hasilnya
      // HARUS slug katalog statis (mis. 'food') — UUID library lama ditolak.
      // `template_source` (saved/builtin) diabaikan: hanya kompatibilitas
      // client lama, tidak lagi mempengaruhi lookup.
      const normalizedId =
        typeof raw_template_id === "string" && raw_template_id
          ? resolveTemplateId(raw_template_id)
          : "";
      const siteSlug =
        typeof (site as unknown as { template_slug?: unknown }).template_slug === "string"
          ? ((site as unknown as { template_slug?: string }).template_slug as string)
          : null;
      const catalogTemplate =
        (normalizedId ? BUILT_IN_CATALOG.find((t) => t.id === normalizedId) : undefined) ??
        (siteSlug ? BUILT_IN_CATALOG.find((t) => t.id === siteSlug) : undefined) ??
        (site.business_type
          ? BUILT_IN_CATALOG.find((t) => t.category === site.business_type)
          : undefined) ??
        BUILT_IN_CATALOG[0];
      if (!catalogTemplate) {
        return NextResponse.json({ success: false, error: "Template belum tersedia" }, { status: 503 });
      }
      if (normalizedId && normalizedId !== catalogTemplate.id) {
        return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
      }
      const slug = catalogTemplate.id;

      if (isDemoUserId(sessionUser.id)) {
        saveDemoWebsiteConfig(sessionUser.id, websiteId, slug, custom_config);
        return NextResponse.json({
          success: true,
          data: { website_id: websiteId, template_id: slug, template_name: catalogTemplate.category, custom_config },
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

      // Gate tier per-template (saat ini semua terbuka; tetap dicek agar
      // 403 otomatis bila katalog nanti mengunci tier tertentu).
      if (!isCatalogTemplateAllowedForTier(catalogTemplate.tiers, user.tier)) {
        return NextResponse.json(
          {
            success: false,
            error: `Template ${catalogTemplate.name} hanya untuk paket tertentu. Upgrade untuk membukanya.`,
            upgrade_url: "/dashboard/billing",
          },
          { status: 403 }
        );
      }

      // Normalisasi identitas sections di server: client lama / baris lama
      // bisa menyimpan tanpa variant+anchorId sehingga section hilang di live.
      // Aturan sama dengan seed kanvas & render publik → ketiganya sepakat.
      const toStore = {
        design_style_id: custom_config.design_style_id ?? 'minimalist',
        // Jangan buang skema warna user: tanpanya live site selalu
        // kembali ke warna bawaan template walau kanvas sudah diganti.
        palette_override: custom_config.palette_override ?? {},
        sections: ensureSectionIdentities(custom_config.sections ?? [], slug),
        header: custom_config.header ?? {},
        footer: custom_config.footer ?? {},
        theme: custom_config.theme ?? {},
        core: custom_config.core ?? {},
        seo: custom_config.seo ?? {},
        // Animasi/behaviour template ikut tersimpan agar `BehaviourRuntime`
        // bisa menjalankannya di live site. Template tanpa animasi → array kosong,
        // bukan undefined, supaya template lama yang disimpan ulang bersih.
        animations: Array.isArray(custom_config.animations) ? custom_config.animations : [],
        behaviours: Array.isArray(custom_config.behaviours) ? custom_config.behaviours : [],
        // CSS kustom template ikut tersimpan agar `BehaviourRuntime` bisa
        // menampilkannya di live site.
        customCss: typeof custom_config.customCss === 'string' ? custom_config.customCss : '',
        catalog_template_id: slug,
        // Single-page (044): status tayang + meta halaman ikut di config yang
        // sama. Builder mengirimnya saat Simpan / Publish.
        is_published: custom_config.is_published !== false,
        meta_title: typeof custom_config.meta_title === 'string' ? custom_config.meta_title : null,
        meta_description: typeof custom_config.meta_description === 'string' ? custom_config.meta_description : null,
        og_image_url: typeof custom_config.og_image_url === 'string' ? custom_config.og_image_url : null,
      };

      const { error: upsertError } = await supabase.from("user_templates").upsert(
        {
          user_id: sessionUser.id,
          website_id: websiteId,
          template_slug: slug,
          custom_config: toStore,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "website_id,template_slug" }
      );
      if (upsertError) {
        console.error("Upsert website config error:", upsertError);
        return NextResponse.json({ success: false, error: "Gagal menyimpan konfigurasi" }, { status: 500 });
      }

      // Single-page: sections halaman kini ikut tersimpan di
      // user_templates.custom_config (lihat 044_single_page_user_templates.sql),
      // jadi tidak ada lagi sinkronisasi terpisah ke store_pages.

      await supabase
        .from("websites")
        .update({ template_slug: slug, updated_at: new Date().toISOString() })
        .eq("id", websiteId)
        .eq("user_id", sessionUser.id);

      revalidatePath("/", "layout");

      return NextResponse.json({
        success: true,
        data: { website_id: websiteId, template_id: slug, template_name: catalogTemplate.category, custom_config: toStore },
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
      // Fetch existing config to get template slug and merge
      const { data: existing } = await supabase
        .from("user_templates")
        .select("template_slug, custom_config")
        .eq("website_id", websiteId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        template_id = template_id ?? (existing.template_slug as string | undefined);
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

    // Normalisasi ke slug katalog (tolak UUID library lama).
    const slug = resolveTemplateId(validatedTemplateId);
    const catalogTemplate = BUILT_IN_CATALOG.find((t) => t.id === slug);
    if (!catalogTemplate) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    if (isDemoUserId(sessionUser.id)) {
      saveDemoWebsiteConfig(sessionUser.id, websiteId, slug, custom_config);
      return NextResponse.json({
        success: true,
        data: { website_id: websiteId, template_id: slug, template_name: catalogTemplate.category, custom_config },
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
      // Single-page (044): status tayang + meta halaman.
      is_published: custom_config.is_published !== false,
      meta_title: typeof custom_config.meta_title === 'string' ? custom_config.meta_title : null,
      meta_description: typeof custom_config.meta_description === 'string' ? custom_config.meta_description : null,
      og_image_url: typeof custom_config.og_image_url === 'string' ? custom_config.og_image_url : null,
    };

    const { error: upsertError } = await supabase.from("user_templates").upsert(
      {
        user_id: sessionUser.id,
        website_id: websiteId,
        template_slug: slug,
        custom_config: toStore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "website_id,template_slug" }
    );
    if (upsertError) {
      console.error("Upsert website config error:", upsertError);
      return NextResponse.json({ success: false, error: "Gagal menyimpan konfigurasi" }, { status: 500 });
    }

    await supabase
      .from("websites")
      .update({ template_slug: slug, updated_at: new Date().toISOString() })
      .eq("id", websiteId)
      .eq("user_id", sessionUser.id);

    return NextResponse.json({
      success: true,
      data: { website_id: websiteId, template_id: slug, template_name: catalogTemplate.category, custom_config: toStore },
      message: "Website berhasil disimpan",
    });
  } catch (error) {
    console.error("Save website error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}