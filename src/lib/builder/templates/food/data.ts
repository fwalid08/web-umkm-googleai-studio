import type { FullTemplateData } from "../../types";
import { BRAND, NAV_ITEMS } from "./chrome";

export const DATA: FullTemplateData = {
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
    bottomBar: {
      enabled: true,
      items: [
        { id: "home", label: "Beranda", icon: "Home", url: "#beranda" },
        { id: "menu", label: "Menu", icon: "Menu", url: "#menu" },
        { id: "cta", label: "Pesan", icon: "MessageCircle", url: "https://wa.me/6281234567890", isExternal: true },
        { id: "gallery", label: "Galeri", icon: "Image", url: "#galeri" },
        { id: "contact", label: "Kontak", icon: "Phone", url: "#kontak" },
      ],
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
};
