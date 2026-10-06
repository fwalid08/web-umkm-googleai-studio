import type { ConfigField } from "../../template-types";

export const BRAND = "Toko Kita";
export const NS = "marketplace-hybrid";
export const vid = (name: string) => `${NS}:${name}`;

const LABELS: Record<string, string> = {
  badge: "Lencana", eyebrow: "Eyebrow", headline: "Headline", subheadline: "Subheadline",
  title: "Judul", subtitle: "Subjudul", content: "Konten", quote: "Kutipan", image: "Foto",
  images: "Daftar Foto", logoUrl: "Logo URL", siteTitle: "Nama Toko", tagline: "Tagline",
  navItems: "Menu Navigasi", label: "Label", url: "URL", cta_text: "Teks Tombol", cta_link: "Link Tombol",
  ctaText: "Teks Tombol", ctaLink: "Link Tombol", showCta: "Tampilkan Tombol", sticky: "Header menempel",
  menuPosition: "Posisi Menu", contentWidth: "Lebar Konten", topbarText: "Teks Topbar",
  text: "Teks Copyright", showNav: "Tampilkan navigasi", showSocial: "Tampilkan sosmed",
  items: "Daftar Isi", name: "Nama", description: "Deskripsi", price: "Harga", icon: "Ikon",
  question: "Pertanyaan", answer: "Jawaban", address: "Alamat", phone: "Telepon", email: "Email",
  hours: "Jam Buka", button_text: "Teks Tombol", button_link: "Link Tombol", ctaTitle: "Judul CTA",
  ctaButtonText: "Teks Tombol CTA", ctaButtonLink: "Link Tombol CTA", newsletterTitle: "Judul Newsletter",
  newsletterText: "Teks Newsletter", newsletterButtonText: "Teks Tombol Newsletter",
};

function prettyLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function fieldTypeFor(key: string, value: unknown): ConfigField["type"] {
  if (typeof value === "boolean") return "switch";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "list";
  const lower = key.toLowerCase();
  if (lower.includes("image") || lower.includes("logo")) return "image";
  if (lower.includes("color")) return "color";
  if (typeof value === "string" && value.length > 120) return "textarea";
  return "text";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function inferFields(config: Record<string, unknown>, nested = false): ConfigField[] {
  return Object.entries(config)
    .filter(([key]) => !(nested && key === "id"))
    .map(([key, value]) => {
      const field: ConfigField = { key, label: prettyLabel(key), type: fieldTypeFor(key, value) };
      if (key === "menuPosition") {
        field.type = "select";
        field.options = [
          { label: "Tengah", value: "center" },
          { label: "Kiri", value: "left" },
          { label: "Kanan", value: "right" },
        ];
      }
      if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
        field.itemFields = inferFields(value[0] as Record<string, unknown>, true);
      }
      if (typeof value === "string" && value.length > 120) field.rows = 3;
      return field;
    });
}

export const NAV_ITEMS = [
  { id: "nav-beranda", label: "Beranda", url: "#beranda", isExternal: false, enabled: true },
  { id: "nav-produk", label: "Produk", url: "#produk", isExternal: false, enabled: true },
  { id: "nav-promo", label: "Promo", url: "#promo", isExternal: false, enabled: true },
  { id: "nav-testimoni", label: "Testimoni", url: "#testimoni", isExternal: false, enabled: true },
  { id: "nav-faq", label: "FAQ", url: "#faq", isExternal: false, enabled: true },
  { id: "nav-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
];

const PX = "https://images.pexels.com/photos";
const px = (id: number, w: number, h?: number) =>
  `${PX}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}${h ? `&h=${h}&fit=crop` : ""}`;

export const IMG = {
  hero: px(4481253, 1200, 600),
  hero2: px(5632387, 1200, 600),
  hero3: px(5632398, 1200, 600),
  about: px(5632397, 800, 600),
  prod1: px(46798, 600, 600),
  prod2: px(5632402, 600, 600),
  prod3: px(5632384, 600, 600),
  prod4: px(4483610, 600, 600),
  prod5: px(5632385, 600, 600),
  prod6: px(5632386, 600, 600),
};


export const BODY = "font-family:var(--font-body),sans-serif;";
export const HEADING = "font-family:var(--font-heading),sans-serif;";
export const ACCENT = "font-family:var(--font-accent),sans-serif;";
