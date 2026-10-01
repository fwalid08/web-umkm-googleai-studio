import type { Template } from "../template-types";
import type { FullTemplateData } from "../types";
import { PANGKAS_RAPI_TEMPLATE } from "./pangkas-rapi";

const WA = "https://wa.me/6281234567890";

export const BUTIK_HIJAB_TEMPLATE = ({
  ...PANGKAS_RAPI_TEMPLATE,
  id: "butik-hijab",
  name: "Butik Hijab — Fashion & Hijab",
  description:
    "Hero koleksi, grid produk, keunggulan, testimoni, CTA, kontak. Gaya elegan anggur cocok fashion hijab.",
  category: "fashion",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: "#E11D48",
      secondary: "#9F1239",
      accent: "#FB7185",
      background: "#FFF1F2",
      surface: "#FFFFFF",
      text: "#4C0519",
      textMuted: "#78716C",
      border: "#FECDD3",
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Poppins",
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 600,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 20,
      buttonStyle: "gradient",
      shadowStyle: "lg",
      navStyle: "glass",
      footerStyle: "centered",
    },
    effects: {
      glassmorphism: true,
      gradientBackgrounds: true,
    },
  },
  headers: PANGKAS_RAPI_TEMPLATE.headers.map((h) => ({
    ...h,
    // Katalog fashion: menu 2 tingkat (mis. Koleksi > Muslim / Formal).
    maxNavDepth: 2,
    defaultConfig: {
      ...h.defaultConfig,
      siteTitle: "Butik Hijab",
      tagline: "Elegan, Syar'i, Terjangkau",
      navItems: [
        { id: "bh-koleksi", label: "Koleksi", url: "#koleksi", isExternal: false, enabled: true },
        { id: "bh-baru", label: "Baru Datang", url: "#baru", isExternal: false, enabled: true },
        { id: "bh-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "bh-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      ctaText: "Belanja Sekarang",
      ctaLink: "#koleksi",
      showCta: true,
      sticky: true,
    },
  })),
  footers: PANGKAS_RAPI_TEMPLATE.footers.map((f) => ({
    ...f,
    defaultConfig: {
      ...f.defaultConfig,
      text: "© {year} Butik Hijab. Elegan setiap hari.",
      navItems: [
        { id: "bh-f-koleksi", label: "Koleksi", url: "#koleksi", isExternal: false, enabled: true },
        { id: "bh-f-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "bh-f-syarat", label: "Syarat & Ketentuan", url: "/syarat", isExternal: false, enabled: true },
        { id: "bh-f-privasi", label: "Kebijakan Privasi", url: "/privasi", isExternal: false, enabled: true },
      ],
      showSocial: true,
      address: "Jl. Fashion No. 12, Jakarta",
      phone: "0812-3456-7890",
      email: "hello@butikhijab.id",
    },
  })),
  sections: PANGKAS_RAPI_TEMPLATE.sections.map((s) => ({
    ...s,
    variants: s.variants.map((v) => ({
      ...v,
      defaultConfig: {
        ...v.defaultConfig,
        ...(s.type === "hero" && v.id === "hero-split"
          ? {
              headline: "Hijab & Fashion Muslim Elegan",
              subheadline: "Koleksi terbaru: cerutty, voal, paris, wolpeach. Baju muslim modern, gamis, dua piece. Kualitas premium, harga teman.",
              cta_text: "Belanja Koleksi",
              cta_link: "#koleksi",
              image: "",
            }
          : {}),
        ...(s.type === "features" && v.id === "features-3col"
          ? {
              title: "Kenapa Belanja di Butik Hijab",
              items: [
                { icon: "✨", title: "Bahan Premium", description: "Kain cerutty, voal, paris, wolpeach berkualitas tinggi" },
                { icon: "💰", title: "Harga Terjangkau", description: "Langsung dari produsen, tanpa perantara" },
                { icon: "🚚", title: "Pengiriman Cepat", description: "Dikirim hari sama, gratis ongkir min. belanja Rp 150rb" },
              ],
            }
          : {}),
        ...(s.type === "product_grid" && v.id === "product-4col"
          ? {
              title: "Koleksi Terbaru",
              columns: 4,
              show_price: true,
              show_rating: true,
            }
          : {}),
        ...(s.type === "testimonials" && v.id === "testimonials-carousel"
          ? {
              title: "Review Pelanggan",
              items: [
                { name: "Siti", text: "Hijab ceruttynya adem, nggak gerah. Warna cantik banget sama fotonya!", rating: 5 },
                { name: "Aisyah", text: "Gamisnya bagus, jahitan rapi. Udah beli 3x di sini, puas selalu.", rating: 5 },
                { name: "Fatima", text: "Paket dua piece hemat, cocok buat kerja. Kirimnya cepet, packing rapi.", rating: 5 },
              ],
            }
          : {}),
        ...(s.type === "cta" && v.id === "cta-banner"
          ? {
              title: "Dapatkan Diskon 15% untuk Pembelian Pertama",
              subtitle: "Daftar newsletter & dapatkan kode promo eksklusif. Berlaku untuk semua produk.",
              button_text: "Daftar & Belanja",
              button_link: "#koleksi",
            }
          : {}),
        ...(s.type === "about" && v.id === "about-centered"
          ? {
              title: "Cerita Butik Hijab",
              content: "Berawal dari kebutuhan sendiri cari hijab berkualitas tapi terjangkau. Kini Butik Hijab melayani ribuan pelanggan setia di seluruh Indonesia dengan komitmen: kualitas terbaik, harga jujur, pelayanan hati.",
              image: "",
            }
          : {}),
        ...(s.type === "contact" && v.id === "contact-form-map"
          ? {
              title: "Hubungi Kami",
              subtitle: "Butuh bantuan pilih ukuran? Atau mau tanya stok? Chat kami via WhatsApp.",
              show_map: true,
              address: "Jl. Fashion No. 12, Jakarta",
            }
          : {}),
      },
    })),
  })),
  data: {
    designStyleId: "minimalist",
    paletteOverride: {
      primary: "#9d174d",
      secondary: "#831843",
      accent: "#f59e0b",
      background: "#fff1f2",
      surface: "#ffe4e6",
      text: "#1c1917",
      textMuted: "#57534e",
      border: "#fecdd3",
    },
    sections: [
      { type: "hero", variant: "hero-split", anchorId: "beranda", config: { headline: "Hijab & Fashion Muslim Elegan", subheadline: "Koleksi terbaru: cerutty, voal, paris, wolpeach. Baju muslim modern, gamis, dua piece. Kualitas premium, harga teman.", cta_text: "Belanja Koleksi", cta_link: "#koleksi", image: "" } },
      { type: "features", variant: "features-3col", anchorId: "keunggulan", config: { title: "Kenapa Belanja di Butik Hijab", items: [{ icon: "✨", title: "Bahan Premium", description: "Kain cerutty, voal, paris, wolpeach berkualitas tinggi" }, { icon: "💰", title: "Harga Terjangkau", description: "Langsung dari produsen, tanpa perantara" }, { icon: "🚚", title: "Pengiriman Cepat", description: "Dikirim hari sama, gratis ongkir min. belanja Rp 150rb" }] } },
      { type: "product_grid", variant: "product-4col", anchorId: "koleksi", config: { title: "Koleksi Terbaru", columns: 4, show_price: true, show_rating: true } },
      { type: "testimonials", variant: "testimonials-carousel", anchorId: "testimoni", config: { title: "Review Pelanggan", items: [{ name: "Siti", text: "Hijab ceruttynya adem, nggak gerah. Warna cantik banget sama fotonya!", rating: 5 }, { name: "Aisyah", text: "Gamisnya bagus, jahitan rapi. Udah beli 3x di sini, puas selalu.", rating: 5 }, { name: "Fatima", text: "Paket dua piece hemat, cocok buat kerja. Kirimnya cepet, packing rapi.", rating: 5 }] } },
      { type: "cta", variant: "cta-banner", anchorId: "promo", config: { title: "Dapatkan Diskon 15% untuk Pembelian Pertama", subtitle: "Daftar newsletter & dapatkan kode promo eksklusif. Berlaku untuk semua produk.", button_text: "Daftar & Belanja", button_link: "#koleksi" } },
      { type: "about", variant: "about-centered", anchorId: "tentang", config: { title: "Cerita Butik Hijab", content: "Berawal dari kebutuhan sendiri cari hijab berkualitas tapi terjangkau. Kini Butik Hijab melayani ribuan pelanggan setia di seluruh Indonesia dengan komitmen: kualitas terbaik, harga jujur, pelayanan hati.", image: "" } },
      { type: "pricing", variant: "pricing-2tier", anchorId: "harga", config: { title: "Kategori Harga", items: [{ name: "Koleksi Harian", price: "Mulai Rp 89rb", features: ["Kain basic & premium", "Motif terbaru mingguan", "Stok selalu ada"] }, { name: "Koleksi Premium", price: "Mulai Rp 249rb", features: ["Kain cerutty & wolpeach", "Jilbab premium + gamis", "Free ongkir min. Rp 500rb"] }] } },
      { type: "gallery", variant: "gallery-grid", anchorId: "galeri", config: { title: "Galeri Koleksi" } },
      { type: "faq", variant: "faq-accordion", anchorId: "faq", config: { title: "Tanya Jawab", items: [{ question: "Apakah semua bahan premium?", answer: "Ya, kami memakai cerutty, voal, dan wolpeach berkualitas tinggi." }, { question: "Bisa kirim luar kota?", answer: "Bisa. Kami kirim ke seluruh Indonesia, ongkir dihitung dari berat & lokasi." }, { question: "Ada retensi ukuran?", answer: "Bisa tukar ukuran selama label masih terpasang." }] } },
      { type: "location", variant: "location-hours", anchorId: "lokasi", config: { title: "Kunjungi Boutique Kami", address: "Jl. Fashion No. 12, Jakarta", hours: "Setiap hari 10.00–19.00", map_url: "", button_text: "Chat via WhatsApp", button_link: "https://wa.me/6281234567890" } },
      { type: "booking", variant: "booking-single", anchorId: "konsultasi", config: { title: "Cek Ukuran & Konsultasi", subtitle: "Bingung pilih ukuran? Konsultasi dulu, gratis tanpa minimum.", services: [{ name: "Konsultasi Ukuran (Online)", price: "Gratis" }, { name: "Fit Custom (Bahan Premium)", price: "Mulai Rp 50rb" }], address: "Jl. Fashion No. 12, Jakarta", hours: "Setiap hari 10.00–19.00", success_message: "Terima kasih! Tim kami akan menghubungi kamu via WhatsApp.", forward_wa: "" } },
      { type: "contact", variant: "contact-form-map", anchorId: "kontak", config: { title: "Hubungi Kami", subtitle: "Butuh bantuan pilih ukuran? Atau mau tanya stok? Chat kami via WhatsApp.", show_map: true, address: "Jl. Fashion No. 12, Jakarta" } },
    ],
    header: {
      variant: "floating",
      logoUrl: "",
      siteTitle: "Butik Hijab",
      tagline: "Elegan, Syar'i, Terjangkau",
      navItems: [
        { id: "bh-koleksi", label: "Koleksi", url: "#koleksi", isExternal: false, enabled: true },
        { id: "bh-baru", label: "Baru Datang", url: "#baru", isExternal: false, enabled: true },
        { id: "bh-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "bh-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      ctaText: "Belanja Sekarang",
      ctaLink: "#koleksi",
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "columns",
      text: "© {year} Butik Hijab. Elegan setiap hari.",
      navItems: [
        { id: "bh-f-koleksi", label: "Koleksi", url: "#koleksi", isExternal: false, enabled: true },
        { id: "bh-f-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "bh-f-syarat", label: "Syarat & Ketentuan", url: "/syarat", isExternal: false, enabled: true },
        { id: "bh-f-privasi", label: "Kebijakan Privasi", url: "/privasi", isExternal: false, enabled: true },
      ],
      showSocial: true,
      address: "Jl. Fashion No. 12, Jakarta",
      phone: "0812-3456-7890",
      email: "hello@butikhijab.id",
    },
    seo: {
      title: "Butik Hijab — Hijab & Fashion Muslim Elegan Terjangkau",
      description: "Hijab cerutty, voal, paris premium. Baju muslim modern, gamis, dua piece. Belanja online aman, COD, pengiriman cepat.",
    },
    core: {
      site_title: "Butik Hijab",
      tagline: "Elegan, Syar'i, Terjangkau",
      favicon_url: "",
      logo_url: "",
      header_nav: [
        { id: "bh-koleksi", label: "Koleksi", url: "#koleksi", isExternal: false, enabled: true },
        { id: "bh-baru", label: "Baru Datang", url: "#baru", isExternal: false, enabled: true },
        { id: "bh-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "bh-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      footer_nav: [
        { id: "bh-f-koleksi", label: "Koleksi", url: "#koleksi", isExternal: false, enabled: true },
        { id: "bh-f-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
        { id: "bh-f-syarat", label: "Syarat & Ketentuan", url: "/syarat", isExternal: false, enabled: true },
        { id: "bh-f-privasi", label: "Kebijakan Privasi", url: "/privasi", isExternal: false, enabled: true },
      ],
      footer_text: "© {year} Butik Hijab. Elegan setiap hari.",
    },
  },
} as Template & { data: FullTemplateData });