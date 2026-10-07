import type { FullTemplateData } from "../../types";
import { BRAND, IMAGES, NAV_ITEMS, vid } from "./shared";
import { SECTION_CONFIGS } from "./sections";

const config = (type: string) => ({ ...SECTION_CONFIGS[type] });

export const DATA: FullTemplateData = {
  activeSections: ["hero", "features", "product_grid", "pricing", "testimonials", "gallery", "location", "faq", "contact", "about", "video", "team", "newsletter", "divider", "marquee", "menu_board", "steps", "cta"],
  sections: [
    { type: "hero", variant: vid("hero-feature-cards-1"), anchorId: "beranda", config: config("hero") },
    { type: "menu_board", variant: vid("menu_board-feature-cards-1"), anchorId: "kategori", config: config("menu_board") },
    { type: "product_grid", variant: vid("product_grid-editorial-stack-2"), anchorId: "produk", config: config("product_grid") },
    { type: "about", variant: vid("about-soft-arc-3"), anchorId: "restock", config: { ...config("about"), title: "Seasonal Restock untuk Rutinitas Aktif", content: "Pilihan baru untuk mendukung sesi gerak dan pemulihanmu. Temukan nutrisi harian yang praktis, dengan informasi produk yang jelas.", image: IMAGES.wellness } },
    { type: "features", variant: vid("features-editorial-stack-2"), anchorId: "benefit", config: config("features") },
    { type: "product_grid", variant: vid("product_grid-feature-cards-1"), anchorId: "perawatan", config: { ...config("product_grid"), title: "Memulai Rutinitas, Dibuat Mudah", subtitle: "Pilihan praktis untuk kebutuhan kulit, energi, dan keseimbangan harian." } },
    { type: "pricing", variant: vid("pricing-soft-arc-3"), anchorId: "promo", config: config("pricing") },
    { type: "team", variant: vid("team-editorial-stack-2"), anchorId: "wellness-goal", config: config("team") },
    { type: "marquee", variant: vid("marquee-soft-arc-3"), anchorId: "brand", config: config("marquee") },
    { type: "gallery", variant: vid("gallery-feature-cards-1"), anchorId: "inspirasi", config: config("gallery") },
    { type: "testimonials", variant: vid("testimonials-editorial-stack-2"), anchorId: "cerita", config: config("testimonials") },
    { type: "newsletter", variant: vid("newsletter-soft-arc-3"), anchorId: "newsletter", config: config("newsletter") },
    { type: "steps", variant: vid("steps-feature-cards-1"), anchorId: "cara-belanja", config: config("steps") },
    { type: "location", variant: vid("location-editorial-stack-2"), anchorId: "lokasi", config: config("location") },
    { type: "faq", variant: vid("faq-soft-arc-3"), anchorId: "faq", config: config("faq") },
    { type: "contact", variant: vid("contact-feature-cards-1"), anchorId: "kontak", config: config("contact") },
    { type: "cta", variant: vid("cta-editorial-stack-2"), anchorId: "mulai", config: config("cta") },
  ],
  header: {
    variant: "standard",
    siteTitle: BRAND,
    tagline: "Ritual baik, setiap hari",
    navItems: NAV_ITEMS,
    ctaText: "Jelajahi Produk",
    ctaLink: "#produk",
    showCta: true,
    sticky: true,
  },
  footer: {
    style: "columns",
    text: `© {year} ${BRAND}. Rawat diri dengan penuh perhatian.`,
    navItems: NAV_ITEMS.slice(0, 4),
    showNav: true,
    showSocial: true,
  },
  bottomBar: {
    enabled: true,
    items: [
      { id: "home", label: "Beranda", icon: "Home", url: "#beranda" },
      { id: "categories", label: "Kategori", icon: "Grid2X2", url: "#kategori" },
      { id: "shop", label: "Belanja", icon: "ShoppingBag", url: "#produk" },
      { id: "journal", label: "Inspirasi", icon: "BookOpen", url: "#inspirasi" },
      { id: "account", label: "Kontak", icon: "UserRound", url: "#kontak" },
    ],
  },
  seo: {
    title: `${BRAND} Wellness — Ritual baik, setiap hari`,
    description: "Jelajahi suplemen, perawatan diri, dan pilihan wellness terkurasi untuk mendukung rutinitas harianmu.",
  },
  core: { site_title: BRAND, tagline: "Ritual baik, setiap hari" },
};