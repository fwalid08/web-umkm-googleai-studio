import type {
  FooterVariant,
  HeaderVariant,
} from "../template-types";
import type { CatalogTemplate } from "./catalog";
import type { ColorScheme } from "../color-schemes";
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

const MOBILE_MENU_CONFIG = {
  style: "drawer-sidebar" as const,
  showCta: true,
  ctaText: "Pesan via WhatsApp",
  ctaLink: "https://wa.me/6281234567890",
};

/**
 * Lencana bundar di header.
 */
function brandMark(bg: string, fg: string, size: number): string {
  return (
    `<span data-hdr-mark style="display:inline-flex;align-items:center;justify-content:center;` +
    `width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:${fg};` +
    `font-family:var(--font-heading),serif;font-weight:700;font-size:${Math.round(size * 0.42)}px;flex:none;">{{siteTitleInitial}}</span>`
  );
}

/**
 * Header HTML yang responsif mobile: desktop nav only.
 * Hamburger button & drawer ditangani oleh React MobileDrawer component (live site & canvas).
 *
 * Setiap blok opsional dibungkus `{{#if key}}…{{/if}}` agar toggle sidebar
 * benar-benar berfungsi — tanpa ini config seperti `showCta`/`logoUrl`
 * hanya jadi field form yang saat diubah tidak terjadi apa pun:
 * - `{{#if logoUrl}}` → <img> logo, fallback lencana inisial.
 * - `{{#if showCta}}` → tombol CTA (teks + link ikut config).
 * - `sticky` TIDAK dibaca di dalam HTML: `position:sticky` di dalam
 *   HTML varian tidak efektif (terjebak pembungkus setinggi header).
 *   Toggle "Header menempel" diterapkan `VariantHtmlRenderer` via prop
 *   `sticky` di pembungkusnya.
 */
function headerShellMobile(inner: string, opts: {
  headerBg?: string;
  headerBorder?: string;
  headerPadding?: string;
  /**
   * Sticky bawaan bila `respectStickyConfig` mati. Bila
   * `respectStickyConfig` true, posisi dibaca dari `config.sticky` saat
   * render via blok `{{#if sticky}}` — toggle sidebar jadi berfungsi.
   * Aman untuk data lama: `normalizeChrome` selalu mengisi `sticky`
   * dari default varian, jadi key-nya selalu ada saat render.
   * Default false = perilaku lama (nilai opts dipakai mentah).
   */
  headerSticky?: boolean;
  respectStickyConfig?: boolean;
} = {}): string {
  const bg = opts.headerBg ?? 'var(--color-surface)';
  const border = opts.headerBorder ?? 'var(--color-border)';
  const padding = opts.headerPadding ?? '12px 24px';

  // `sticky` TIDAK dirender di sini: `position:sticky` di dalam HTML
  // varian terjebak pembungkus renderer yang tingginya persis setinggi
  // header sehingga tidak pernah menempel. Toggle "Header menempel"
  // diterapkan oleh `VariantHtmlRenderer` (prop `sticky`) di pembungkusnya.
  if (opts.respectStickyConfig) {
    return `
<header style="background:${bg};border-bottom:1px solid ${border};padding:${padding};">
  <div style="max-width:1152px;margin:0 auto;">
    ${inner}
  </div>
</header>`;
  }

  const sticky = opts.headerSticky ?? true;
  const stickyStyle = sticky ? 'position:sticky;top:0;z-index:50;' : '';

  return `
<header style="background:${bg};${stickyStyle}border-bottom:1px solid ${border};padding:${padding};">
  <div style="max-width:1152px;margin:0 auto;">
    ${inner}
  </div>
</header>`;
}

/**
 * Blok brand header: logo <img> bila `logoUrl` diisi, fallback lencana
 * inisial `{{siteTitleInitial}}` bila kosong.
 */
function brandBlock(bg: string, fg: string, size: number): string {
  return (
    `{{#if logoUrl}}<img data-hdr-mark src="{{logoUrl}}" alt="{{siteTitle}}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex:none;" />{{/if}}` +
    `{{#if !logoUrl}}` + brandMark(bg, fg, size) + `{{/if}}`
  );
}

/** Tombol CTA header — hanya render bila `showCta` true. */
function ctaBlock(padding = '12px 28px', hideOnMobile = true): string {
  return `{{#if showCta}}<a href="{{ctaLink}}"${hideOnMobile ? ' data-hdr-cta' : ''} style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:${padding};border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;font-family:var(--font-body),sans-serif;white-space:nowrap;">{{ctaText}}</a>{{/if}}`;
}

