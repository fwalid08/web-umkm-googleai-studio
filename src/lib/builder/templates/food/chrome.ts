import type { FooterVariant, HeaderVariant } from "../../template-types";

export const BRAND = "Warung Makan Sederhana";

export const NAV_ITEMS = [
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

export const HEADERS: HeaderVariant[] = [
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

export const FOOTERS: FooterVariant[] = [
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
