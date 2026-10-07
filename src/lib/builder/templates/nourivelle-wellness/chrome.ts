import type { FooterVariant, HeaderVariant } from "../../template-types";
import { BRAND, HEADER_CONFIG, NAV_ITEMS, ACCENT, BODY, HEADING, footerConfig, inferFields, vid } from "./shared";

function brandMark(size: number): string {
  return `{{#if logoUrl}}<img data-hdr-mark src="{{logoUrl}}" alt="{{siteTitle}}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex:none;" />{{/if}}{{#if !logoUrl}}<span data-hdr-mark style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:var(--color-secondary);color:var(--color-text);font-size:${Math.round(size * 0.48)}px;font-weight:800;flex:none;">{{siteTitleInitial}}</span>{{/if}}`;
}

function burger(): string {
  return `<button type="button" data-hdr-burger aria-label="Buka menu navigasi" style="display:none;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--color-border);border-radius:50%;background:var(--color-background);color:var(--color-text);flex:none;"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>`;
}

function headerHtml(layout: number): string {
  const brand = `<a href="#beranda" style="display:flex;align-items:center;gap:10px;min-width:0;color:var(--color-text);text-decoration:none;">${brandMark(layout === 2 ? 42 : 36)}<span data-hdr-title style="${HEADING}font-size:1.05rem;font-weight:800;line-height:1.1;white-space:nowrap;">{{siteTitle}}</span></a>`;
  const nav = `<nav data-hdr-navpos="{{menuPosition}}" style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px 18px;${BODY}font-size:.82rem;">{{navItems}}</nav>`;
  const cta = `{{#if showCta}}<a data-hdr-cta href="{{ctaLink}}" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 17px;border-radius:999px;background:var(--color-primary);color:var(--color-on-primary);${BODY}font-size:.82rem;font-weight:700;text-decoration:none;white-space:nowrap;">{{ctaText}}</a>{{/if}}`;
  const search = `<a href="#produk" aria-label="Cari produk" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--color-border);border-radius:50%;color:var(--color-text);text-decoration:none;"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4 4"/></svg></a>`;

  if (layout === 0) return `<header style="background:var(--color-background);border-bottom:1px solid var(--color-border);padding:12px 18px;"><div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;">${brand}${nav}<div style="display:flex;align-items:center;gap:8px;">${search}${cta}${burger()}</div></div></header>`;
  if (layout === 1) return `<header style="background:var(--color-surface);border-bottom:1px solid var(--color-border);padding:10px 18px 0;"><div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:14px;padding-bottom:10px;">${brand}<span style="${ACCENT}color:var(--color-primary-on-surface);font-size:1rem;">{{tagline}}</span><div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;">${search}${burger()}</div></div><div style="max-width:1152px;margin:0 auto;padding:0 0 10px;display:flex;justify-content:center;">${nav}</div></header>`;
  if (layout === 2) return `<header style="background:var(--color-primary);color:var(--color-on-primary);padding:14px 18px;"><div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;">${brand}<div style="display:flex;align-items:center;gap:12px;"><nav style="display:flex;flex-wrap:wrap;gap:16px;${BODY}font-size:.82rem;color:var(--color-on-primary);">{{navItems}}</nav>${cta}${burger()}</div></div></header>`;
  if (layout === 3) return `<header style="background:var(--color-background);padding:10px 18px;"><div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:18px;position:relative;">${brand}<span style="position:absolute;left:0;display:flex;align-items:center;gap:8px;">${search}</span><span style="position:absolute;right:0;display:flex;align-items:center;gap:8px;">${cta}${burger()}</span></div><div style="max-width:1152px;margin:10px auto 0;padding-top:10px;border-top:1px solid var(--color-border);display:flex;justify-content:center;">${nav}</div></header>`;
  return `<header style="background:var(--color-surface);padding:12px 18px;"><div style="max-width:1152px;margin:0 auto;display:flex;align-items:center;gap:14px;">${brand}<div style="flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:0 14px;min-height:44px;border-radius:999px;border:1px solid var(--color-border);background:var(--color-background);color:var(--color-text-muted);${BODY}font-size:.85rem;"><span aria-hidden="true">⌕</span><span>{{searchPlaceholder}}</span></div>${nav}${cta}${burger()}</div></header>`;
}

