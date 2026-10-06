import type {
  ConfigField,
  FooterVariant,
  HeaderVariant,
  SectionTypeDefinition,
} from "../template-types";
import type { CatalogTemplate } from "./catalog";

const BRAND = "Toko Kita";
const NS = "marketplace-hybrid";
const vid = (name: string) => `${NS}:${name}`;

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

function inferFields(config: Record<string, unknown>, nested = false): ConfigField[] {
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

const NAV_ITEMS = [
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

const IMG = {
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

const BODY = "font-family:var(--font-body),sans-serif;";
const HEADING = "font-family:var(--font-heading),sans-serif;";
const ACCENT = "font-family:var(--font-accent),sans-serif;";

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

const HEADERS: HeaderVariant[] = [
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

const FOOTERS: FooterVariant[] = [
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

function sectionShell(inner: string, bg: string, pad = '64px 24px'): string {
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

function eyebrow(text: string, color = "var(--color-accent)"): string {
  return `<div style="${ACCENT}font-size:1rem;color:${color};margin-bottom:8px;">${text}</div>`;
}

/* hero */
const HERO_CONFIG = {
  badge: "Gratis Ongkir",
  eyebrow: "Belanja Lebih Mudah",
  headline: "Produk Terbaik untuk Anda",
  subheadline: "Temukan ribuan produk berkualitas dengan harga terjangkau dan pengiriman cepat.",
  cta_text: "Mulai Belanja",
  cta_link: "#produk",
  image: IMG.hero,
};

const HERO_HTML = sectionShell(
  `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:32px;align-items:center;">
    <div>
      <div style="display:inline-block;background:var(--color-accent);color:var(--color-text);padding:6px 14px;border-radius:999px;font-size:0.75rem;font-weight:700;margin-bottom:16px;${BODY}">✦ {{badge}}</div>
      ${eyebrow("{{eyebrow}}", "var(--color-primary)")}
      <h1 style="${HEADING}font-size:clamp(2rem,5vw,3rem);font-weight:700;line-height:1.15;color:var(--color-text);margin:0 0 12px 0;">{{headline}}</h1>
      <p style="font-size:1rem;line-height:1.6;color:var(--color-text-muted);margin:0 0 20px 0;${BODY}">{{subheadline}}</p>
      <a href="{{cta_link}}" style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);padding:14px 32px;border-radius:999px;font-weight:600;text-decoration:none;${BODY}">{{cta_text}}</a>
    </div>
    <div style="border-radius:12px;overflow:hidden;"><img src="{{image}}" alt="Hero" style="width:100%;height:auto;display:block;" /></div>
  </div>`,
  "var(--color-background)",
);

/* features */
const FEATURES_CONFIG = {
  title: "Kenapa Belanja di Sini?",
  subtitle: "Keunggulan yang membuat belanja Anda lebih nyaman.",
  items: [
    { icon: "🚚", title: "Pengiriman Cepat", description: "Dikirim dari kota Anda, sampai 1-3 hari." },
    { icon: "🔒", title: "Pembayaran Aman", description: "COD, transfer, dan e-wallet tersedia." },
    { icon: "↩️", title: "Garansi Retur", description: "Barang tidak sesuai? Kembalikan gratis." },
  ],
};

const FEATURES_HTML = sectionShell(
  `<div style="text-align:center;margin-bottom:32px;">
    <h2 style="${HEADING}font-size:clamp(1.5rem,4vw,2.2rem);font-weight:700;color:var(--color-text);margin:0;">{{title}}</h2>
    <p style="${BODY}font-size:1rem;color:var(--color-text-muted);margin:8px 0 0 0;">{{subtitle}}</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:20px;">
    {{#items}}<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:24px;text-align:center;">
      <div style="font-size:2rem;margin-bottom:12px;">{{icon}}</div>
      <div style="${HEADING}font-weight:700;font-size:1rem;color:var(--color-text);">{{title}}</div>
      <p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);margin:8px 0 0 0;">{{description}}</p>
    </div>{{/items}}
  </div>`,
  "var(--color-surface)",
);

/* product_grid */
const PRODUCT_CONFIG = {
  title: "Produk Populer",
  items: [
    { name: "Kemeja Pria Slim Fit", price: "Rp 89.000", image: IMG.prod1 },
    { name: "Sepatu Sneakers Putih", price: "Rp 259.000", image: IMG.prod2 },
    { name: "Jam Tangan Kulit", price: "Rp 189.000", image: IMG.prod3 },
    { name: "Tas Ransel Laptop", price: "Rp 149.000", image: IMG.prod4 },
    { name: "Kacamata Hitam", price: "Rp 79.000", image: IMG.prod5 },
    { name: "Topi Baseball", price: "Rp 59.000", image: IMG.prod6 },
  ],
};

const PRODUCT_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:clamp(1.5rem,4vw,2.2rem);font-weight:700;color:var(--color-text);margin:0 0 24px 0;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:16px;">
    {{#items}}<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;overflow:hidden;">
      <img src="{{image}}" alt="{{name}}" style="width:100%;height:auto;aspect-ratio:1/1;object-fit:cover;display:block;" />
      <div style="padding:12px;">
        <div style="${BODY}font-weight:600;font-size:0.875rem;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{name}}</div>
        <div style="${HEADING}font-weight:700;font-size:1rem;color:var(--color-primary);margin-top:4px;">{{price}}</div>
      </div>
    </div>{{/items}}
  </div>`,
  "var(--color-background)",
);

/* faq */
const FAQ_CONFIG = {
  title: "Pertanyaan Umum",
  items: [
    { question: "Berapa lama pengiriman?", answer: "1-3 hari kerja untuk kota besar, 3-7 hari untuk daerah." },
    { question: "Apakah bisa COD?", answer: "Ya, tersedia COD untuk wilayah tertentu dengan biaya tambahan." },
    { question: "Bagaimana cara retur?", answer: "Hubungi CS kami dalam 7 hari, kami atur penjemputan gratis." },
  ],
};

const FAQ_HTML = sectionShell(
  `<div style="max-width:768px;margin:0 auto;">
    <h2 style="${HEADING}font-size:clamp(1.5rem,4vw,2.2rem);font-weight:700;color:var(--color-text);margin:0 0 24px 0;text-align:center;">{{title}}</h2>
    <div style="display:grid;gap:12px;">
      {{#items}}<details style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:16px;">
        <summary style="${BODY}font-weight:700;color:var(--color-text);cursor:pointer;">{{question}}</summary>
        <p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);margin:12px 0 0 0;">{{answer}}</p>
      </details>{{/items}}
    </div>
  </div>`,
  "var(--color-background)",
);

/* testimonials */
const TESTI_CONFIG = {
  title: "Apa Kata Pelanggan",
  items: [
    { name: "Andi S.", text: "Barang sampai cepat, sesuai gambar. Puas!", rating: "5.0" },
    { name: "Budi P.", text: "Harga murah, kualitas beli. Banyak langganan.", rating: "4.9" },
    { name: "Citra R.", text: "CS responsif, packaging aman. Recommended.", rating: "5.0" },
  ],
};

const TESTI_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:clamp(1.5rem,4vw,2.2rem);font-weight:700;color:var(--color-text);margin:0 0 24px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px;">
    {{#items}}<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:20px;">
      <div style="color:var(--color-primary);font-size:1rem;margin-bottom:8px;">★ {{rating}}</div>
      <p style="${BODY}font-size:0.9rem;color:var(--color-text);line-height:1.6;margin:0 0 12px 0;">"{{text}}"</p>
      <div style="${BODY}font-weight:600;font-size:0.85rem;color:var(--color-text-muted);">— {{name}}</div>
    </div>{{/items}}
  </div>`,
  "var(--color-surface)",
);

/* about */
const ABOUT_CONFIG = {
  title: "Cerita Toko Kita",
  content: "Toko Kita didirikan tahun 2020 dengan visi membuat belanja online lebih mudah dan terjangkau. Kami bekerja sama langsung dengan produsen lokal untuk menghadirkan produk berkualitas.",
  image: IMG.about,
};

const ABOUT_HTML = sectionShell(
  `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:32px;align-items:center;">
    <div style="border-radius:12px;overflow:hidden;"><img src="{{image}}" alt="About" style="width:100%;height:auto;display:block;" /></div>
    <div>
      <h2 style="${HEADING}font-size:clamp(1.5rem,4vw,2.2rem);font-weight:700;color:var(--color-text);margin:0 0 12px 0;">{{title}}</h2>
      <p style="${BODY}font-size:1rem;color:var(--color-text-muted);line-height:1.7;">{{content}}</p>
    </div>
  </div>`,
  "var(--color-surface)",
);

/* cta */
const CTA_CONFIG = {
  title: "Siap Mulai Belanja?",
  text: "Ribuan produk menunggu Anda. Dapatkan diskon ongkir hari ini.",
  cta_text: "Lihat Semua Produk",
  cta_link: "#produk",
};

const CTA_HTML = `<section style="background:var(--color-primary);color:var(--color-on-primary);padding:64px 24px;text-align:center;">
  <h2 style="${HEADING}font-size:clamp(1.7rem,4vw,2.4rem);font-weight:700;margin:0 0 12px 0;">{{title}}</h2>
  <p style="${BODY}font-size:1rem;opacity:0.9;margin:0 0 24px 0;">{{text}}</p>
  <a href="{{cta_link}}" style="display:inline-block;background:var(--color-accent);color:var(--color-text);padding:14px 32px;border-radius:999px;font-weight:700;text-decoration:none;${BODY}">{{cta_text}}</a>
</section>`;

/* gallery, location, contact — stubs dengan html minimal tapi valid */
const GALLERY_CONFIG = { title: "Galeri Produk", images: [{ image: IMG.prod1 }, { image: IMG.prod2 }, { image: IMG.prod3 }] };
const GALLERY_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 20px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px;">
    {{#images}}<img src="{{image}}" alt="Galeri" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:1/1;" />{{/images}}
  </div>`,
  "var(--color-background)",
);

const LOCATION_CONFIG = { title: "Lokasi Kami", address: "Jl. Sudirman No. 123, Jakarta", hours: "Senin–Sabtu 08.00–20.00", note: "Parkir luas tersedia" };
const LOCATION_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 12px 0;">{{title}}</h2>
  <p style="${BODY}color:var(--color-text-muted);">{{address}}</p>
  <p style="${BODY}color:var(--color-text-muted);">{{hours}}</p>
  <p style="${BODY}font-style:italic;color:var(--color-text-muted);">{{note}}</p>`,
  "var(--color-surface)",
);

const CONTACT_CONFIG = { title: "Hubungi Kami", subtitle: "CS siap membantu 24 jam", phone: "0812-3456-7890", email: "halo@tokokita.id", address: "Jakarta" };
const CONTACT_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2>
  <p style="${BODY}color:var(--color-text-muted);margin:0 0 16px 0;">{{subtitle}}</p>
  <p style="${BODY}color:var(--color-text);">📞 {{phone}}<br />✉️ {{email}}<br />📍 {{address}}</p>`,
  "var(--color-background)",
);

/* pricing, newsletter, divider, marquee, menu_board, steps, video, team — stubs */
const PRICING_CONFIG = { title: "Paket Membership", items: [{ name: "Silver", price: "Rp 0", description: "Gratis ongkir 2x" }, { name: "Gold", price: "Rp 29.000", description: "Gratis ongkir tanpa batas" }] };
const PRICING_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 20px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px;">
    {{#items}}<div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:24px;text-align:center;">
      <div style="${HEADING}font-weight:700;font-size:1.2rem;">{{name}}</div>
      <div style="${BODY}font-size:1.5rem;font-weight:700;color:var(--color-primary);margin:8px 0;">{{price}}</div>
      <p style="${BODY}font-size:0.9rem;color:var(--color-text-muted);">{{description}}</p>
    </div>{{/items}}
  </div>`,
  "var(--color-surface)",
);

const NEWSLETTER_CONFIG = { title: "Dapatkan Promo", subtitle: "Daftar untuk info diskon terbaru.", button_text: "Daftar" };
const NEWSLETTER_HTML = sectionShell(
  `<div style="max-width:480px;margin:0 auto;text-align:center;">
    <h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2>
    <p style="${BODY}color:var(--color-text-muted);margin:0 0 16px 0;">{{subtitle}}</p>
    <input type="email" placeholder="Email Anda" style="width:100%;padding:12px;border:1px solid var(--color-border);border-radius:8px;margin-bottom:12px;${BODY}" />
    <button style="background:var(--color-primary);color:var(--color-on-primary);padding:12px 32px;border:none;border-radius:999px;font-weight:600;cursor:pointer;${BODY}">{{button_text}}</button>
  </div>`,
  "var(--color-background)",
);

const DIVIDER_CONFIG = { style: "solid" };
const DIVIDER_HTML = `<div style="padding:24px;background:var(--color-background);"><hr style="border:none;border-top:1px solid var(--color-border);margin:0 auto;max-width:1152px;" /></div>`;

const MARQUEE_CONFIG = { items: [{ text: "Gratis Ongkir" }, { text: "Diskon 50%" }, { text: "COD Tersedia" }] };
const MARQUEE_HTML = `<div style="background:var(--color-accent);color:var(--color-text);padding:12px 0;overflow:hidden;white-space:nowrap;${BODY}font-weight:700;font-size:0.875rem;"><div style="display:inline-block;animation:marquee 20s linear infinite;">{{#items}}<span style="margin:0 32px;">{{text}}</span>{{/items}}</div></div>`;

const MENU_BOARD_CONFIG = { title: "Daftar Harga", items: [{ name: "Produk A", price: "Rp 50.000" }, { name: "Produk B", price: "Rp 75.000" }] };
const MENU_BOARD_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 16px 0;">{{title}}</h2>
  <div style="display:grid;gap:8px;">{{#items}}<div style="display:flex;justify-content:space-between;padding:12px;background:var(--color-surface);border-radius:8px;${BODY}"><span>{{name}}</span><span style="font-weight:700;color:var(--color-primary);">{{price}}</span></div>{{/items}}</div>`,
  "var(--color-background)",
);

const STEPS_CONFIG = { title: "Cara Belanja", items: [{ title: "Pilih Produk", description: "Cari dan pilih produk yang Anda inginkan." }, { title: "Checkout", description: "Isi alamat dan pilih metode pembayaran." }, { title: "Tunggu Pengiriman", description: "Pesanan diproses dan dikirim." }] };
const STEPS_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 20px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px;">
    {{#items}}<div style="text-align:center;"><div style="${HEADING}font-weight:700;font-size:1.1rem;color:var(--color-text);">{{title}}</div><p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);">{{description}}</p></div>{{/items}}
  </div>`,
  "var(--color-surface)",
);

const VIDEO_CONFIG = { title: "Video Produk", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
const VIDEO_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 16px 0;text-align:center;">{{title}}</h2>
  <div style="aspect-ratio:16/9;background:var(--color-surface);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);${BODY}">Video embed: {{video_url}}</div>`,
  "var(--color-background)",
);

const TEAM_CONFIG = { title: "Tim Kami", members: [{ name: "Rina", role: "Founder", image: IMG.about }, { name: "Doni", role: "Ops", image: IMG.about }] };
const TEAM_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 20px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:16px;">
    {{#members}}<div style="text-align:center;"><img src="{{image}}" alt="{{name}}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 12px;" /><div style="${HEADING}font-weight:700;color:var(--color-text);">{{name}}</div><div style="${BODY}font-size:0.875rem;color:var(--color-text-muted);">{{role}}</div></div>{{/members}}
  </div>`,
  "var(--color-surface)",
);

const ALL_SECTIONS: SectionTypeDefinition[] = [
  { type: "hero", name: "Hero", icon: "Layout", variants: [toVariant({ id: vid("hero-hybrid"), name: "Hybrid Hero", description: "Hero + produk", config: HERO_CONFIG, html: HERO_HTML }), toVariant({ id: vid("hero-big-image"), name: "Big Image Hero", description: "Hero image besar", config: HERO_CONFIG, html: HERO_HTML }), toVariant({ id: vid("hero-compact-band"), name: "Compact Hero", description: "Hero compact", config: HERO_CONFIG, html: HERO_HTML })] },
  { type: "features", name: "Fitur", icon: "Star", variants: [toVariant({ id: vid("features-cards"), name: "Kartu Fitur", description: "3 kolom fitur", config: FEATURES_CONFIG, html: FEATURES_HTML }), toVariant({ id: vid("features-cards-2"), name: "Kartu Fitur 2", description: "3 kolom fitur 2", config: FEATURES_CONFIG, html: FEATURES_HTML }), toVariant({ id: vid("features-cards-3"), name: "Kartu Fitur 3", description: "3 kolom fitur 3", config: FEATURES_CONFIG, html: FEATURES_HTML })] },
  { type: "product_grid", name: "Produk", icon: "Grid", variants: [toVariant({ id: vid("product-feed"), name: "Feed Produk", description: "Grid produk", config: PRODUCT_CONFIG, html: PRODUCT_HTML }), toVariant({ id: vid("product-feed-2"), name: "Feed Produk 2", description: "Grid produk 2", config: PRODUCT_CONFIG, html: PRODUCT_HTML }), toVariant({ id: vid("product-feed-3"), name: "Feed Produk 3", description: "Grid produk 3", config: PRODUCT_CONFIG, html: PRODUCT_HTML })] },
  { type: "pricing", name: "Harga", icon: "Tag", variants: [toVariant({ id: vid("pricing-cards"), name: "Kartu Harga", description: "Paket membership", config: PRICING_CONFIG, html: PRICING_HTML }), toVariant({ id: vid("pricing-cards-2"), name: "Kartu Harga 2", description: "Paket membership 2", config: PRICING_CONFIG, html: PRICING_HTML }), toVariant({ id: vid("pricing-cards-3"), name: "Kartu Harga 3", description: "Paket membership 3", config: PRICING_CONFIG, html: PRICING_HTML })] },
  { type: "testimonials", name: "Testimoni", icon: "MessageCircle", variants: [toVariant({ id: vid("testi-wall"), name: "Wall of Love", description: "Testimoni pelanggan", config: TESTI_CONFIG, html: TESTI_HTML }), toVariant({ id: vid("testi-wall-2"), name: "Wall of Love 2", description: "Testimoni pelanggan 2", config: TESTI_CONFIG, html: TESTI_HTML }), toVariant({ id: vid("testi-wall-3"), name: "Wall of Love 3", description: "Testimoni pelanggan 3", config: TESTI_CONFIG, html: TESTI_HTML })] },
  { type: "gallery", name: "Galeri", icon: "Image", variants: [toVariant({ id: vid("gallery-tile"), name: "Grid Galeri", description: "Foto produk", config: GALLERY_CONFIG, html: GALLERY_HTML }), toVariant({ id: vid("gallery-tile-2"), name: "Grid Galeri 2", description: "Foto produk 2", config: GALLERY_CONFIG, html: GALLERY_HTML }), toVariant({ id: vid("gallery-tile-3"), name: "Grid Galeri 3", description: "Foto produk 3", config: GALLERY_CONFIG, html: GALLERY_HTML })] },
  { type: "location", name: "Lokasi", icon: "MapPin", variants: [toVariant({ id: vid("location-info"), name: "Info Lokasi", description: "Alamat & jam buka", config: LOCATION_CONFIG, html: LOCATION_HTML }), toVariant({ id: vid("location-info-2"), name: "Info Lokasi 2", description: "Alamat & jam buka 2", config: LOCATION_CONFIG, html: LOCATION_HTML }), toVariant({ id: vid("location-info-3"), name: "Info Lokasi 3", description: "Alamat & jam buka 3", config: LOCATION_CONFIG, html: LOCATION_HTML })] },
  { type: "faq", name: "FAQ", icon: "HelpCircle", variants: [toVariant({ id: vid("faq-toggle"), name: "Daftar FAQ", description: "Accordion FAQ", config: FAQ_CONFIG, html: FAQ_HTML }), toVariant({ id: vid("faq-toggle-2"), name: "Daftar FAQ 2", description: "Accordion FAQ 2", config: FAQ_CONFIG, html: FAQ_HTML }), toVariant({ id: vid("faq-toggle-3"), name: "Daftar FAQ 3", description: "Accordion FAQ 3", config: FAQ_CONFIG, html: FAQ_HTML })] },
  { type: "contact", name: "Kontak", icon: "Phone", variants: [toVariant({ id: vid("contact-info"), name: "Info Kontak", description: "Kontak langsung", config: CONTACT_CONFIG, html: CONTACT_HTML }), toVariant({ id: vid("contact-info-2"), name: "Info Kontak 2", description: "Kontak langsung 2", config: CONTACT_CONFIG, html: CONTACT_HTML }), toVariant({ id: vid("contact-info-3"), name: "Info Kontak 3", description: "Kontak langsung 3", config: CONTACT_CONFIG, html: CONTACT_HTML })] },
  { type: "about", name: "Tentang", icon: "Info", variants: [toVariant({ id: vid("about-split"), name: "Split About", description: "Cerita toko", config: ABOUT_CONFIG, html: ABOUT_HTML }), toVariant({ id: vid("about-split-2"), name: "Split About 2", description: "Cerita toko 2", config: ABOUT_CONFIG, html: ABOUT_HTML }), toVariant({ id: vid("about-split-3"), name: "Split About 3", description: "Cerita toko 3", config: ABOUT_CONFIG, html: ABOUT_HTML })] },
  { type: "video", name: "Video", icon: "PlayCircle", variants: [toVariant({ id: vid("video-embed"), name: "Embed Video", description: "Video produk", config: VIDEO_CONFIG, html: VIDEO_HTML }), toVariant({ id: vid("video-embed-2"), name: "Embed Video 2", description: "Video produk 2", config: VIDEO_CONFIG, html: VIDEO_HTML }), toVariant({ id: vid("video-embed-3"), name: "Embed Video 3", description: "Video produk 3", config: VIDEO_CONFIG, html: VIDEO_HTML })] },
  { type: "team", name: "Tim", icon: "Users", variants: [toVariant({ id: vid("team-panel"), name: "Grid Tim", description: "Profil tim", config: TEAM_CONFIG, html: TEAM_HTML }), toVariant({ id: vid("team-panel-2"), name: "Grid Tim 2", description: "Profil tim 2", config: TEAM_CONFIG, html: TEAM_HTML }), toVariant({ id: vid("team-panel-3"), name: "Grid Tim 3", description: "Profil tim 3", config: TEAM_CONFIG, html: TEAM_HTML })] },
  { type: "newsletter", name: "Newsletter", icon: "Mail", variants: [toVariant({ id: vid("newsletter-form"), name: "Form Newsletter", description: "Daftar promo", config: NEWSLETTER_CONFIG, html: NEWSLETTER_HTML }), toVariant({ id: vid("newsletter-form-2"), name: "Form Newsletter 2", description: "Daftar promo 2", config: NEWSLETTER_CONFIG, html: NEWSLETTER_HTML }), toVariant({ id: vid("newsletter-form-3"), name: "Form Newsletter 3", description: "Daftar promo 3", config: NEWSLETTER_CONFIG, html: NEWSLETTER_HTML })] },
  { type: "divider", name: "Divider", icon: "Minus", variants: [toVariant({ id: vid("divider-line"), name: "Garis", description: "Pemisah", config: DIVIDER_CONFIG, html: DIVIDER_HTML }), toVariant({ id: vid("divider-line-2"), name: "Garis 2", description: "Pemisah 2", config: DIVIDER_CONFIG, html: DIVIDER_HTML }), toVariant({ id: vid("divider-line-3"), name: "Garis 3", description: "Pemisah 3", config: DIVIDER_CONFIG, html: DIVIDER_HTML })] },
  { type: "marquee", name: "Marquee", icon: "Sliders", variants: [toVariant({ id: vid("marquee-band"), name: "Pita Promo", description: "Teks berjalan", config: MARQUEE_CONFIG, html: MARQUEE_HTML }), toVariant({ id: vid("marquee-band-2"), name: "Pita Promo 2", description: "Teks berjalan 2", config: MARQUEE_CONFIG, html: MARQUEE_HTML }), toVariant({ id: vid("marquee-band-3"), name: "Pita Promo 3", description: "Teks berjalan 3", config: MARQUEE_CONFIG, html: MARQUEE_HTML })] },
  { type: "menu_board", name: "Menu", icon: "FileText", variants: [toVariant({ id: vid("menu-index"), name: "Daftar Menu", description: "Daftar harga", config: MENU_BOARD_CONFIG, html: MENU_BOARD_HTML }), toVariant({ id: vid("menu-index-2"), name: "Daftar Menu 2", description: "Daftar harga 2", config: MENU_BOARD_CONFIG, html: MENU_BOARD_HTML }), toVariant({ id: vid("menu-index-3"), name: "Daftar Menu 3", description: "Daftar harga 3", config: MENU_BOARD_CONFIG, html: MENU_BOARD_HTML })] },
  { type: "steps", name: "Langkah", icon: "ListOrdered", variants: [toVariant({ id: vid("steps-timeline"), name: "Timeline", description: "Cara belanja", config: STEPS_CONFIG, html: STEPS_HTML }), toVariant({ id: vid("steps-timeline-2"), name: "Timeline 2", description: "Cara belanja 2", config: STEPS_CONFIG, html: STEPS_HTML }), toVariant({ id: vid("steps-timeline-3"), name: "Timeline 3", description: "Cara belanja 3", config: STEPS_CONFIG, html: STEPS_HTML })] },
  { type: "cta", name: "CTA", icon: "MousePointer", variants: [toVariant({ id: vid("cta-wave"), name: "Banner CTA", description: "Panggilan aksi", config: CTA_CONFIG, html: CTA_HTML }), toVariant({ id: vid("cta-wave-2"), name: "Banner CTA 2", description: "Panggilan aksi 2", config: CTA_CONFIG, html: CTA_HTML }), toVariant({ id: vid("cta-wave-3"), name: "Banner CTA 3", description: "Panggilan aksi 3", config: CTA_CONFIG, html: CTA_HTML })] },
];

export const MARKETPLACE_HYBRID_TEMPLATE: CatalogTemplate = {
  id: NS,
  name: "Hybrid Shop",
  description: "Template toko online hybrid: bersih seperti katalog premium, tapi tetap punya search bar, category chips, bottom nav, dan mobile native-app feel.",
  category: "retail",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: {
      primary: "#2563eb",
      secondary: "#1d4ed8",
      accent: "#f97316",
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
    },
    typography: {
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      accentFont: "Inter",
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 8,
      buttonStyle: "solid",
      shadowStyle: "md",
      navStyle: "solid",
      footerStyle: "columns",
    },
    effects: {},
  },
  headers: HEADERS,
  footers: FOOTERS,
  sections: ALL_SECTIONS,
  colorSchemes: [
    {
      id: "default-light",
      name: "Default Light",
      category: "light",
      palette: { primary: "#2563eb", secondary: "#1d4ed8", accent: "#f97316", background: "#ffffff", surface: "#f8fafc", text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0" },
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
    },
  ],
  contrast: {
    pairs: [
      { fg: "text", bg: "background", role: "body" },
      { fg: "text", bg: "surface", role: "body" },
      { fg: "textMuted", bg: "background", role: "muted" },
      { fg: "textMuted", bg: "surface", role: "muted" },
      { fg: "primary", bg: "background", role: "body" },
      { fg: "primary", bg: "surface", role: "body" },
      { fg: "accent", bg: "background", role: "body" },
      { fg: "accent", bg: "surface", role: "body" },
      { fg: "text", bg: "primary", role: "body" },
      { fg: "text", bg: "accent", role: "body" },
    ],
  },
  data: {
    paletteOverride: { primary: "#2563eb", secondary: "#1d4ed8", accent: "#f97316", background: "#ffffff", surface: "#f8fafc", text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0" },
    activeSections: ["hero", "features", "product_grid", "pricing", "testimonials", "gallery", "location", "faq", "contact", "about", "video", "team", "newsletter", "divider", "marquee", "menu_board", "steps", "cta"],
    sections: [
      { type: "hero", variant: vid("hero-hybrid"), anchorId: "beranda", config: { ...HERO_CONFIG } },
      { type: "marquee", variant: vid("marquee-band"), anchorId: "promo", config: { ...MARQUEE_CONFIG } },
      { type: "features", variant: vid("features-cards"), anchorId: "keunggulan", config: { ...FEATURES_CONFIG } },
      { type: "product_grid", variant: vid("product-feed"), anchorId: "produk", config: { ...PRODUCT_CONFIG } },
      { type: "about", variant: vid("about-split"), anchorId: "tentang", config: { ...ABOUT_CONFIG } },
      { type: "pricing", variant: vid("pricing-cards"), anchorId: "harga", config: { ...PRICING_CONFIG } },
      { type: "steps", variant: vid("steps-timeline"), anchorId: "cara-belanja", config: { ...STEPS_CONFIG } },
      { type: "testimonials", variant: vid("testi-wall"), anchorId: "testimoni", config: { ...TESTI_CONFIG } },
      { type: "gallery", variant: vid("gallery-tile"), anchorId: "galeri", config: { ...GALLERY_CONFIG } },
      { type: "location", variant: vid("location-info"), anchorId: "lokasi", config: { ...LOCATION_CONFIG } },
      { type: "faq", variant: vid("faq-toggle"), anchorId: "faq", config: { ...FAQ_CONFIG } },
      { type: "newsletter", variant: vid("newsletter-form"), anchorId: "newsletter", config: { ...NEWSLETTER_CONFIG } },
      { type: "contact", variant: vid("contact-info"), anchorId: "kontak", config: { ...CONTACT_CONFIG } },
    ],
    header: {
      variant: "standard",
      siteTitle: BRAND,
      tagline: "Belanja mudah, harga terbaik",
      navItems: NAV_ITEMS,
      ctaText: "Cari Produk",
      ctaLink: "#produk",
      showCta: true,
      sticky: true,
    },
    footer: {
      style: "columns",
      text: `© {year} ${BRAND}. Belanja mudah, harga terbaik.`,
      navItems: NAV_ITEMS.slice(0, 4),
      showNav: true,
      showSocial: true,
    },
    bottomBar: {
      enabled: true,
      items: [
        { id: "home", label: "Beranda", icon: "Home", url: "#beranda" },
        { id: "products", label: "Produk", icon: "Grid", url: "#produk" },
        { id: "cta", label: "Cari", icon: "Search", url: "#produk" },
        { id: "faq", label: "FAQ", icon: "HelpCircle", url: "#faq" },
        { id: "contact", label: "Kontak", icon: "Phone", url: "#kontak" },
      ],
    },
    seo: {
      title: `${BRAND} — Toko Online Hybrid`,
      description: "Template toko online hybrid: produk lengkap, harga terjangkau, pengiriman cepat, dan belanja nyaman seperti native app.",
    },
    core: { site_title: BRAND, tagline: "Belanja mudah, harga terbaik" },
    customCss: [
      '[data-tpl-type="header"] nav a:hover{color:var(--color-primary);}',
      '[data-tpl-type="footer"] nav a{text-decoration:none;}',
      '[data-tpl-type="footer"] nav a:hover{color:var(--color-primary);}',
      '@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}',
    ].join("\n"),
  },
};
