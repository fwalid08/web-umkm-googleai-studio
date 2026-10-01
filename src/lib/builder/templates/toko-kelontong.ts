import type { Template } from "../template-types";
import type { FullTemplateData } from "../types";
import { PANGKAS_RAPI_TEMPLATE } from "./pangkas-rapi";

const WA = "https://wa.me/6281234567890";

export const TOKO_KELONTONG_TEMPLATE = ({
  ...PANGKAS_RAPI_TEMPLATE,
  id: "toko-kelontong",
  name: "Toko Kelontong — Retail & Kelontong",
  description:
    "Hero promo, grid produk, tabel harga, newsletter, lokasi, FAQ, kontak. Gaya biru laut profesional untuk retail.",
  category: "retail",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: "#0369A1",
      secondary: "#0C4A6E",
      accent: "#14B8A6",
      background: "#F0F9FF",
      surface: "#FFFFFF",
      text: "#0C4A6E",
      textMuted: "#475569",
      border: "#BAE6FD",
    },
    typography: {
      headingFont: "Roboto",
      bodyFont: "Roboto",
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 8,
      buttonStyle: "solid",
      shadowStyle: "sm",
      navStyle: "solid",
      footerStyle: "simple",
    },
    effects: {
      borderWidth: 1,
    },
  },
  headers: PANGKAS_RAPI_TEMPLATE.headers.map((h) => ({
    ...h,
    defaultConfig: {
      ...h.defaultConfig,
      siteTitle: "Toko Kelontong",
      tagline: "Kebutuhan Rumah Tangga Lengkap & Terjangkau",
      navItems: [
        { id: "tk-produk", label: "Produk", url: "#produk", isExternal: false, enabled: true },
        { id: "tk-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "tk-harga", label: "Daftar Harga", url: "#harga", isExternal: false, enabled: true },
        { id: "tk-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
      ],
      ctaText: "Belanja via WA",
      ctaLink: WA,
      showCta: true,
      sticky: true,
    },
  })),
  footers: PANGKAS_RAPI_TEMPLATE.footers.map((f) => ({
    ...f,
    defaultConfig: {
      ...f.defaultConfig,
      text: "© {year} Toko Kelontong. Melayani kebutuhan Anda.",
      navItems: [
        { id: "tk-f-produk", label: "Produk", url: "#produk", isExternal: false, enabled: true },
        { id: "tk-f-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "tk-f-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
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
        ...(s.type === "hero" && v.id === "hero-full"
          ? {
              headline: "Kebutuhan Rumah Tangga Lengkap & Terjangkau",
              subheadline: "Dari makanan, minuman, kebersihan, sampai peralatan rumah. Harga grosir & eceran. Stok lengkap, antar gratis radius 5km.",
              cta_text: "Lihat Semua Produk",
              cta_link: "#produk",
              text_align: "center",
              background_type: "color",
              background_color: "theme:primary",
            }
          : {}),
        ...(s.type === "product_grid" && v.id === "product-3col"
          ? {
              title: "Produk Terlaris",
              columns: 3,
              show_price: true,
              show_rating: true,
            }
          : {}),
        ...(s.type === "pricing" && v.id === "pricing-3tier"
          ? {
              title: "Daftar Harga Grosir & Eceran",
              items: [
                { name: "Beras Premium 5kg", price: "Rp 68rb", features: ["Beras kualitas super", "Bersih, tidak pecah", "Kemasan standar"] },
                { name: "Minyak Goreng 2L", price: "Rp 32rb", features: ["Minyak sawit murni", "Kemasan botol aman", "Halal MUI"] },
                { name: "Gula Pasir 1kg", price: "Rp 14rb", features: ["Gula putih bersih", "Kemasan plastik rapat", "Harga grosir tersedia"] },
              ],
            }
          : {}),
        ...(s.type === "newsletter" && v.id === "newsletter-inline"
          ? {
              title: "Dapatkan Info Promo Mingguan",
              subtitle: "Kirimkan daftar promo & stok baru ke email/WhatsApp Anda setiap Senin pagi.",
              placeholder: "Email atau No. WA",
              button_text: "Kirimkan Promo",
            }
          : {}),
        ...(s.type === "location" && v.id === "location-hours"
          ? {
              title: "Toko Kami",
              address: "Jl. Raya Kelontong No. 88, Jakarta",
              note: "Dekat terminal, parkir luas (mobil & motor)",
              button_text: "Chat via WhatsApp",
              button_link: WA,
              hours: [
                { days: "Senin–Sabtu", time: "07.00–21.00" },
                { days: "Minggu", time: "08.00–20.00" },
              ],
            }
          : {}),
        ...(s.type === "faq" && v.id === "faq-accordion"
          ? {
              title: "Pertanyaan Umum",
              items: [
                { question: "Bisa beli grosir?", answer: "Bisa, minimal 1 dus/karton. Harga grosir otomatis 적용 di keranjang." },
                { question: "Bisa antar ke rumah?", answer: "Gratis ongkir radius 5km min. belanja Rp 100rb. Di luar radius biaya Rp 10rb." },
                { question: "Produk expired dekat?", answer: "Tidak. Kami rotasi stok FIFO, minimal 6 bulan kedaluwarsa. Bisa tukar kalau tidak puas." },
              ],
            }
          : {}),
        ...(s.type === "contact" && v.id === "contact-form-map"
          ? {
              title: "Hubungi Kami",
              subtitle: "Butuh kuantitas besar? Atau mau tanya stok? Tim kami siap bantu.",
              show_map: true,
              address: "Jl. Raya Kelontong No. 88, Jakarta",
            }
          : {}),
      },
    })),
  })),
  data: {
    designStyleId: "minimalist",
    paletteOverride: {
      primary: "#0369a1",
      secondary: "#0c4a6e",
      accent: "#f59e0b",
      background: "#ffffff",
      surface: "#f0f9ff",
      text: "#0f172a",
      textMuted: "#475569",
      border: "#bae6fd",
    },
    sections: [
      { type: "hero", variant: "hero-full", anchorId: "beranda", config: { headline: "Kebutuhan Rumah Tangga Lengkap & Terjangkau", subheadline: "Dari makanan, minuman, kebersihan, sampai peralatan rumah. Harga grosir & eceran. Stok lengkap, antar gratis radius 5km.", cta_text: "Lihat Semua Produk", cta_link: "#produk", text_align: "center", background_type: "color", background_color: "theme:primary" } },
      { type: "product_grid", variant: "product-3col", anchorId: "produk", config: { title: "Produk Terlaris", columns: 3, show_price: true, show_rating: true } },
      { type: "pricing", variant: "pricing-3tier", anchorId: "harga", config: { title: "Daftar Harga Grosir & Eceran", items: [{ name: "Beras Premium 5kg", price: "Rp 68rb", features: ["Beras kualitas super", "Bersih, tidak pecah", "Kemasan standar"] }, { name: "Minyak Goreng 2L", price: "Rp 32rb", features: ["Minyak sawit murni", "Kemasan botol aman", "Halal MUI"] }, { name: "Gula Pasir 1kg", price: "Rp 14rb", features: ["Gula putih bersih", "Kemasan plastik rapat", "Harga grosir tersedia"] }] } },
      { type: "newsletter", variant: "newsletter-inline", anchorId: "promo", config: { title: "Dapatkan Info Promo Mingguan", subtitle: "Kirimkan daftar promo & stok baru ke email/WhatsApp Anda setiap Senin pagi.", placeholder: "Email atau No. WA", button_text: "Kirimkan Promo" } },
      { type: "location", variant: "location-hours", anchorId: "lokasi", config: { title: "Toko Kami", address: "Jl. Raya Kelontong No. 88, Jakarta", note: "Dekat terminal, parkir luas (mobil & motor)", button_text: "Chat via WhatsApp", button_link: WA, hours: [{ days: "Senin–Sabtu", time: "07.00–21.00" }, { days: "Minggu", time: "08.00–20.00" }] } },
      { type: "faq", variant: "faq-accordion", anchorId: "faq", config: { title: "Pertanyaan Umum", items: [{ question: "Bisa beli grosir?", answer: "Bisa, minimal 1 dus/karton. Harga grosir otomatis 적용 di keranjang." }, { question: "Bisa antar ke rumah?", answer: "Gratis ongkir radius 5km min. belanja Rp 100rb. Di luar radius biaya Rp 10rb." }, { question: "Produk expired dekat?", answer: "Tidak. Kami rotasi stok FIFO, minimal 6 bulan kedaluwarsa. Bisa tukar kalau not puas." }] } },
      { type: "contact", variant: "contact-form-map", anchorId: "kontak", config: { title: "Hubungi Kami", subtitle: "Butuh kuantitas besar? Atau mau tanya stok? Tim kami siap bantu.", show_map: true, address: "Jl. Raya Kelontong No. 88, Jakarta" } },
    ],
    header: {
      variant: "standard",
      logoUrl: "",
      siteTitle: "Toko Kelontong",
      tagline: "Kebutuhan Rumah Tangga Lengkap & Terjangkau",
      navItems: [
        { id: "tk-produk", label: "Produk", url: "#produk", isExternal: false, enabled: true },
        { id: "tk-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "tk-harga", label: "Daftar Harga", url: "#harga", isExternal: false, enabled: true },
        { id: "tk-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
      ],
      ctaText: "Belanja via WA",
      ctaLink: WA,
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "simple",
      text: "© {year} Toko Kelontong. Melayani kebutuhan Anda.",
      navItems: [
        { id: "tk-f-produk", label: "Produk", url: "#produk", isExternal: false, enabled: true },
        { id: "tk-f-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "tk-f-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      showSocial: true,
    },
    seo: {
      title: "Toko Kelontong — Kebutuhan Rumah Tangga Lengkap & Terjangkau",
      description: "Beragam kebutuhan rumah tangga: makanan, minuman, kebersihan, peralatan. Harga grosir & eceran. Antar gratis area sekitar.",
    },
    core: {
      site_title: "Toko Kelontong",
      tagline: "Kebutuhan Rumah Tangga Lengkap & Terjangkau",
      favicon_url: "",
      logo_url: "",
      header_nav: [
        { id: "tk-produk", label: "Produk", url: "#produk", isExternal: false, enabled: true },
        { id: "tk-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "tk-harga", label: "Daftar Harga", url: "#harga", isExternal: false, enabled: true },
        { id: "tk-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
      ],
      footer_nav: [
        { id: "tk-f-produk", label: "Produk", url: "#produk", isExternal: false, enabled: true },
        { id: "tk-f-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "tk-f-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      footer_text: "© {year} Toko Kelontong. Melayani kebutuhan Anda.",
    },
  },
} as Template & { data: FullTemplateData });