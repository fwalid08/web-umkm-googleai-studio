import type { ConfigField } from "../../template-types";

export const TEMPLATE_ID = "retail-marketplace";
export const BRAND = "Pasar Modern";
export const vid = (name: string) => `${TEMPLATE_ID}:${name}`;

const LABELS: Record<string, string> = {
  accountLink: "Tautan Akun",
  accountLabel: "Label Akun",
  address: "Alamat Toko",
  badge: "Lencana Promo",
  cartLink: "Tautan Keranjang",
  cartLabel: "Label Keranjang",
  category: "Kategori",
  ctaLink: "Tautan Tombol",
  ctaText: "Teks Tombol",
  cta_link: "Tautan Tombol",
  cta_text: "Teks Tombol",
  description: "Deskripsi",
  email: "Email",
  headline: "Judul Utama",
  hours: "Jam Buka",
  image: "Foto",
  item: "Nama Item",
  label: "Label",
  logoUrl: "URL Logo",
  menuPosition: "Posisi Menu",
  name: "Nama",
  navItems: "Menu Navigasi",
  phone: "Telepon",
  price: "Harga",
  productLink: "Tautan Produk",
  question: "Pertanyaan",
  rating: "Rating",
  searchLabel: "Label Pencarian",
  searchLink: "Tautan Pencarian",
  searchPlaceholder: "Placeholder Pencarian",
  showCta: "Tampilkan Tombol",
  showNav: "Tampilkan Navigasi",
  showSocial: "Tampilkan Media Sosial",
  siteTitle: "Nama Toko",
  siteTitleInitial: "Inisial Toko",
  socials: "Media Sosial",
  subtitle: "Subjudul",
  text: "Teks",
  title: "Judul",
  url: "URL",
  wishlistLink: "Tautan Wishlist",
  wishlistLabel: "Label Wishlist",
};

function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function fieldType(key: string, value: unknown): ConfigField["type"] {
  if (typeof value === "boolean") return "switch";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "list";
  const normalized = key.toLowerCase();
  if (normalized.includes("image") || normalized.includes("logo")) return "image";
  if (normalized.includes("color")) return "color";
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
      const field: ConfigField = { key, label: labelFor(key), type: fieldType(key, value) };
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
  { id: "nav-promo", label: "Promo", url: "#promo", enabled: true, isExternal: false },
  { id: "nav-produk", label: "Produk", url: "#produk", enabled: true, isExternal: false },
  { id: "nav-kontak", label: "Kontak", url: "#kontak", enabled: true, isExternal: false },
];

export const HEADER_CONFIG: Record<string, unknown> = {
  logoUrl: "",
  siteTitle: BRAND,
  siteTitleInitial: "P",
  tagline: "Pilihan dekat, harga bersahabat",
  navItems: NAV_ITEMS,
  menuPosition: "center",
  ctaText: "Lihat Promo",
  ctaLink: "#promo",
  showCta: true,
  sticky: true,
  searchLabel: "Cari produk",
  searchPlaceholder: "Cari kebutuhan harianmu",
  searchLink: "#produk",
  cartLabel: "Keranjang",
  cartLink: "#produk",
  wishlistLabel: "Favorit",
  wishlistLink: "#produk",
  accountLabel: "Akun",
  accountLink: "#kontak",
};

export function footerConfig(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    siteTitle: BRAND,
    text: `© {year} ${BRAND}. Belanja lebih dekat, lebih mudah.`,
    address: "Jl. Melati No. 18, Bandung",
    phone: "0812-3456-7890",
    email: "halo@pasarmodern.id",
    showNav: true,
    navItems: NAV_ITEMS.slice(0, 4),
    showSocial: true,
    socials: [
      { label: "IG", url: "#kontak" },
      { label: "FB", url: "#kontak" },
      { label: "WA", url: "#kontak" },
    ],
    ...extra,
  };
}

const PEXELS = "https://images.pexels.com/photos";
const photo = (id: number, width: number, height = width) =>
  `${PEXELS}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}&h=${height}&fit=crop`;

export const IMAGES = {
  hero: photo(5632402, 1200, 700),
  home: photo(5632387, 900, 700),
  productOne: photo(5632388, 640),
  productTwo: photo(5632402, 640),
  productThree: photo(5632384, 640),
  productFour: photo(4483610, 640),
  productFive: photo(5632385, 640),
  productSix: photo(5632386, 640),
  team: photo(5632397, 640),
};

export const BODY = "font-family:var(--font-body),sans-serif;";
export const HEADING = "font-family:var(--font-heading),sans-serif;";
export const ACCENT = "font-family:var(--font-accent),sans-serif;";

export const ICON = {
  search: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.8 8.8c0 5.1-8.8 10.2-8.8 10.2S3.2 13.9 3.2 8.8a4.6 4.6 0 0 1 8.8-1.7 4.6 4.6 0 0 1 8.8 1.7Z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
};