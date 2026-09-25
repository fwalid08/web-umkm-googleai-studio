import { headers } from "next/headers";
import { cache } from "react";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { mergeAndValidateSections, type MergedSection } from "@/lib/builder/validation";
import type { ColorPalette, TypographyConfig } from "@/types";
import { getDemoPublicSite } from "@/lib/mock/store";

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

  const palette = {
    ...(template.color_palette as ColorPalette),
    ...((theme.palette ?? theme) as Partial<ColorPalette>),
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
  if (!/^[a-z0-9-]{3,50}$/.test(subdomain)) return null;

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
  const supabase = createServiceSupabaseClient();
  const { data: site } = await supabase
    .from("websites")
    .select("id, user_id, name, business_type, subdomain, current_template_id")
    .eq("custom_domain", domain.toLowerCase())
    .eq("custom_domain_verified", true)
    .maybeSingle();
  if (!site) return null;
  return buildSite(site as PublicUserRow);
}

function isRootHost(host: string, root: string): boolean {
  const r = root.split(":")[0].toLowerCase();
  if (!host) return true;
  return (
    host === r ||
    host === `www.${r}` ||
    host === "localhost" ||
    host.startsWith("admin.") ||
    host.endsWith(".vercel.app")
  );
}

/**
 * Tentukan dari request headers: apakah ini request tenant (subdomain /
 * custom domain / *.localhost dev) atau root (landing). Di-cache per request.
 */
export const getTenantSite = cache(
  async (): Promise<{ isTenant: boolean; site: PublicSiteData | null }> => {
    const h = await headers();
    let sub = h.get("x-tenant-subdomain") || "";
    const host = (h.get("host") || "").split(":")[0].toLowerCase();
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com").toLowerCase();

    // Fallback dev: warung.localhost (jika proxy belum set header)
    if (!sub && host.endsWith(".localhost") && host !== "localhost") {
      sub = host.replace(/\.localhost$/, "");
    }
    if (sub) return { isTenant: true, site: await getPublicSiteBySubdomain(sub) };
    if (!isRootHost(host, root) && host) {
      return { isTenant: true, site: await getPublicSiteByCustomDomain(host) };
    }
    return { isTenant: false, site: null };
  }
);
