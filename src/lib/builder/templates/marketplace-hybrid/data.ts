import type { FullTemplateData } from "../../types";
import { BRAND, NAV_ITEMS, vid } from "./shared";
import {
  HERO_CONFIG, MARQUEE_CONFIG, FEATURES_CONFIG, PRODUCT_CONFIG, ABOUT_CONFIG,
  PRICING_CONFIG, STEPS_CONFIG, TESTI_CONFIG, GALLERY_CONFIG, LOCATION_CONFIG,
  FAQ_CONFIG, NEWSLETTER_CONFIG, CONTACT_CONFIG,
} from "./sections";

export const DATA: FullTemplateData = {
    paletteOverride: { primary: "#2563eb", secondary: "#1d4ed8", accent: "#f97316", background: "#ffffff", surface: "#f8fafc", text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0" },
    activeSections: ["hero", "features", "product_grid", "pricing", "testimonials", "gallery", "location", "faq", "contact", "about", "video", "team", "newsletter", "divider", "marquee", "menu_board", "steps", "cta"],
    sections: [
      { type: "hero", variant: vid("hero-hybrid"), anchorId: "beranda", config: { ...HERO_CONFIG } },
      { type: "marquee", variant: vid("marquee-band"), anchorId: "promo", config: { ...MARQUEE_CONFIG } },
      { type: "features", variant: vid("features-cards"), anchorId: "keunggulan", config: { ...FEATURES_CONFIG } },
      { type: "product_grid", variant: vid("product-feed"), anchorId: "produk", config: { ...PRODUCT_CONFIG } },
      { type: "about", variant: vid("about-split"), anchorId: "tentang", config: { ...ABOUT_CONFIG } },
      { type: "pricing", variant: vid("pricing-cards"), anchorId: "harga", config: { ...PRICING_CONFIG } },
      { type: "steps", variant: vid("steps-timeline"), anchorId: "cara-belanja", config: { ...STEPS_CONFIG } },
      { type: "testimonials", variant: vid("testi-wall"), anchorId: "testimoni", config: { ...TESTI_CONFIG } },
      { type: "gallery", variant: vid("gallery-tile"), anchorId: "galeri", config: { ...GALLERY_CONFIG } },
      { type: "location", variant: vid("location-info"), anchorId: "lokasi", config: { ...LOCATION_CONFIG } },
      { type: "faq", variant: vid("faq-toggle"), anchorId: "faq", config: { ...FAQ_CONFIG } },
      { type: "newsletter", variant: vid("newsletter-form"), anchorId: "newsletter", config: { ...NEWSLETTER_CONFIG } },
      { type: "contact", variant: vid("contact-info"), anchorId: "kontak", config: { ...CONTACT_CONFIG } },
    ],
    header: {
      variant: "standard",
      siteTitle: BRAND,
      tagline: "Belanja mudah, harga terbaik",
      navItems: NAV_ITEMS,
      ctaText: "Cari Produk",
      ctaLink: "#produk",
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "columns",
      text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.`,
      navItems: NAV_ITEMS.slice(0, 4),
      showNav: true,
      showSocial: true,
    },
    bottomBar: {
      enabled: true,
      items: [
        { id: "home", label: "Beranda", icon: "Home", url: "#beranda" },
        { id: "products", label: "Produk", icon: "Grid", url: "#produk" },
        { id: "cta", label: "Cari", icon: "Search", url: "#produk" },
        { id: "faq", label: "FAQ", icon: "HelpCircle", url: "#faq" },
        { id: "contact", label: "Kontak", icon: "Phone", url: "#kontak" },
      ],
    },
    seo: {
      title: `${BRAND} — Toko Online Hybrid`,
      description: "Template toko online hybrid: produk lengkap, harga terjangkau, pengiriman cepat, dan belanja nyaman seperti native app.",
    },
    core: { site_title: BRAND, tagline: "Belanja mudah, harga terbaik" },
    customCss: [
      '[data-tpl-type="header"] nav a:hover{color:var(--color-primary);}',
      '[data-tpl-type="footer"] nav a{text-decoration:none;}',
      '[data-tpl-type="footer"] nav a:hover{color:var(--color-primary);}',
      '@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}',
    ].join("\n"),
};
