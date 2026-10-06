import type { FooterVariant, HeaderVariant } from "../../template-types";
import { ACCENT, BODY, HEADER_CONFIG, HEADING, ICON, inferFields, footerConfig, vid } from "./shared";

function brand(markSize = 38): string {
  return `{{#if logoUrl}}<img data-hdr-mark src="{{logoUrl}}" alt="{{siteTitle}}" style="width:${markSize}px;height:${markSize}px;object-fit:cover;border-radius:10px;flex:none;" />{{/if}}{{#if !logoUrl}}<span data-hdr-mark style="display:inline-flex;align-items:center;justify-content:center;width:${markSize}px;height:${markSize}px;border-radius:10px;background:var(--color-primary);color:var(--color-on-primary);${HEADING}font-weight:800;">{{siteTitleInitial}}</span>{{/if}}<span data-hdr-title style="${HEADING}font-size:1.1rem;font-weight:800;color:var(--color-text);white-space:nowrap;">{{siteTitle}}</span>`;
}

function iconLink(icon: string, labelKey: string, hrefKey: string, compact = false): string {
  return `<a href="{{${hrefKey}}}" aria-label="{{${labelKey}}}" style="display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;min-width:44px;padding:${compact ? "0 8px" : "0 12px"};border-radius:8px;color:var(--color-text);${BODY}font-size:0.78rem;font-weight:700;text-decoration:none;">${icon}${compact ? "" : `<span>{{${labelKey}}}</span>`}</a>`;
}

function searchLink(compact = false): string {
  return `<a href="{{searchLink}}" aria-label="{{searchLabel}}" style="display:flex;align-items:center;gap:10px;min-height:44px;min-width:44px;flex:1;background:var(--color-background);border:1px solid var(--color-border);border-radius:${compact ? "8px" : "999px"};padding:0 14px;color:var(--color-text-muted);${BODY}font-size:0.88rem;text-decoration:none;">${ICON.search}<span>{{searchPlaceholder}}</span></a>`;
}

function navMarkup(): string {
  return `<nav data-hdr-navpos="{{menuPosition}}" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;${BODY}font-size:0.85rem;">{{navItems}}</nav>`;
}

function burger(): string {
  return `<button type="button" data-hdr-burger aria-label="Buka menu navigasi" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;flex:none;background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px;color:var(--color-text);">${ICON.menu}</button>`;
}

function cta(): string {
  return `{{#if showCta}}<a href="{{ctaLink}}" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;background:var(--color-primary);color:var(--color-on-primary);border-radius:8px;padding:0 14px;${BODY}font-size:0.85rem;font-weight:700;text-decoration:none;white-space:nowrap;">{{ctaText}}</a>{{/if}}`;
}

function header(id: string, name: string, description: string, html: string): HeaderVariant {
  return {
    id: vid(id),
    name,
    description,
    layout: vid(id),
    configFields: inferFields(HEADER_CONFIG),
    defaultConfig: { ...HEADER_CONFIG },
    mockup: `header-${id}`,
    maxNavDepth: 1,
    mobileMenu: { style: "drawer-sidebar", showCta: true, ctaText: "Lihat Promo", ctaLink: "#promo" },
    html: `<header data-tpl-type="header" data-tpl-variant="${vid(id)}" style="background:var(--color-surface);border-bottom:1px solid var(--color-border);">${html}</header>`,
  };
}

