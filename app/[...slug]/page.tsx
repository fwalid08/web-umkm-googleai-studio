import { notFound } from "next/navigation";
import { getTenantSite } from "@/lib/builder/public";
import { PublicWebsiteV3 } from "@/components/website/renderer-v3";
import { PublicWebsite } from "@/components/website/renderer";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { createServiceSupabaseClient } from "@/lib/supabase/service";
import type { PublicSiteData } from "@/lib/builder/public";
import type { TemplateSectionInstance } from "@/lib/builder/template-types";
import type { DesignStylePalette, DesignStyleTypography } from "@/lib/builder/types";

const RESERVED_SLUGS = new Set([
  "api",
  "dashboard",
  "auth",
  "login",
  "signin",
  "signup",
  "builder",
  "customize",
  "page-builder",
  "checkout",
  "blog",
  "cart",
  "p",
  "produk",
  "order",
  "preview",
  "terms",
  "privacy",
]);

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function TenantPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug?.join("/") || "";

  if (!slugPath || RESERVED_SLUGS.has(slugPath)) {
    notFound();
  }

  const tenant = await getTenantSite();

  if (!tenant.isTenant || !tenant.site) {
    notFound();
  }

  const site = tenant.site;
  const supabase = createServiceSupabaseClient();

  const { data: page } = await supabase
    .from("store_pages")
    .select("id, title, slug, layout, meta_title, meta_description, og_image_url, is_published")
    .eq("website_id", site.websiteId)
    .eq("slug", slugPath)
    .eq("is_published", true)
    .maybeSingle();

  if (!page) {
    notFound();
  }

  const layout = page.layout as {
    sections?: Array<{
      id: string;
      type: string;
      variant: string;
      config?: Record<string, unknown>;
      style?: Record<string, unknown>;
      responsive?: Record<string, unknown>;
    }>;
  } | null;

  const pageSections = layout?.sections ?? [];

  if (site.templateId && site.builderSections && site.builderSections.length > 0) {
    const catalogTemplate = BUILT_IN_CATALOG.find((t) => t.id === site.templateId);
    if (catalogTemplate) {
      const templateData = catalogTemplate.data;
      const headerVariantId = site.header?.variant as string || templateData.header?.variant || catalogTemplate.headers?.[0]?.id || '';
      const headerVariant = catalogTemplate.headers?.find((h) => h.id === headerVariantId) || catalogTemplate.headers?.[0];

      const footerVariantId = site.footer?.style as string || templateData.footer?.style || catalogTemplate.footers?.[0]?.id || '';
      const footerVariant = catalogTemplate.footers?.find((f) => f.id === footerVariantId) || catalogTemplate.footers?.[0];

      const builderSections: TemplateSectionInstance[] = pageSections.map((s) => ({
        id: s.id,
        type: s.type,
        variantId: s.variant,
        config: s.config ?? {},
        style: {
          padding: { top: 48, right: 24, bottom: 48, left: 24 },
          background: 'transparent' as const,
          ...(s.style ?? {}),
        } as TemplateSectionInstance['style'],
        responsive: s.responsive ?? {},
      }));

      return (
        <PublicWebsiteV3
          site={{
            template: {
              id: catalogTemplate.id,
              name: catalogTemplate.name,
              description: catalogTemplate.description,
              category: catalogTemplate.category,
              theme: {
                ...catalogTemplate.theme,
                typography: site.v3Typography ?? catalogTemplate.theme.typography,
              },
              headers: catalogTemplate.headers,
              footers: catalogTemplate.footers,
              sections: catalogTemplate.sections,
            },
            headerVariantId,
            footerVariantId,
            sections: builderSections,
            themeOverride: site.paletteOverride || {},
            websiteId: site.websiteId,
            headerConfig: { ...(headerVariant?.defaultConfig ?? {}), ...((site.header ?? {}) as Record<string, unknown>) },
            footerConfig: { ...(footerVariant?.defaultConfig ?? {}), ...((site.footer ?? {}) as Record<string, unknown>) },
            seo: {
              title: page.meta_title || site.seo.title,
              description: page.meta_description || site.seo.description,
            },
          }}
        />
      );
    }
  }

  const mergedSections = pageSections.map((s) => ({
    id: s.id,
    type: s.type,
    label: s.type,
    enabled: true,
    required: false,
    order: 0,
    style: s.style ?? {},
    content: s.config ?? {},
  }));

  const fallbackSite: PublicSiteData = {
    ...site,
    sections: mergedSections,
    seo: {
      title: page.meta_title || site.seo.title,
      description: page.meta_description || site.seo.description,
    },
  };

  return <PublicWebsite site={fallbackSite} />;
}
