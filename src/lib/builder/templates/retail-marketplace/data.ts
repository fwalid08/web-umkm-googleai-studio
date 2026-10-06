import type { FullTemplateData } from "../../types";
import { BRAND, IMAGES, NAV_ITEMS, vid } from "./shared";

export const DATA: FullTemplateData = {
  activeSections: ["hero", "features", "product_grid", "menu_board", "pricing", "testimonials", "gallery", "location", "faq", "contact", "about", "steps", "newsletter", "cta"],
  sections: [
    { type: "hero", variant: vid("hero-market-row"), anchorId: "beranda" },
    { type: "features", variant: vid("features-market-grid"), anchorId: "keunggulan" },
    { type: "menu_board", variant: vid("menu_board-market-grid"), anchorId: "kategori" },
    { type: "product_grid", variant: vid("product_grid-market-grid"), anchorId: "produk" },
    { type: "pricing", variant: vid("pricing-market-row"), anchorId: "promo" },
    { type: "about", variant: vid("about-market-row"), anchorId: "tentang" },
    { type: "steps", variant: vid("steps-market-grid"), anchorId: "cara-belanja" },
    { type: "testimonials", variant: vid("testimonials-market-row"), anchorId: "testimoni" },
    { type: "gallery", variant: vid("gallery-market-grid"), anchorId: "galeri" },
    { type: "location", variant: vid("location-market-row"), anchorId: "lokasi" },
    { type: "faq", variant: vid("faq-market-grid"), anchorId: "faq" },
    { type: "newsletter", variant: vid("newsletter-market-row"), anchorId: "newsletter" },
    { type: "contact", variant: vid("contact-market-row"), anchorId: "kontak" },
  ],
  header: {
    variant: "standard",
    siteTitle: BRAND,
    tagline: "Pilihan dekat, harga bersahabat",
    navItems: NAV_ITEMS,
    ctaText: "Lihat Promo",
    ctaLink: "#promo",
    showCta: true,
    sticky: true,
  },
  footer: {
    style: "columns",
    text: `© {year} ${BRAND}. Belanja lebih dekat, lebih mudah.`,
    navItems: NAV_ITEMS.slice(0, 4),
    showNav: true,
    showSocial: true,
  },
  bottomBar: {
    enabled: true,
    items: [
      { id: "home", label: "Beranda", icon: "Home", url: "#beranda" },
      { id: "categories", label: "Kategori", icon: "Grid2X2", url: "#kategori" },
      { id: "search", label: "Cari", icon: "Search", url: "#produk" },
      { id: "wishlist", label: "Favorit", icon: "Heart", url: "#produk" },
      { id: "account", label: "Akun", icon: "UserRound", url: "#kontak" },
    ],
  },
  seo: {
    title: `${BRAND} — Pilihan toko lokal untuk kebutuhan harian`,
    description: "Jelajahi produk rumah, dapur, aksesori, dan kebutuhan sehari-hari dari toko lokal.",
  },
  core: { site_title: BRAND, tagline: "Pilihan dekat, harga bersahabat" },
  customCss: [
    '[data-tpl-type="header"] a:hover{color:var(--color-primary);}',
    '[data-tpl-type="footer"] a{text-decoration:none;}',
    '[data-tpl-type="footer"] a:hover{text-decoration:underline;}',
    '[data-tpl-type="product_grid"] img{transition:transform 180ms ease;}',
  ].join("\n"),
};

export const SEED_IMAGES = [IMAGES.hero, IMAGES.productOne, IMAGES.productTwo];