export const HEADERS: HeaderVariant[] = [
  header("hdr-market-counter", "Meja Pasar", "Identitas, pencarian, dan pintasan belanja dalam satu baris.",
    `<div style="background:var(--color-primary);color:var(--color-on-primary);padding:7px 16px;text-align:center;${BODY}font-size:0.75rem;">Pilihan toko lokal, dekat untuk kebutuhanmu</div><div style="max-width:1200px;margin:0 auto;padding:12px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;"><div style="display:flex;align-items:center;gap:9px;">${brand()}</div>${searchLink()}<div style="display:flex;align-items:center;gap:2px;">${iconLink(ICON.heart, "wishlistLabel", "wishlistLink", true)}${iconLink(ICON.cart, "cartLabel", "cartLink", true)}${iconLink(ICON.user, "accountLabel", "accountLink", true)}</div>${burger()}${cta()}</div><div style="max-width:1200px;margin:0 auto;padding:0 16px 12px;">${navMarkup()}</div>`),
  header("hdr-category-stall", "Lorong Kategori", "Navigasi kategori tampil sebagai jalur kedua di bawah pencarian.",
    `<div style="max-width:1200px;margin:0 auto;padding:14px 16px 10px;display:grid;grid-template-columns:auto minmax(180px,1fr) auto;align-items:center;gap:14px;"><div style="display:flex;align-items:center;gap:9px;">${brand(34)}</div>${searchLink(true)}<div style="display:flex;align-items:center;">${iconLink(ICON.cart, "cartLabel", "cartLink")}${burger()}</div></div><div style="border-top:1px solid var(--color-border);"><div style="max-width:1200px;margin:0 auto;padding:8px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">${navMarkup()}<div style="display:flex;align-items:center;gap:4px;">${iconLink(ICON.heart, "wishlistLabel", "wishlistLink", true)}${iconLink(ICON.user, "accountLabel", "accountLink")}${cta()}</div></div></div>`),
  header("hdr-market-board", "Papan Belanja", "Pencarian jadi fokus utama dengan utilitas berlabel.",
    `<div style="max-width:1200px;margin:0 auto;padding:16px;display:grid;grid-template-columns:auto minmax(200px,1fr) auto;gap:14px;align-items:center;"><div style="display:flex;align-items:center;gap:9px;">${brand(42)}</div>${searchLink()}<div style="display:flex;align-items:center;background:var(--color-background);border:1px solid var(--color-border);border-radius:10px;">${iconLink(ICON.heart, "wishlistLabel", "wishlistLink")}${iconLink(ICON.cart, "cartLabel", "cartLink")}${iconLink(ICON.user, "accountLabel", "accountLink")}</div>${burger()}</div><div style="max-width:1200px;margin:0 auto;padding:0 16px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">${navMarkup()}${cta()}</div>`),
  header("hdr-pocket-market", "Pasar Saku", "Bar ringkas dan pencarian lebar untuk tampilan mobile-first.",
    `<div style="max-width:1200px;margin:0 auto;padding:10px 14px;display:flex;align-items:center;gap:10px;"><div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;">${brand(32)}</div>${iconLink(ICON.heart, "wishlistLabel", "wishlistLink", true)}${iconLink(ICON.cart, "cartLabel", "cartLink", true)}${iconLink(ICON.user, "accountLabel", "accountLink", true)}${burger()}</div><div style="max-width:1200px;margin:0 auto;padding:0 14px 10px;">${searchLink(true)}</div><div style="max-width:1200px;margin:0 auto;padding:0 14px 10px;">${navMarkup()}</div>`),
  header("hdr-shop-window", "Etalase Toko", "Logo dan menu editorial dengan utilitas terpisah di sisi kanan.",
    `<div style="max-width:1200px;margin:0 auto;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;"><div style="display:flex;align-items:center;gap:10px;">${brand(44)}<span style="${BODY}font-size:0.75rem;color:var(--color-text-muted);">{{tagline}}</span></div><div style="display:flex;align-items:center;gap:8px;">${iconLink(ICON.heart, "wishlistLabel", "wishlistLink")}${iconLink(ICON.cart, "cartLabel", "cartLink")}${iconLink(ICON.user, "accountLabel", "accountLink")}${burger()}</div></div><div style="max-width:1200px;margin:0 auto;padding:0 16px 12px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">${navMarkup()}<div style="display:flex;align-items:center;gap:10px;min-width:min(100%,260px);">${searchLink(true)}${cta()}</div></div>`),
];

function socials(): string {
  return `{{#if showSocial}}<div style="display:flex;gap:8px;">{{#socials}}<a href="{{url}}" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:1px solid currentColor;border-radius:50%;${BODY}font-size:0.7rem;font-weight:700;color:inherit;text-decoration:none;">{{label}}</a>{{/socials}}</div>{{/if}}`;
}

function footer(id: string, name: string, description: string, html: string, extra: Record<string, unknown> = {}): FooterVariant {
  const config = footerConfig(extra);
  return {
    id: vid(id),
    name,
    description,
    layout: vid(id),
    configFields: inferFields(config),
    defaultConfig: config,
    mockup: `footer-${id}`,
    html: `<footer data-tpl-type="footer" data-tpl-variant="${vid(id)}">${html}</footer>`,
  };
}

const footerNav = `<nav style="display:flex;flex-direction:column;gap:8px;${BODY}font-size:0.85rem;">{{navItems}}</nav>`;

