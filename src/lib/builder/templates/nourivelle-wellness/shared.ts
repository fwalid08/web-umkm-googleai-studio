import type { ConfigField } from "../../template-types";

export const TEMPLATE_ID = "nourivelle-wellness";
export const BRAND = "Nourivelle";
export const vid = (name: string) => `${TEMPLATE_ID}:${name}`;

const LABELS: Record<string, string> = {
  accountLink: "Tautan Akun",
  accountLabel: "Label Akun",
  address: "Alamat",
  badge: "Lencana",
  buttonLink: "Tautan Tombol",
  buttonText: "Teks Tombol",
  category: "Kategori",
  content: "Konten",
  cta_link: "Tautan Tombol",
  cta_text: "Teks Tombol",
  description: "Deskripsi",
  email: "Email",
  headline: "Judul Utama",
  hours: "Jam Operasional",
  image: "Foto",
  label: "Label",
  logoUrl: "URL Logo",
  menuPosition: "Posisi Menu",
  name: "Nama",
  navItems: "Menu Navigasi",
  note: "Catatan",
  phone: "Telepon",
  price: "Harga",
  question: "Pertanyaan",
  rating: "Rating",
  siteTitle: "Nama Toko",
  siteTitleInitial: "Inisial Logo",
  socials: "Media Sosial",
  subtitle: "Subjudul",
  subheadline: "Deskripsi Utama",
  text: "Teks",
  title: "Judul",
  url: "URL",
};

function fieldType(key: string, value: unknown): ConfigField["type"] {
  if (typeof value === "boolean") return "switch";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "list";
  const normalized = key.toLowerCase();
  if (normalized.includes("image") || normalized.includes("logo")) return "image";
  if (typeof value === "string" && value.length > 100) return "textarea";
  return "text";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function inferFields(config: Record<string, unknown>, nested = false): ConfigField[] {
  return Object.entries(config)
    .filter(([key]) => !(nested && key === "id"))
    .map(([key, value]) => {
      const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
      const field: ConfigField = {
        key,
        label: LABELS[key] ?? spaced.charAt(0).toUpperCase() + spaced.slice(1),
        type: fieldType(key, value),
      };
      if (key === "menuPosition") {
        field.type = "select";
        field.options = [
          { label: "Tengah", value: "center" },
          { label: "Kiri", value: "left" },
          { label: "Kanan", value: "right" },
        ];
      }
      if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
        field.itemFields = inferFields(value[0], true);
      }
      if (typeof value === "string" && value.length > 100) field.rows = 3;
      return field;
    });
}

export const NAV_ITEMS = [
  { id: "nav-beranda", label: "Beranda", url: "#beranda", enabled: true, isExternal: false },
  { id: "nav-kategori", label: "Kategori", url: "#kategori", enabled: true, isExternal: false },
  { id: "nav-produk", label: "Produk", url: "#produk", enabled: true, isExternal: false },
  { id: "nav-jurnal", label: "Jurnal", url: "#jurnal", enabled: true, isExternal: false },
  { id: "nav-kontak", label: "Kontak", url: "#kontak", enabled: true, isExternal: false },
];

export const HEADER_CONFIG: Record<string, unknown> = {
  logoUrl: "",
  siteTitle: BRAND,
  siteTitleInitial: "N",
  tagline: "Ritual baik, setiap hari",
  navItems: NAV_ITEMS,
  menuPosition: "center",
  ctaText: "Jelajahi Produk",
  ctaLink: "#produk",
  showCta: true,
  sticky: true,
  searchPlaceholder: "Cari vitamin, skincare, dan lainnya",
};

export function footerConfig(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    siteTitle: BRAND,
    text: `© {year} ${BRAND}. Rawat diri dengan penuh perhatian.`,
    address: "Bandung, Jawa Barat",
    phone: "+62 812 3456 7890",
    email: "halo@nourivelle.id",
    showNav: true,
    navItems: NAV_ITEMS.slice(0, 4),
    showSocial: true,
    socials: [{ label: "IG", url: "#kontak" }, { label: "TT", url: "#kontak" }, { label: "WA", url: "#kontak" }],
    ...extra,
  };
}

const PEXELS = "https://images.pexels.com/photos";
const photo = (id: number, width: number, height = width) =>
  `${PEXELS}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;

export const IMAGES = {
  hero: photo(10042874, 1400, 820),
  wellness: photo(4857813, 1000, 800),
  productOne: photo(14029289, 700),
  productTwo: photo(29060401, 700),
  productThree: photo(7321654, 700),
  productFour: photo(17820733, 700),
  productFive: photo(13779107, 700),
  productSix: photo(8940739, 700),
  lifestyleOne: photo(6193559, 760, 900),
  lifestyleTwo: photo(7592372, 760, 900),
  lifestyleThree: photo(14133435, 760, 900),
  lifestyleFour: photo(8497995, 760, 900),
  lifestyleFive: photo(10223026, 760, 900),
};

export const BODY = "font-family:var(--font-body),sans-serif;";
export const HEADING = "font-family:var(--font-heading),sans-serif;";
export const ACCENT = "font-family:var(--font-accent),serif;";