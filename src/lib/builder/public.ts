import { headers } from "next/headers";
import { cache } from "react";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { mergeAndValidateSections, type MergedSection } from "@/lib/builder/validation";
import type { ColorPalette, TypographyConfig } from "@/types";
import { getDemoPublicSite } from "@/lib/mock/store";
import { isValidSubdomain, normalizeHost, rootHost, isRootHost } from "@/lib/tenant";

/**
 * Sprint 01 US-04 — Public tenant lookup + merge.
 * SERVER-ONLY: pakai service-role karena RLS memblokir anon membaca
 * tabel users/user_templates. Hanya kolom public-safe yang di-SELECT
 * (TIDAK PERNAH email / data sensitif).
 */

export interface PublicSiteData {
  subdomain: string;
  name: string;
  businessType: string;
  palette: ColorPalette;
  typography: TypographyConfig;
  sections: MergedSection[];
  seo: { title: string; description: string };
  whatsapp: string;
}

const TEMPLATE_FIELDS =
  "id, name, description, color_palette, typography_config, sections_config, is_active";

interface PublicUserRow {
  id: string;
  user_id: string;
  name: string | null;
  business_type: string | null;
  subdomain: string | null;
  current_template_id: string | null;
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

  const { data: templates } = await supabase
    .from("templates")
    .select(TEMPLATE_FIELDS)
    .eq("is_active", true)
    .order("name");
  const list = templates ?? [];
  if (list.length === 0) return null;

  let template =
    (user.current_template_id && list.find((t) => t.id === user.current_template_id)) || null;
  if (!template && user.business_type) template = list.find((t) => t.name === user.business_type) || null;
  if (!template) template = list[0];

  const { data: row } = await supabase
    .from("user_templates")
    .select("custom_config")
    .eq("website_id", user.id)
    .eq("template_id", template.id)
    .maybeSingle();

  const stored = (row?.custom_config ?? null) as {
    theme?: Record<string, unknown>;
    sections?: MergedSection[];
    seo?: { title?: string; description?: string };
  } | null;

  let sections: MergedSection[];
  let theme: Record<string, unknown> = {};
  let seo: { title?: string; description?: string } = {};
  if (stored && Array.isArray(stored.sections) && stored.sections.length > 0) {
    sections = stored.sections;
    theme = stored.theme ?? {};
    seo = stored.seo ?? {};
  } else {
    const merged = mergeAndValidateSections(
      (template.sections_config ?? []) as Parameters<typeof mergeAndValidateSections>[0],
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
    ...(template.color_palette as ColorPalette),
    ...palettePatch,
  } as ColorPalette;
  const typography = {
    ...(template.typography_config as TypographyConfig),
    ...((theme.typography ?? {}) as Partial<TypographyConfig>),
  } as TypographyConfig;

  const name = user.name || "Toko Kami";
  return {
    subdomain: user.subdomain ?? "",
    name,
    businessType: user.business_type ?? "retail",
    palette,
    typography,
    sections,
    seo: {
      title: seo.title || `${name} — Toko Online`,
      description: seo.description || (template.description as string) || `Belanja online di ${name}.`,
    },
    whatsapp: findWhatsapp(sections),
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
      .select("id, user_id, name, business_type, subdomain, current_template_id")
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
      .select("id, user_id, name, business_type, subdomain, current_template_id")
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
