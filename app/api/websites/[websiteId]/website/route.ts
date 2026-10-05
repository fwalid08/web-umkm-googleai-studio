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
  type MergedSection,
} from "@/lib/builder/validation";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { resolveTemplateId } from "@/lib/builder/apply-template";
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
import {
  buildLibrarySlug,
  isLibrarySlug,
  normalizeLibraryName,
} from "@/lib/builder/template-library";
import {
  buildActiveCustomConfig,
  buildDefaultCustomConfig,
  buildStoredCustomConfig,
  hasStoredCustomConfig,
  resolveNextIsPublished,
  type ActiveCustomConfig,
} from "@/lib/builder/website-config";

/**
 * Salin config saat ini ke `user_templates` sebagai template library
 * ("Simpan sebagai Template").
 *
 * Berdiri sebagai helper (bukan inline di dalam handler) karena handler ini
 * punya DUA branch yang masing-masing membangun `toStore` sendiri — menaruh
 * logikanya inline berarti menyalinnya dua kali, dan dua salinan itu pasti
 * menyimpang seiring waktu lalu diam-diam menulis config berbeda bentuknya.
 *
 * Template aktif website TIDAK tersentuh: branch upsert normal dilewati
 * sepenuhnya saat helper ini mengembalikan response.
 */
async function saveAsLibraryTemplate(args: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
  websiteId: string;
  /** Slug katalog asal ('food'), disimpan sebagai base_slug untuk apply. */
  baseSlug: string;
  name: string;
  toStore: Record<string, unknown>;
}): Promise<NextResponse> {
  const { supabase, userId, websiteId, baseSlug, toStore } = args;
  const name = normalizeLibraryName(args.name);
  // Slug sintetis `saved-<uuid>`: kalau slug katalog dipakai, constraint
  // UNIQUE (website_id, template_slug) akan membuat tiap Simpan menimpa
  // template sebelumnya alih-alih menambah yang baru.
  const templateSlug = buildLibrarySlug(crypto.randomUUID());
  const now = new Date().toISOString();

  const { error } = await supabase.from("user_templates").insert({
    user_id: userId,
    website_id: websiteId,
    template_slug: templateSlug,
    base_slug: baseSlug,
    name,
    is_library: true,
    // Dipaksa false: salinan library adalah aset untuk dipakai ulang, bukan
    // konten publik. Status tayang milik template aktif.
    custom_config: { ...toStore, is_published: false },
    created_at: now,
    updated_at: now,
  });
  if (error) {
    console.error("Insert template library error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan template" },
      { status: 500 },
    );
  }
  return NextResponse.json({
    success: true,
    data: { library: { template_slug: templateSlug, base_slug: baseSlug, name } },
    message: `Template "${name}" tersimpan di library`,
  });
}

/**
 * Baca config template AKTIF website yang sudah tersimpan.
 *
 * Dipakai `PUT` untuk mempertahankan `is_published` saat payload tidak
 * mengirimnya (jalur "terapkan template"). Tanpa ini, aturan lama
 * `custom_config.is_published === true` mengubah payload tanpa field menjadi
 * `false` — yaitu menerapkan template diam-diam mengembalikan website ke Draft
 * dan live site ikut 404.
 *
 * `slugs` dicoba berurutan: slug template yang SEDANG aktif dulu, baru slug
 * tujuan. Penting — status tayang milik WEBSITE, jadi saat user apply template
 * lain (slug berbeda) status lama tetap yang dicari. Kalau hanya slug tujuan
 * yang dicek, baris tujuannya belum ada sehingga hasilnya `null` dan website
 * tetap jatuh ke Draft.
 *
 * `is_library = false` wajib: baris library bukan template aktif.
 */
