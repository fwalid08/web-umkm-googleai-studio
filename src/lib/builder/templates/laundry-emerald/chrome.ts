import type { ConfigField, FooterVariant, HeaderVariant } from "../../template-types";
import { BRAND, NAV_ITEMS, vid, inferFields, BODY, HEADING, SCRIPT } from "./shared";

const HEADER_DEFAULT = {
  logoUrl: "",
  siteTitle: BRAND,
  tagline: "Cuci bersih, wangi, siap pakai",
  navItems: NAV_ITEMS,
  ctaText: "Pesan Sekarang",
  ctaLink: "https://wa.me/6281234567890",
  showCta: true,
  sticky: true,
  menuPosition: "center",
  contentWidth: "6xl",
  mobileMenuCtaText: "Pesan Sekarang",
  mobileMenuCtaLink: "https://wa.me/6281234567890",
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
    `<span data-hdr-mark style="display:inline-flex;align-items:center;justify-content:center;` +
    `width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:${fg};` +
    `font-family:var(--font-heading),serif;font-weight:700;font-size:${Math.round(size * 0.42)}px;flex:none;">{{siteTitleInitial}}</span>`
  );
}

/**
 * Header HTML yang responsif mobile: desktop nav only.
 * Hamburger button & drawer ditangani oleh React MobileDrawer component (live site & canvas).
 * Menggunakan variabel CSS dari template (var(--color-*), var(--font-*)).
 *
 * @param inner - HTML konten header (brand, nav, CTA) — harus sudah punya desktop nav
 * @param opts - Opsi tambahan
 */
