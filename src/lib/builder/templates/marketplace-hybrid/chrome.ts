import type { FooterVariant, HeaderVariant } from "../../template-types";
import { BRAND, NAV_ITEMS, vid, inferFields, BODY, HEADING } from "./shared";

const HEADER_DEFAULT = {
  logoUrl: "",
  siteTitle: BRAND,
  tagline: "Belanja mudah, harga terbaik",
  navItems: NAV_ITEMS,
  ctaText: "Cari Produk",
  ctaLink: "#produk",
  showCta: true,
  sticky: true,
  menuPosition: "center",
  contentWidth: "6xl",
};


function brandBlock(bg: string, fg: string, size: number): string {
  return (
    `{{#if logoUrl}}<img data-hdr-mark src="{{logoUrl}}" alt="{{siteTitle}}" style="width:${size}px;height:${size}px;border-radius:8px;object-fit:cover;flex:none;" />{{/if}}` +
    `{{#if !logoUrl}}<span data-hdr-mark style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:8px;background:${bg};color:${fg};font-family:var(--font-heading),sans-serif;font-weight:700;font-size:${Math.round(size * 0.5)}px;flex:none;">{{siteTitleInitial}}</span>{{/if}}`
  );
}

function ctaBlock(padding = '10px 24px'): string {
  return `{{#if showCta}}<a href="{{ctaLink}}" data-hdr-cta style="display:inline-flex;align-items:center;background:var(--color-primary);color:var(--color-on-primary);padding:${padding};border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;${BODY}white-space:nowrap;">{{ctaText}}</a>{{/if}}`;
}

function burgerBtn(): string {
  return `<button type="button" data-hdr-burger aria-label="Buka menu navigasi" style="display:none;align-items:center;justify-content:center;width:44px;height:44px;flex:none;border-radius:10px;border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text);cursor:pointer;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>`;
}

const NAV_STYLE = "display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;color:var(--color-text);font-size:0.875rem;" + BODY;

