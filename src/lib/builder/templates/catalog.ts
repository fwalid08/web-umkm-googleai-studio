import type { BuiltInTemplate } from "../types";
import type { Tier } from "@/types";

export type BusinessCategory = "food" | "fashion" | "retail" | "handicraft" | "services";

export interface CatalogTemplate extends BuiltInTemplate {
  category: BusinessCategory;
  /**
   * Tier yang boleh memakai template ini.
   * `undefined` (tidak diisi) = semua tier boleh.
   * Contoh mengunci ke berbayar: tiers: ["starter", "growth", "enterprise"].
   */
  tiers?: Tier[];
}

export const CATEGORY_LABELS: Record<BusinessCategory | "all", string> = {
  all: "Semua",
  food: "Kuliner & Minuman",
  fashion: "Fashion & Hijab",
  retail: "Retail & Kelontong",
  handicraft: "Kerajinan Tangan",
  services: "Jasa & Servis",
};

const WA = "https://wa.me/6281234567890";

/**
 * Katalog template builtin — SATU template per validasi model baru:
 * source of truth = template terpilih, varian milik template, kontrak
 * section inti wajib terpenuhi. Template berikutnya ditambah satu per satu
 * dengan pola yang sama (lihat TEMPLATE_CONTRACT di catalog.test.ts).
 */