function headerShellMobile(inner: string, opts: {
  headerBg?: string;
  headerBorder?: string;
  headerPadding?: string;
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
 * inisial `{{siteTitleInitial}}` bila kosong. Tanpa ini field "Logo URL"
 * di sidebar tidak berpengaruh apa pun.
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
 * terhadap blok header). Absolute `top:50%` terbukti meleset: di varian
 * multi-baris (brand tengah, topbar) ia jatuh di tengah blok, saat konten
 * wrap ia bahkan menimpa CTA. In-flow = selalu sejajar logo secara
 * konstruksi, selebar apa pun layar/konten.
 *
 * Tampil hanya <640px (globals.css `[data-hdr-burger]`); klik
 * didelegasikan ke MobileDrawer. `extra` untuk kasus khusus (brand
 * tengah: absolute di dalam blok brand yang relative).
 */
function burgerBtn(extra = ""): string {
  return `<button type="button" data-hdr-burger aria-label="Buka menu navigasi" style="display:none;align-items:center;justify-content:center;width:44px;height:44px;flex:none;border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text);cursor:pointer;${extra}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>`;
}

/** Tagline header — hilang bila dikosongkan di sidebar. */
function taglineBlock(style: string): string {
  return `{{#if tagline}}<div data-hdr-tag style="${style}">{{tagline}}</div>{{/if}}`;
}

const MOBILE_MENU_CONFIG = {
  style: "drawer-sidebar" as const,
  showCta: true,
  ctaText: "Pesan Sekarang",
  ctaLink: "https://wa.me/6281234567890",
};

const HEADER_BASE_CONFIG = {
  ...HEADER_DEFAULT,
  siteTitleInitial: "E",
};

/**
 * Field sidebar header. `menuPosition` dipaksa select (bukan text) agar
 * merchant memilih Kiri/Tengah/Kanan — nilainya CSS-ready via
 * `data-hdr-navpos` + globals.css. Varian topbar menimpa daftar ini
 * sendiri (butuh field topbar tambahan).
 */
function headerFields(extra: Record<string, unknown> = {}): ConfigField[] {
  return inferFields({ ...HEADER_BASE_CONFIG, ...extra }).map((f) =>
    f.key === "menuPosition"
      ? {
          key: "menuPosition",
          label: "Posisi Menu",
          type: "select" as ConfigField["type"],
          options: [
            { label: "Tengah", value: "center" },
            { label: "Kiri", value: "left" },
            { label: "Kanan", value: "right" },
          ],
          hint: "Posisi menu saat sisi kanan header kosong (tanpa tombol)",
        }
      : f,
  );
}

export const HEADERS: HeaderVariant[] = [
  {
    id: vid("hdr-arch"),
    name: "Emerald Arch",
    description: "Bar terang + garis emas ganda, brand serif + CTA pill",
    layout: vid("hdr-arch"),
    configFields: headerFields(),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-arch"),
    maxNavDepth: 1,
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;">
    <div style="display:flex;align-items:center;gap:12px;min-width:0;">
      ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 44)}
      <div style="min-width:0;">
        <div data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.25rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
        ${taglineBlock("font-family:var(--font-accent),cursive;font-size:1rem;color:var(--color-accent-on-surface);line-height:1.2;")}
      </div>
    </div>
    <nav style="${NAV_STYLE}" data-hdr-navpos="{{menuPosition}}">{{navItems}}</nav>
    ${ctaBlock()}
    ${burgerBtn()}
  </div>
`, { respectStickyConfig: true, headerBg: 'var(--color-surface)', headerBorder: '3px double var(--color-accent)', headerPadding: '12px 24px' }),
  },
  {
    id: vid("hdr-floating"),
    name: "Pill Melayang",
    description: "Bar pil mengambang dengan bayangan lembut",
    layout: vid("hdr-floating"),
    configFields: headerFields(),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-floating"),
    maxNavDepth: 1,
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <div style="padding:0 8px;background:transparent;">
    <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:999px;padding:10px 12px 10px 12px;box-shadow:0 12px 32px color-mix(in srgb, var(--color-text) 18%, transparent);">
      <div style="display:flex;align-items:center;gap:10px;min-width:0;padding-left:8px;">
        ${brandBlock("var(--color-accent)", "var(--color-on-accent)", 36)}
        <span data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.1rem;color:var(--color-text);white-space:nowrap;">{{siteTitle}}</span>
      </div>
      <nav style="${NAV_STYLE}" data-hdr-navpos="{{menuPosition}}">{{navItems}}</nav>
      ${ctaBlock('10px 24px')}
      ${burgerBtn()}
    </div>
  </div>
`, { respectStickyConfig: true, headerBg: 'var(--color-primary)', headerBorder: 'transparent', headerPadding: '14px 16px 18px 16px', headerSticky: false }),
  },
  {
    id: vid("hdr-topbar"),
    name: "Topbar Promo",
    description: "Pita promo hijau tua + bar utama terang",
    layout: vid("hdr-topbar"),
    configFields: headerFields({
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
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <header>
    <div style="background:var(--color-primary);color:var(--color-on-primary);padding:8px 24px;font-family:var(--font-body),sans-serif;font-size:0.75rem;">
      <div style="max-width:1152px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 16px;">
        <span style="font-weight:600;letter-spacing:0.04em;">✦ {{topbarText}}</span>
        <span style="opacity:0.9;">{{topbarPhone}} · {{topbarEmail}}</span>
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
        <nav style="${NAV_STYLE}" data-hdr-navpos="{{menuPosition}}">{{navItems}}</nav>
        ${ctaBlock()}
        ${burgerBtn()}
      </div>
    </div>
  </header>
`, { respectStickyConfig: true, headerBg: 'var(--color-surface)', headerBorder: 'none', headerPadding: '0' }),
  },
{
    id: vid("hdr-split"),
    name: "Blok Brand",
    description: "Blok brand besar kiri dengan bingkai emas, menu kanan",
    layout: vid("hdr-split"),
    configFields: headerFields(),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-split"),
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
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:16px 28px;" data-hdr-navpos="{{menuPosition}}">
      <nav style="${NAV_STYLE}">{{navItems}}</nav>
      ${ctaBlock()}
      ${burgerBtn()}
    </div>
  </div>
`, { respectStickyConfig: true, headerBg: 'var(--color-surface)', headerBorder: '1px solid var(--color-border)', headerPadding: '16px 24px' }),
  },
{
    id: vid("hdr-centered"),
    name: "Brand Tengah",
    description: "Brand serif tengah + baris menu simetris di bawah",
    layout: vid("hdr-centered"),
    configFields: headerFields(),
    defaultConfig: { ...HEADER_BASE_CONFIG },
    mockup: vid("hdr-centered"),
    maxNavDepth: 1,
    mobileMenu: MOBILE_MENU_CONFIG,
    html: headerShellMobile(`
  <div style="max-width:1152px;margin:0 auto;text-align:center;">
    <div style="position:relative;">
      ${burgerBtn("position:absolute;right:0;top:50%;transform:translateY(-50%);")}
      ${taglineBlock("font-family:var(--font-accent),cursive;font-size:1.2rem;color:var(--color-secondary-on-surface);")}
      <div data-hdr-title style="font-family:var(--font-heading),serif;font-weight:700;font-size:1.75rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 16px;margin-top:12px;">
      <nav style="${NAV_STYLE}">{{navItems}}</nav>
      ${ctaBlock('10px 26px', false)}
    </div>
  </div>
`, { respectStickyConfig: true, headerBg: 'var(--color-surface)', headerBorder: '3px double var(--color-accent)', headerPadding: '16px 24px 12px 24px' }),
  },
];


/* ------------------------------------------------------------------ */
/* Footers — 5 varian unik, semua html kustom bertoken                   */
/* ------------------------------------------------------------------ */

/**
 * Field dasar footer.
 *
 * `showNav` / `showSocial` SENGAJA TIDAK ada di sini. `inferFields` membuat
 * form field dari setiap key config, jadi mendeklarasikan toggle yang tidak
 * pernah dibaca HTML menghasilkan sakelar di sidebar yang saat user drag
 * tidak terjadi apa pun. Toggle dideklarasikan per varian, hanya di varian
 * yang benar-benar merender isinya.
 *
 * `siteTitleInitial` juga dihapus: hanya `brandMark()` yang memakainya, dan
 * itu khusus header.
 */