export const HEADERS: HeaderVariant[] = [
  {
    id: vid("hdr-search"),
    name: "Search Bar",
    description: "Logo kiri, search bar tengah, CTA kanan",
    layout: vid("hdr-search"),
    configFields: inferFields({ ...HEADER_DEFAULT, siteTitleInitial: "T" }),
    defaultConfig: { ...HEADER_DEFAULT, siteTitleInitial: "T" },
    mockup: "header-search",
    maxNavDepth: 1,
    mobileMenu: { style: "drawer-sidebar", showCta: true, ctaText: "Cari Produk", ctaLink: "#produk" },
    html: `<header style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:10px 16px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
      ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 36)}
      <div data-hdr-title style="${HEADING}font-weight:700;font-size:1.1rem;color:var(--color-text);line-height:1.2;white-space:nowrap;">{{siteTitle}}</div>
    </div>
    <div style="flex:1;min-width:160px;max-width:480px;">
      <div style="display:flex;align-items:center;background:var(--color-background);border:1px solid var(--color-border);border-radius:999px;padding:8px 14px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted);flex:none;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" placeholder="Cari produk..." style="border:none;outline:none;background:transparent;margin-left:8px;width:100%;${BODY}font-size:0.875rem;color:var(--color-text);" />
      </div>
    </div>
    <nav style="${NAV_STYLE}" data-hdr-navpos="{{menuPosition}}">{{navItems}}</nav>
    ${ctaBlock()}
    ${burgerBtn()}
  </div>
</header>`,
  },
  {
    id: vid("hdr-compact"),
    name: "Compact",
    description: "Bar rapat, search full-width di bawah",
    layout: vid("hdr-compact"),
    configFields: inferFields({ ...HEADER_DEFAULT, siteTitleInitial: "T" }),
    defaultConfig: { ...HEADER_DEFAULT, siteTitleInitial: "T" },
    mockup: "header-compact",
    maxNavDepth: 1,
    mobileMenu: { style: "drawer-sidebar", showCta: true, ctaText: "Cari Produk", ctaLink: "#produk" },
    html: `<header style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:8px 16px 0 16px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;">
    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
      ${brandBlock("var(--color-accent)", "var(--color-text)", 32)}
      <div data-hdr-title style="${HEADING}font-weight:700;font-size:1rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
    </div>
    <nav style="${NAV_STYLE}">{{navItems}}</nav>
    ${ctaBlock('8px 18px')}
    ${burgerBtn()}
  </div>
  <div style="max-width:1152px;margin:0 auto;padding-bottom:10px;">
    <div style="display:flex;align-items:center;background:var(--color-background);border:1px solid var(--color-border);border-radius:10px;padding:10px 14px;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-text-muted);flex:none;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" placeholder="Cari produk..." style="border:none;outline:none;background:transparent;margin-left:8px;width:100%;${BODY}font-size:0.875rem;color:var(--color-text);" />
    </div>
  </div>
</header>`,
  },
  {
    id: vid("hdr-categories"),
    name: "Category Chips",
    description: "Bar utama + row kategori horizontal scroll",
    layout: vid("hdr-categories"),
    configFields: inferFields({ ...HEADER_DEFAULT, siteTitleInitial: "T" }),
    defaultConfig: { ...HEADER_DEFAULT, siteTitleInitial: "T" },
    mockup: "header-categories",
    maxNavDepth: 1,
    mobileMenu: { style: "drawer-sidebar", showCta: true, ctaText: "Cari Produk", ctaLink: "#produk" },
    html: `<header style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:12px 16px 0 16px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
      ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 36)}
      <div data-hdr-title style="${HEADING}font-weight:700;font-size:1.1rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
    </div>
    <nav style="${NAV_STYLE}">{{navItems}}</nav>
    ${ctaBlock()}
    ${burgerBtn()}
  </div>
  <div style="max-width:1152px;margin:0 auto;overflow-x:auto;white-space:nowrap;padding:12px 0;-webkit-overflow-scrolling:touch;scrollbar-width:none;">
    <span style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:6px 14px;border-radius:999px;font-size:0.8rem;font-weight:600;margin-right:8px;${BODY}">Semua</span>
    <span style="display:inline-block;background:var(--color-background);color:var(--color-text);border:1px solid var(--color-border);padding:6px 14px;border-radius:999px;font-size:0.8rem;margin-right:8px;${BODY}">Elektronik</span>
    <span style="display:inline-block;background:var(--color-background);color:var(--color-text);border:1px solid var(--color-border);padding:6px 14px;border-radius:999px;font-size:0.8rem;margin-right:8px;${BODY}">Fashion</span>
    <span style="display:inline-block;background:var(--color-background);color:var(--color-text);border:1px solid var(--color-border);padding:6px 14px;border-radius:999px;font-size:0.8rem;margin-right:8px;${BODY}">Makanan</span>
    <span style="display:inline-block;background:var(--color-background);color:var(--color-text);border:1px solid var(--color-border);padding:6px 14px;border-radius:999px;font-size:0.8rem;margin-right:8px;${BODY}">Rumah</span>
  </div>
</header>`,
  },
  {
    id: vid("hdr-glass"),
    name: "Glass Effect",
    description: "Header transparan blur di atas hero",
    layout: vid("hdr-glass"),
    configFields: inferFields({ ...HEADER_DEFAULT, siteTitleInitial: "T" }),
    defaultConfig: { ...HEADER_DEFAULT, siteTitleInitial: "T" },
    mockup: "header-glass",
    maxNavDepth: 1,
    mobileMenu: { style: "drawer-sidebar", showCta: true, ctaText: "Cari Produk", ctaLink: "#produk" },
    html: `<header style="background:color-mix(in srgb, var(--color-surface) 80%, transparent);backdrop-filter:blur(12px);border-bottom:1px solid color-mix(in srgb, var(--color-border) 50%, transparent);padding:12px 16px;position:relative;z-index:40;">
  <div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;">
    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
      ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 36)}
      <div data-hdr-title style="${HEADING}font-weight:700;font-size:1.1rem;color:var(--color-text);line-height:1.2;">{{siteTitle}}</div>
    </div>
    <nav style="${NAV_STYLE}">{{navItems}}</nav>
    ${ctaBlock()}
    ${burgerBtn()}
  </div>
</header>`,
  },
  {
    id: vid("hdr-minimal"),
    name: "Minimal",
    description: "Logo + hamburger only, brand centered",
    layout: vid("hdr-minimal"),
    configFields: inferFields({ ...HEADER_DEFAULT, siteTitleInitial: "T" }),
    defaultConfig: { ...HEADER_DEFAULT, siteTitleInitial: "T" },
    mockup: "header-minimal",
    maxNavDepth: 1,
    mobileMenu: { style: "drawer-sidebar", showCta: true, ctaText: "Cari Produk", ctaLink: "#produk" },
    html: `<header style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:16px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
    ${burgerBtn()}
    <div style="display:flex;align-items:center;gap:10px;">
      ${brandBlock("var(--color-primary)", "var(--color-on-primary)", 32)}
      <div data-hdr-title style="${HEADING}font-weight:700;font-size:1.1rem;color:var(--color-text);">{{siteTitle}}</div>
    </div>
    <div style="width:44px;"></div>
  </div>
</header>`,
  },
];

