import type { FullTemplateData } from "../../types";
import { BRAND, NAV_ITEMS, vid } from "./shared";
import {
  HERO_CONFIG, FEATURES_CONFIG, ABOUT_CONFIG, PRICING_CONFIG, STATS_CONFIG,
  PROCESS_CONFIG, FAQ_CONFIG, TESTI_CONFIG, STEPS_CONFIG, GALLERY_CONFIG,
  ARTICLES_CONFIG, LOCATION_CONFIG, CONTACT_CONFIG,
} from "./sections";

export const DATA: FullTemplateData = {
    paletteOverride: {
      primary: "#0C3B2E",
      secondary: "#1E4D3B",
      accent: "#C6A15B",
      background: "#F5F1E8",
      surface: "#FDFBF6",
      text: "#1E2A26",
      textMuted: "#4E5E57",
      border: "#E5DCC8",
    },
    sections: [
      { type: "hero", variant: vid("hero-arch"), anchorId: "beranda", config: { ...HERO_CONFIG } },
      { type: "features", variant: vid("welcome-dividers"), anchorId: "keunggulan", config: { ...FEATURES_CONFIG } },
      { type: "about", variant: vid("luxury-split"), anchorId: "tentang", config: { ...ABOUT_CONFIG } },
      { type: "pricing", variant: vid("service-cards"), anchorId: "layanan", config: { ...PRICING_CONFIG } },
      { type: "stats-band", variant: vid("comfort-band"), anchorId: "statistik", config: { ...STATS_CONFIG } },
      { type: "about", variant: vid("process-arch"), anchorId: "proses", config: { ...PROCESS_CONFIG } },
      { type: "faq", variant: vid("faq-emerald"), anchorId: "faq", config: { ...FAQ_CONFIG } },
      { type: "testimonials", variant: vid("testimoni-bg"), anchorId: "testimoni", config: { ...TESTI_CONFIG } },
      { type: "steps", variant: vid("booking-band"), anchorId: "cara-pesan", config: { ...STEPS_CONFIG } },
      { type: "gallery", variant: vid("gallery-luxe"), anchorId: "galeri", config: { ...GALLERY_CONFIG } },
      { type: "articles", variant: vid("artikel-grid"), anchorId: "artikel", config: { ...ARTICLES_CONFIG } },
      { type: "location", variant: vid("location-panel"), anchorId: "lokasi", config: { ...LOCATION_CONFIG } },
      { type: "contact", variant: vid("contact-cards"), anchorId: "kontak", config: { ...CONTACT_CONFIG } },
    ],
    header: {
      // "standard" dipertahankan sementara agar lolos guard chrome registry
      // (catalog.test.ts) selama chrome generik belum dihapus (§18.7).
      // Header aktual yang dipakai = varian pertama template (fallback renderer).
      variant: "standard",
      siteTitle: BRAND,
      tagline: "Cuci bersih, wangi, siap pakai",
      navItems: NAV_ITEMS,
      ctaText: "Pesan Sekarang",
      ctaLink: "https://wa.me/6281234567890",
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "columns",
      text: `© {year} ${BRAND}. Cuci bersih, wangi, siap pakai.`,
      navItems: NAV_ITEMS.slice(0, 4),
      showNav: true,
      showSocial: true,
    },
    bottomBar: {
      enabled: true,
      items: [
        { id: "home", label: "Beranda", icon: "Home", url: "#beranda" },
        { id: "services", label: "Layanan", icon: "Package", url: "#layanan" },
        { id: "cta", label: "Pesan", icon: "MessageCircle", url: "https://wa.me/6281234567890", isExternal: true },
        { id: "testimonials", label: "Testimoni", icon: "Star", url: "#testimoni" },
        { id: "contact", label: "Kontak", icon: "Phone", url: "#kontak" },
      ],
    },
    seo: {
      title: `${BRAND} — Laundry Premium Antar-Jemput`,
      description:
        "Laundry premium bergaya emerald: kiloan, express 3 jam, bedcover & hotel. Antar-jemput gratis, deterjen premium, garansi cuci ulang.",
    },
    core: {
      site_title: BRAND,
      tagline: "Cuci bersih, wangi, siap pakai",
    },
    customCss: [
      // Header/footer berlatar `surface` memakai token turunan
      // (`--color-accent-on-surface`) karena emas #C6A15B di atas krem hanya
      // ~2.3:1. Footer berlatar `primary` boleh emas langsung.
      '[data-tpl-type="header"] nav a:hover{color:var(--color-accent-on-surface);}',
      '[data-tpl-type="header"] nav a{font-weight:600;text-decoration:none;}',
      '[data-tpl-type="footer"] nav a{text-decoration:none;}',
      '[data-tpl-type="footer"] nav a:hover{color:var(--color-accent-on-primary);}',
      '[data-tpl-type="faq"] details summary{cursor:pointer;}',
    ].join("\n"),
};
