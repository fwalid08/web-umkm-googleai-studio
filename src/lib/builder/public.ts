import { headers } from "next/headers";
import { cache } from "react";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { mergeAndValidateSections, type MergedSection } from "@/lib/builder/validation";
import type { ColorPalette, TypographyConfig, SectionConfig, SectionType } from "@/types";
import type { AnimationConfig, BehaviourConfig, TemplateSectionInstance } from "@/lib/builder/template-types";
import type { DesignStylePalette, DesignStyleTypography } from "@/lib/builder/types";
import { getDemoPublicSite } from "@/lib/mock/store";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { isValidSubdomain, normalizeHost, rootHost, isRootHost } from "@/lib/tenant";
import { defaultAnchorId, uniqueAnchorId } from "@/lib/builder/migration";

/** Convert builder section format to MergedSection format for public rendering. */
function builderToMergedSection(
  builderSection: {
    id: string;
    type: string;
    variant: string;
    anchorId?: string;
    config?: Record<string, unknown>;
    style?: Record<string, unknown>;
    responsive?: Record<string, unknown>;
  },
  templateSection: SectionConfig
): MergedSection {
  return {
    id: builderSection.id,
    type: builderSection.type,
    label: templateSection.label,
    enabled: true,
    required: templateSection.required ?? false,
    order: templateSection.order ?? 0,
    style: builderSection.style ?? {},
    content: builderSection.config ?? {},
  };
}

/**
 * Sprint 01 US-04 — Public tenant lookup + merge.
 * SERVER-ONLY: pakai service-role karena RLS memblokir anon membaca
 * tabel users/user_templates. Hanya kolom public-safe yang di-SELECT
 * (TIDAK PERNAH email / data sensitif).
 */

export interface PublicSiteData {
  subdomain: string;
  /** ID website (baris websites.id) — dipakai form live untuk submit. */
  websiteId: string;
  name: string;
  businessType: string;
  palette: ColorPalette;
  typography: TypographyConfig;
  sections: MergedSection[];
  seo: { title: string; description: string };
  whatsapp: string;
  /** Template ID (slug katalog, mis. 'food') untuk V3 renderer. */
  templateId?: string;
  /** Builder format sections untuk V3 renderer (TemplateSectionInstance[]). */
  builderSections?: TemplateSectionInstance[];
  /** Header config untuk V3 renderer. */
  header?: Record<string, unknown>;
  /** Footer config untuk V3 renderer. */
  footer?: Record<string, unknown>;
  /** Palette override untuk V3 renderer. */
  paletteOverride?: Record<string, string>;
  /**
   * Animasi & behaviour template, untuk V3 renderer. Disimpan di
   * `custom_config` saat template diterapkan; `BehaviourRuntime` yang
   * menjalankannya di live site.
   */
  templateAnimations?: AnimationConfig[];
  templateBehaviours?: BehaviourConfig[];
  /** CSS kustom template — diteruskan ke `BehaviourRuntime`. */
  templateCustomCss?: string;
  /** Catalog template's palette for V3 renderer (when different from database template). */
  v3Palette?: DesignStylePalette;
  /** Catalog template's typography for V3 renderer (when different from database template). */
  v3Typography?: DesignStyleTypography;
  /** Slug halaman yang sedang dirender (untuk routing). */
  pageSlug?: string;
  /** ID halaman yang sedang dirender. */
  pageId?: string;
  /** Apakah halaman ini adalah homepage. */
  isHomepage?: boolean;
  /** Meta title halaman. */
  metaTitle?: string;
  /** Meta description halaman. */
  metaDescription?: string;
  /** OG image URL halaman. */
  ogImageUrl?: string;
}

const TEMPLATE_FIELDS =
  "id, name, description, color_palette, typography_config, sections_config, is_active";

interface PublicUserRow {
  id: string;
  user_id: string;
  name: string | null;
  business_type: string | null;
  subdomain: string | null;
  current_template_id?: string | null;
  template_slug: string | null;
}

