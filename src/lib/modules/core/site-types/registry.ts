import type { SiteType, SiteTypeConfig, BusinessCategory, SectionType, TemplateCompatibility } from "./types";

/** Single source of truth for site type configurations. */
export const SITE_TYPE_REGISTRY: Record<SiteType, SiteTypeConfig> = {
  online_shop: {
    siteType: "online_shop",
    label: "Online Shop",
    niches: ["food", "fashion", "retail", "handicraft", "services"],
    allowedSections: [
      "hero",
      "features",
      "product_grid",
      "menu_board",
      "pricing",
      "testimonials",
      "gallery",
      "location",
      "faq",
      "contact",
      "cta",
      "steps",
      "newsletter",
      "video",
      "about",
      "team",
      "divider",
      "marquee",
    ],
    requiredSections: ["hero", "contact"],
    requiresModules: ["products_dasar", "orders_wa", "subdomain", "template_dasar", "dashboard_dasar"],
    futureModules: ["payment_online", "blog_posts", "booking_system"],
    packId: "online_shop_pack",
    isActive: true,
  },
  company: {
    siteType: "company",
    label: "Company Profile",
    niches: ["company_profile"],
    allowedSections: [
      "hero",
      "features",
      "about",
      "team",
      "testimonials",
      "gallery",
      "location",
      "contact",
      "cta",
      "steps",
      "divider",
    ],
    requiredSections: ["hero", "about", "contact"],
    requiresModules: ["subdomain", "template_dasar", "dashboard_dasar"],
    futureModules: ["blog_posts", "careers"],
    packId: "company_pack",
    isActive: false,
    comingSoon: true,
  },
  portfolio: {
    siteType: "portfolio",
    label: "Portfolio",
    niches: ["portfolio_showcase"],
    allowedSections: [
      "hero",
      "gallery",
      "about",
      "testimonials",
      "contact",
      "cta",
      "divider",
      "marquee",
    ],
    requiredSections: ["hero", "gallery", "contact"],
    requiresModules: ["subdomain", "template_dasar", "dashboard_dasar"],
    futureModules: ["blog_posts", "client_portal"],
    packId: "portfolio_pack",
    isActive: false,
    comingSoon: true,
  },
  blog: {
    siteType: "blog",
    label: "Blog",
    niches: ["blog_personal"],
    allowedSections: [
      "hero",
      "features",
      "about",
      "testimonials",
      "contact",
      "newsletter",
      "divider",
      "marquee",
    ],
    requiredSections: ["hero", "contact"],
    requiresModules: ["subdomain", "template_dasar", "dashboard_dasar"],
    futureModules: ["blog_posts", "comments", "newsletter_advanced"],
    packId: "blog_pack",
    isActive: false,
    comingSoon: true,
  },
  sekolah: {
    siteType: "sekolah",
    label: "Sekolah/Pendidikan",
    niches: ["sekolah_pendidikan"],
    allowedSections: [
      "hero",
      "features",
      "about",
      "team",
      "gallery",
      "location",
      "faq",
      "contact",
      "cta",
      "steps",
      "newsletter",
      "divider",
    ],
    requiredSections: ["hero", "about", "contact", "location"],
    requiresModules: ["subdomain", "template_dasar", "dashboard_dasar"],
    futureModules: ["student_portal", "learning_management", "payment_online"],
    packId: "sekolah_pack",
    isActive: false,
    comingSoon: true,
  },
  booking: {
    siteType: "booking",
    label: "Booking Layanan",
    niches: ["booking_layanan"],
    allowedSections: [
      "hero",
      "features",
      "pricing",
      "menu_board",
      "testimonials",
      "gallery",
      "location",
      "faq",
      "contact",
      "cta",
      "steps",
      "divider",
    ],
    requiredSections: ["hero", "pricing", "contact"],
    requiresModules: ["subdomain", "template_dasar", "dashboard_dasar"],
    futureModules: ["booking_system", "payment_online", "calendar_sync"],
    packId: "booking_pack",
    isActive: false,
    comingSoon: true,
  },
};

/** Get config for a site type. */
export function getSiteTypeConfig(siteType: SiteType): SiteTypeConfig {
  return SITE_TYPE_REGISTRY[siteType];
}

/** Get all active site types. */
export function getActiveSiteTypes(): SiteTypeConfig[] {
  return Object.values(SITE_TYPE_REGISTRY).filter((c) => c.isActive);
}

/** Get all site types (including coming soon). */
export function getAllSiteTypes(): SiteTypeConfig[] {
  return Object.values(SITE_TYPE_REGISTRY);
}

/** Get niches for a site type. */
export function getNichesForSiteType(siteType: SiteType): BusinessCategory[] {
  return SITE_TYPE_REGISTRY[siteType]?.niches || [];
}

/** Check if a section is allowed for a site type. */
export function isSectionAllowed(siteType: SiteType, section: SectionType): boolean {
  return SITE_TYPE_REGISTRY[siteType]?.allowedSections.includes(section) ?? false;
}

/** Get required modules for a site type. */
export function getRequiredModules(siteType: SiteType): string[] {
  return SITE_TYPE_REGISTRY[siteType]?.requiresModules || [];
}

/** Get pack ID for a site type. */
export function getPackId(siteType: SiteType): string {
  return SITE_TYPE_REGISTRY[siteType]?.packId || "";
}

/** Template compatibility mapping (extends Template type with siteTypes). */
export const TEMPLATE_COMPATIBILITY: TemplateCompatibility[] = [
  // Online Shop templates
  { templateId: "food", siteTypes: ["online_shop"], category: "food" },
  { templateId: "laundry-emerald", siteTypes: ["online_shop"], category: "services" },
  { templateId: "marketplace-hybrid", siteTypes: ["online_shop"], category: "retail" },
  { templateId: "fashion", siteTypes: ["online_shop"], category: "fashion" },
  { templateId: "retail", siteTypes: ["online_shop"], category: "retail" },
  { templateId: "handicraft", siteTypes: ["online_shop"], category: "handicraft" },
  { templateId: "services", siteTypes: ["online_shop"], category: "services" },
  // Future templates for other site types (stubs)
];

/** Get compatible templates for a site type. */
export function getCompatibleTemplates(siteType: SiteType): TemplateCompatibility[] {
  return TEMPLATE_COMPATIBILITY.filter((t) => t.siteTypes.includes(siteType));
}

/** Check if template is compatible with site type. */
export function isTemplateCompatibleWithSite(templateId: string, siteType: SiteType): boolean {
  const compat = TEMPLATE_COMPATIBILITY.find((t) => t.templateId === templateId);
  if (!compat) return false; // Unknown template = not compatible
  return compat.siteTypes.includes(siteType);
}

/** Get default site type. */
export const DEFAULT_SITE_TYPE: SiteType = "online_shop";