/**
 * Tombol hamburger mobile — IN-FLOW di baris brand (bukan absolute
 * terhadap blok header). Absolute `top:50%` terbukti meleset saat konten
 * wrap / varian multi-baris, bahkan menimpa CTA. In-flow = selalu
 * sejajar logo secara konstruksi.
 *
 * Tampil hanya <640px (globals.css `[data-hdr-burger]`); klik
 * didelegasikan ke MobileDrawer.
 */
function burgerBtn(): string {
  return `<button type="button" data-hdr-burger aria-label="Buka menu navigasi" style="display:none;align-items:center;justify-content:center;width:44px;height:44px;flex:none;border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text);cursor:pointer;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>`;
}

/** Tagline header — hilang bila dikosongkan di sidebar. */
function taglineBlock(style: string): string {
  return `{{#if tagline}}<div data-hdr-tag style="${style}">{{tagline}}</div>{{/if}}`;
}

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
  siteTitleInitial: "W",
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
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;">
    <div style="display:flex;align-items:center;gap:12px;min-width:0;">
      ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 40)}
      <div style="min-width:0;">
        <div data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.25rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
        ${taglineBlock("font-family:var(--font-accent),cursive;font-size:1rem;color:var(--color-accent-on-surface);line-height:1.2;")}
      </div>
    </div>
    <nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 20px;color:var(--color-text);font-family:var(--font-body),sans-serif;font-size:0.875rem;">{{navItems}}</nav>
    ${ctaBlock()}
    ${burgerBtn()}
  </div>
`, { respectStickyConfig: true, headerBg: 'var(--color-background)', headerBorder: '1px solid var(--color-border)', headerPadding: '12px 24px' }),
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
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <div style="padding:12px 16px 0 16px;background:transparent;">
    <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify_content:space-between;gap:12px 20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:999px;padding:10px 12px 10px 12px;box-shadow:0 12px 32px color-mix(in srgb, var(--color-text) 18%, transparent);">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;padding-left:8px;">
        ${brandBlock("var(--color-accent)", "var(--color-on-accent)", 36)}
        <span data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.1rem;color:var(--color-text);white-space:nowrap;">{{siteTitle}}</span>
      </div>
      <nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 20px;color:var(--color-text);font-family:var(--font-body),sans-serif;font-size:0.875rem;">{{navItems}}</nav>
      ${ctaBlock('10px 24px')}
      ${burgerBtn()}
    </div>
  </div>
`, { respectStickyConfig: true, headerBg: 'transparent', headerBorder: 'none', headerPadding: '0', headerSticky: false }),
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
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <div style="background:transparent;transition:background 0.3s,box-shadow 0.3s;">
    <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;padding:12px 24px;">
      <div style="display:flex;align-items:center;gap:12px;min-width:0;">
        ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 40)}
        <div style="min-width:0;">
          <div data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.25rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
          ${taglineBlock("font-family:var(--font-accent),cursive;font-size:1rem;color:var(--color-accent-on-surface);line-height:1.2;")}
        </div>
      </div>
      <nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 20px;color:var(--color-text);font-family:var(--font-body),sans-serif;font-size:0.875rem;">{{navItems}}</nav>
      ${ctaBlock()}
      ${burgerBtn()}
    </div>
  </div>
`, { respectStickyConfig: true, headerBg: 'transparent', headerBorder: 'none', headerPadding: '0', headerSticky: true }),
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
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 24px;">
    <div style="display:flex;align-items:center;gap:14px;border:1px solid var(--color-accent);border-radius:var(--radius);padding:10px 18px 10px 10px;min-width:0;">
      ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 52)}
      <div style="min-width:0;">
        <div data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.4rem;color:var(--color-text);line-height:1.15;">{{siteTitle}}</div>
        ${taglineBlock("font-family:var(--font-accent),cursive;font-size:1.05rem;color:var(--color-secondary-on-surface);line-height:1.2;")}
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:16px 28px;">
      <nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 20px;color:var(--color-text);font-family:var(--font-body),sans-serif;font-size:0.875rem;">{{navItems}}</nav>
      ${ctaBlock()}
      ${burgerBtn()}
    </div>
  </div>
`, { respectStickyConfig: true, headerBg: 'var(--color-surface)', headerBorder: '1px solid var(--color-border)', headerPadding: '16px 24px' }),
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
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <header>
    <div style="background:var(--color-primary);color:var(--color-on-primary);padding:8px 24px;font-family:var(--font-body),sans-serif;font-size:0.75rem;">
      <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 16px;">
        <span style="font-weight:600;letter-spacing:0.04em;">✦ Promo: Antar-Jemput GRATIS se-Kota minggu ini</span>
        <span style="opacity:0.9;">0812-3456-7890 · halo@warungsederhana.id</span>
      </div>
    </div>
    <div style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:12px 24px;">
      <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;">
        <div style="display:flex;align-items:center;gap:12px;min-width:0;">
          ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 40)}
          <div style="min-width:0;">
            <div data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.15rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
            ${taglineBlock("font-size:0.75rem;color:var(--color-text-muted);font-family:var(--font-body),sans-serif;")}
          </div>
        </div>
        <nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 20px;color:var(--color-text);font-family:var(--font-body),sans-serif;font-size:0.875rem;">{{navItems}}</nav>
        ${ctaBlock()}
        ${burgerBtn()}
      </div>
    </div>
  </header>