const FOOTER_FIELDS_BASE = {
  siteTitle: BRAND,
  logoUrl: "",
  text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.`,
  navItems: NAV_ITEMS.slice(0, 4),
  showNav: true,
  showSocial: true,
  socials: [{ label: "IG" }, { label: "FB" }, { label: "WA" }],
  address: "Jl. Sudirman No. 123, Jakarta",
  phone: "0812-3456-7890",
  email: "halo@tokokita.id",
};

function socialRow(fg: string, border: string): string {
  return `{{#if showSocial}}<div style="display:flex;gap:8px;margin-top:12px;">{{#socials}}<span style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;border:1px solid ${border};color:${fg};font-size:0.7rem;font-weight:700;${BODY}">{{label}}</span>{{/socials}}</div>{{/if}}`;
}

export const FOOTERS: FooterVariant[] = [
  {
    id: vid("ftr-columns"),
    name: "Kolom",
    description: "4 kolom: brand, navigasi, bantuan, kontak",
    layout: vid("ftr-columns"),
    configFields: inferFields(FOOTER_FIELDS_BASE),
    defaultConfig: { ...FOOTER_FIELDS_BASE },
    mockup: "footer-columns",
    html: `<footer style="background:var(--color-primary);color:var(--color-on-primary);padding:48px 16px 24px 16px;">
  <div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:24px;">
    <div>
      <div style="${HEADING}font-weight:700;font-size:1.25rem;margin-bottom:8px;">{{siteTitle}}</div>
      <p style="font-size:0.875rem;opacity:0.85;${BODY}">{{address}}</p>
    </div>
    <div>
      <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;opacity:0.7;${BODY}">Navigasi</div>
      {{#if showNav}}<nav style="display:flex;flex-direction:column;gap:6px;font-size:0.875rem;${BODY}">{{navItems}}</nav>{{/if}}
    </div>
    <div>
      <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;opacity:0.7;${BODY}">Bantuan</div>
      <p style="font-size:0.875rem;${BODY}">{{phone}}<br />{{email}}</p>
      ${socialRow("var(--color-on-primary)", "var(--color-accent)")}
    </div>
  </div>
  <div style="border-top:1px solid var(--color-accent);margin-top:32px;padding-top:16px;text-align:center;font-size:0.8rem;opacity:0.75;${BODY}">{{text}}</div>
</footer>`,
  },
  {
    id: vid("ftr-newsletter"),
    name: "Newsletter",
    description: "Fokus daftar newsletter + sosmed",
    layout: vid("ftr-newsletter"),
    configFields: inferFields({ ...FOOTER_FIELDS_BASE, newsletterTitle: "Dapatkan promo", newsletterText: "Diskon hingga 50% tiap minggu.", newsletterButtonText: "Daftar" }),
    defaultConfig: { ...FOOTER_FIELDS_BASE, newsletterTitle: "Dapatkan promo", newsletterText: "Diskon hingga 50% tiap minggu.", newsletterButtonText: "Daftar" },
    mockup: "footer-newsletter",
    html: `<footer style="background:var(--color-surface);border-top:1px solid var(--color-border);padding:40px 16px 24px 16px;">
  <div style="max-width:1152px;margin:0 auto;">
    <div style="background:var(--color-background);border:1px solid var(--color-border);border-radius:12px;padding:24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;">
      <div>
        <div style="${HEADING}font-weight:700;font-size:1.1rem;color:var(--color-text);">{{newsletterTitle}}</div>
        <p style="font-size:0.875rem;color:var(--color-text-muted);margin-top:4px;${BODY}">{{newsletterText}}</p>
      </div>
      <a href="#" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:10px 24px;border-radius:999px;font-weight:600;text-decoration:none;font-size:0.875rem;${BODY}">{{newsletterButtonText}}</a>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin-top:24px;">
      {{#if showNav}}<nav style="display:flex;gap:16px;font-size:0.875rem;color:var(--color-text);${BODY}">{{navItems}}</nav>{{/if}}
      ${socialRow("var(--color-text)", "var(--color-border)")}
    </div>
    <p style="text-align:center;font-size:0.8rem;color:var(--color-text-muted);margin-top:16px;${BODY}">{{text}}</p>
  </div>
</footer>`,
  },
  {
    id: vid("ftr-minimal"),
    name: "Minimal",
    description: "Hanya copyright + link singkat",
    layout: vid("ftr-minimal"),
    configFields: inferFields({ siteTitle: BRAND, logoUrl: "", text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.` }),
    defaultConfig: { siteTitle: BRAND, logoUrl: "", text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.` },
    mockup: "footer-minimal",
    html: `<footer style="background:var(--color-surface);border-top:1px solid var(--color-border);padding:16px;">
  <div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
    <span style="${HEADING}font-weight:700;color:var(--color-text);">{{siteTitle}}</span>
    <span style="font-size:0.8rem;color:var(--color-text-muted);${BODY}">{{text}}</span>
  </div>
</footer>`,
  },
  {
    id: vid("ftr-cta"),
    name: "CTA Banner",
    description: "Banner CTA + copyright",
    layout: vid("ftr-cta"),
    configFields: inferFields({ siteTitle: BRAND, logoUrl: "", text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.`, ctaTitle: "Siap mulai belanja?", ctaButtonText: "Lihat Produk", ctaButtonLink: "#produk" }),
    defaultConfig: { siteTitle: BRAND, logoUrl: "", text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.`, ctaTitle: "Siap mulai belanja?", ctaButtonText: "Lihat Produk", ctaButtonLink: "#produk" },
    mockup: "footer-cta",
    html: `<footer style="background:var(--color-primary);color:var(--color-on-primary);padding:40px 16px 24px 16px;">
  <div style="max-width:1152px;margin:0 auto;text-align:center;">
    <h3 style="${HEADING}font-size:1.5rem;font-weight:700;margin:0 0 12px 0;">{{ctaTitle}}</h3>
    <a href="{{ctaButtonLink}}" style="display:inline-block;background:var(--color-accent);color:var(--color-text);padding:12px 32px;border-radius:999px;font-weight:600;text-decoration:none;${BODY}">{{ctaButtonText}}</a>
    <div style="border-top:1px solid color-mix(in srgb, var(--color-on-primary) 30%, transparent);margin-top:32px;padding-top:16px;font-size:0.8rem;opacity:0.75;${BODY}">{{text}}</div>
  </div>
</footer>`,
  },
  {
    id: vid("ftr-contact"),
    name: "Kontak Fokus",
    description: "Alamat dan kontak besar di atas",
    layout: vid("ftr-contact"),
    configFields: inferFields({ siteTitle: BRAND, logoUrl: "", text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.`, address: "Jl. Sudirman No. 123, Jakarta", phone: "0812-3456-7890", email: "halo@tokokita.id", navItems: NAV_ITEMS.slice(0, 4) }),
    defaultConfig: { siteTitle: BRAND, logoUrl: "", text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.`, address: "Jl. Sudirman No. 123, Jakarta", phone: "0812-3456-7890", email: "halo@tokokita.id", navItems: NAV_ITEMS.slice(0, 4) },
    mockup: "footer-contact",
    html: `<footer style="background:var(--color-surface);border-top:1px solid var(--color-border);padding:32px 16px 24px 16px;">
  <div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:20px;">
    <div style="background:var(--color-background);border:1px solid var(--color-border);border-radius:12px;padding:20px;">
      <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);margin-bottom:8px;${BODY}">Alamat</div>
      <p style="font-size:0.9rem;color:var(--color-text);${BODY}">{{address}}</p>
    </div>
    <div style="background:var(--color-background);border:1px solid var(--color-border);border-radius:12px;padding:20px;">
      <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--color-text-muted);margin-bottom:8px;${BODY}">Kontak</div>
      <p style="font-size:0.9rem;color:var(--color-text);${BODY}">{{phone}}<br />{{email}}</p>
    </div>
  </div>
  <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-top:24px;padding-top:16px;border-top:1px solid var(--color-border);">
    <span style="${HEADING}font-weight:700;color:var(--color-text);">{{siteTitle}}</span>
    <span style="font-size:0.8rem;color:var(--color-text-muted);${BODY}">{{text}}</span>
  </div>
</footer>`,
  },
];
