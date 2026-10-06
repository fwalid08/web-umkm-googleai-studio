import type { SectionTypeDefinition } from "../../template-types";
import { vid, inferFields, IMG, BODY, HEADING, ACCENT } from "./shared";

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
export const HERO_CONFIG = {
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
export const FEATURES_CONFIG = {
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
export const PRODUCT_CONFIG = {
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
export const FAQ_CONFIG = {
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
export const TESTI_CONFIG = {
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
export const ABOUT_CONFIG = {
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
export const CTA_CONFIG = {
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
export const GALLERY_CONFIG = { title: "Galeri Produk", images: [{ image: IMG.prod1 }, { image: IMG.prod2 }, { image: IMG.prod3 }] };
const GALLERY_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 20px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px;">
    {{#images}}<img src="{{image}}" alt="Galeri" style="width:100%;height:auto;border-radius:8px;object-fit:cover;aspect-ratio:1/1;" />{{/images}}
  </div>`,
  "var(--color-background)",
);

export const LOCATION_CONFIG = { title: "Lokasi Kami", address: "Jl. Sudirman No. 123, Jakarta", hours: "Senin–Sabtu 08.00–20.00", note: "Parkir luas tersedia" };
const LOCATION_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 12px 0;">{{title}}</h2>
  <p style="${BODY}color:var(--color-text-muted);">{{address}}</p>
  <p style="${BODY}color:var(--color-text-muted);">{{hours}}</p>
  <p style="${BODY}font-style:italic;color:var(--color-text-muted);">{{note}}</p>`,
  "var(--color-surface)",
);

export const CONTACT_CONFIG = { title: "Hubungi Kami", subtitle: "CS siap membantu 24 jam", phone: "0812-3456-7890", email: "halo@tokokita.id", address: "Jakarta" };
const CONTACT_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2>
  <p style="${BODY}color:var(--color-text-muted);margin:0 0 16px 0;">{{subtitle}}</p>
  <p style="${BODY}color:var(--color-text);">📞 {{phone}}<br />✉️ {{email}}<br />📍 {{address}}</p>`,
  "var(--color-background)",
);

/* pricing, newsletter, divider, marquee, menu_board, steps, video, team — stubs */
export const PRICING_CONFIG = { title: "Paket Membership", items: [{ name: "Silver", price: "Rp 0", description: "Gratis ongkir 2x" }, { name: "Gold", price: "Rp 29.000", description: "Gratis ongkir tanpa batas" }] };
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

export const NEWSLETTER_CONFIG = { title: "Dapatkan Promo", subtitle: "Daftar untuk info diskon terbaru.", button_text: "Daftar" };
const NEWSLETTER_HTML = sectionShell(
  `<div style="max-width:480px;margin:0 auto;text-align:center;">
    <h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2>
    <p style="${BODY}color:var(--color-text-muted);margin:0 0 16px 0;">{{subtitle}}</p>
    <input type="email" placeholder="Email Anda" style="width:100%;padding:12px;border:1px solid var(--color-border);border-radius:8px;margin-bottom:12px;${BODY}" />
    <button style="background:var(--color-primary);color:var(--color-on-primary);padding:12px 32px;border:none;border-radius:999px;font-weight:600;cursor:pointer;${BODY}">{{button_text}}</button>
  </div>`,
  "var(--color-background)",
);

export const DIVIDER_CONFIG = { style: "solid" };
const DIVIDER_HTML = `<div style="padding:24px;background:var(--color-background);"><hr style="border:none;border-top:1px solid var(--color-border);margin:0 auto;max-width:1152px;" /></div>`;

export const MARQUEE_CONFIG = { items: [{ text: "Gratis Ongkir" }, { text: "Diskon 50%" }, { text: "COD Tersedia" }] };
const MARQUEE_HTML = `<div style="background:var(--color-accent);color:var(--color-text);padding:12px 0;overflow:hidden;white-space:nowrap;${BODY}font-weight:700;font-size:0.875rem;"><div style="display:inline-block;animation:marquee 20s linear infinite;">{{#items}}<span style="margin:0 32px;">{{text}}</span>{{/items}}</div></div>`;

export const MENU_BOARD_CONFIG = { title: "Daftar Harga", items: [{ name: "Produk A", price: "Rp 50.000" }, { name: "Produk B", price: "Rp 75.000" }] };
const MENU_BOARD_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 16px 0;">{{title}}</h2>
  <div style="display:grid;gap:8px;">{{#items}}<div style="display:flex;justify-content:space-between;padding:12px;background:var(--color-surface);border-radius:8px;${BODY}"><span>{{name}}</span><span style="font-weight:700;color:var(--color-primary);">{{price}}</span></div>{{/items}}</div>`,
  "var(--color-background)",
);

export const STEPS_CONFIG = { title: "Cara Belanja", items: [{ title: "Pilih Produk", description: "Cari dan pilih produk yang Anda inginkan." }, { title: "Checkout", description: "Isi alamat dan pilih metode pembayaran." }, { title: "Tunggu Pengiriman", description: "Pesanan diproses dan dikirim." }] };
const STEPS_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 20px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px;">
    {{#items}}<div style="text-align:center;"><div style="${HEADING}font-weight:700;font-size:1.1rem;color:var(--color-text);">{{title}}</div><p style="${BODY}font-size:0.875rem;color:var(--color-text-muted);">{{description}}</p></div>{{/items}}
  </div>`,
  "var(--color-surface)",
);

export const VIDEO_CONFIG = { title: "Video Produk", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
const VIDEO_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 16px 0;text-align:center;">{{title}}</h2>
  <div style="aspect-ratio:16/9;background:var(--color-surface);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--color-text-muted);${BODY}">Video embed: {{video_url}}</div>`,
  "var(--color-background)",
);

export const TEAM_CONFIG = { title: "Tim Kami", members: [{ name: "Rina", role: "Founder", image: IMG.about }, { name: "Doni", role: "Ops", image: IMG.about }] };
const TEAM_HTML = sectionShell(
  `<h2 style="${HEADING}font-size:1.5rem;font-weight:700;color:var(--color-text);margin:0 0 20px 0;text-align:center;">{{title}}</h2>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:16px;">
    {{#members}}<div style="text-align:center;"><img src="{{image}}" alt="{{name}}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 12px;" /><div style="${HEADING}font-weight:700;color:var(--color-text);">{{name}}</div><div style="${BODY}font-size:0.875rem;color:var(--color-text-muted);">{{role}}</div></div>{{/members}}
  </div>`,
  "var(--color-surface)",
);

export const ALL_SECTIONS: SectionTypeDefinition[] = [
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