`, { respectStickyConfig: true, headerBg: 'var(--color-surface)', headerBorder: 'none', headerPadding: '0' }),
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
  {
    key: "socials",
    label: "Akun Sosmed",
    type: "list",
    itemFields: [
      { key: "label", label: "Label", type: "text" },
    ],
  },
  { key: "showPowered", label: "Tampilkan kredit", type: "switch" },
  { key: "poweredText", label: "Teks kredit", type: "text" },
  { key: "poweredUrl", label: "Link kredit", type: "text" },
  { key: "newsletterTitle", label: "Judul pita info", type: "text" },
  { key: "newsletterText", label: "Teks pita info", type: "textarea" },
  { key: "newsletterButtonText", label: "Teks tombol pita", type: "text" },
  { key: "newsletterPlaceholder", label: "Placeholder email", type: "text" },
] as FooterVariant["configFields"];

const FOOTER_DEFAULT = {
  siteTitle: BRAND,
  logoUrl: "",
  text: `© {year} ${BRAND}. Cita rasa rumahan di setiap sajian.`,
  navItems: NAV_ITEMS.slice(0, 4),
  showNav: true,
  showSocial: true,
  socials: [{ label: "IG" }, { label: "FB" }, { label: "WA" }],
  showPowered: true,
  poweredText: "Powered by Rabasha",
  poweredUrl: "https://rabasha.web.id",
  newsletterTitle: "Kabar promo tiap pekan",
  newsletterText: "Menu baru dan diskon catering — langsung ke WhatsApp Anda.",
  newsletterButtonText: "Daftar",
  newsletterPlaceholder: "Email Anda",
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
  colorSchemes: [
    // Light schemes (10)
    {
      id: 'terracotta-classic',
      name: 'Terracotta Classic',
      category: 'light',
      palette: { background: '#fffbeb', surface: '#fef3c7', primary: '#c2410c', accent: '#f59e0b', text: '#1c1917', textMuted: '#57534e', border: '#fde68a' },
      headingFont: 'Poppins',
      bodyFont: 'Inter',
    },
    {
      id: 'rust-warmth',
      name: 'Rust Warmth',
      category: 'light',
      palette: { background: '#fefaf0', surface: '#fefce8', primary: '#b45309', accent: '#fbbf24', text: '#1c1917', textMuted: '#57534e', border: '#fde68a' },
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
    },
    {
      id: 'amber-glow',
      name: 'Amber Glow',
      category: 'light',
      palette: { background: '#fffbeb', surface: '#fef3c7', primary: '#d97706', accent: '#fcd34d', text: '#1c1917', textMuted: '#57534e', border: '#fde68a' },
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Inter',
    },
    {
      id: 'clay-pottery',
      name: 'Clay Pottery',
      category: 'light',
      palette: { background: '#fdfdf8', surface: '#fef9e7', primary: '#a16207', accent: '#fde68a', text: '#1c1917', textMuted: '#57534e', border: '#e4d5b7' },
      headingFont: 'Montserrat',
      bodyFont: 'Lato',
    },
    {
      id: 'sunset-kitchen',
      name: 'Sunset Kitchen',
      category: 'light',
      palette: { background: '#fff7ed', surface: '#fed7aa', primary: '#ea580c', accent: '#fb923c', text: '#431407', textMuted: '#57534e', border: '#fec99a' },
      headingFont: 'Syne',
      bodyFont: 'Inter',
    },
    {
      id: 'spice-market',
      name: 'Spice Market',
      category: 'light',
      palette: { background: '#fdf8f3', surface: '#fef3c7', primary: '#9a3412', accent: '#f59e0b', text: '#1c1917', textMuted: '#57534e', border: '#fde68a' },
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    {
      id: 'harvest-gold',
      name: 'Harvest Gold',
      category: 'light',
      palette: { background: '#fefce8', surface: '#fef9c3', primary: '#854d0e', accent: '#eab308', text: '#1c1917', textMuted: '#57534e', border: '#fde047' },
      headingFont: 'Raleway',
      bodyFont: 'Inter',
    },
    {
      id: 'cream-soup',
      name: 'Cream Soup',
      category: 'light',
      palette: { background: '#fafaf9', surface: '#f5f5f4', primary: '#78716c', accent: '#a3e635', text: '#1c1917', textMuted: '#57534e', border: '#e7e5e4' },
      headingFont: 'DM Serif Display',
      bodyFont: 'Inter',
    },
    {
      id: 'ginger-zest',
      name: 'Ginger Zest',
      category: 'light',
      palette: { background: '#fffbeb', surface: '#fef3c7', primary: '#92400e', accent: '#fbbf24', text: '#1c1917', textMuted: '#57534e', border: '#fde68a' },
      headingFont: 'Outfit',
      bodyFont: 'Inter',
    },
    {
      id: 'paprika-rich',
      name: 'Paprika Rich',
      category: 'light',
      palette: { background: '#fef2f2', surface: '#fee2e2', primary: '#7c2d12', accent: '#f97316', text: '#450a0a', textMuted: '#7f1d1d', border: '#fecaca' },
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
    },
    // Dark schemes (10)
    {
      id: 'ember-hearth',
      name: 'Ember Hearth',
      category: 'dark',
      palette: { background: '#1c1917', surface: '#292524', primary: '#fb923c', accent: '#fbbf24', text: '#fafaf9', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'Playfair Display',
      bodyFont: 'Inter',
    },
    {
      id: 'charcoal-grill',
      name: 'Charcoal Grill',
      category: 'dark',
      palette: { background: '#0c0a09', surface: '#1c1917', primary: '#f97316', accent: '#fde047', text: '#fafaf9', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'Syne',
      bodyFont: 'Inter',
    },
    {
      id: 'midnight-feast',
      name: 'Midnight Feast',
      category: 'dark',
      palette: { background: '#141210', surface: '#1f1d1a', primary: '#f59e0b', accent: '#fcd34d', text: '#fefce8', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'Cormorant Garamond',
      bodyFont: 'Inter',
    },
    {
      id: 'copper-pot',
      name: 'Copper Pot',
      category: 'dark',
      palette: { background: '#0f0e0d', surface: '#1c1917', primary: '#ea580c', accent: '#fbbf24', text: '#fafaf9', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'Montserrat',
      bodyFont: 'Lato',
    },
    {
      id: 'bronze-kitchen',
      name: 'Bronze Kitchen',
      category: 'dark',
      palette: { background: '#11100d', surface: '#1c1917', primary: '#d97706', accent: '#fde047', text: '#fefce8', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'Raleway',
      bodyFont: 'Inter',
    },
    {
      id: 'obsidian-broth',
      name: 'Obsidian Broth',
      category: 'dark',
      palette: { background: '#080706', surface: '#141210', primary: '#fbbf24', accent: '#fde68a', text: '#fefce8', textMuted: '#a8a29e', border: '#292524' },
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    {
      id: 'smoked-paprika',
      name: 'Smoked Paprika',
      category: 'dark',
      palette: { background: '#0d0b09', surface: '#1c1917', primary: '#c2410c', accent: '#fde68a', text: '#fafaf9', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'DM Serif Display',
      bodyFont: 'Inter',
    },
    {
      id: 'cinder-oven',
      name: 'Cinder Oven',
      category: 'dark',
      palette: { background: '#0a0908', surface: '#181614', primary: '#9a3412', accent: '#fcd34d', text: '#fafaf9', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'Outfit',
      bodyFont: 'Inter',
    },
    {
      id: 'volcanic-ash',
      name: 'Volcanic Ash',
      category: 'dark',
      palette: { background: '#0f0e0d', surface: '#1c1917', primary: '#78716c', accent: '#eab308', text: '#fafaf9', textMuted: '#a8a29e', border: '#44403c' },
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
    },
    {
      id: 'coal-ember',
      name: 'Coal Ember',
      category: 'dark',
      palette: { background: '#090807', surface: '#141210', primary: '#57534e', accent: '#fde047', text: '#fafaf9', textMuted: '#a8a29e', border: '#292524' },
      headingFont: 'Space Grotesk',
      bodyFont: 'Inter',
    },
  ],
  data: {
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
  },
};
