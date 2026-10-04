import type {
  FooterVariant,
  HeaderVariant,
} from "../template-types";
import type { CatalogTemplate } from "./catalog";
import { registrySections } from "./compose";

/**
 * Template kuliner: warung makan, cafe, catering, bakery.
 *
 * Fresh-authored di kode (bukan konversi baris DB lama). Katalog section
 * dibagikan dari registry; karakter niche ada di theme, seed, dan copy.
 */

const BRAND = "Warung Makan Sederhana";

const NAV_ITEMS = [
  { id: "nav-beranda", label: "Beranda", url: "#beranda", isExternal: false, enabled: true },
  { id: "nav-menu", label: "Menu", url: "#menu", isExternal: false, enabled: true },
  { id: "nav-tentang", label: "Tentang Kami", url: "#tentang", isExternal: false, enabled: true },
  { id: "nav-galeri", label: "Galeri", url: "#galeri", isExternal: false, enabled: true },
  { id: "nav-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
];

const HEADER_FIELDS = [
  { key: "logoUrl", label: "Logo URL", type: "image", placeholder: "https://..." },
  { key: "siteTitle", label: "Nama Warung", type: "text", placeholder: BRAND },
  { key: "tagline", label: "Tagline", type: "text" },
  {
    key: "navItems",
    label: "Menu Navigasi",
    type: "list",
    itemFields: [
      { key: "label", label: "Label", type: "text" },
      { key: "url", label: "URL", type: "text" },
    ],
  },
  { key: "ctaText", label: "Teks Tombol", type: "text" },
  { key: "ctaLink", label: "Link Tombol", type: "text" },
  { key: "showCta", label: "Tampilkan Tombol", type: "switch" },
  { key: "sticky", label: "Header menempel", type: "switch" },
] as HeaderVariant["configFields"];

const HEADER_DEFAULT = {
  logoUrl: "",
  siteTitle: BRAND,
  tagline: "Masakan rumahan autentik sejak 2010",
  navItems: NAV_ITEMS,
  ctaText: "Pesan via WhatsApp",
  ctaLink: "https://wa.me/6281234567890",
  showCta: true,
  sticky: true,
  contentWidth: "6xl",
};

const HEADERS: HeaderVariant[] = [
  {
    id: "hdr-klasik",
    name: "Klasik",
    description: "Bar penuh: logo kiri, menu tengah, tombol pesan kanan",
    layout: "standard",
    configFields: HEADER_FIELDS,
    defaultConfig: { ...HEADER_DEFAULT },
    mockup: "header-standard",
    maxNavDepth: 1,
  },
  {
    id: "hdr-melayang",
    name: "Melayang",
    description: "Bar mengambang rounded di atas hero",
    layout: "floating",
    configFields: HEADER_FIELDS,
    defaultConfig: { ...HEADER_DEFAULT },
    mockup: "header-floating",
    maxNavDepth: 1,
  },
  {
    id: "hdr-hero",
    name: "Hero Overlay",
    description: "Transparan di atas hero, solid saat scroll",
    layout: "hero-overlay",
    configFields: HEADER_FIELDS,
    defaultConfig: { ...HEADER_DEFAULT },
    mockup: "header-hero-overlay",
    maxNavDepth: 1,
  },
  {
    id: "hdr-split",
    name: "Nav Kiri",
    description: "Brand besar di kiri, menu dan tombol di kanan",
    layout: "split-nav",
    configFields: HEADER_FIELDS,
    defaultConfig: { ...HEADER_DEFAULT },
    mockup: "header-split-nav",
    maxNavDepth: 1,
  },
  {
    id: "hdr-topbar",
    name: "Promo Topbar",
    description: "Baris info jam buka di atas header utama",
    layout: "with-topbar",
    configFields: HEADER_FIELDS,
    defaultConfig: { ...HEADER_DEFAULT },
    mockup: "header-with-topbar",
    maxNavDepth: 1,
  },
];

const FOOTER_FIELDS = [
  { key: "siteTitle", label: "Nama Warung", type: "text" },
  { key: "logoUrl", label: "Logo URL", type: "image" },
  { key: "text", label: "Teks Copyright", type: "text", placeholder: `© {year} ${BRAND}` },
  { key: "showNav", label: "Tampilkan navigasi", type: "switch" },
  {
    key: "navItems",
    label: "Menu Footer",
    type: "list",
    itemFields: [
      { key: "label", label: "Label", type: "text" },
      { key: "url", label: "URL", type: "text" },
    ],
  },
  { key: "showSocial", label: "Tampilkan sosmed", type: "switch" },
] as FooterVariant["configFields"];

const FOOTER_DEFAULT = {
  siteTitle: BRAND,
  logoUrl: "",
  text: `© {year} ${BRAND}. Cita rasa rumahan di setiap sajian.`,
  navItems: NAV_ITEMS.slice(0, 4),
  showNav: true,
  showSocial: true,
};

const FOOTERS: FooterVariant[] = [
  {
    id: "ftr-inline",
    name: "Satu Baris",
    description: "Baris tunggal: teks, menu, ikon sosial",
    layout: "simple",
    configFields: FOOTER_FIELDS,
    defaultConfig: { ...FOOTER_DEFAULT },
    mockup: "footer-simple",
  },
  {
    id: "ftr-kolom",
    name: "Kolom Aksen",
    description: "Tiga kolom dengan aksen hangat di atas",
    layout: "columns",
    configFields: FOOTER_FIELDS,
    defaultConfig: { ...FOOTER_DEFAULT },
    mockup: "footer-columns",
  },
  {
    id: "ftr-tengah",
    name: "Brand Tengah",
    description: "Nama warung besar bertumpuk di tengah",
    layout: "centered",
    configFields: FOOTER_FIELDS,
    defaultConfig: { ...FOOTER_DEFAULT },
    mockup: "footer-centered",
  },
  {
    id: "ftr-mini",
    name: "Mini",
    description: "Ringkas: hanya teks hak cipta",
    layout: "minimal",
    configFields: FOOTER_FIELDS,
    defaultConfig: { ...FOOTER_DEFAULT },
    mockup: "footer-minimal",
  },
  {
    id: "ftr-news",
    name: "Pita Info",
    description: "Pita info promo lebar di atas baris copyright",
    layout: "newsletter",
    configFields: FOOTER_FIELDS,
    defaultConfig: { ...FOOTER_DEFAULT },
    mockup: "footer-newsletter",
  },
];

export const FOOD_TEMPLATE: CatalogTemplate = {
  id: "food",
  name: "Warung Makan",
  description:
    "Template kuliner untuk warung makan, cafe, catering, dan bakery — hero menggugah selera, papan menu, pemesanan meja, dan jam operasional.",
  category: "food",
  designType: "organic",
  designStyleId: "organic",
  theme: {
    palette: {
      primary: "#c2410c",
      secondary: "#9a3412",
      accent: "#f59e0b",
      background: "#fffbeb",
      surface: "#fef3c7",
      text: "#1c1917",
      textMuted: "#57534e",
      border: "#fde68a",
    },
    typography: {
      headingFont: "Poppins",
      bodyFont: "Inter",
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
      footerStyle: "centered",
    },
    effects: {},
  },
  headers: HEADERS,
  footers: FOOTERS,
  sections: registrySections(),
  data: {
    designStyleId: "organic",
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
    activeSections: [
      "hero",
      "features",
      "menu_board",
      "pricing",
      "testimonials",
      "gallery",
      "location",
      "faq",
      "contact",
    ],
    sections: [
      {
        type: "hero",
        variant: "hero-full",
        anchorId: "beranda",
        config: {
          headline: "Rasa Rumahan, Harga Bersahabat",
          subheadline:
            "Nikmati masakan autentik dimasak segar setiap hari — tersedia untuk makan di tempat, bungkus, dan catering acara.",
          cta_text: "Lihat Menu Hari Ini",
          cta_link: "#menu",
        },
      },
      {
        type: "features",
        variant: "features-3col",
        anchorId: "keunggulan",
        config: {
          title: "Kenapa Makan di Sini?",
          items: [
            {
              icon: "flame",
              title: "Dimasak Segar",
              description: "Semua hidangan dimasak dadakan, bukan stok kemarin",
            },
            {
              icon: "wallet",
              title: "Harga Warung",
              description: "Porsi kenyang mulai Rp 10.000, cocok untuk harian",
            },
            {
              icon: "bike",
              title: "Siap Diantar",
              description: "Pesan via WhatsApp, diantar panas-panas ke rumah",
            },
          ],
        },
      },
      {
        type: "menu_board",
        variant: "menu-tabs",
        anchorId: "menu",
        config: {
          title: "Menu Andalan",
          items: [
            { name: "Ayam Goreng Lalapan", price: 15000, description: "Ayam kampung goreng + lalapan + sambal" },
            { name: "Soto Ayam Lamongan", price: 12000, description: "Kuah gurih dengan koya dan telur" },
            { name: "Nasi Campur Komplit", price: 18000, description: "Lauk lengkap + kerupuk + es teh" },
          ],
        },
      },
      {
        type: "pricing",
        variant: "pricing-3tier",
        anchorId: "paket",
        config: {
          title: "Paket Catering",
          items: [
            { name: "Harian", price: "Rp 15rb/porsi", description: "Untuk makan siang kantor, min. 20 porsi" },
            { name: "Acara", price: "Rp 25rb/porsi", description: "Prasmanan hajatan dan rapat, min. 50 porsi" },
            { name: "Nasi Kotak", price: "Rp 12rb/kotak", description: "Praktis untuk rapat dan yasinan" },
          ],
        },
      },
      {
        type: "testimonials",
        variant: "testimonials-grid",
        anchorId: "testimoni",
        config: {
          title: "Kata Pelanggan",
          items: [
            { name: "Pak Harto", text: "Sambalnya juara, porsinya tidak pelit. Langganan tiap Jumat.", rating: 5 },
            { name: "Mbak Dina", text: "Catering 100 kotak untuk rapat, datang tepat waktu dan masih hangat.", rating: 5 },
            { name: "Mas Yoga", text: "Tempatnya bersih, cocok buat buka puasa bareng keluarga.", rating: 4 },
          ],
        },
      },
      {
        type: "gallery",
        variant: "gallery-grid",
        anchorId: "galeri",
        config: {
          title: "Suasana & Hidangan",
          images: [],
        },
      },
      {
        type: "location",
        variant: "location-hours",
        anchorId: "lokasi",
        config: {
          title: "Lokasi & Jam Buka",
          address: "Jl. Kenanga No. 12, Yogyakarta",
          hours: "Senin–Sabtu 08.00–21.00, Minggu tutup",
        },
      },
      {
        type: "faq",
        variant: "faq-accordion",
        anchorId: "faq",
        config: {
          title: "Pertanyaan Umum",
          items: [
            { question: "Apakah bisa pesan untuk acara?", answer: "Bisa. Paket catering dan nasi kotak tersedia, hubungi H-3 via WhatsApp." },
            { question: "Apakah tersedia ojek online?", answer: "Ya, cari Warung Makan Sederhana di aplikasi favorit Anda." },
            { question: "Bagaimana cara reservasi meja?", answer: "Isi formulir reservasi di atas atau chat WhatsApp, gratis tanpa DP." },
          ],
        },
      },
      {
        type: "contact",
        variant: "contact-form",
        anchorId: "kontak",
        config: {
          title: "Hubungi Kami",
          subtitle: "Tanya menu, catering, atau kerja sama — fast respon di jam buka",
          address: "Jl. Kenanga No. 12, Yogyakarta",
          phone: "0812-3456-7890",
          email: "halo@warungsederhana.id",
        },
      },
    ],
    header: {
      variant: "standard",
      siteTitle: BRAND,
      tagline: "Masakan rumahan autentik sejak 2010",
      navItems: NAV_ITEMS,
      ctaText: "Pesan via WhatsApp",
      ctaLink: "https://wa.me/6281234567890",
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "columns",
      text: `© {year} ${BRAND}. Cita rasa rumahan di setiap sajian.`,
      navItems: NAV_ITEMS.slice(0, 4),
      showNav: true,
      showSocial: true,
    },
    seo: {
      title: `${BRAND} — Masakan Rumahan Autentik di Yogyakarta`,
      description:
        "Warung makan dengan menu harian segar, paket catering, dan reservasi meja. Rasa rumahan dengan harga bersahabat sejak 2010.",
    },
    core: {
      site_title: BRAND,
      tagline: "Masakan rumahan autentik sejak 2010",
    },
  },
};