const HEADER_NAMES = ["Editorial", "Ritual Bar", "Deep Teal", "Centered Mark", "Search Atelier"];
const HEADER_DESCRIPTIONS = [
  "Logo, menu ringkas, dan aksi belanja dalam satu garis editorial.",
  "Identitas brand dipisah dari navigasi dengan tagline di tengah.",
  "Bar teal kontras untuk tampilan storefront yang tegas.",
  "Brand menjadi pusat dengan navigasi pada baris tersendiri.",
  "Pencarian produk menjadi titik fokus untuk katalog yang luas.",
];

export const HEADERS: HeaderVariant[] = HEADER_NAMES.map((name, layout) => ({
  id: vid(`hdr-${["editorial", "ritual", "deep-teal", "center-mark", "search-atelier"][layout]}`),
  name,
  description: HEADER_DESCRIPTIONS[layout],
  layout: vid(`hdr-layout-${layout + 1}`),
  configFields: inferFields(HEADER_CONFIG),
  defaultConfig: { ...HEADER_CONFIG },
  mockup: `header-nourivelle-${layout + 1}`,
  maxNavDepth: 1,
  mobileMenu: { style: "drawer-sidebar", showCta: true, ctaText: "Jelajahi Produk", ctaLink: "#produk" },
  html: headerHtml(layout),
}));

const FOOTER_BASE = footerConfig();
const FOOTER_LAYOUTS = [
  { slug: "five-columns", name: "Botanical Columns", desc: "Lima kolom dengan bidang teal dan jalur navigasi terpisah." },
  { slug: "brand-led", name: "Brand Led", desc: "Brand besar menjadi jangkar, tautan disusun berlapis." },
  { slug: "newsletter-band", name: "Newsletter Band", desc: "Pita daftar kabar di atas susunan kontak ringkas." },
  { slug: "centered-seal", name: "Centered Seal", desc: "Komposisi simetris dengan cap brand di tengah." },
  { slug: "contact-ledger", name: "Contact Ledger", desc: "Kontak utama dipisahkan oleh garis dan daftar navigasi." },
];

