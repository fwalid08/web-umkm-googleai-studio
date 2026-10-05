import type {
  ConfigField,
  FooterVariant,
  HeaderVariant,
  SectionTypeDefinition,
} from "../template-types";
import type { CatalogTemplate } from "./catalog";

/**
 * Emerald Laundry — template laundry unik bergaya luxury emerald.
 *
 * Kontrak §18 (UNIQUE_TEMPLATE_SPEC.md):
 * - TIDAK mewarisi `registrySections()` / `compose.ts` — semua varian
 *   dideklarasikan di file ini dengan `html` kustom + ID namespaced.
 * - Nol warna hardcoded (hanya `var(--color-*)`), nol font hardcoded
 *   (hanya `var(--font-heading/body/accent)`).
 * - List dinamis memakai blok loop `{{#items}}…{{/items}}` yang diekspan
 *   `renderVariantHtml` (lihat `behaviour-script.ts`) — bukan `{{items}}`
 *   mentah yang dulu jadi "[object Object]".
 */

const BRAND = "Emerald Laundry";
const NS = "laundry-emerald";
const vid = (name: string) => `${NS}:${name}`;

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
function inferFields(config: Record<string, unknown>, nested = false): ConfigField[] {
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

const NAV_ITEMS = [
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
const IMG = {
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

const HEADER_DEFAULT = {
  logoUrl: "",
  siteTitle: BRAND,
  tagline: "Cuci bersih, wangi, siap pakai",
  navItems: NAV_ITEMS,
  ctaText: "Pesan Sekarang",
  ctaLink: "https://wa.me/6281234567890",
  showCta: true,
  sticky: true,
  contentWidth: "6xl",
};

const NAV_STYLE =
  "display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 20px;" +
  "color:var(--color-text);font-family:var(--font-body),sans-serif;font-size:0.875rem;";

/**
 * Lencana bundar di header.
 *
 * `fg` WAJIB berupa token `--color-on-<bg>` yang cocok dengan `bg` — bukan
 * warna tetap. Kasus nyata: header "Pill Melayang" memakai accent emas
 * `#C6A15B`; bila teksnya ikut `var(--color-on-primary)` (putih, dihitung dari
 * primary hijau tua) rasionya cuma ~2.3:1 dan inisial "E" nyaris tak terlihat.
 * `--color-on-accent` selalu ≥ 4.5:1 untuk warna sRGB mana pun, jadi lencana
 * aman di latar apa pun tanpa perlu autofix per varian.
 */
function brandMark(bg: string, fg: string, size: number): string {
  return (
    `<span style="display:inline-flex;align-items:center;justify-content:center;` +
    `width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:${fg};` +
    `font-family:var(--font-heading),serif;font-weight:700;font-size:${Math.round(size * 0.42)}px;flex:none;">{{siteTitleInitial}}</span>`
  );
}

const HEADER_BASE_CONFIG = {
  ...HEADER_DEFAULT,
  siteTitleInitial: "E",
};

const HEADERS: HeaderVariant[] = [
  {
    id: vid("hdr-arch"),
    name: "Emerald Arch",
    description: "Bar terang + garis emas ganda, brand serif + CTA pill",
    layout: vid("hdr-arch"),
    configFields: inferFields(HEADER_BASE_CONFIG),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-arch"),
    maxNavDepth: 1,
    html: `<header style="background:var(--color-surface);border-bottom:3px double var(--color-accent);padding:12px 24px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;">
    <div style="display:flex;align-items:center;gap:12px;min-width:0;">
      ${brandMark("var(--color-primary)", "var(--color-on-primary)", 44)}
      <div style="min-width:0;">
        <div style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.25rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
        <div style="font-family:var(--font-accent),cursive;font-size:1rem;color:var(--color-accent-on-surface);line-height:1.2;">{{tagline}}</div>
      </div>
    </div>
    <nav style="${NAV_STYLE}">{{navItems}}</nav>
    <a href="{{ctaLink}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:12px 28px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;font-family:var(--font-body),sans-serif;white-space:nowrap;">{{ctaText}}</a>
  </div>
</header>`,
  },
  {
    id: vid("hdr-floating"),
    name: "Pill Melayang",
    description: "Bar pil mengambang dengan bayangan lembut",
    layout: vid("hdr-floating"),
    configFields: inferFields(HEADER_BASE_CONFIG),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-floating"),
    maxNavDepth: 1,
    html: `<div style="padding:12px 16px 0 16px;background:transparent;">
  <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:999px;padding:10px 12px 10px 12px;box-shadow:0 12px 32px color-mix(in srgb, var(--color-text) 18%, transparent);">
    <div style="display:flex;align-items:center;gap:10px;min-width:0;padding-left:8px;">
      ${brandMark("var(--color-accent)", "var(--color-on-accent)", 36)}
      <span style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.1rem;color:var(--color-text);white-space:nowrap;">{{siteTitle}}</span>
    </div>
    <nav style="${NAV_STYLE}">{{navItems}}</nav>
    <a href="{{ctaLink}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:10px 24px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;font-family:var(--font-body),sans-serif;white-space:nowrap;">{{ctaText}}</a>
  </div>
</div>`,
  },
  {
    id: vid("hdr-topbar"),
    name: "Topbar Promo",
    description: "Pita promo hijau tua + bar utama terang",
    layout: vid("hdr-topbar"),
    configFields: inferFields({
      ...HEADER_BASE_CONFIG,
      topbarText: "Promo: Antar-Jemput GRATIS se-Kota minggu ini",
      topbarPhone: "0812-3456-7890",
      topbarEmail: "halo@emeraldlaundry.id",
    }),
    defaultConfig: {
      ...HEADER_BASE_CONFIG,
      topbarText: "Promo: Antar-Jemput GRATIS se-Kota minggu ini",
      topbarPhone: "0812-3456-7890",
      topbarEmail: "halo@emeraldlaundry.id",
    },
    mockup: vid("hdr-topbar"),
    maxNavDepth: 1,
    html: `<header>
  <div style="background:var(--color-primary);color:var(--color-on-primary);padding:8px 24px;font-family:var(--font-body),sans-serif;font-size:0.75rem;">
    <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 16px;">
      <span style="font-weight:600;letter-spacing:0.04em;">✦ {{topbarText}}</span>
      <span style="opacity:0.9;">{{topbarPhone}} · {{topbarEmail}}</span>
    </div>
  </div>
  <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:12px 24px;">
    <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        ${brandMark("var(--color-primary)", "var(--color-on-primary)", 40)}
        <div style="min-width:0;">
          <div style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.15rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
          <div style="font-size:0.75rem;color:var(--color-text-muted);font-family:var(--font-body),sans-serif;">{{tagline}}</div>
        </div>
      </div>
      <nav style="${NAV_STYLE}">{{navItems}}</nav>
      <a href="{{ctaLink}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:12px 28px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;font-family:var(--font-body),sans-serif;white-space:nowrap;">{{ctaText}}</a>
    </div>
  </div>
</header>`,
  },
  {
    id: vid("hdr-split"),
    name: "Blok Brand",
    description: "Blok brand besar kiri dengan bingkai emas, menu kanan",
    layout: vid("hdr-split"),
    configFields: inferFields(HEADER_BASE_CONFIG),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-split"),
    maxNavDepth: 1,
    html: `<header style="background:var(--color-surface);padding:16px 24px;border-bottom:1px solid var(--color-border);">
  <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 24px;">
    <div style="display:flex;align-items:center;gap:14px;border:1px solid var(--color-accent);border-radius:var(--radius);padding:10px 18px 10px 10px;min-width:0;">
      ${brandMark("var(--color-primary)", "var(--color-on-primary)", 52)}
      <div style="min-width:0;">
        <div style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.4rem;color:var(--color-text);line-height:1.15;">{{siteTitle}}</div>
        <div style="font-family:var(--font-accent),cursive;font-size:1.05rem;color:var(--color-secondary-on-surface);line-height:1.2;">{{tagline}}</div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:16px 28px;">
      <nav style="${NAV_STYLE}">{{navItems}}</nav>
      <a href="{{ctaLink}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:12px 28px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;font-family:var(--font-body),sans-serif;white-space:nowrap;">{{ctaText}}</a>
    </div>
  </div>
</header>`,
  },
  {
    id: vid("hdr-centered"),
    name: "Brand Tengah",
    description: "Brand serif tengah + baris menu simetris di bawah",
    layout: vid("hdr-centered"),
    configFields: inferFields(HEADER_BASE_CONFIG),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-centered"),
    maxNavDepth: 1,
    html: `<header style="background:var(--color-surface);border-bottom:3px double var(--color-accent);padding:16px 24px 12px 24px;text-align:center;">
  <div style="max-width:1152px;margin:0 auto;">
    <div style="font-family:var(--font-accent),cursive;font-size:1.2rem;color:var(--color-secondary-on-surface);">{{tagline}}</div>
    <div style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.75rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 16px;margin-top:12px;">
      <nav style="${NAV_STYLE}">{{navItems}}</nav>
      <a href="{{ctaLink}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:10px 26px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;font-family:var(--font-body),sans-serif;white-space:nowrap;">{{ctaText}}</a>
    </div>
  </div>
</header>`,
  },
];

/* ------------------------------------------------------------------ */
/* Footers — 5 varian unik, semua html kustom bertoken                   */
/* ------------------------------------------------------------------ */

const FOOTER_BASE = {
  siteTitle: BRAND,
  siteTitleInitial: "E",
  logoUrl: "",
  text: `© {year} ${BRAND}. Cuci bersih, wangi, siap pakai.`,
  navItems: NAV_ITEMS.slice(0, 4),
  showNav: true,
  showSocial: true,
  poweredText: "Powered by Rabasha",
  poweredUrl: "https://rabasha.web.id",
  showPowered: true,
};
const BODY = "font-family:var(--font-body),sans-serif;";
const HEADING = "font-family:var(--font-heading),serif;";
const SCRIPT = "font-family:var(--font-accent),cursive;";

function poweredBar(color: string): string {
  return `{{#if showPowered}}<div style="text-align:center;margin-top:16px;font-size:0.75rem;${BODY}"><a href="{{poweredUrl}}" style="color:${color};text-decoration:none;opacity:0.7;">{{poweredText}}</a></div>{{/if}}`;
}

const FTR_COLUMNS_CONFIG = {
  ...FOOTER_BASE,
  tagline: "Cuci bersih, wangi, siap pakai",
  menuTitle: "Jelajahi",
  contactTitle: "Hubungi Kami",
  address: "Jl. Merdeka No. 45, Yogyakarta",
  phone: "0812-3456-7890",
  email: "halo@emeraldlaundry.id",
  whatsappText: "Chat WhatsApp",
  whatsappLink: "https://wa.me/6281234567890?text=Halo%20Emerald%20Laundry",
};

const FTR_CENTERED_CONFIG = {
  ...FOOTER_BASE,
  strapline: "Terima kasih telah mempercayakan cucian Anda",
  socials: [{ label: "IG" }, { label: "FB" }, { label: "WA" }],
};

const FTR_NEWS_CONFIG = {
  ...FOOTER_BASE,
  kicker: "Penawaran spesial",
  newsletterTitle: "Dapat kabar promo tiap pekan",
  newsletterText: "Diskon cuci bedcover 20% untuk 50 pendaftar pertama bulan ini.",
  newsletterButtonText: "Klaim via WhatsApp",
  newsletterButtonLink: "https://wa.me/6281234567890?text=Halo%20Emerald%20Laundry",
};

const FTR_CONTACT_CONFIG = {
  ...FOOTER_BASE,
  panelVisitTitle: "Kunjungi Kami",
  panelContactTitle: "Hubungi Kami",
  address: "Jl. Merdeka No. 45, Yogyakarta",
  phone: "0812-3456-7890",
  email: "halo@emeraldlaundry.id",
  hours: "Senin–Sabtu 08.00–20.00 · Minggu 09.00–14.00",
};

const FOOTERS: FooterVariant[] = [
  {
    id: vid("ftr-columns"),
    name: "Kolom Emerald",
    description: "Band hijau tua 3 kolom + garis emas",
    layout: vid("ftr-columns"),
    configFields: inferFields(FTR_COLUMNS_CONFIG),
    defaultConfig: { ...FTR_COLUMNS_CONFIG },
    mockup: vid("ftr-columns"),
    html: `<footer style="background:var(--color-primary);color:var(--color-on-primary);padding:56px 24px 24px 24px;">
  <div style="max-width:1152px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:32px;">
      <div>
        <div style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.5rem;line-height:1.2;">{{siteTitle}}</div>
        <div style="font-family:var(--font-accent),cursive;font-size:1.1rem;color:var(--color-accent-on-primary);margin:4px 0 12px 0;">{{tagline}}</div>
        <p style="font-size:0.875rem;line-height:1.6;opacity:0.85;font-family:var(--font-body),sans-serif;">{{address}}</p>
      </div>
      <div>
        <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;opacity:0.7;font-family:var(--font-body),sans-serif;">{{menuTitle}}</div>
        <nav style="display:flex;flex-direction:column;gap:8px;font-size:0.9rem;font-family:var(--font-body),sans-serif;color:var(--color-on-primary);">{{navItems}}</nav>
      </div>
      <div>
        <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;opacity:0.7;font-family:var(--font-body),sans-serif;">{{contactTitle}}</div>
        <p style="font-size:0.9rem;line-height:1.8;font-family:var(--font-body),sans-serif;">{{phone}}<br />{{email}}</p>
        <a href="{{whatsappLink}}" style="display:inline-block;margin-top:12px;background:var(--color-accent);color:var(--color-primary-on-accent);padding:10px 24px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;font-family:var(--font-body),sans-serif;">{{whatsappText}}</a>
      </div>
    </div>
    <div style="border-top:1px solid var(--color-accent);margin-top:40px;padding-top:20px;text-align:center;font-size:0.8rem;opacity:0.75;font-family:var(--font-body),sans-serif;">{{text}}</div>
    ${poweredBar("inherit")}
  </div>
</footer>`,
  },
  {
    id: vid("ftr-centered"),
    name: "Brand Tengah",
    description: "Nama besar tengah + menu simetris + sosmed",
    layout: vid("ftr-centered"),
    configFields: inferFields(FTR_CENTERED_CONFIG),
    defaultConfig: { ...FTR_CENTERED_CONFIG },
    mockup: vid("ftr-centered"),
    html: `<footer style="background:var(--color-surface);border-top:3px double var(--color-accent);padding:48px 24px 24px 24px;text-align:center;">
  <div style="max-width:1152px;margin:0 auto;">
    <div style="font-family:var(--font-accent),cursive;font-size:1.25rem;color:var(--color-secondary-on-surface);">{{strapline}}</div>
    <div style="font-family:var(--font-heading),serif;font-weight:700;font-size:2rem;color:var(--color-text);line-height:1.2;margin:4px 0 16px 0;">{{siteTitle}}</div>
    <nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 24px;font-size:0.9rem;color:var(--color-text);font-family:var(--font-body),sans-serif;">{{navItems}}</nav>
    <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px;">
      {{#socials}}<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;border:1px solid var(--color-border);color:var(--color-text);font-size:0.7rem;font-weight:700;font-family:var(--font-body),sans-serif;">{{label}}</span>{{/socials}}
    </div>
    <p style="font-size:0.8rem;color:var(--color-text-muted);margin-top:20px;font-family:var(--font-body),sans-serif;">{{text}}</p>
    ${poweredBar("var(--color-text-muted)")}
  </div>
</footer>`,
},
  {
    id: vid("ftr-mini"),
    name: "Mini",
    description: "Satu baris ringkas: brand + copyright",
    layout: vid("ftr-mini"),
    configFields: inferFields(FOOTER_BASE),
    defaultConfig: { ...FOOTER_BASE },
    mockup: vid("ftr-mini"),
    html: `<footer style="background:var(--color-surface);border-top:1px solid var(--color-border);padding:16px 24px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;">
    <span style="font-family:var(--font-heading),serif;font-weight:700;color:var(--color-text);">✦ {{siteTitle}}</span>
    <span style="font-size:0.8rem;color:var(--color-text-muted);font-family:var(--font-body),sans-serif;">{{text}}</span>
  </div>
  ${poweredBar("var(--color-text-muted)")}
</footer>`,
  },
  {
    id: vid("ftr-news"),
    name: "Pita Promo",
    description: "Kartu promo terang + baris copyright hijau tua",
    layout: vid("ftr-news"),
    configFields: inferFields(FTR_NEWS_CONFIG),
    defaultConfig: { ...FTR_NEWS_CONFIG },
    mockup: vid("ftr-news"),
    html: `<footer style="background:var(--color-primary);color:var(--color-on-primary);padding:40px 24px 24px 24px;">
  <div style="max-width:1152px;margin:0 auto;">
    <div style="background:var(--color-surface);color:var(--color-text);border-radius:var(--radius);padding:28px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 24px;">
      <div style="min-width:min(100%,280px);flex:1;">
        <div style="font-family:var(--font-accent),cursive;font-size:1.15rem;color:var(--color-secondary-on-surface);">{{kicker}}</div>
        <div style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.4rem;line-height:1.3;">{{newsletterTitle}}</div>
        <p style="font-size:0.9rem;color:var(--color-text-muted);margin-top:6px;font-family:var(--font-body),sans-serif;">{{newsletterText}}</p>
      </div>
      <a href="{{newsletterButtonLink}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:14px 30px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.95rem;font-family:var(--font-body),sans-serif;white-space:nowrap;">{{newsletterButtonText}}</a>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;margin-top:24px;">
      <nav style="display:flex;flex-wrap:wrap;gap:8px 20px;font-size:0.875rem;font-family:var(--font-body),sans-serif;color:var(--color-on-primary);">{{navItems}}</nav>
      <span style="font-size:0.8rem;opacity:0.75;font-family:var(--font-body),sans-serif;">{{text}}</span>
    </div>
    ${poweredBar("inherit")}
  </div>
</footer>`,
  },
  {
    id: vid("ftr-contact"),
    name: "Kontak Fokus",
    description: "Alamat + jam + kontak dalam panel terang di atas band gelap",
    layout: vid("ftr-contact"),
    configFields: inferFields(FTR_CONTACT_CONFIG),
    defaultConfig: { ...FTR_CONTACT_CONFIG },
    mockup: vid("ftr-contact"),
    html: `<footer style="background:var(--color-primary);color:var(--color-on-primary);padding:48px 24px 24px 24px;">
  <div style="max-width:1152px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:20px;">
      <div style="background:var(--color-surface);color:var(--color-text);border-radius:var(--radius);padding:24px;">
        <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-secondary-on-surface);margin-bottom:8px;font-family:var(--font-body),sans-serif;">{{panelVisitTitle}}</div>
        <p style="font-size:0.95rem;line-height:1.6;font-family:var(--font-body),sans-serif;">{{address}}</p>
        <p style="font-size:0.85rem;color:var(--color-text-muted);margin-top:8px;font-family:var(--font-body),sans-serif;">{{hours}}</p>
      </div>
      <div style="background:var(--color-surface);color:var(--color-text);border-radius:var(--radius);padding:24px;">
        <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-secondary-on-surface);margin-bottom:8px;font-family:var(--font-body),sans-serif;">{{panelContactTitle}}</div>
        <p style="font-size:0.95rem;line-height:1.8;font-family:var(--font-body),sans-serif;">{{phone}}<br />{{email}}</p>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;margin-top:28px;padding-top:20px;border-top:1px solid var(--color-accent);">
      <span style="font-family:var(--font-heading),serif;font-weight:700;">{{siteTitle}}</span>
      <span style="font-size:0.8rem;opacity:0.75;font-family:var(--font-body),sans-serif;">{{text}}</span>
    </div>
    ${poweredBar("inherit")}
  </div>
</footer>`,
  },
];

function eyebrow(text = "{{eyebrow}}", color = "var(--color-secondary-on-surface)"): string {
  return `<div style="${SCRIPT}font-size:1.2rem;color:${color};margin-bottom:8px;">${text}</div>`;
}

function sectionShell(inner: string, bg: string, pad = "72px 24px"): string {
  return `<section style="background:${bg};padding:${pad};"><div style="max-width:1152px;margin:0 auto;">${inner}</div></section>`;
}

interface VariantSpec {
  id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  html: string;
}

function toVariant(spec: VariantSpec) {
  return {
    id: spec.id,
    name: spec.name,
    description: spec.description,
    layout: spec.id,
    configFields: inferFields(spec.config),
    defaultConfig: { ...spec.config },
    mockup: spec.id,
    html: spec.html,
  };
}

/* ---- hero ---- */

const HERO_CONFIG = {
  badge: "Antar-Jemput Gratis se-Kota",
  eyebrow: "Laundry premium kesayangan keluarga",
  headline: "Cuci Bersih, Wangi, Siap Pakai",
  subheadline:
    "Layanan laundry premium dengan deterjen berkualitas dan proses modern. Pesan dari rumah, kami jemput dan antar kembali — wangi seperti baru.",
  cta_text: "Pesan Sekarang",
  cta_link: "#layanan",
  cta2_text: "Lihat Layanan",
  cta2_link: "#layanan",
  phone: "0812-3456-7890",
  image: IMG.hero,
  rating_text: "4.9 dari 2.400+ ulasan pelanggan",
};

const HERO_HTML = `<section style="background:var(--color-primary);color:var(--color-on-primary);padding:72px 24px 80px 24px;position:relative;overflow:hidden;">
  <div style="position:absolute;top:-120px;left:-120px;width:340px;height:340px;border-radius:50%;border:2px solid var(--color-accent);opacity:0.35;"></div>
  <div style="position:absolute;bottom:-160px;right:-100px;width:380px;height:380px;border-radius:50%;background:var(--color-accent);opacity:0.12;"></div>
  <div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:48px;align-items:center;position:relative;">
    <div>
      <div style="display:inline-block;border:1px solid var(--color-accent);color:var(--color-accent-on-primary);padding:8px 18px;border-radius:999px;font-size:0.8rem;font-weight:600;letter-spacing:0.06em;margin-bottom:20px;${BODY}">✦ {{badge}}</div>
      ${eyebrow("Laundry premium kesayangan keluarga", "var(--color-accent-on-primary)")}
      <h1 style="${HEADING}font-size:clamp(2.2rem,5vw,3.4rem);font-weight:700;line-height:1.15;margin:0 0 16px 0;">{{headline}}</h1>
      <p style="font-size:1.05rem;line-height:1.7;opacity:0.9;margin:0 0 28px 0;${BODY}">{{subheadline}}</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
        <a href="{{cta_link}}" style="display:inline-block;background:var(--color-accent);color:var(--color-primary-on-accent);padding:15px 34px;border-radius:999px;font-weight:700;text-decoration:none;font-size:1rem;${BODY}">{{cta_text}}</a>
        <a href="{{cta2_link}}" style="display:inline-block;border:1px solid var(--color-on-primary);color:var(--color-on-primary);padding:14px 30px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.95rem;${BODY}">{{cta2_text}}</a>
      </div>
      <p style="font-size:0.85rem;margin:20px 0 0 0;opacity:0.8;${BODY}">★ {{rating_text}} · ☎ {{phone}}</p>
    </div>
    <div style="position:relative;">
      <div style="border-radius:190px 190px var(--radius) var(--radius);overflow:hidden;border:3px solid var(--color-accent);">
        <img src="{{image}}" alt="Laundry premium" style="width:100%;height:auto;display:block;aspect-ratio:4/5;object-fit:cover;" />
      </div>
    </div>
  </div>
</section>`;

/* ---- features (welcome dividers) ---- */

const FEATURES_CONFIG = {
  eyebrow: "Selamat datang di",
  title: "Emerald Laundry",
  subtitle: "Standar premium untuk cucian harian Anda — bersih, wangi, tepat waktu.",
  items: [
    { icon: "🚚", title: "Antar-Jemput Gratis", description: "Kami jemput dan antar cucian Anda tanpa biaya tambahan." },
    { icon: "✦", title: "Deterjen Premium", description: "Formula aman untuk kain, lembut untuk kulit, wangi tahan lama." },
    { icon: "⚡", title: "Same-Day Service", description: "Pagi dijemput, sore sudah rapi kembali di lemari Anda." },
  ],
};

const FEATURES_HTML = sectionShell(
  `<div style="text-align:center;margin-bottom:40px;">${eyebrow("Selamat datang di", "var(--color-secondary-on-background)")}<h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0;">{{title}}</h2><p style="${BODY}font-size:1rem;color:var(--color-text-muted);margin:12px auto 0 auto;max-width:640px;line-height:1.6;">{{subtitle}}</p></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:0;">
    {{#items}}<div style="text-align:center;padding:28px 20px;border-left:1px solid var(--color-border);">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:var(--color-surface);border:1px solid var(--color-accent);font-size:1.5rem;margin-bottom:14px;">{{icon}}</div>
      <div style="${HEADING}font-weight:700;font-size:1.05rem;color:var(--color-text);">{{title}}</div>
      <p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);line-height:1.6;margin:8px 0 0 0;">{{description}}</p>
    </div>{{/items}}
  </div>`,
  "var(--color-background)",
);

/* ---- about (luxury split circle) ---- */

const ABOUT_CONFIG = {
  eyebrow: "Cerita kami",
  title: "Rapi, Wangi, Seperti Baru",
  content:
    "Berdiri sejak 2015, Emerald Laundry merawat setiap helai dengan mesin modern dan deterjen ramah lingkungan. Dari kemeja kerja hingga bedcover hotel — semua melewati quality control sebelum kembali ke tangan Anda.",
  quote: "Cucian kembali selalu wangi dan lipatannya rapi. Langganan 3 tahun!",
  quote_name: "Ibu Sari — Pelanggan",
  image: IMG.about,
  badge_text: "10+ Tahun",
  cta_text: "Kenali Layanan Kami",
  cta_link: "#layanan",
};

const ABOUT_HTML = sectionShell(
  `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:48px;align-items:center;">
    <div style="position:relative;text-align:center;">
      <div style="display:inline-block;border-radius:50%;overflow:hidden;border:3px solid var(--color-accent);width:min(100%,340px);aspect-ratio:1/1;">
        <img src="{{image}}" alt="Tentang kami" style="width:100%;height:100%;object-fit:cover;display:block;" />
      </div>
      <div style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);border:2px solid var(--color-accent);border-radius:999px;padding:10px 22px;font-weight:700;margin-top:-24px;position:relative;${BODY}">{{badge_text}} Pengalaman</div>
    </div>
    <div>
      ${eyebrow("Rapi, Wangi, Seperti Baru", "var(--color-secondary-on-background)")}
      <h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0 0 16px 0;line-height:1.25;">{{title}}</h2>
      <p style="${BODY}font-size:1rem;color:var(--color-text-muted);line-height:1.7;margin:0 0 20px 0;">{{content}}</p>
      <div style="border-left:3px solid var(--color-accent);background:var(--color-surface);border-radius:0 var(--radius) var(--radius) 0;padding:16px 20px;margin-bottom:24px;">
        <p style="${BODY}font-size:0.95rem;font-style:italic;color:var(--color-text);line-height:1.6;margin:0;">“{{quote}}”</p>
        <p style="${BODY}font-size:0.8rem;color:var(--color-text-muted);margin:8px 0 0 0;">— {{quote_name}}</p>
      </div>
      <a href="{{cta_link}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:14px 32px;border-radius:999px;font-weight:600;text-decoration:none;${BODY}">{{cta_text}}</a>
    </div>
  </div>`,
  "var(--color-background)",
);

/* ---- pricing (service cards luxe) ---- */

const PRICING_CONFIG = {
  eyebrow: "Layanan kami",
  title: "Pilih Perawatan Cucian Anda",
  subtitle: "Harga transparan per kilo — tanpa biaya tersembunyi.",
  cta_link: "#kontak",
  items: [
    { label: "Premium", image: IMG.service1, name: "Cuci Kering", description: "Cuci + kering + lipat rapi, wangi premium.", price: "Rp 8.000/kg", cta_text: "Pesan" },
    { label: "Premium", image: IMG.service2, name: "Cuci Setrika", description: "Cuci + setrika uap, siap pakai langsung.", price: "Rp 10.000/kg", cta_text: "Pesan" },
    { label: "Premium", image: IMG.service3, name: "Setrika Saja", description: "Setrika halus untuk pakaian kesayangan.", price: "Rp 5.000/kg", cta_text: "Pesan" },
    { label: "Premium", image: IMG.service4, name: "Kiloan Harian", description: "Solusi cucian rutin keluarga, jemput berkala.", price: "Rp 7.000/kg", cta_text: "Pesan" },
    { label: "Premium", image: IMG.service5, name: "Express 3 Jam", description: "Darurat rapat atau acara? Selesai 3 jam.", price: "Rp 15.000/kg", cta_text: "Pesan" },
    { label: "Premium", image: IMG.service6, name: "Bedcover & Hotel", description: "Sprei, bedcover, handuk, dan gordyn besar.", price: "Rp 25.000/kg", cta_text: "Pesan" },
  ],
};

const PRICING_HTML = sectionShell(
  `<div style="text-align:center;margin-bottom:40px;">${eyebrow("Layanan kami", "var(--color-secondary-on-background)")}<h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0;">{{title}}</h2><p style="${BODY}font-size:1rem;color:var(--color-text-muted);margin:12px 0 0 0;">{{subtitle}}</p></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:24px;">
    {{#items}}<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);overflow:hidden;">
      <img src="{{image}}" alt="{{name}}" style="width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;display:block;" />
      <div style="padding:20px;">
        <div style="${SCRIPT}font-size:1rem;color:var(--color-secondary-on-surface);">{{label}}</div>
        <div style="${HEADING}font-weight:700;font-size:1.15rem;color:var(--color-text);margin:2px 0 6px 0;">{{name}}</div>
        <p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);line-height:1.6;margin:0 0 12px 0;">{{description}}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <span style="${BODY}font-weight:700;font-size:1rem;color:var(--color-primary-on-surface);">{{price}}</span>
          <a href="{{cta_link}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:10px 22px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.85rem;${BODY}">{{cta_text}}</a>
        </div>
      </div>
    </div>{{/items}}
  </div>`,
  "var(--color-background)",
);

/* ---- stats-band (comfort band oval) ---- */

const STATS_CONFIG = {
  eyebrow: "Emerald Laundry",
  title: "Kenyamanan Bertemu Kemewahan",
  subtitle: "Ribuan kilo cucian dipercayakan kepada kami setiap bulan — dengan tingkat kepuasan nyaris sempurna.",
  image: IMG.oval,
  side_text: "Nikmati layanan laundry profesional dengan nyaman, dari rumah Anda.",
  stats: [
    { value: "500+", label: "Pelanggan Puas" },
    { value: "12 ton", label: "Cucian / Bulan" },
    { value: "10+", label: "Tahun Pengalaman" },
    { value: "98%", label: "Tingkat Kepuasan" },
  ],
};

const STATS_HTML = `<section style="background:var(--color-background);padding:40px 24px;">
  <div style="max-width:1152px;margin:0 auto;background:var(--color-primary);color:var(--color-on-primary);border-radius:calc(var(--radius) * 1.5);padding:56px 40px;">
    <div style="text-align:center;margin-bottom:36px;">
      <div style="${SCRIPT}font-size:1.2rem;color:var(--color-accent-on-primary);">{{eyebrow}}</div>
      <h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;margin:0;">{{title}}</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:32px;align-items:center;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
        {{#stats}}<div style="text-align:center;">
          <div style="${BODY}font-size:2rem;font-weight:700;">{{value}}</div>
          <div style="${BODY}font-size:0.8rem;opacity:0.8;">{{label}}</div>
        </div>{{/stats}}
      </div>
      <div style="border-radius:120px;overflow:hidden;border:3px solid var(--color-accent);max-width:260px;margin:0 auto;width:100%;">
        <img src="{{image}}" alt="Laundry premium" style="width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;display:block;" />
      </div>
      <div style="text-align:center;">
        <p style="${BODY}font-size:1rem;line-height:1.7;opacity:0.9;margin:0 0 8px 0;">{{subtitle}}</p>
        <p style="${SCRIPT}font-size:1.25rem;color:var(--color-accent-on-primary);margin:0;">{{side_text}}</p>
      </div>
    </div>
  </div>
</section>`;

/* ---- about 2 (process arch) ---- */

const PROCESS_CONFIG = {
  eyebrow: "Proses higienis",
  title: "Bisa Pantau Tiap Tahapnya",
  content:
    "Setiap kantong cucian diberi label, disortir berdasar warna dan bahan, dicuci terpisah, lalu melewati quality control dua kali. Anda menerima notifikasi WhatsApp di setiap tahap — transparan dari jemput sampai antar.",
  image: IMG.arch,
  cta_text: "Mulai Pesanan Pertama",
  cta_link: "#cara-pesan",
  points: [
    { no: "01", title: "Sortir & Label", description: "Dipisah per warna, bahan, dan tingkat noda." },
    { no: "02", title: "Cuci Terpisah", description: "Mesin dan deterjen disesuaikan tiap kategori." },
    { no: "03", title: "QC Dua Kali", description: "Diperiksa sebelum dan sesudah pengemasan." },
  ],
};

const PROCESS_HTML = sectionShell(
  `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:48px;align-items:center;">
    <div style="text-align:center;order:2;">
      <div style="display:inline-block;border-radius:160px 160px var(--radius) var(--radius);overflow:hidden;border:3px solid var(--color-accent);width:min(100%,320px);">
        <img src="{{image}}" alt="Proses laundry" style="width:100%;height:auto;aspect-ratio:3/4;object-fit:cover;display:block;" />
      </div>
    </div>
    <div style="order:1;">
      ${eyebrow("Panduan mudah", "var(--color-secondary-on-surface)")}
      <h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0 0 16px 0;line-height:1.25;">{{title}}</h2>
      <p style="${BODY}font-size:1rem;color:var(--color-text-muted);line-height:1.7;margin:0 0 24px 0;">{{content}}</p>
      <div style="display:grid;gap:14px;margin-bottom:28px;">
        {{#points}}<div style="display:flex;gap:14px;align-items:flex-start;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);padding:16px 18px;">
          <span style="${HEADING}font-weight:700;color:var(--color-secondary-on-surface);font-size:1.1rem;">{{no}}</span>
          <div><div style="${BODY}font-weight:700;color:var(--color-text);">{{title}}</div>
          <p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);margin:4px 0 0 0;line-height:1.6;">{{description}}</p></div>
        </div>{{/points}}
      </div>
      <a href="{{cta_link}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:14px 32px;border-radius:999px;font-weight:600;text-decoration:none;${BODY}">{{cta_text}}</a>
    </div>
  </div>`,
  "var(--color-surface)",
);

/* ---- faq ---- */

const FAQ_CONFIG = {
  eyebrow: "Butuh jawaban cepat?",
  title: "Pertanyaan Umum",
  items: [
    { question: "Bagaimana cara memesan?", answer: "Chat WhatsApp atau isi form kontak — kurir kami menjemput cucian di jam yang Anda pilih.", open: "open" },
    { question: "Berapa lama prosesnya?", answer: "Reguler 1–2 hari, same-day untuk area kota, express selesai dalam 3 jam.", open: "" },
    { question: "Apakah ada garansi?", answer: "Ya — bila hasil kurang memuaskan, kami cuci ulang gratis tanpa bertanya.", open: "" },
    { question: "Bagaimana pembayaran?", answer: "Transfer bank, e-wallet, atau tunai saat antar. Nota digital selalu dikirim.", open: "" },
    { question: "Apakah menerima bedcover dan boneka?", answer: "Menerima — bedcover, selimut, gordyn, boneka, hingga sepatu dan tas.", open: "" },
  ],
};

const FAQ_HTML = sectionShell(
  `<div style="max-width:768px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:32px;">${eyebrow("Butuh jawaban cepat?", "var(--color-secondary-on-background)")}<h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0;">{{title}}</h2></div>
    <div style="display:grid;gap:12px;">
      {{#items}}<details {{open}} style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);padding:18px 20px;">
        <summary style="${BODY}font-weight:700;color:var(--color-text);cursor:pointer;font-size:0.95rem;">{{question}}</summary>
        <p style="${BODY}font-size:0.9rem;color:var(--color-text-muted);line-height:1.7;margin:12px 0 0 0;">{{answer}}</p>
      </details>{{/items}}
    </div>
  </div>`,
  "var(--color-background)",
);

/* ---- testimonials ---- */

const TESTI_CONFIG = {
  eyebrow: "Kata mereka",
  overlayTitle: "Testimoni",
  title: "Pengalaman Nyata Pelanggan Kami",
  bg_image: IMG.testiBg,
  items: [
    { name: "Ibu Sari", text: "Setrikaannya rapi banget, kemeja suami seperti baru. Kurirnya juga tepat waktu.", rating: 5, stars: "★★★★★" },
    { name: "Pak Joko", text: "Langganan kiloan 2 tahun. Bedcover besar pun wanginya tahan berminggu-minggu.", rating: 5, stars: "★★★★★" },
    { name: "Mbak Rina", text: "Express 3 jam benar-benar nolong sebelum kondangan. Recommended!", rating: 4, stars: "★★★★☆" },
  ],
};

const TESTI_HTML = `<section style="padding:0 0 72px 0;background:var(--color-background);">
  <div style="position:relative;padding:88px 24px;overflow:hidden;background:var(--color-primary);">
    <img src="{{bg_image}}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.25;" />
    <div style="position:relative;text-align:center;">
      <div style="${HEADING}font-size:clamp(2rem,5vw,3rem);font-weight:700;color:var(--color-on-primary);">{{overlayTitle}}</div>
      <div style="${SCRIPT}font-size:1.3rem;color:var(--color-accent-on-primary);">{{eyebrow}}</div>
    </div>
  </div>
  <div style="max-width:1152px;margin:0 auto;padding:0 24px;">
    <h2 style="${HEADING}font-size:clamp(1.5rem,3.5vw,2rem);font-weight:700;color:var(--color-text);margin:40px 0 24px 0;text-align:center;">{{title}}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:20px;">
      {{#items}}<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);padding:24px;">
        <div style="color:var(--color-secondary-on-surface);letter-spacing:0.15em;margin-bottom:4px;" aria-hidden="true">{{stars}}</div>
        <div style="${BODY}font-size:0.8rem;font-weight:700;color:var(--color-primary-on-surface);margin-bottom:12px;">{{rating}} dari 5</div>
        <p style="${BODY}font-size:0.9rem;color:var(--color-text);line-height:1.7;margin:0 0 14px 0;">“{{text}}”</p>
        <div style="${BODY}font-weight:700;font-size:0.9rem;color:var(--color-text);">— {{name}}</div>
      </div>{{/items}}
    </div>
  </div>
</section>`;

/* ---- steps ---- */

const STEPS_CONFIG = {
  eyebrow: "Panduan mudah",
  title: "Cara Pesan Laundry",
  subtitle: "Tiga langkah, cucian beres tanpa keluar rumah.",
  items: [
    { no: "1", title: "Hubungi Kami", description: "Chat WhatsApp, sebutkan jenis dan perkiraan berat cucian." },
    { no: "2", title: "Kami Jemput", description: "Kurir datang sesuai jadwal, cucian ditimbang transparan." },
    { no: "3", title: "Terima Rapi", description: "Diberi kabar tiap tahap, diantar wangi dan siap pakai." },
  ],
};

const STEPS_HTML = `<section style="background:var(--color-background);padding:0 24px 72px 24px;">
  <div style="max-width:1152px;margin:0 auto;background:var(--color-primary);color:var(--color-on-primary);border-radius:calc(var(--radius) * 1.5);padding:56px 40px;text-align:center;">
    <div style="${SCRIPT}font-size:1.2rem;color:var(--color-accent-on-primary);">{{eyebrow}}</div>
    <h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;margin:0 0 8px 0;">{{title}}</h2>
    <p style="${BODY}font-size:0.95rem;opacity:0.85;margin:0 0 32px 0;">{{subtitle}}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:20px;text-align:left;">
      {{#items}}<div style="background:var(--color-surface);color:var(--color-text);border-radius:var(--radius);padding:24px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--color-accent);color:var(--color-primary-on-accent);font-weight:700;font-size:1.1rem;margin-bottom:12px;${BODY}">{{no}}</span>
        <div style="${BODY}font-weight:700;font-size:1.05rem;margin-bottom:6px;">{{title}}</div>
        <p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);line-height:1.6;margin:0;">{{description}}</p>
      </div>{{/items}}
    </div>
  </div>
</section>`;

/* ---- gallery ---- */

const GALLERY_CONFIG = {
  eyebrow: "Galeri",
  title: "Hasil Kerja Kami",
  images: [{ image: IMG.gal1 }, { image: IMG.gal2 }, { image: IMG.gal3 }, { image: IMG.gal4 }],
};

const GALLERY_HTML = sectionShell(
  `<div style="text-align:center;margin-bottom:32px;">${eyebrow("Galeri", "var(--color-secondary-on-background)")}<h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0;">{{title}}</h2></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:16px;">
    {{#images}}<div style="border-radius:var(--radius);overflow:hidden;border:1px solid var(--color-border);"><img src="{{image}}" alt="Hasil laundry" style="width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;display:block;" /></div>{{/images}}
  </div>`,
  "var(--color-background)",
);

/* ---- articles ---- */

const ARTICLES_CONFIG = {
  eyebrow: "Tips & trik",
  title: "Artikel Terbaru",
  readMore: "Baca selengkapnya →",
  items: [
    { image: IMG.art1, title: "5 Tips Merawat Pakaian Putih", excerpt: "Pakaian putih menguning? Ini cara mencuci dan menjemur yang benar.", url: "#" },
    { image: IMG.art2, title: "Atasi Noda Membandel", excerpt: "Noda kopi, tinta, dan minyak — kenali penangan pertama yang tepat.", url: "#" },
    { image: IMG.art3, title: "Cuci Kering vs Cuci Biasa", excerpt: "Kapan pakaian butuh dry clean? Panduan bahan dan label perawatan.", url: "#" },
    { image: IMG.art4, title: "Seberapa Sering Cuci Sepatu?", excerpt: "Jadwal ideal mencuci sneakers, sepatu kulit, dan sepatu olahraga.", url: "#" },
  ],
};

const ARTICLES_HTML = sectionShell(
  `<div style="margin-bottom:32px;">${eyebrow("Tips & trik", "var(--color-secondary-on-surface)")}<h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0;">{{title}}</h2></div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:20px;">
    {{#items}}<a href="{{url}}" style="display:block;text-decoration:none;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);overflow:hidden;">
      <img src="{{image}}" alt="{{title}}" style="width:100%;height:auto;aspect-ratio:16/10;object-fit:cover;display:block;" />
      <div style="padding:18px;">
        <div style="${HEADING}font-weight:700;font-size:1rem;color:var(--color-text);line-height:1.4;">{{title}}</div>
        <p style="${BODY}font-size:0.85rem;color:var(--color-text-muted);line-height:1.6;margin:8px 0 0 0;">{{excerpt}}</p>
        <span style="${BODY}font-size:0.85rem;font-weight:700;color:var(--color-primary-on-surface);">{{readMore}}</span>
      </div>
    </a>{{/items}}
  </div>`,
  "var(--color-surface)",
);

/* ---- location ---- */

const LOCATION_CONFIG = {
  eyebrow: "Mampir yuk",
  title: "Lokasi & Jam Buka",
  address: "Jl. Merdeka No. 45, Yogyakarta",
  hours: "Senin–Sabtu 08.00–20.00 · Minggu 09.00–14.00",
  note: "Parkir luas, drop-off kilat di depan outlet. Tersedia antar-jemput radius 8 km.",
  button_text: "Chat via WhatsApp",
  button_link: "https://wa.me/6281234567890",
  panelTitle: "Kenapa mampir langsung?",
  highlights: [
    { highlight: "Timbang di depan Anda — transparan" },
    { highlight: "Konsultasi noda gratis dengan tim" },
    { highlight: "Ambil dalam 24 jam untuk reguler" },
  ],
};

const LOCATION_HTML = sectionShell(
  `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:24px;align-items:stretch;">
    <div style="background:var(--color-primary);color:var(--color-on-primary);border-radius:var(--radius);padding:32px;">
      <div style="${SCRIPT}font-size:1.15rem;color:var(--color-accent-on-primary);">{{eyebrow}}</div>
      <h2 style="${HEADING}font-size:1.6rem;font-weight:700;margin:0 0 16px 0;">{{title}}</h2>
      <p style="${BODY}font-size:0.95rem;line-height:1.7;margin:0;">{{address}}</p>
      <p style="${BODY}font-size:0.9rem;margin:12px 0 0 0;opacity:0.9;">🕘 {{hours}}</p>
      <p style="${BODY}font-size:0.875rem;margin:12px 0 20px 0;opacity:0.85;line-height:1.6;">{{note}}</p>
      <a href="{{button_link}}" style="display:inline-block;background:var(--color-accent);color:var(--color-primary-on-accent);padding:13px 30px;border-radius:999px;font-weight:600;text-decoration:none;${BODY}">{{button_text}}</a>
    </div>
    <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);padding:32px;display:flex;flex-direction:column;justify-content:center;gap:14px;">
      <div style="${BODY}font-weight:700;color:var(--color-text);">{{panelTitle}}</div>
      {{#highlights}}<div style="${BODY}font-size:0.9rem;color:var(--color-text-muted);line-height:1.7;">✦ {{highlight}}</div>{{/highlights}}
    </div>
  </div>`,
  "var(--color-background)",
);

/* ---- contact ---- */

const CONTACT_CONFIG = {
  eyebrow: "Fast respon di jam buka",
  title: "Hubungi Kami",
  subtitle: "Tanya layanan, harga, atau kerja sama — balas < 1 jam.",
  address: "Jl. Merdeka No. 45, Yogyakarta",
  phone: "0812-3456-7890",
  email: "halo@emeraldlaundry.id",
};

const CONTACT_HTML = sectionShell(
  `<div style="max-width:768px;margin:0 auto;text-align:center;">
    <div>${eyebrow("Fast respon di jam buka", "var(--color-secondary-on-surface)")}</div>
    <h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;color:var(--color-text);margin:0;">{{title}}</h2>
    <p style="${BODY}font-size:1rem;color:var(--color-text-muted);margin:12px 0 28px 0;">{{subtitle}}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:16px;">
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);padding:20px;">
        <div style="font-size:1.4rem;margin-bottom:8px;">📍</div>
        <div style="${BODY}font-size:0.85rem;color:var(--color-text-muted);line-height:1.6;">{{address}}</div>
      </div>
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);padding:20px;">
        <div style="font-size:1.4rem;margin-bottom:8px;">☎</div>
        <div style="${BODY}font-size:0.85rem;color:var(--color-text-muted);line-height:1.6;">{{phone}}</div>
      </div>
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius);padding:20px;">
        <div style="font-size:1.4rem;margin-bottom:8px;">✉</div>
        <div style="${BODY}font-size:0.85rem;color:var(--color-text-muted);line-height:1.6;">{{email}}</div>
      </div>
    </div>
  </div>`,
  "var(--color-surface)",
);

/* ------------------------------------------------------------------ */
/* Katalog sections                                                     */
/* ------------------------------------------------------------------ */

const SECTION_SPECS: Array<{ type: string; name: string; icon: string; variants: VariantSpec[] }> = [
  { type: "hero", name: "Hero", icon: "Layout", variants: [{ id: vid("hero-arch"), name: "Hero Arch Emerald", description: "Band hijau tua + lengkung emas + foto arch", config: HERO_CONFIG, html: HERO_HTML }] },
  { type: "features", name: "Keunggulan", icon: "Grid", variants: [{ id: vid("welcome-dividers"), name: "Welcome Dividers", description: "Sambutan tengah + 3 keunggulan bersekat", config: FEATURES_CONFIG, html: FEATURES_HTML }] },
  { type: "about", name: "Tentang", icon: "Info", variants: [
    { id: vid("luxury-split"), name: "Split Lingkaran", description: "Foto lingkaran + lencana + kutipan", config: ABOUT_CONFIG, html: ABOUT_HTML },
    { id: vid("process-arch"), name: "Proses Arch", description: "Foto arch + tahapan transparan", config: PROCESS_CONFIG, html: PROCESS_HTML },
  ] },
  { type: "pricing", name: "Layanan", icon: "Tag", variants: [{ id: vid("service-cards"), name: "Kartu Layanan", description: "Grid kartu layanan + harga", config: PRICING_CONFIG, html: PRICING_HTML }] },
  { type: "stats-band", name: "Statistik", icon: "BarChart", variants: [{ id: vid("comfort-band"), name: "Band Kenyamanan", description: "Band inset + statistik + foto oval", config: STATS_CONFIG, html: STATS_HTML }] },
  { type: "faq", name: "FAQ", icon: "HelpCircle", variants: [{ id: vid("faq-emerald"), name: "FAQ Emerald", description: "Accordion details + item pertama terbuka", config: FAQ_CONFIG, html: FAQ_HTML }] },
  { type: "testimonials", name: "Testimoni", icon: "Quote", variants: [{ id: vid("testimoni-bg"), name: "Testimoni BG", description: "Judul di atas foto + kartu bintang", config: TESTI_CONFIG, html: TESTI_HTML }] },
  { type: "steps", name: "Cara Pesan", icon: "ListOrdered", variants: [{ id: vid("booking-band"), name: "Band Panduan", description: "Band hijau + 3 kartu langkah", config: STEPS_CONFIG, html: STEPS_HTML }] },
  { type: "gallery", name: "Galeri", icon: "Image", variants: [{ id: vid("gallery-luxe"), name: "Galeri Luxe", description: "Grid foto hasil kerja", config: GALLERY_CONFIG, html: GALLERY_HTML }] },
  { type: "articles", name: "Artikel", icon: "FileText", variants: [{ id: vid("artikel-grid"), name: "Grid Artikel", description: "Grid kartu artikel + tautan", config: ARTICLES_CONFIG, html: ARTICLES_HTML }] },
  { type: "location", name: "Lokasi", icon: "MapPin", variants: [{ id: vid("location-panel"), name: "Panel Lokasi", description: "Panel gelap + panel info", config: LOCATION_CONFIG, html: LOCATION_HTML }] },
  { type: "contact", name: "Kontak", icon: "Mail", variants: [{ id: vid("contact-cards"), name: "Kartu Kontak", description: "Tiga kartu kontak", config: CONTACT_CONFIG, html: CONTACT_HTML }] },
];

const SECTIONS: SectionTypeDefinition[] = SECTION_SPECS.map((s) => ({
  type: s.type,
  name: s.name,
  icon: s.icon,
  variants: s.variants.map((v) => toVariant(v)),
}));

/* ------------------------------------------------------------------ */
/* Template                                                             */
/* ------------------------------------------------------------------ */

export const LAUNDRY_EMERALD_TEMPLATE: CatalogTemplate = {
  id: "laundry-emerald",
  name: "Emerald Laundry",
  description:
    "Template laundry premium bergaya luxury emerald: hero arch emas, kartu layanan, band statistik, FAQ accordion, testimoni foto, dan panduan booking. Isi tetap jasa laundry (kiloan, express, antar-jemput).",
  category: "services",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: "#0C3B2E",
      secondary: "#1E4D3B",
      accent: "#C6A15B",
      background: "#F5F1E8",
      surface: "#FDFBF6",
      text: "#1E2A26",
      textMuted: "#4E5E57",
      border: "#E5DCC8",
    },
    typography: {
      headingFont: "Playfair Display",
      bodyFont: "Manrope",
      accentFont: "Great Vibes",
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 20,
      buttonStyle: "solid",
      shadowStyle: "md",
      navStyle: "solid",
      footerStyle: "columns",
    },
    effects: {},
  },
  headers: HEADERS,
  footers: FOOTERS,
  sections: SECTIONS,
  /**
   * Kontrak kontras template (§19).
   *
   * Setiap pasangan = "warna teks X aman di atas latar Y dengan rasio
   * minimal Z". Pasangan yang paling rawan justru yang DUA ARAH:
   * `accent` di atas `primary` (eyebrow emas di band hijau tua) dan
   * `primary` di atas `accent` (tombol WhatsApp emas) — satu nilai palet
   * dipakai sebagai teks DAN sebagai latar, jadi tidak boleh "diperbaiki"
   * di satu tempat dan merusak yang lain.
   *
   * `on-primary` sengaja ikut meski bukan kunci palet: `brandMark()` memakai
   * `--color-on-<bg>` supaya teks lencana mengikuti latar lencana itu
   * sendiri (lihat `buildOnColorTokens`).
   */
  contrast: {
    pairs: [
      // Permukaan terang — teks utama & redup.
      { fg: "text", bg: "background", role: "body" },
      { fg: "text", bg: "surface", role: "body" },
      { fg: "textMuted", bg: "background", role: "muted" },
      { fg: "textMuted", bg: "surface", role: "muted" },
      { fg: "secondary", bg: "background", role: "body", note: "strapline footer" },
      { fg: "secondary", bg: "surface", role: "body" },
      { fg: "primary", bg: "surface", role: "body" },
      // Emas `#C6A15B` di atas krem hanya ~2.3:1, jadi yang dipakai di latar
      // terang adalah token TURUNAN, bukan `accent` langsung. Kontrak ini
      // yang menghitungkannya (`buildThemeTokens` menerapkannya).
      { fg: "accent", bg: "surface", role: "body", note: "tagline header (regresi emas di krem)" },
      { fg: "accent", bg: "background", role: "body" },
      // Band hijau tua — emas di sini justru aman, teks lewat on-primary.
      { fg: "accent", bg: "primary", role: "body", note: "eyebrow emas di band hijau" },
      // Emas jadi LAYAR (tombol/lencana) → teks gelap di atasnya.
      { fg: "primary", bg: "accent", role: "body", note: "tombol WhatsApp emas" },
    ],
  },
  data: {
    paletteOverride: {
      primary: "#0C3B2E",
      secondary: "#1E4D3B",
      accent: "#C6A15B",
      background: "#F5F1E8",
      surface: "#FDFBF6",
      text: "#1E2A26",
      textMuted: "#4E5E57",
      border: "#E5DCC8",
    },
    sections: [
      { type: "hero", variant: vid("hero-arch"), anchorId: "beranda", config: { ...HERO_CONFIG } },
      { type: "features", variant: vid("welcome-dividers"), anchorId: "keunggulan", config: { ...FEATURES_CONFIG } },
      { type: "about", variant: vid("luxury-split"), anchorId: "tentang", config: { ...ABOUT_CONFIG } },
      { type: "pricing", variant: vid("service-cards"), anchorId: "layanan", config: { ...PRICING_CONFIG } },
      { type: "stats-band", variant: vid("comfort-band"), anchorId: "statistik", config: { ...STATS_CONFIG } },
      { type: "about", variant: vid("process-arch"), anchorId: "proses", config: { ...PROCESS_CONFIG } },
      { type: "faq", variant: vid("faq-emerald"), anchorId: "faq", config: { ...FAQ_CONFIG } },
      { type: "testimonials", variant: vid("testimoni-bg"), anchorId: "testimoni", config: { ...TESTI_CONFIG } },
      { type: "steps", variant: vid("booking-band"), anchorId: "cara-pesan", config: { ...STEPS_CONFIG } },
      { type: "gallery", variant: vid("gallery-luxe"), anchorId: "galeri", config: { ...GALLERY_CONFIG } },
      { type: "articles", variant: vid("artikel-grid"), anchorId: "artikel", config: { ...ARTICLES_CONFIG } },
      { type: "location", variant: vid("location-panel"), anchorId: "lokasi", config: { ...LOCATION_CONFIG } },
      { type: "contact", variant: vid("contact-cards"), anchorId: "kontak", config: { ...CONTACT_CONFIG } },
    ],
    header: {
      // "standard" dipertahankan sementara agar lolos guard chrome registry
      // (catalog.test.ts) selama chrome generik belum dihapus (§18.7).
      // Header aktual yang dipakai = varian pertama template (fallback renderer).
      variant: "standard",
      siteTitle: BRAND,
      tagline: "Cuci bersih, wangi, siap pakai",
      navItems: NAV_ITEMS,
      ctaText: "Pesan Sekarang",
      ctaLink: "https://wa.me/6281234567890",
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "columns",
      text: `© {year} ${BRAND}. Cuci bersih, wangi, siap pakai.`,
      navItems: NAV_ITEMS.slice(0, 4),
      showNav: true,
      showSocial: true,
    },
    seo: {
      title: `${BRAND} — Laundry Premium Antar-Jemput`,
      description:
        "Laundry premium bergaya emerald: kiloan, express 3 jam, bedcover & hotel. Antar-jemput gratis, deterjen premium, garansi cuci ulang.",
    },
    core: {
      site_title: BRAND,
      tagline: "Cuci bersih, wangi, siap pakai",
    },
    customCss: [
      // Header/footer berlatar `surface` memakai token turunan
      // (`--color-accent-on-surface`) karena emas #C6A15B di atas krem hanya
      // ~2.3:1. Footer berlatar `primary` boleh emas langsung.
      '[data-tpl-type="header"] nav a:hover{color:var(--color-accent-on-surface);}',
      '[data-tpl-type="header"] nav a{font-weight:600;text-decoration:none;}',
      '[data-tpl-type="footer"] nav a{text-decoration:none;}',
      '[data-tpl-type="footer"] nav a:hover{color:var(--color-accent-on-primary);}',
      '[data-tpl-type="faq"] details summary{cursor:pointer;}',
    ].join("\n"),
  },
};