function digitsOnly(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

/** Cari nomor WA pertama dari section yang aktif (contact / whatsapp_button / hero). */
function findWhatsapp(sections: MergedSection[]): string {
  for (const s of sections) {
    if (!s.enabled) continue;
    const c = s.content as Record<string, unknown>;
    for (const key of ["whatsapp", "phone"]) {
      const v = c[key];
      if (typeof v === "string" && digitsOnly(v).length >= 9) return digitsOnly(v);
    }
  }
  return "";
}

/** Fetch products from database for a website.
 * F2-4: mints fresh signed URLs from storage_path (stored public_url may be an
 * expired 7-day signed URL). Falls back to stored public_url when minting fails.
 */
async function fetchProductsForWebsite(websiteId: string): Promise<Array<{
  id: string;
  name: string;
  price: number;
  description: string | null;
  category: string;
  stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  images: Array<{ public_url: string; alt_text: string | null }>;
}>> {
  const supabase = createServiceSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      description,
      category,
      stock,
      low_stock_threshold,
      is_active,
      product_images (
        storage_path,
        public_url,
        alt_text,
        is_primary,
        sort_order
      )
    `)
    .eq("website_id", websiteId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  // Mint fresh signed URLs (best-effort, batched per product)
  const { getStorageProvider } = await import("@/lib/storage/factory");
  const storage = getStorageProvider();
  const rows = data || [];
  return await Promise.all(
    rows.map(async (p) => {
      const imgs = ((p.product_images || []) as Array<{
        storage_path?: string | null;
        public_url?: string | null;
        alt_text?: string | null;
        is_primary?: boolean;
        sort_order?: number;
      }>).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      const images = await Promise.all(
        imgs.map(async (img) => {
          if (img.storage_path) {
            try {
              const signed = await storage.getSignedUrl({ path: img.storage_path, expiresIn: 604800 });
              if (signed.success && signed.url) {
                return { public_url: signed.url, alt_text: img.alt_text ?? null };
              }
            } catch {
              // fall through to stored URL
            }
          }
          return { public_url: img.public_url ?? "", alt_text: img.alt_text ?? null };
        })
      );
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        category: p.category,
        stock: p.stock,
        low_stock_threshold: p.low_stock_threshold ?? 5,
        is_active: p.is_active,
        images,
      };
    })
  );
}

async function buildSite(user: PublicUserRow): Promise<PublicSiteData | null> {
  const supabase = createServiceSupabaseClient();

  // Katalog statis dari kode — satu-satunya sumber template
  // (tabel `templates`/`templates_library` sudah dihapus).
  const list = BUILT_IN_CATALOG;
  if (list.length === 0) return null;

  const template =
    (user.template_slug && list.find((t) => t.id === user.template_slug)) ||
    (user.current_template_id && list.find((t) => t.id === user.current_template_id)) ||
    (user.business_type && list.find((t) => t.category === user.business_type)) ||
    list[0];

  const { data: row } = await supabase
    .from("user_templates")
    .select("custom_config")
    .eq("website_id", user.id)
    .eq("template_slug", template.id)
    .maybeSingle();

  const stored = (row?.custom_config ?? null) as {
    sections?: Array<{
      id: string;
      type: string;
      variant: string;
      anchorId?: string;
      config?: Record<string, unknown>;
      style?: Record<string, unknown>;
      responsive?: Record<string, unknown>;
    }>;
    header?: Record<string, unknown>;
    footer?: Record<string, unknown>;
    theme?: Record<string, unknown>;
    palette_override?: Record<string, string>;
    paletteOverride?: Record<string, string>;
    core?: Record<string, unknown>;
    seo?: { title?: string; description?: string };
    catalog_template_id?: string;
    /** Status tayang halaman (single-page, lihat 044). `false` = 404. */
    is_published?: boolean;
    /** Meta per-halaman (single-page, lihat 044). */
    meta_title?: string;
    meta_description?: string;
    og_image_url?: string;
    /** Animasi & behaviour template — dijalankan `BehaviourRuntime`. */
    animations?: AnimationConfig[];
    behaviours?: BehaviourConfig[];
    /** CSS kustom template — ditampilkan `BehaviourRuntime`. */
    customCss?: string;
  } | null;

  // Template katalog untuk mapping section: selalu template statis yang
  // sama dengan `template` di atas (`catalog_template_id` simpanan lama
  // diabaikan — UUID library tidak lagi dikenal).
  const sectionMappingTemplate = {
    sections_config: template.sections.map((def, i) => ({
      id: def.type,
      type: def.type as SectionType,
      label: def.name,
      required: false,
      order: i,
      default_props: def.variants[0]?.defaultConfig ?? {},
    })),
  };
  const catalogTemplateId: string | null = template.id;

  // Website sekarang SATU HALAMAN (lihat 044_single_page_user_templates.sql).
  // `user_templates.custom_config` adalah satu-satunya sumber isi halaman:
  // sections dan meta. Tabel `store_pages` sudah dihapus, jadi tidak ada lagi
  // baris "is_homepage" yang dicari terpisah.
  //
  // `is_published` TIDAK lagi jadi gerbang render. Builder tidak punya konsep
  // draft: satu-satunya aksi yang menyentuh website publik adalah tombol
  // "Tampilkan". Sebelumnya ada `if (!isPublished) return null;` yang membuat
  // live site 404 hanya karena satu klik "Simpan", dan statusnya nempel —
  // harus klik "Tayangkan" lagi untuk memulihkannya. Status tayang kini
  // hanya informatif di panel builder; baris yang tadinya `false` otomatis
  // tampil lagi begitu gerbang ini dihapus.
  const pageMeta: { title?: string; description?: string; ogImageUrl?: string } = {
    title: stored?.meta_title ?? undefined,
    description: stored?.meta_description ?? undefined,
    ogImageUrl: stored?.og_image_url ?? undefined,
  };

  const pageSections = Array.isArray(stored?.sections) && stored.sections.length > 0 ? stored.sections : null;

  let sections: MergedSection[];
  let theme: Record<string, unknown> = {};
  let seo: { title?: string; description?: string } = {};

  // Sumber render homepage: hanya dari custom_config.sections di user_templates.
  const sectionsToRender = pageSections;

  if (sectionsToRender && sectionsToRender.length > 0) {
    // Convert builder format sections to MergedSection format
    const templateSectionMap = new Map<string, SectionConfig>(
      (sectionMappingTemplate.sections_config ?? []).map((s: SectionConfig) => [s.id, s])
    );
    sections = sectionsToRender.map((bs) => {
      const ts: SectionConfig | undefined = templateSectionMap.get(bs.type);
      if (ts) return builderToMergedSection(bs, ts);
      // Fallback: create minimal SectionConfig for unknown types
      const fallback = {
        id: bs.type,
        type: bs.type as SectionType,
        label: bs.type,
        default_props: {},
        required: false,
        order: 0,
      } as SectionConfig;
      return builderToMergedSection(bs, fallback);
    });
    theme = stored?.theme ?? {};
    seo = stored?.seo ?? {};
  } else {
    const merged = mergeAndValidateSections(
      (sectionMappingTemplate.sections_config ?? []) as Parameters<typeof mergeAndValidateSections>[0],
      []
    );
    sections = merged.ok ? merged.sections : [];
  }

  // Fetch products from DB and inject into product_grid sections
  const products = await fetchProductsForWebsite(user.id);
  if (products.length > 0) {
    sections = sections.map((s) => {
      if (s.type === "product_grid" && s.enabled) {
        return {
          ...s,
          content: {
            ...s.content,
            items: products.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              description: p.description,
              image: p.images[0]?.public_url || "",
              category: p.category,
              stock: p.stock,
              low_stock_threshold: p.low_stock_threshold,
              is_active: p.is_active,
            })),
          },
        };
      }
      return s;
    });
  }

  const rawPalette = theme.palette;
  const palettePatch =
    rawPalette && typeof rawPalette === "object" && !Array.isArray(rawPalette)
      ? (rawPalette as Partial<ColorPalette>)
      : {};
  const palette = {
    primary: template.theme.palette.primary,
    secondary: template.theme.palette.secondary,
    accent: template.theme.palette.accent,
    background: template.theme.palette.background,
    text: template.theme.palette.text,
    text_light: template.theme.palette.textMuted,
    border: template.theme.palette.border,
    ...palettePatch,
  } as ColorPalette;
  const typography = {
    heading_font: template.theme.typography.headingFont,
    body_font: template.theme.typography.bodyFont,
    base_size: template.theme.typography.baseSize,
    scale_ratio: template.theme.typography.scaleRatio,
    ...((theme.typography ?? {}) as Partial<TypographyConfig>),
  } as TypographyConfig;
const name = user.name || "Toko Kami";
  // Use catalog template ID if available (for V3 renderer), otherwise determine from businessType
  const templateId = catalogTemplateId || template.id;
  // Template katalog untuk mapping variant & anchor default.
const catalogTemplateForSections = template;
const variantSource: Array<{ type: string; variants?: Array<{ id: string }> }> =
  template.sections.map((def) => ({
    type: def.type,
    variants: def.variants.map((v) => ({ id: v.id })),
  }));
  const resolveVariantId = (type: string, variant: unknown): string => {
    const typeDef = variantSource.find((t) => t.type === type);
    if (typeof variant === 'string' && variant.length > 0 && typeDef?.variants?.some((v) => v.id === variant)) {
      return variant;
    }
    return typeDef?.variants?.[0]?.id ?? 'hero-full';
  };
  // Samakan dengan seed kanvas: tipe tak dikenal dipetakan ke hero agar
  // section tidak hilang diam-diam di live site.
  const resolveType = (type: unknown): string =>
    typeof type === 'string' && type.length > 0 && variantSource.some((t) => t.type === type)
      ? type
      : 'hero';
  // Sections homepage hanya dari baris page-builder (sama seperti sectionsToRender).
  const sectionsForBuilder = pageSections;
  const usedAnchors = new Set<string>();
  const builderSections = sectionsForBuilder?.map((s) => {
    const resolvedType = resolveType(s.type);
    const variantId = resolveVariantId(
      resolvedType,
      resolvedType === s.type ? s.variant : undefined,
    );
    const anchorId =
      typeof s.anchorId === 'string' && s.anchorId.length > 0
        ? uniqueAnchorId(s.anchorId, usedAnchors)
        : uniqueAnchorId(
            defaultAnchorId(catalogTemplateForSections?.id ?? templateId, resolvedType, variantId),
            usedAnchors,
          );
    return {
      id: s.id,
      type: resolvedType,
      variantId,
      anchorId,
      config: s.config ?? {},
      style: {
        padding: { top: 48, right: 24, bottom: 48, left: 24 },
        background: 'transparent' as const,
        ...(s.style ?? {}),
      } as TemplateSectionInstance['style'],
      responsive: s.responsive ?? {},
    };
  }) as TemplateSectionInstance[] | undefined;

  const header = stored?.header as Record<string, unknown> | undefined;
  const footer = stored?.footer as Record<string, unknown> | undefined;
  const paletteOverride = ((stored?.palette_override as Record<string, string>) || (stored?.paletteOverride as Record<string, string>) || undefined) as Record<string, string> | undefined;
  // Animasi/behaviour ikut template. Disimpan utuh di custom_config; runtime
  // yang menyalakannya, bukan data ini. Bila simpanan belum memilikinya
  // (mis. baris lama), fallback ke data template katalog agar live site
  // tidak kehilangan gaya/animasi bawaan template.
  const libData = {
    animations: catalogTemplateForSections.animations ?? [],
    behaviours: catalogTemplateForSections.behaviours ?? [],
    customCss: catalogTemplateForSections.data.customCss ?? "",
  };
  const nonEmptyString = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim().length > 0 ? v : undefined;
  const nonEmptyArray = <T,>(v: unknown): T[] | undefined =>
    Array.isArray(v) && v.length > 0 ? (v as T[]) : undefined;
  const templateAnimations =
    nonEmptyArray<AnimationConfig>(stored?.animations) ??
    nonEmptyArray<AnimationConfig>(libData.animations);
  const templateBehaviours =
    nonEmptyArray<BehaviourConfig>(stored?.behaviours) ??
    nonEmptyArray<BehaviourConfig>(libData.behaviours);
  const templateCustomCss =
    nonEmptyString(stored?.customCss) ?? nonEmptyString(libData.customCss);

// Use catalog template's theme/typography for V3 renderer if available.
const catalogTemplate = catalogTemplateForSections;
const v3Palette = (catalogTemplate?.theme?.palette ?? palette) as DesignStylePalette;
  const storedTypography = ((stored?.theme as Record<string, unknown> | undefined)?.typography ?? {}) as Record<string, string>;
  const v3Typography = {
    ...((catalogTemplate?.theme?.typography ?? typography) as DesignStyleTypography),
    ...(typeof storedTypography.headingFont === 'string' && storedTypography.headingFont.trim() ? { headingFont: storedTypography.headingFont.trim() } : {}),
    ...(typeof storedTypography.bodyFont === 'string' && storedTypography.bodyFont.trim() ? { bodyFont: storedTypography.bodyFont.trim() } : {}),
  } as DesignStyleTypography;

  // Determine page slug and meta
  // Single-page: URL root adalah satu-satunya halaman, jadi slug selalu "home".
  const pageSlug = 'home';
  const pageId: string | undefined = undefined;
  const isHomepage = true;

  return {
    websiteId: user.id,
    subdomain: user.subdomain ?? "",
    name,
    businessType: user.business_type ?? "retail",
    palette,
    typography,
    sections,
    seo: {
      title: pageMeta.title || seo.title || `${name} — Toko Online`,
      description: pageMeta.description || seo.description || (template.description as string) || `Belanja online di ${name}.`,
    },
    whatsapp: findWhatsapp(sections),
    templateId,
    builderSections,
    header,
    footer,
    paletteOverride,
    templateAnimations,
    templateBehaviours,
    templateCustomCss,
    // V3 renderer needs catalog template's theme
    v3Palette,
    v3Typography,
    pageSlug,
    pageId,
    isHomepage,
    metaTitle: pageMeta.title,
    metaDescription: pageMeta.description,
    ogImageUrl: pageMeta.ogImageUrl,
  };
}

export async function getPublicSiteBySubdomain(subdomain: string): Promise<PublicSiteData | null> {
  if (!isValidSubdomain(subdomain)) return null;

  const demoSite = getDemoPublicSite(subdomain);
  if (demoSite) {
    return demoSite as unknown as PublicSiteData;
  }

  try {
    const supabase = createServiceSupabaseClient();
    const { data: site } = await supabase
      .from("websites")
      .select("id, user_id, name, business_type, subdomain, template_slug")
      .eq("subdomain", subdomain)
      .maybeSingle();
    if (!site) return null;
    return buildSite(site as PublicUserRow);
  } catch {
    return null;
  }
}

export async function getPublicSiteByCustomDomain(domain: string): Promise<PublicSiteData | null> {
  try {
    const supabase = createServiceSupabaseClient();
    const { data: site, error } = await supabase
      .from("websites")
      .select("id, user_id, name, business_type, subdomain, template_slug")
      .eq("custom_domain", domain.toLowerCase())
      .eq("custom_domain_verified", true)
      .maybeSingle();
    if (error || !site) return null;
    return buildSite(site as PublicUserRow);
  } catch {
    return null;
  }
}

/**
 * Tentukan dari request headers: apakah ini request tenant (subdomain /
 * custom domain / *.localhost dev) atau root (landing). Di-cache per request.
 */
export const getTenantSite = cache(
  async (): Promise<{ isTenant: boolean; site: PublicSiteData | null }> => {
    const h = await headers();
    let sub = h.get("x-tenant-subdomain") || "";
    const host = normalizeHost(h.get("host") || "");
    const root = rootHost();

    // admin.* = central, bukan toko (selaras dengan proxy x-is-tenant=admin)
    if (host.startsWith("admin.")) return { isTenant: false, site: null };

    // Fallback dev: warung.localhost (jika proxy belum set header)
    if (!sub && host.endsWith(".localhost") && host !== "localhost") {
      const cand = host.replace(/\.localhost$/, "");
      if (isValidSubdomain(cand)) sub = cand;
    }
    if (sub) {
      if (!isValidSubdomain(sub)) return { isTenant: false, site: null };
      return { isTenant: true, site: await getPublicSiteBySubdomain(sub) };
    }
    if (!isRootHost(host, root) && host) {
      return { isTenant: true, site: await getPublicSiteByCustomDomain(host) };
    }
    return { isTenant: false, site: null };
  }
);