function footerHtml(layout: number): string {
  const nav = `{{#if showNav}}<nav style="display:flex;flex-wrap:wrap;gap:10px 18px;${BODY}font-size:.82rem;">{{navItems}}</nav>{{/if}}`;
  const social = `{{#if showSocial}}<div style="display:flex;flex-wrap:wrap;gap:8px;">{{#socials}}<a href="{{url}}" aria-label="{{label}}" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid var(--color-accent);border-radius:50%;color:var(--color-on-primary);${BODY}font-size:.72rem;font-weight:700;text-decoration:none;">{{label}}</a>{{/socials}}</div>{{/if}}`;
  const copyright = `<div style="border-top:1px solid var(--color-accent);margin-top:26px;padding-top:16px;${BODY}font-size:.75rem;color:var(--color-on-primary);opacity:.86;">{{text}}</div>`;
  const base = `background:var(--color-primary);color:var(--color-on-primary);padding:38px 20px 22px;`;
  if (layout === 0) return `<footer style="${base}"><div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:24px;"><div><strong style="${HEADING}font-size:1.2rem;">{{siteTitle}}</strong><p style="${BODY}font-size:.82rem;line-height:1.6;">Rawat diri dengan penuh perhatian.</p></div><div><strong style="${BODY}font-size:.76rem;">JELAJAHI</strong>${nav}</div><div><strong style="${BODY}font-size:.76rem;">BANTUAN</strong><p style="${BODY}font-size:.82rem;line-height:1.8;">{{phone}}<br />{{email}}</p></div><div><strong style="${BODY}font-size:.76rem;">KUNJUNGI</strong><p style="${BODY}font-size:.82rem;">{{address}}</p></div><div>${social}</div></div><div style="max-width:1152px;margin:0 auto;">${copyright}</div></footer>`;
  if (layout === 1) return `<footer style="${base}"><div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));align-items:end;gap:24px;"><div><span style="${ACCENT}font-size:1.1rem;color:var(--color-accent-on-primary);">A little care, every day</span><h2 style="${HEADING}font-size:clamp(2rem,5vw,3.5rem);line-height:1;margin:10px 0;">{{siteTitle}}</h2><p style="${BODY}font-size:.85rem;max-width:32rem;">{{address}} · {{email}}</p></div><div style="display:flex;flex-direction:column;align-items:flex-start;gap:18px;">${nav}${social}</div></div><div style="max-width:1152px;margin:0 auto;">${copyright}</div></footer>`;
  if (layout === 2) return `<footer style="background:var(--color-surface);padding:30px 20px;color:var(--color-text);"><div style="max-width:1152px;margin:0 auto;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:18px;align-items:center;padding:24px;border-radius:18px;background:var(--color-primary);color:var(--color-on-primary);"><div><span style="${ACCENT}font-size:1rem;color:var(--color-accent-on-primary);">Kabar baik, langsung ke inbox</span><h2 style="${HEADING}font-size:1.55rem;margin:6px 0;">Temukan ritual barumu</h2><p style="${BODY}font-size:.85rem;margin:0;">{{email}}</p></div><a href="#newsletter" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:999px;background:var(--color-accent);color:var(--color-on-accent);${BODY}font-weight:700;text-decoration:none;">Daftar newsletter</a></div><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:18px;padding-top:22px;"><strong style="${HEADING}font-size:1.1rem;">{{siteTitle}}</strong>${nav}${social}</div><div style="${BODY}font-size:.75rem;margin-top:18px;">{{text}}</div></div></footer>`;
  if (layout === 3) return `<footer style="${base}text-align:center;"><div style="max-width:800px;margin:0 auto;"><span style="display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;border:1px solid var(--color-accent);border-radius:50%;${HEADING}font-size:1.4rem;font-weight:800;">N</span><h2 style="${HEADING}font-size:1.5rem;margin:12px 0 6px;">{{siteTitle}}</h2><p style="${BODY}font-size:.84rem;">{{address}} · {{phone}}</p><div style="display:flex;justify-content:center;margin:18px 0;">${nav}</div><div style="display:flex;justify-content:center;">${social}</div>${copyright}</div></footer>`;
  return `<footer style="${base}"><div style="max-width:1152px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:18px;align-items:start;"><div><span style="${BODY}font-size:.72rem;text-transform:uppercase;">Temui kami</span><h2 style="${HEADING}font-size:1.5rem;margin:8px 0;">{{siteTitle}}</h2><p style="${BODY}font-size:.84rem;line-height:1.7;">{{address}}<br />{{hours}}</p></div><div style="border-left:1px solid var(--color-accent);padding-left:18px;"><span style="${BODY}font-size:.72rem;text-transform:uppercase;">Layanan pelanggan</span><p style="${BODY}font-size:.9rem;line-height:1.8;">{{phone}}<br />{{email}}</p></div><div style="border-left:1px solid var(--color-accent);padding-left:18px;"><span style="${BODY}font-size:.72rem;text-transform:uppercase;">Tautan pilihan</span>${nav}</div><div style="display:flex;align-items:center;">${social}</div></div><div style="max-width:1152px;margin:0 auto;">${copyright}</div></footer>`;
}

export const FOOTERS: FooterVariant[] = FOOTER_LAYOUTS.map((layout, index) => ({
  id: vid(`ftr-${layout.slug}`),
  name: layout.name,
  description: layout.desc,
  layout: vid(`ftr-layout-${index + 1}`),
  configFields: inferFields(FOOTER_BASE),
  defaultConfig: { ...FOOTER_BASE },
  mockup: `footer-nourivelle-${index + 1}`,
  html: footerHtml(index),
}));

export { BRAND, NAV_ITEMS };