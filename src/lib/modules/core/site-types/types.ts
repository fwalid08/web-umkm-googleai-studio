/** Site type configuration types. */

export type SiteType = "online_shop" | "company" | "portfolio" | "blog" | "sekolah" | "booking";

export interface SiteTypeConfig {
  siteType: SiteType;
  label: string;
  niches: BusinessCategory[];
  allowedSections: SectionType[];
  requiredSections: SectionType[];
  requiresModules: string[];      // Core module feature IDs (always enabled)
  futureModules: string[];        // Planned but not yet active
  packId: string;                 // e.g., "online_shop_pack"
  isActive: boolean;              // Only active site_type is usable
  comingSoon?: boolean;           // Shows "Segera hadir" in UI
}

export type BusinessCategory =
  | "food"
  | "fashion"
  | "retail"
  | "handicraft"
  | "services"
  | "company_profile"
  | "portfolio_showcase"
  | "blog_personal"
  | "sekolah_pendidikan"
  | "booking_layanan";

export type SectionType =
  | "hero"
  | "features"
  | "product_grid"
  | "pricing"
  | "testimonials"
  | "gallery"
  | "location"
  | "faq"
  | "contact"
  | "about"
  | "video"
  | "team"
  | "newsletter"
  | "divider"
  | "marquee"
  | "menu_board"
  | "steps"
  | "cta";

export interface TemplateCompatibility {
  templateId: string;
  siteTypes: SiteType[];
  category: BusinessCategory;
}

/** Check if template is compatible with site type. */
export function isTemplateCompatible(templateSiteTypes: SiteType[] | undefined, siteType: SiteType): boolean {
  if (!templateSiteTypes || templateSiteTypes.length === 0) {
    return siteType === "online_shop"; // backward compat
  }
  return templateSiteTypes.includes(siteType);
}

/** Get default site type (online_shop). */
export function getDefaultSiteType(): SiteType {
  return "online_shop";
}

/** Get all registered site types. */
export function getRegisteredSiteTypes(): SiteType[] {
  return ["online_shop", "company", "portfolio", "blog", "sekolah", "booking"];
}