const FOOTER_BASE = {
  siteTitle: BRAND,
  logoUrl: "",
  text: `© {year} ${BRAND}. Cuci bersih, wangi, siap pakai.`,
  navItems: NAV_ITEMS.slice(0, 4),
  poweredText: "Powered by Rabasha",
  poweredUrl: "https://rabasha.web.id",
  showPowered: true,
};

/** Data sosmed default — dipakai varian yang punya blok sosial. */
const SOCIALS = [{ label: "IG" }, { label: "FB" }, { label: "WA" }];


function poweredBar(color: string): string {
  return `{{#if showPowered}}<div style="text-align:center;margin-top:16px;font-size:0.75rem;${BODY}"><a href="{{poweredUrl}}" style="color:${color};text-decoration:none;opacity:0.7;">{{poweredText}}</a></div>{{/if}}`;
}

/**
 * Blok sosmed.
 *
 * `fg` WAJIB token pasangan yang cocok dengan latar footernya. Footer
 * `ftr-columns` berlatar `primary` (gelap) sementara `ftr-centered` berlatar
 * `surface` (terang) — memakai warna teks yang sama untuk keduanya berarti
 * salah satunya pasti tak terbaca. Token `--color-text-on-<bg>` dijamin
 * ≥ 4.5:1 untuk background itu apa pun skema warnanya.
 *
 * `border` sengaja boleh warna mentah: garis lingkaran sosmed itu dekoratif,
 * bukan informasi.
 */
function socialRow(fg: string, border: string): string {
  return `{{#if showSocial}}<div style="display:flex;gap:8px;margin-top:16px;">{{#socials}}<span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;border:1px solid ${border};color:${fg};font-size:0.7rem;font-weight:700;font-family:var(--font-body),sans-serif;">{{label}}</span>{{/socials}}</div>{{/if}}`;
}

const FTR_COLUMNS_CONFIG = {
  ...FOOTER_BASE,
  showNav: true,
  showSocial: true,
  socials: SOCIALS,
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
  showNav: true,
  showSocial: true,
  socials: SOCIALS,
  strapline: "Terima kasih telah mempercayakan cucian Anda",
};

const FTR_NEWS_CONFIG = {
  ...FOOTER_BASE,
  showNav: true,
  kicker: "Penawaran spesial",
  newsletterTitle: "Dapat kabar promo tiap pekan",
  newsletterText: "Diskon cuci bedcover 20% untuk 50 pendaftar pertama bulan ini.",
  newsletterButtonText: "Klaim via WhatsApp",
  newsletterButtonLink: "https://wa.me/6281234567890?text=Halo%20Emerald%20Laundry",
};

// Tanpa nav & sosmed — toggle-nya tidak dideklarasikan sama sekali.
const FTR_MINI_CONFIG = { ...FOOTER_BASE };
const FTR_CONTACT_CONFIG = {
  ...FOOTER_BASE,
  panelVisitTitle: "Kunjungi Kami",
  panelContactTitle: "Hubungi Kami",
  address: "Jl. Merdeka No. 45, Yogyakarta",
  phone: "0812-3456-7890",
  email: "halo@emeraldlaundry.id",
  hours: "Senin–Sabtu 08.00–20.00 · Minggu 09.00–14.00",
};

export const FOOTERS: FooterVariant[] = [
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
        ${taglineBlock("font-family:var(--font-accent),cursive;font-size:1.1rem;color:var(--color-accent-on-primary);margin:4px 0 12px 0;")}
        <p style="font-size:0.875rem;line-height:1.6;opacity:0.85;font-family:var(--font-body),sans-serif;">{{address}}</p>
      </div>
      <div>
        <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;opacity:0.7;font-family:var(--font-body),sans-serif;">{{menuTitle}}</div>
        {{#if showNav}}<nav style="display:flex;flex-direction:column;gap:8px;font-size:0.9rem;font-family:var(--font-body),sans-serif;color:var(--color-on-primary);">{{navItems}}</nav>{{/if}}
        ${socialRow("var(--color-text-on-primary)", "var(--color-accent)")}
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
    {{#if showNav}}<nav style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 24px;font-size:0.9rem;color:var(--color-text);font-family:var(--font-body),sans-serif;">{{navItems}}</nav>{{/if}}
    ${socialRow("var(--color-text-on-surface)", "var(--color-border)")}
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
    configFields: inferFields(FTR_MINI_CONFIG),
    defaultConfig: { ...FTR_MINI_CONFIG },
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
      {{#if showNav}}<nav style="display:flex;flex-wrap:wrap;gap:8px 20px;font-size:0.875rem;font-family:var(--font-body),sans-serif;color:var(--color-on-primary);">{{navItems}}</nav>{{/if}}
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
