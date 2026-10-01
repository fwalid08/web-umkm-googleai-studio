import type { Template } from "../template-types";
import type { FullTemplateData } from "../types";
import { PANGKAS_RAPI_TEMPLATE } from "./pangkas-rapi";

const WA = "https://wa.me/6281234567890";

/**
 * Warung Makan template - reuses section type definitions from Pangkas Rapi
 * but with food category theme and menu_board section as primary
 */
function createWarungMakanTemplate(): Template & { data: FullTemplateData } {
  return {
    ...PANGKAS_RAPI_TEMPLATE,
    id: "warung-makan",
    name: "Warung Makan — Kuliner & Minuman",
    description:
      "Hero makanan, menu bertab, galeri foto, jam buka & lokasi, testimoni, FAQ, kontak. Gaya hangat terakota cocok kuliner.",
    category: "food",
    tiers: ["free", "starter", "growth", "enterprise"],
    theme: {
      palette: {
        primary: "#EA580C",
        secondary: "#9A3412",
        accent: "#FB923C",
        background: "#FFF7ED",
        surface: "#FFFFFF",
        text: "#431407",
        textMuted: "#78716C",
        border: "#FED7AA",
      },
      typography: {
        headingFont: "Playfair Display",
        bodyFont: "Nunito",
        baseSize: 16,
        scaleRatio: 1.25,
        headingWeight: 700,
        bodyWeight: 400,
      },
      components: {
        borderRadius: 16,
        buttonStyle: "solid",
        shadowStyle: "md",
        navStyle: "solid",
        footerStyle: "columns",
      },
      effects: {
        gradientBackgrounds: true,
      },
    },
    headers: PANGKAS_RAPI_TEMPLATE.headers.map((h) => ({
      ...h,
      defaultConfig: {
        ...h.defaultConfig,
        siteTitle: "Warung Makan",
        tagline: "Makanan Rumahan Enak & Sehat",
        navItems: [
          { id: "wm-menu", label: "Menu", url: "#menu", isExternal: false, enabled: true },
          { id: "wm-tentang", label: "Tentang", url: "#tentang", isExternal: false, enabled: true },
          { id: "wm-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
          { id: "wm-pesan", label: "Pesan", url: "#pesan", isExternal: false, enabled: true },
        ],
        ctaText: "Pesan via WA",
        ctaLink: WA,
        showCta: true,
        sticky: true,
      },
    })),
    footers: PANGKAS_RAPI_TEMPLATE.footers.map((f) => ({
      ...f,
      defaultConfig: {
        ...f.defaultConfig,
        text: "© {year} Warung Makan. Enak, sehat, murah.",
        navItems: [
          { id: "wm-f-menu", label: "Menu", url: "#menu", isExternal: false, enabled: true },
          { id: "wm-f-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
          { id: "wm-f-pesan", label: "Pesan", url: "#pesan", isExternal: false, enabled: true },
        ],
        showSocial: true,
      },
    })),
    sections: PANGKAS_RAPI_TEMPLATE.sections.map((s) => ({
      ...s,
      variants: s.variants.map((v) => ({
        ...v,
        defaultConfig: {
          ...v.defaultConfig,
          ...(s.type === "hero" && v.id === "hero-bg-image"
            ? {
                headline: "Makanan Rumahan Enak & Sehat",
                subheadline: "Bahan segar tiap hari, bumbu buatan sendiri, tanpa pengawet. Pesan sekarang, antar gratis radius 3km.",
                cta_text: "Lihat Menu & Pesan",
                cta_link: "#menu",
                text_align: "center",
                background_type: "image",
                background_image: "",
              }
            : {}),
          ...(s.type === "features" && v.id === "features-3col"
            ? {
                title: "Kenapa Makan di Warung Kami",
                items: [
                  { icon: "🍳", title: "Bahan Segar Harian", description: "Beli pagi, masak pagi - tanpa bahan beku" },
                  { icon: "🏠", title: "Rasa Rumahan Asli", description: "Bumbu buatan sendiri, tanpa MSG & pengawet" },
                  { icon: "💰", title: "Harga Teman Kantong", description: "Porsi banyak, harga pas untuk sehari-hari" },
                ],
              }
            : {}),
          ...(s.type === "menu_board" && v.id === "menu-tabs"
            ? {
                title: "Menu Warung",
                subtitle: "Pilih kategori untuk melihat daftar makanan & minuman",
                groups: [
                  {
                    key: "makanan",
                    label: "Makanan",
                    items: [
                      { name: "Nasi Goreng Spesial", desc: "Nasi, ayam, telur, sayur, kerupuk", price: "Rp 18rb" },
                      { name: "Mie Goreng / Rebus", desc: "Mie, ayam, sayur, telur", price: "Rp 16rb" },
                      { name: "Nasi + Lauk Pauk", desc: "Nasi, ayam goreng, tempe, sayur, sambal", price: "Rp 20rb" },
                      { name: "Soto Ayam", desc: "Soto, mie, ayam, telur, kerupuk", price: "Rp 18rb" },
                    ],
                  },
                  {
                    key: "minuman",
                    label: "Minuman",
                    items: [
                      { name: "Es Teh Manis", desc: "Teh manis segar", price: "Rp 5rb" },
                      { name: "Es Jeruk", desc: "Jeruk peras segar", price: "Rp 7rb" },
                      { name: "Kopi Hitam / Susu", desc: "Kopi tubruk atau susu", price: "Rp 8rb" },
                      { name: "Air Mineral", desc: "Air mineral 600ml", price: "Rp 3rb" },
                    ],
                  },
                  {
                    key: "paket",
                    label: "Paket Hemat",
                    items: [
                      { name: "Paket Makan Siang", desc: "Nasi + lauk + sayur + sambal + es teh", price: "Rp 22rb" },
                      { name: "Paket Keluarga (4 porsi)", desc: "4x nasi + 4 lauk + sayur + sambal + 4 minum", price: "Rp 80rb" },
                    ],
                  },
                ],
              }
            : {}),
          ...(s.type === "location" && v.id === "location-hours"
            ? {
                title: "Kunjungi Kami",
                address: "Jl. Raya No. 45, Kelurahan Makanan, Jakarta",
                note: "Dekat pasar, parkir motor luas",
                button_text: "Chat via WhatsApp",
                button_link: WA,
                hours: [
                  { days: "Senin–Minggu", time: "07.00–21.00" },
                ],
              }
            : {}),
          ...(s.type === "testimonials" && v.id === "testimonials-grid"
            ? {
                title: "Kata Pelanggan",
                items: [
                  { name: "Ibu Sari", text: "Nasi gorengnya enak banget, porsi banyak, harga pas di kantong!", rating: 5 },
                  { name: "Bapak Joko", text: "Soto ayamnya segar, kuah gurih. Sudah langganan 2 tahun.", rating: 5 },
                  { name: "Mbak Rina", text: "Pesan via WA praktis, antar cepet. Makanan masih hangat sampe rumah.", rating: 5 },
                ],
              }
            : {}),
          ...(s.type === "faq" && v.id === "faq-accordion"
            ? {
                title: "Sering Ditanyakan",
                items: [
                  { question: "Bisa antar ke rumah?", answer: "Bisa, gratis ongkir radius 3km. Di luar radius tambah Rp 5rb." },
                  { question: "Bisa pesan besok?", answer: "Bisa, pesan minimal 1 jam sebelum jam buka. Kami siapkan fresh." },
                  { question: "Ada paket meeting/acara?", answer: "Ada, minimal 10 porsi. Hubungi WA untuk harga spesial." },
                ],
              }
            : {}),
          ...(s.type === "contact" && v.id === "contact-form-map"
            ? {
                title: "Hubungi Kami",
                subtitle: "Ada pertanyaan atau mau pesan banyak? Kirim pesan.",
                show_map: true,
                address: "Jl. Raya No. 45, Kelurahan Makanan, Jakarta",
              }
            : {}),
        },
      })),
    })),
    data: {
      designStyleId: "minimalist",
      paletteOverride: {
        primary: "#c2410c",
        secondary: "#9a3412",
        accent: "#f59e0b",
        background: "#fffbeb",
        surface: "#fef3c7",
        text: "#1c1917",
        textMuted: "#57534e",
        border: "#fde68a",
      },
      sections: [
        { type: "hero", variant: "hero-bg-image", anchorId: "beranda", config: { headline: "Makanan Rumahan Enak & Sehat", subheadline: "Bahan segar tiap hari, bumbu buatan sendiri, tanpa pengawet. Pesan sekarang, antar gratis radius 3km.", cta_text: "Lihat Menu & Pesan", cta_link: "#menu", text_align: "center", background_type: "image", background_image: "" } },
        { type: "menu_board", variant: "menu-tabs", anchorId: "menu", config: { title: "Menu Warung", subtitle: "Pilih kategori untuk melihat daftar makanan & minuman", groups: [{ key: "makanan", label: "Makanan", items: [{ name: "Nasi Goreng Spesial", desc: "Nasi, ayam, telur, sayur, kerupuk", price: "Rp 18rb" }, { name: "Mie Goreng / Rebus", desc: "Mie, ayam, sayur, telur", price: "Rp 16rb" }, { name: "Nasi + Lauk Pauk", desc: "Nasi, ayam goreng, tempe, sayur, sambal", price: "Rp 20rb" }, { name: "Soto Ayam", desc: "Soto, mie, ayam, telur, kerupuk", price: "Rp 18rb" }] }, { key: "minuman", label: "Minuman", items: [{ name: "Es Teh Manis", desc: "Teh manis segar", price: "Rp 5rb" }, { name: "Es Jeruk", desc: "Jeruk peras segar", price: "Rp 7rb" }, { name: "Kopi Hitam / Susu", desc: "Kopi tubruk atau susu", price: "Rp 8rb" }, { name: "Air Mineral", desc: "Air mineral 600ml", price: "Rp 3rb" }] }, { key: "paket", label: "Paket Hemat", items: [{ name: "Paket Makan Siang", desc: "Nasi + lauk + sayur + sambal + es teh", price: "Rp 22rb" }, { name: "Paket Keluarga (4 porsi)", desc: "4x nasi + 4 lauk + sayur + sambal + 4 minum", price: "Rp 80rb" }] }] } },
        { type: "gallery", variant: "gallery-grid", anchorId: "galeri", config: { title: "Galeri Makanan" } },
        { type: "location", variant: "location-hours", anchorId: "lokasi", config: { title: "Kunjungi Kami", address: "Jl. Raya No. 45, Kelurahan Makanan, Jakarta", note: "Dekat pasar, parkir motor luas", button_text: "Chat via WhatsApp", button_link: WA, hours: [{ days: "Senin–Minggu", time: "07.00–21.00" }] } },
        { type: "testimonials", variant: "testimonials-grid", anchorId: "testimoni", config: { title: "Kata Pelanggan", items: [{ name: "Ibu Sari", text: "Nasi gorengnya enak banget, porsi banyak, harga pas di kantong!", rating: 5 }, { name: "Bapak Joko", text: "Soto ayamnya segar, kuah gurih. Sudah langganan 2 tahun.", rating: 5 }, { name: "Mbak Rina", text: "Pesan via WA praktis, antar cepet. Makanan masih hangat sampe rumah.", rating: 5 }] } },
        { type: "faq", variant: "faq-accordion", anchorId: "faq", config: { title: "Sering Ditanyakan", items: [{ question: "Bisa antar ke rumah?", answer: "Bisa, gratis ongkir radius 3km. Di luar radius tambah Rp 5rb." }, { question: "Bisa pesan besok?", answer: "Bisa, pesan minimal 1 jam sebelum jam buka. Kami siapkan fresh." }, { question: "Ada paket meeting/acara?", answer: "Ada, minimal 10 porsi. Hubungi WA untuk harga spesial." }] } },
        { type: "contact", variant: "contact-form-map", anchorId: "kontak", config: { title: "Hubungi Kami", subtitle: "Ada pertanyaan atau mau pesan banyak? Kirim pesan.", show_map: true, address: "Jl. Raya No. 45, Kelurahan Makanan, Jakarta" } },
      ],
      header: {
        variant: "standard",
        logoUrl: "",
        siteTitle: "Warung Makan",
        tagline: "Makanan Rumahan Enak & Sehat",
        navItems: [
          { id: "wm-menu", label: "Menu", url: "#menu", isExternal: false, enabled: true },
          { id: "wm-tentang", label: "Tentang", url: "#tentang", isExternal: false, enabled: true },
          { id: "wm-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
          { id: "wm-pesan", label: "Pesan", url: "#pesan", isExternal: false, enabled: true },
        ],
        ctaText: "Pesan via WA",
        ctaLink: WA,
        showCta: true,
        sticky: true,
      },
      footer: {
        style: "simple",
        text: "© {year} Warung Makan. Enak, sehat, murah.",
        navItems: [
          { id: "wm-f-menu", label: "Menu", url: "#menu", isExternal: false, enabled: true },
          { id: "wm-f-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
          { id: "wm-f-pesan", label: "Pesan", url: "#pesan", isExternal: false, enabled: true },
        ],
        showSocial: true,
      },
      seo: {
        title: "Warung Makan — Makanan Rumahan Enak & Sehat",
        description: "Makanan rumahan bersih, bahan segar, harga terjangkau. Pesan via WhatsApp, antar ke tempat.",
      },
      core: {
        site_title: "Warung Makan",
        tagline: "Makanan Rumahan Enak & Sehat",
        favicon_url: "",
        logo_url: "",
        header_nav: [
          { id: "wm-menu", label: "Menu", url: "#menu", isExternal: false, enabled: true },
          { id: "wm-tentang", label: "Tentang", url: "#tentang", isExternal: false, enabled: true },
          { id: "wm-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
          { id: "wm-pesan", label: "Pesan", url: "#pesan", isExternal: false, enabled: true },
        ],
        footer_nav: [
          { id: "wm-f-menu", label: "Menu", url: "#menu", isExternal: false, enabled: true },
          { id: "wm-f-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
          { id: "wm-f-pesan", label: "Pesan", url: "#pesan", isExternal: false, enabled: true },
        ],
        footer_text: "© {year} Warung Makan. Enak, sehat, murah.",
      },
    },
  };
}

export const WARUNG_MAKAN_TEMPLATE = createWarungMakanTemplate();