export const FOOTERS: FooterVariant[] = [
  footer("ftr-market-hall", "Balai Pasar", "Penutup multi-kolom dengan kontak dan navigasi.",
    `<div style="background:var(--color-primary);color:var(--color-on-primary);padding:38px 16px 20px;"><div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:24px;"><div><h2 style="${HEADING}font-size:1.3rem;margin:0;">{{siteTitle}}</h2><p style="${BODY}font-size:0.85rem;line-height:1.6;">Belanja lokal, lebih dekat dengan keseharian.</p><p style="${BODY}font-size:0.82rem;">{{address}}<br />{{phone}}</p>${socials()}</div><div>{{#if showNav}}<h3 style="${BODY}font-size:0.8rem;">JELAJAHI</h3>${footerNav}{{/if}}</div><div><h3 style="${BODY}font-size:0.8rem;">BANTUAN</h3><a href="mailto:{{email}}" style="${BODY}color:inherit;">{{email}}</a></div></div><p style="max-width:1152px;margin:26px auto 0;padding-top:14px;border-top:1px solid var(--color-accent);${BODY}font-size:0.78rem;">{{text}}</p></div>`),
  footer("ftr-closing-stall", "Teras Toko", "CTA penutup dengan navigasi yang ringkas.",
    `<div style="background:var(--color-background);padding:24px 16px;"><div style="max-width:1152px;margin:auto;background:var(--color-accent);color:var(--color-on-accent);border-radius:14px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;"><div><span style="${ACCENT}color:var(--color-on-accent);">Sampai jumpa di toko</span><h2 style="${HEADING}font-size:1.45rem;color:var(--color-on-accent);margin:6px 0;">{{siteTitle}}</h2><p style="${BODY}color:var(--color-on-accent);">{{address}} · {{phone}}</p></div><a href="#produk" style="display:inline-flex;align-items:center;min-height:44px;background:var(--color-primary);color:var(--color-on-primary);padding:0 18px;border-radius:6px;${BODY}font-weight:700;text-decoration:none;">Kembali belanja</a></div><div style="max-width:1152px;margin:18px auto 0;display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;">{{#if showNav}}${footerNav}{{/if}}${socials()}<span style="${BODY}font-size:0.78rem;color:var(--color-text-muted);">{{text}}</span></div></div>`),
  footer("ftr-neighbor-note", "Catatan Tetangga", "Penutup editorial yang berfokus pada cerita dan kontak.",
    `<div style="background:var(--color-surface);border-top:4px solid var(--color-primary);padding:32px 16px 18px;"><div style="max-width:900px;margin:auto;text-align:center;"><span style="${ACCENT}font-size:1rem;color:var(--color-primary);">PILIHAN DARI SEKITAR</span><h2 style="${HEADING}font-size:1.6rem;color:var(--color-text);margin:8px 0;">{{siteTitle}}</h2><p style="${BODY}color:var(--color-text-muted);">{{address}} · {{phone}} · {{email}}</p><div style="display:flex;justify-content:center;margin:16px 0;">${socials()}</div>{{#if showNav}}<div style="display:flex;justify-content:center;">${footerNav}</div>{{/if}}<p style="${BODY}font-size:0.78rem;color:var(--color-text-muted);margin-top:22px;">{{text}}</p></div></div>`),
  footer("ftr-market-receipt", "Nota Belanja", "Penutup kompak dalam susunan seperti nota toko.",
    `<div style="background:var(--color-background);padding:26px 16px;"><div style="max-width:760px;margin:auto;background:var(--color-surface);border:1px dashed var(--color-primary);padding:20px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;"><div><strong style="${HEADING}font-size:1.1rem;color:var(--color-text);">{{siteTitle}}</strong><p style="${BODY}font-size:0.82rem;color:var(--color-text-muted);">{{address}} · {{phone}}</p></div><div style="text-align:right;">${socials()}</div>{{#if showNav}}<div style="grid-column:1/-1;border-top:1px solid var(--color-border);padding-top:14px;">${footerNav}</div>{{/if}}<span style="grid-column:1/-1;${BODY}font-size:0.78rem;color:var(--color-text-muted);">{{text}}</span></div></div>`),
  footer("ftr-night-market", "Pasar Senja", "Penutup gelap dengan kartu informasi bertingkat.",
    `<div style="background:var(--color-text);color:var(--color-background);padding:38px 16px 18px;"><div style="max-width:1152px;margin:auto;display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:16px;align-items:start;"><div style="background:var(--color-primary);color:var(--color-on-primary);border-radius:12px;padding:18px;"><span style="${ACCENT}color:var(--color-accent-on-primary);">{{siteTitle}}</span><p style="${BODY}font-size:0.85rem;">{{address}}<br />{{phone}}</p>${socials()}</div><div>{{#if showNav}}<h3 style="${HEADING}font-size:1rem;">Temukan</h3>${footerNav}{{/if}}</div><div><h3 style="${HEADING}font-size:1rem;">Hubungi</h3><a href="mailto:{{email}}" style="${BODY}color:inherit;">{{email}}</a></div></div><p style="max-width:1152px;margin:22px auto 0;border-top:1px solid var(--color-border);padding-top:12px;${BODY}font-size:0.78rem;">{{text}}</p></div>`),
];