export const BUILT_IN_CATALOG: CatalogTemplate[] = [
  {
    id: "pangkas-rapi",
    name: "Pangkas Rapi — Barbershop & Jasa",
    description:
      "Hero foto, keunggulan, tarif 3 paket, form booking + info, testimoni, galeri, lokasi & jam buka, FAQ, kontak. Gaya minimalist tepercaya.",
    category: "services",
    // Tersedia untuk semua tier. Untuk mengunci ke tier berbayar nanti,
    // cukup ganti menjadi misalnya ["starter", "growth", "enterprise"].
    tiers: ["free", "starter", "growth", "enterprise"],
    data: {
      designStyleId: "minimalist",
      // Skema warna khas template (diwarisi semua section/header/footer).
      // Ganti skema tidak merusak: sudah lolos kontras WCAG AA (cek kontrak).
      paletteOverride: {
        primary: "#047857",
        secondary: "#065f46",
        accent: "#f59e0b",
        background: "#ffffff",
        surface: "#ecfdf5",
        text: "#111827",
        textMuted: "#4b5563",
        border: "#a7f3d0",
      },
      header: {
        variant: "standard",
        logoUrl: "",
        siteTitle: "Pangkas Rapi",
        tagline: "Rapi, Bersih, Percaya Diri",
        navItems: [
          { id: "pr-layanan", label: "Layanan", url: "#layanan", isExternal: false, enabled: true },
          { id: "pr-tarif", label: "Tarif", url: "#tarif", isExternal: false, enabled: true },
          { id: "pr-booking", label: "Booking", url: "#booking", isExternal: false, enabled: true },
          { id: "pr-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
        ],
        ctaText: "Booking via WA",
        ctaLink: WA,
        showCta: true,
        sticky: true,
      },
      footer: {
        style: "simple",
        text: "© {year} Pangkas Rapi. Rapi setiap hari.",
        navItems: [
          { id: "pr-f-tarif", label: "Tarif", url: "#tarif", isExternal: false, enabled: true },
          { id: "pr-f-booking", label: "Booking", url: "#booking", isExternal: false, enabled: true },
          { id: "pr-f-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
        ],
        showSocial: true,
      },
      seo: {
        title: "Pangkas Rapi — Barbershop Terpercaya",
        description: "Potong rambut rapi tanpa antre lama. Booking online, konfirmasi via WhatsApp.",
      },
      sections: [
        {
          type: "hero",
          variant: "hero-bg-image",
          config: {
            headline: "Tampil Rapi, Percaya Diri",
            subheadline: "Barber berpengalaman, alat steril, hasil konsisten. Booking dulu, datang langsung dilayani.",
            cta_text: "Booking Sekarang",
            cta_link: "#booking",
            text_align: "center",
            background_type: "image",
            background_image: "",
          },
        },
        {
          type: "features",
          variant: "features-3col",
          config: {
            title: "Kenapa Pangkas di Kami",
            items: [
              { icon: "✂️", title: "Barber Berpengalaman", description: "Tim barber dengan pengalaman 5+ tahun" },
              { icon: "🧼", title: "Alat Steril", description: "Alat didesinfeksi setiap selesai dipakai" },
              { icon: "⏱️", title: "Tanpa Antre Lama", description: "Booking online, datang langsung dilayani" },
            ],
          },
        },
        {
          type: "pricing",
          variant: "pricing-3tier",
          config: {
            title: "Tarif Cukur",
            items: [
              { name: "Reguler", price: "Rp 25rb", features: ["Potong rambut", "Cuci rambut", "Styling"] },
              { name: "Premium", price: "Rp 40rb", features: ["Potong rambut", "Cukur jenggot", "Cuci + pijat", "Styling premium"] },
              { name: "Paket Bulanan", price: "Rp 90rb", features: ["4x potong rambut", "Prioritas booking", "Gratis styling"] },
            ],
          },
        },
        {
          type: "booking",
          variant: "booking-split",
          config: {
            title: "Booking Sekarang",
            subtitle: "Amankan jadwal Anda — tanpa antre lama",
            services: [
              { name: "Potong Rambut", duration: "30 menit", price: "Rp 25rb" },
              { name: "Potong + Cukur Jenggot", duration: "45 menit", price: "Rp 40rb" },
              { name: "Creambath + Pijat", duration: "60 menit", price: "Rp 75rb" },
            ],
            address: "Jl. Merdeka No. 12, Jakarta",
            hours: "Senin–Sabtu, 09.00–20.00",
            success_message: "Terima kasih! Booking Anda diterima. Kami akan konfirmasi via WhatsApp.",
            forward_wa: "",
          },
        },
        {
          type: "testimonials",
          variant: "testimonials-grid",
          config: {
            title: "Kata Pelanggan",
            items: [
              { name: "Andi", text: "Potongannya rapi banget, booking online juga gampang!", rating: 5 },
              { name: "Budi", text: "Tempatnya bersih, barber-nya ramah. Langganan tetap.", rating: 5 },
              { name: "Candra", text: "Datang sesuai jadwal langsung dilayani. Mantap.", rating: 5 },
            ],
          },
        },
        {
          type: "gallery",
          variant: "gallery-grid",
          config: { title: "Galeri Hasil" },
        },
        {
          type: "location",
          variant: "location-hours",
          config: {
            title: "Kunjungi Kami",
            address: "Jl. Merdeka No. 12, Jakarta",
            note: "Mudah dijangkau, parkir luas.",
            button_text: "Chat via WhatsApp",
            button_link: WA,
            hours: [
              { days: "Senin–Sabtu", time: "09.00–20.00" },
              { days: "Minggu", time: "Tutup" },
            ],
          },
        },
        {
          type: "faq",
          variant: "faq-accordion",
          config: {
            title: "Sering Ditanyakan",
            items: [
              { question: "Apakah harus booking dulu?", answer: "Tidak wajib, tapi booking memastikan Anda langsung dilayani tanpa antre." },
              { question: "Bagaimana cara booking?", answer: "Isi form booking di atas, kami konfirmasi via WhatsApp dalam 1 jam kerja." },
              { question: "Bisa reschedule?", answer: "Bisa, hubungi kami via WhatsApp minimal 2 jam sebelumnya." },
            ],
          },
        },
        {
          type: "contact",
          variant: "contact-form-map",
          config: {
            title: "Hubungi Kami",
            subtitle: "Ada pertanyaan? Kirim pesan atau mampir langsung",
            show_map: true,
            address: "Jl. Merdeka No. 12, Jakarta",
          },
        },
      ],
    },
  },
];

/** Semua tier yang dikenal — untuk validasi kontrak katalog. */
export const ALL_TIERS = ["free", "starter", "growth", "enterprise"] as const;

/**
 * Apakah template katalog boleh dipakai tier ini?
 * `tiers` kosong/undefined = semua tier boleh (default terbuka).
 * Tier tak dikenal (null/undefined) = fail-open untuk tampilan;
 * penegakan sesungguhnya tetap di API (PUT) yang punya tier asli user.
 */
export function isCatalogTemplateAllowedForTier(
  tiers: readonly string[] | undefined,
  tier: string | null | undefined
): boolean {
  if (!tiers || tiers.length === 0) return true;
  if (!tier) return true;
  return tiers.includes(tier);
}

/** Saring katalog builtin sesuai tier user (untuk galeri). */
export function filterCatalogByTier<T extends { tiers?: readonly string[] }>(
  catalog: readonly T[],
  tier: string | null | undefined
): T[] {
  return catalog.filter((t) => isCatalogTemplateAllowedForTier(t.tiers, tier));
}

/** Ambil template per kategori usaha (tetap ada untuk kompatibilitas galeri). */
export function getCatalogByCategory(category: BusinessCategory | "all"): CatalogTemplate[] {
  if (category === "all") return BUILT_IN_CATALOG;
  return BUILT_IN_CATALOG.filter((t) => t.category === category);
}