async function readExistingActiveConfig(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  websiteId: string,
  slugs: Array<string | null | undefined>,
): Promise<Record<string, unknown> | null> {
  for (const slug of slugs) {
    if (!slug) continue;
    const { data } = await supabase
      .from("user_templates")
      .select("custom_config")
      .eq("website_id", websiteId)
      .eq("template_slug", slug)
      .eq("is_library", false)
      .maybeSingle();
    const config = (data?.custom_config ?? null) as Record<string, unknown> | null;
    if (config) return config;
  }
  return null;
}

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

    // `is_library = false` WAJIB: baris library ("Simpan sebagai Template",
    // slug `saved-<uuid>`) juga punya website_id yang sama. Tanpa filter ini
    // baris library ikut jadi kandidat `stored` di bawah — dan karena
    // urut `updated_at` DESC, baris library terbaru bisa dipakai sebagai
    // config aktif website (design user "ditimpa" desain karangan).
    const { data: rows } = await supabase
      .from("user_templates")
      .select("template_slug, custom_config, updated_at")
      .eq("website_id", websiteId)
      .eq("is_library", false)
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

    const storedConfig = (stored?.custom_config ?? null) as Record<string, unknown> | null;

    // Config aktif untuk builder. WAJIB lewat `buildActiveCustomConfig` —
    // versi lama memakai whitelist tulisan tangan yang lebih sempit, sehingga
    // `palette_override` (warna tema), `customCss`, `animations`, `behaviours`,
    // dan `assets` yang SUDAH tersimpan tidak pernah dikirim ke builder.
    // Akibatnya setiap reload kanvas kembali ke warna bawaan template
    // katalog, dan template hasil "Simpan sebagai Template" tampak
    // "tidak berubah" saat diterapkan lagi.
    let customConfig: ActiveCustomConfig;
    let isDefault: boolean;
    if (hasStoredCustomConfig(stored, storedConfig)) {
      customConfig = buildActiveCustomConfig(storedConfig);
      isDefault = false;
    } else {
      customConfig = buildDefaultCustomConfig(
        (site as unknown as { design_style_id?: string }).design_style_id,
      );
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
    // Flag "Simpan sebagai Template": `true` = salin config saat ini ke
    // `user_templates` sebagai template yang bisa dipilih ulang, BUKAN
    // menyimpan template aktif website. Dibaca di luar branch `hasNewFormat`
    // supaya kedua jalur PUT memakainya.
    const saveAsTemplate = body?.save_as_template === true;
    const libraryName = typeof body?.library_name === "string" ? body.library_name : "";

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

      // Config aktif saat ini — sumber untuk mempertahankan `is_published`.
      // `siteSlug` (template yang SEDANG dipakai) dicoba lebih dulu supaya
      // status tayang website ikut saat user apply template lain.
      const existingActiveConfig = await readExistingActiveConfig(supabase, websiteId, [
        siteSlug,
        slug,
      ]);
      // Whitelist simpan = `buildStoredCustomConfig` (satu-satunya definisi,
      // sama untuk branch format baru & legacy). Normalisasi identitas
      // sections, sanitasi palette, dan creative layer ditangani di sana.
      const storedBase = buildStoredCustomConfig(custom_config, slug);
      // Status tayang milik WEBSITE, bukan milik template. `applyTemplateToWebsite`
      // (katalog) dan `applySavedTemplate` (library) sengaja tidak mengirim
      // `is_published`; dengan aturan lama (`=== true`) payload tanpa field itu
      // menjadi Draft dan live site ikut 404. Payload yang memang mengirim
      // boolean (tombol Simpan/Tayangkan, panel SEO) tetap dihormati.
      const toStore = {
        ...storedBase,
        is_published: resolveNextIsPublished(custom_config.is_published, existingActiveConfig),
      };

      // "Simpan sebagai Template" — salin ke library lalu KEMBALI. Upsert
      // template aktif di bawah sengaja dilewati.
      if (saveAsTemplate) {
        return saveAsLibraryTemplate({
          supabase,
          userId: sessionUser.id,
          websiteId,
          baseSlug: slug,
          name: libraryName,
          toStore: toStore as Record<string, unknown>,
        });
      }

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
    // Config aktif yang sudah tersimpan. Dipakai untuk merge partial update
    // DAN untuk mempertahankan `is_published` (status milik website).
    let existingActiveConfig: Record<string, unknown> | null = null;

    if (!template_id || !bodyCustomConfig?.sections) {
      // Fetch existing config to get template slug and merge.
      // `is_library = false` wajib: tanpa itu baris library (slug
      // `saved-<uuid>`) bisa terpilih dan meng-override `template_id` website
      // dengan slug yang tidak dikenal katalog.
      const { data: existing } = await supabase
        .from("user_templates")
        .select("template_slug, custom_config")
        .eq("website_id", websiteId)
        .eq("is_library", false)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        template_id = template_id ?? (existing.template_slug as string | undefined);
        existingActiveConfig = (existing.custom_config ?? null) as Record<string, unknown> | null;
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

    // Save partial update ke user_templates. Whitelist sama dengan branch format
    // baru (`buildStoredCustomConfig`) — sebelumnya branch ini punya versi
    // sendiri yang membuang `assets` dan `customCss`, jadi payload lama bisa
    // menghapus creative layer yang baru saja disimpan.
    // `is_published`: kalau payload tidak mengirimnya, status milik website
    // dipertahankan (lihat `resolveNextIsPublished`).
    const legacyExistingConfig =
      existingActiveConfig ?? (await readExistingActiveConfig(supabase, websiteId, [slug]));
    const toStore = {
      ...buildStoredCustomConfig(custom_config, slug),
      is_published: resolveNextIsPublished(custom_config.is_published, legacyExistingConfig),
    };

    // Jalur legacy (payload client lama) — hormati flag library yang sama.
    if (saveAsTemplate) {
      return saveAsLibraryTemplate({
        supabase,
        userId: sessionUser.id,
        websiteId,
        baseSlug: slug,
        name: libraryName,
        toStore: toStore as Record<string, unknown>,
      });
    }

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