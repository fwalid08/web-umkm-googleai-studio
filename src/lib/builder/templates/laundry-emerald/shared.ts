import type { ConfigField } from "../../template-types";

export const BRAND = "Emerald Laundry";
export const NS = "laundry-emerald";
export const vid = (name: string) => `${NS}:${name}`;

/* ------------------------------------------------------------------ */
/* Label Indonesia untuk field sidebar (diturunkan otomatis, § field) */
/* ------------------------------------------------------------------ */

const LABELS: Record<string, string> = {
  badge: "Lencana",
  eyebrow: "Eyebrow Script",
  headline: "Headline",
  subheadline: "Subheadline",
  title: "Judul",
  subtitle: "Subjudul",
  content: "Konten",
  quote: "Kutipan",
  image: "Foto",
  images: "Daftar Foto",
  logoUrl: "Logo URL",
  siteTitle: "Nama Laundry",
  tagline: "Tagline",
  navItems: "Menu Navigasi",
  label: "Label",
  url: "URL",
  cta_text: "Teks Tombol",
  cta_link: "Link Tombol",
  ctaText: "Teks Tombol",
  ctaLink: "Link Tombol",
  cta2_text: "Teks Tombol Kedua",
  cta2_link: "Link Tombol Kedua",
  showCta: "Tampilkan Tombol",
  sticky: "Header menempel",
  menuPosition: "Posisi Menu",
  contentWidth: "Lebar Konten",
  topbarText: "Teks Topbar",
  topbarPhone: "Telepon Topbar",
  topbarEmail: "Email Topbar",
  text: "Teks Copyright",
  showNav: "Tampilkan navigasi",
  showSocial: "Tampilkan sosmed",
  items: "Daftar Isi",
  stats: "Daftar Statistik",
  value: "Nilai",
  name: "Nama",
  description: "Deskripsi",
  price: "Harga",
  icon: "Ikon",
  no: "Nomor",
  question: "Pertanyaan",
  answer: "Jawaban",
  open: "Terbuka Default",
  rating: "Rating",
  stars: "Deretan Bintang",
  excerpt: "Ringkasan",
  address: "Alamat",
  phone: "Telepon",
  email: "Email",
  hours: "Jam Buka",
  note: "Catatan",
  button_text: "Teks Tombol",
  button_link: "Link Tombol",
  rating_text: "Teks Rating",
  badge_text: "Teks Lencana Foto",
  overlayTitle: "Judul Overlay",
  readMore: "Teks Selengkapnya",
  panelTitle: "Judul Panel",
  highlights: "Daftar Sorotan",
  highlight: "Sorotan",
  kicker: "Kicker Promo",
  menuTitle: "Judul Menu",
  contactTitle: "Judul Kontak",
  whatsappText: "Teks WhatsApp",
  whatsappLink: "Link WhatsApp",
  panelVisitTitle: "Judul Panel Kunjung",
  panelContactTitle: "Judul Panel Kontak",
  strapline: "Kalimat Pembuka",
  newsletterButtonLink: "Link Tombol Newsletter",
  poweredText: "Teks Powered",
  poweredUrl: "URL Powered",
  showPowered: "Tampilkan Powered",
  showPoweredHint: "Hanya paket Enterprise yang dapat mematikan",
  newsletterTitle: "Judul Newsletter",
  newsletterText: "Teks Newsletter",
  newsletterButtonText: "Teks Tombol Newsletter",
  ctaTitle: "Judul CTA",
  ctaButtonText: "Teks Tombol CTA",
  ctaButtonLink: "Link Tombol CTA",
};

function prettyLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const HINTS: Record<string, string> = {
  showPowered: "Hanya paket Enterprise yang dapat mematikan",
};

function fieldTypeFor(key: string, value: unknown): ConfigField["type"] {
  if (typeof value === "boolean") return "switch";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "list";
  const lower = key.toLowerCase();
  if (lower.includes("image") || lower.includes("logo") || lower.includes("favicon")) return "image";
  if (lower.includes("color") || lower.includes("warna")) return "color";
  if (typeof value === "string" && value.length > 120) return "textarea";
  return "text";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Turunkan configFields dari defaultConfig — menjamin tiap key punya field. */
export function inferFields(config: Record<string, unknown>, nested = false): ConfigField[] {
  return Object.entries(config)
    .filter(([key]) => !(nested && key === "id"))
    .map(([key, value]) => {
      const field: ConfigField = { key, label: prettyLabel(key), type: fieldTypeFor(key, value) };
      if (HINTS[key]) field.hint = HINTS[key];
      if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
        field.itemFields = inferFields(value[0] as Record<string, unknown>, true);
      }
      if (typeof value === "string" && value.length > 120) field.rows = 3;
      return field;
    });
}

/* ------------------------------------------------------------------ */
/* Navigasi + foto (merchant mengganti lewat sidebar)                  */
/* ------------------------------------------------------------------ */

export const NAV_ITEMS = [
  { id: "nav-beranda", label: "Beranda", url: "#beranda", isExternal: false, enabled: true },
  { id: "nav-keunggulan", label: "Keunggulan", url: "#keunggulan", isExternal: false, enabled: true },
  { id: "nav-layanan", label: "Layanan", url: "#layanan", isExternal: false, enabled: true },
  { id: "nav-testimoni", label: "Testimoni", url: "#testimoni", isExternal: false, enabled: true },
  { id: "nav-artikel", label: "Artikel", url: "#artikel", isExternal: false, enabled: true },
  { id: "nav-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
];

const PX = "https://images.pexels.com/photos";
const px = (id: number, w: number, h?: number) =>
  `${PX}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${h ? `&h=${h}&fit=crop` : ""}`;

// Semua ID di bawah terverifikasi subjek laundry dari halaman Pexels-nya
// (lihat docs/UNIQUE_TEMPLATE_SPEC.md). Jangan ganti dengan ID tak dikenal
// tanpa verifikasi via `bun scripts/verify-template-images.ts`.
export const IMG = {
  hero: px(8774556, 900, 1125),
  about: px(8483658, 800),
  service1: px(8774517, 600, 400),
  service2: px(9462667, 600, 400),
  service3: px(9462648, 600, 400),
  service4: px(7703662, 600, 400),
  service5: px(8774647, 600, 400),
  service6: px(9462733, 600, 400),
  oval: px(8774657, 500, 700),
  arch: px(14361266, 700, 900),
  testiBg: px(4700611, 1600),
  gal1: px(4700420, 600, 600),
  gal2: px(16674237, 600, 600),
  gal3: px(5591581, 600, 600),
  gal4: px(18502252, 600, 600),
  art1: px(8483658, 600, 380),
  art2: px(8774517, 600, 380),
  art3: px(4700420, 600, 380),
  art4: px(7703662, 600, 380),
};

/* ------------------------------------------------------------------ */
/* Headers — 5 varian unik, semua html kustom bertoken                  */
/* ------------------------------------------------------------------ */


export const BODY = "font-family:var(--font-body),sans-serif;";
export const HEADING = "font-family:var(--font-heading),serif;";
export const SCRIPT = "font-family:var(--font-accent),cursive;";
