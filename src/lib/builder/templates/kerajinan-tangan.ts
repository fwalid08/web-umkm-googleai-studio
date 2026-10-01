import type { Template } from "../template-types";
import type { FullTemplateData } from "../types";
import { PANGKAS_RAPI_TEMPLATE } from "./pangkas-rapi";

const WA = "https://wa.me/6281234567890";

export const KERAJINAN_TANGAN_TEMPLATE = ({
  ...PANGKAS_RAPI_TEMPLATE,
  id: "kerajinan-tangan",
  name: "Kerajinan Tangan — Produk Unik & Custom",
  description:
    "Hero brand, tentang kami, galeri karya, tim pengrajin, harga custom, FAQ, kontak. Gaya organik alami cocok kerajinan.",
  category: "handicraft",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: "#557153",
      secondary: "#3F6212",
      accent: "#A9B388",
      background: "#F5F5EC",
      surface: "#FFFFF8",
      text: "#2F3A2F",
      textMuted: "#6B7280",
      border: "#D1D5DB",
    },
    typography: {
      headingFont: "Caveat",
      bodyFont: "Nunito",
      baseSize: 16,
      scaleRatio: 1.2,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 24,
      buttonStyle: "ghost",
      shadowStyle: "md",
      navStyle: "bordered",
      footerStyle: "centered",
    },
    effects: {
      borderWidth: 0,
    },
  },
  headers: PANGKAS_RAPI_TEMPLATE.headers.map((h) => ({
    ...h,
    // Katalog kerajinan: menu 2 tingkat (Karya > Kayu / Anyaman / Keramik).
    maxNavDepth: 2,
    defaultConfig: {
      ...h.defaultConfig,
      siteTitle: "Kerajinan Tangan",
      tagline: "Produk Unik, Buatan Tangan, Bermakna",
      navItems: [
        { id: "kt-karya", label: "Karya Kami", url: "#karya", isExternal: false, enabled: true },
        { id: "kt-tentang", label: "Tentang", url: "#tentang", isExternal: false, enabled: true },
        { id: "kt-custom", label: "Custom Order", url: "#custom", isExternal: false, enabled: true },
        { id: "kt-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      ctaText: "Custom Order",
      ctaLink: "#custom",
      showCta: true,
      sticky: true,
    },
  })),
  footers: PANGKAS_RAPI_TEMPLATE.footers.map((f) => ({
    ...f,
    defaultConfig: {
      ...f.defaultConfig,
      text: "© {year} Kerajinan Tangan. Setiap karya punya cerita.",
      navItems: [
        { id: "kt-f-karya", label: "Karya", url: "#karya", isExternal: false, enabled: true },
        { id: "kt-f-custom", label: "Custom", url: "#custom", isExternal: false, enabled: true },
        { id: "kt-f-workshop", label: "Workshop", url: "#workshop", isExternal: false, enabled: true },
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
        ...(s.type === "hero" && v.id === "hero-card"
          ? {
              headline: "Produk Unik, Buatan Tangan, Bermakna",
              subheadline: "Setiap karya dibuat penuh kesabaran oleh pengrajin lokal. Kayu, anyaman, keramik, tenun. Bisa custom untuk hadiah, merch, atau dekorasi ruang.",
              cta_text: "Lihat Karya & Custom",
              cta_link: "#karya",
            }
          : {}),
        ...(s.type === "about" && v.id === "about-left"
          ? {
              title: "Cerita Kami",
              content: "Kami komunitas pengrajin dari berbagai daerah: ukir kayu Jepara, anyaman Tasikmalaya, keramik Kasongan, tenun Troso. Bergabung untuk membawa karya tangan Indonesia ke lebih banyak orang. Setiap pembelian mendukung penghidupan pengrajin & kelestarian budaya.",
              image: "",
            }
          : {}),
        ...(s.type === "gallery" && v.id === "gallery-masonry"
          ? {
              title: "Galeri Karya",
            }
          : {}),
        ...(s.type === "team" && v.id === "team-grid"
          ? {
              title: "Pengrajin di Balik Karya",
              members: [
                { name: "Pak Budi", role: "Ahli Ukir Kayu (Jepara)", image: "" },
                { name: "Ibu Siti", role: "Ahli Anyaman Bambu (Tasik)", image: "" },
                { name: "Pak Agus", role: "Ahli Keramik (Kasongan)", image: "" },
                { name: "Ibu Dewi", role: "Ahli Tenun (Troso)", image: "" },
              ],
            }
          : {}),
        ...(s.type === "pricing" && v.id === "pricing-2tier"
          ? {
              title: "Estimasi Harga Custom Order",
              items: [
                { name: "Custom Kecil (Aksesoris, Kunci)", price: "Mulai Rp 50rb", features: ["Desain gratis", "Proses 3-5 hari", "Min. order 10 pcs"] },
                { name: "Custom Sedang (Dekor, Merch)", price: "Mulai Rp 200rb", features: ["Konsultasi desain", "Proses 7-14 hari", "Min. order 20 pcs"] },
              ],
            }
          : {}),
        ...(s.type === "faq" && v.id === "faq-accordion"
          ? {
              title: "Tanya Jawab Custom Order",
              items: [
                { question: "Bisa custom desain sendiri?", answer: "Bisa. Kirim referensi/sketsa, tim kami bantu finalisasi desain gratis." },
                { question: "Berapa lama prosesnya?", answer: "Tergantung kompleksitas & kuantitas: 3-14 hari kerja. Kami update progress via WA." },
                { question: "Bisa kirim ke luar kota?", answer: "Bisa ke seluruh Indonesia. Ongkir dihitung dari berat & lokasi. Packing kayu/keramik extra hati-hati." },
              ],
            }
          : {}),
        ...(s.type === "contact" && v.id === "contact-split"
          ? {
              title: "Mulai Custom Order",
              subtitle: "Ceritakan ide Anda. Tim kami balas via WhatsApp dalam 1 jam kerja.",
              address: "Jl. Kerajinan No. 7, Yogyakarta",
            }
          : {}),
      },
    })),
  })),
  data: {
    designStyleId: "organic",
    paletteOverride: {
      primary: "#2d6a4f",
      secondary: "#40916c",
      accent: "#95d5b2",
      background: "#f8f9fa",
      surface: "#ffffff",
      text: "#1b4332",
      textMuted: "#2f7d4f",
      border: "#d8f3dc",
    },
    sections: [
      { type: "hero", variant: "hero-card", anchorId: "beranda", config: { headline: "Produk Unik, Buatan Tangan, Bermakna", subheadline: "Setiap karya dibuat penuh kesabaran oleh pengrajin lokal. Kayu, anyaman, keramik, tenun. Bisa custom untuk hadiah, merch, atau dekorasi ruang.", cta_text: "Lihat Karya & Custom", cta_link: "#karya" } },
      { type: "about", variant: "about-left", anchorId: "tentang", config: { title: "Cerita Kami", content: "Kami komunitas pengrajin dari berbagai daerah: ukir kayu Jepara, anyaman Tasikmalaya, keramik Kasongan, tenun Troso. Bergabung untuk membawa karya tangan Indonesia ke lebih banyak orang. Setiap pembelian mendukung penghidupan pengrajin & kelestarian budaya.", image: "" } },
      { type: "gallery", variant: "gallery-masonry", anchorId: "karya", config: { title: "Galeri Karya" } },
      { type: "team", variant: "team-grid", anchorId: "pengrajin", config: { title: "Pengrajin di Balik Karya", members: [{ name: "Pak Budi", role: "Ahli Ukir Kayu (Jepara)", image: "" }, { name: "Ibu Siti", role: "Ahli Anyaman Bambu (Tasik)", image: "" }, { name: "Pak Agus", role: "Ahli Keramik (Kasongan)", image: "" }, { name: "Ibu Dewi", role: "Ahli Tenun (Troso)", image: "" }] } },
      { type: "pricing", variant: "pricing-2tier", anchorId: "custom", config: { title: "Estimasi Harga Custom Order", items: [{ name: "Custom Kecil (Aksesoris, Kunci)", price: "Mulai Rp 50rb", features: ["Desain gratis", "Proses 3-5 hari", "Min. order 10 pcs"] }, { name: "Custom Sedang (Dekor, Merch)", price: "Mulai Rp 200rb", features: ["Konsultasi desain", "Proses 7-14 hari", "Min. order 20 pcs"] }] } },
      { type: "location", variant: "location-hours", anchorId: "lokasi-toko", config: { title: "Kunjungi Toko Kami", address: "Jl. Kerajinan No. 7, Yogyakarta", note: "Dekat Pasar Seni, parkir motor tersedia", button_text: "Chat via WhatsApp", button_link: "https://wa.me/6281234567890", hours: [{ days: "Senin–Sabtu", time: "09.00–17.00" }, { days: "Minggu", time: "Tutup" }] } },
      { type: "testimonials", variant: "testimonials-grid", anchorId: "testimoni", config: { title: "Cerita Pembeli", items: [{ name: "Ibu Ani", text: "Kualitasnya luar biasa, detailnya rapih. Sangat cocok untuk hadiah.", rating: 5 }, { name: "Budi", text: "Pesanan custom-nya cepat dan hasilnya sesuai permintaan.", rating: 5 }, { name: "Sinta", text: "Pengrajin-nya ramah dan sabar. Recommended! untuk semua yang suka kerajinan tangan.", rating: 5 }] } },
      { type: "features", variant: "features-3col", anchorId: "keunggulan", config: { title: "Kenapa Belanja Produk Kami", items: [{ icon: "🤲", title: "Buatan Tangan", description: "Setiap karya dibuat penuh kesabaran oleh pengrajin lokal." }, { icon: "🎁", title: "Bisa Custom", description: "Warna, bentuk, dan ukuran bisa disesuaikan sesuai permintaan." }, { icon: "🌱", title: "Dukung Lokal", description: "Setiap pembelian menopang pengrajin & kelestarian budaya." }] } },
      { type: "booking", variant: "booking-single", anchorId: "pesan-custom", config: { title: "Pesan Custom Order", subtitle: "Ceritakan idenya — tim kami balas via WhatsApp dalam 1 jam kerja.", services: [{ name: "Custom Aksesoris (Gelang, Kalung)", price: "Mulai Rp 50rb" }, { name: "Custom Dekorasi / Merch", price: "Mulai Rp 200rb" }], address: "Jl. Kerajinan No. 7, Yogyakarta", hours: "Senin–Sabtu, 09.00–17.00", success_message: "Pesanan custom diterima! Tim kami akan menghubungi kamu.", forward_wa: "" } },
      { type: "faq", variant: "faq-accordion", anchorId: "faq", config: { title: "Tanya Jawab Custom Order", items: [{ question: "Bisa custom desain sendiri?", answer: "Bisa. Kirim referensi/sketsa, tim kami bantu finalisasi desain gratis." }, { question: "Berapa lama prosesnya?", answer: "Tergantung kompleksitas & kuantitas: 3-14 hari kerja. Kami update progress via WA." }, { question: "Bisa kirim ke luar kota?", answer: "Bisa ke seluruh Indonesia. Ongkir dihitung dari berat & lokasi. Packing kayu/keramik extra hati-hati." }] } },
      { type: "contact", variant: "contact-split", anchorId: "kontak", config: { title: "Mulai Custom Order", subtitle: "Ceritakan ide Anda. Tim kami balas via WhatsApp dalam 1 jam kerja.", address: "Jl. Kerajinan No. 7, Yogyakarta" } },
    ],
    header: {
      variant: "minimal",
      logoUrl: "",
      siteTitle: "Kerajinan Tangan",
      tagline: "Produk Unik, Buatan Tangan, Bermakna",
      navItems: [
        { id: "kt-karya", label: "Karya Kami", url: "#karya", isExternal: false, enabled: true },
        { id: "kt-tentang", label: "Tentang", url: "#tentang", isExternal: false, enabled: true },
        { id: "kt-custom", label: "Custom Order", url: "#custom", isExternal: false, enabled: true },
        { id: "kt-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      ctaText: "Custom Order",
      ctaLink: "#custom",
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "centered",
      text: "© {year} Kerajinan Tangan. Setiap karya punya cerita.",
      navItems: [
        { id: "kt-f-karya", label: "Karya", url: "#karya", isExternal: false, enabled: true },
        { id: "kt-f-custom", label: "Custom", url: "#custom", isExternal: false, enabled: true },
        { id: "kt-f-workshop", label: "Workshop", url: "#workshop", isExternal: false, enabled: true },
      ],
      showSocial: true,
    },
    seo: {
      title: "Kerajinan Tangan — Produk Unik Buatan Tangan, Bisa Custom",
      description: "Kerajinan kayu, anyaman, keramik, tenun tangan. Bisa custom order untuk hadiah, merch, dekorasi. Di buat pengrajin lokal Indonesia.",
    },
    core: {
      site_title: "Kerajinan Tangan",
      tagline: "Produk Unik, Buatan Tangan, Bermakna",
      favicon_url: "",
      logo_url: "",
      header_nav: [
        { id: "kt-karya", label: "Karya Kami", url: "#karya", isExternal: false, enabled: true },
        { id: "kt-tentang", label: "Tentang", url: "#tentang", isExternal: false, enabled: true },
        { id: "kt-custom", label: "Custom Order", url: "#custom", isExternal: false, enabled: true },
        { id: "kt-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
      ],
      footer_nav: [
        { id: "kt-f-karya", label: "Karya", url: "#karya", isExternal: false, enabled: true },
        { id: "kt-f-custom", label: "Custom", url: "#custom", isExternal: false, enabled: true },
        { id: "kt-f-workshop", label: "Workshop", url: "#workshop", isExternal: false, enabled: true },
      ],
      footer_text: "© {year} Kerajinan Tangan. Setiap karya punya cerita.",
    },
  },
} as Template & { data: FullTemplateData });