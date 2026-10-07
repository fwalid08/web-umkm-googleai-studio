import type { SectionTypeDefinition } from "../../template-types";
import { ACCENT, BODY, HEADING, IMAGES, inferFields, vid } from "./shared";

interface SectionSpec {
  type: string;
  name: string;
  icon: string;
  config: Record<string, unknown>;
  titleKey?: string;
  subtitleKey?: string;
  collectionKey?: string;
  itemTitleKey?: string;
  itemTextKey?: string;
  itemMetaKey?: string;
  itemImageKey?: string;
  itemLinkKey?: string;
  special?: "hero" | "cta" | "contact" | "location" | "about" | "video" | "newsletter" | "divider" | "marquee";
}

const sectionSpecs: SectionSpec[] = [
  {
    type: "hero", name: "Etalase Utama", icon: "PanelsTopLeft", titleKey: "headline", subtitleKey: "subheadline", special: "hero",
    config: { badge: "Pilihan Minggu Ini", headline: "Belanja dekat, temukan lebih banyak", subheadline: "Kebutuhan rumah, gaya, dan keseharian pilihan toko lokal dalam satu etalase.", image: IMAGES.hero, cta_text: "Jelajahi Produk", cta_link: "#produk" },
  },
  {
    type: "features", name: "Keunggulan Toko", icon: "Sparkles", titleKey: "title", subtitleKey: "subtitle", collectionKey: "items", itemTitleKey: "title", itemTextKey: "description", itemMetaKey: "icon",
    config: { title: "Belanja lokal terasa lebih mudah", subtitle: "Pilihan jelas, bantuan dekat, dan pengalaman belanja yang nyaman.", items: [{ icon: "01", title: "Pilihan terkurasi", description: "Produk harian pilihan dari toko dan produsen lokal." }, { icon: "02", title: "Bantuan langsung", description: "Tanyakan stok dan detail produk dengan mudah." }, { icon: "03", title: "Belanja fleksibel", description: "Pilih produk sesuai kebutuhan dan anggaran." }] },
  },
  {
    type: "product_grid", name: "Katalog Produk", icon: "ShoppingBag", titleKey: "title", subtitleKey: "subtitle", collectionKey: "items", itemTitleKey: "name", itemTextKey: "category", itemMetaKey: "price", itemImageKey: "image", itemLinkKey: "productLink",
    config: { title: "Pilihan untuk hari ini", subtitle: "Temukan produk favorit dari berbagai kategori.", items: [{ name: "Lampu meja Nordik", category: "Rumah", price: "Rp 129.000", image: IMAGES.productOne, productLink: "#produk" }, { name: "Botol minum harian", category: "Keseharian", price: "Rp 45.000", image: IMAGES.productTwo, productLink: "#produk" }, { name: "Tas belanja lipat", category: "Aksesori", price: "Rp 59.000", image: IMAGES.productThree, productLink: "#produk" }, { name: "Set wadah serbaguna", category: "Dapur", price: "Rp 89.000", image: IMAGES.productFour, productLink: "#produk" }, { name: "Lilin aroma lembut", category: "Dekorasi", price: "Rp 72.000", image: IMAGES.productFive, productLink: "#produk" }, { name: "Organizer meja", category: "Rumah", price: "Rp 64.000", image: IMAGES.productSix, productLink: "#produk" }] },
  },
  {
    type: "pricing", name: "Pilihan Hemat", icon: "BadgePercent", titleKey: "title", subtitleKey: "subtitle", collectionKey: "items", itemTitleKey: "name", itemTextKey: "description", itemMetaKey: "price",
    config: { title: "Paket belanja pilihan", subtitle: "Racikan kebutuhan praktis dengan harga yang bersahabat.", items: [{ name: "Paket Dapur", price: "Rp 149.000", description: "Wadah simpan, lap serbaguna, dan botol bumbu." }, { name: "Paket Rumah", price: "Rp 199.000", description: "Organizer, lampu meja, dan aksen dekorasi." }, { name: "Paket Harian", price: "Rp 99.000", description: "Botol minum, tas lipat, dan aksesori kecil." }] },
  },
  {
    type: "testimonials", name: "Cerita Pelanggan", icon: "MessageCircle", titleKey: "title", subtitleKey: "subtitle", collectionKey: "items", itemTitleKey: "name", itemTextKey: "text", itemMetaKey: "rating",
    config: { title: "Cerita dari pelanggan", subtitle: "Pengalaman kecil yang membuat belanja terasa dekat.", items: [{ name: "Nadia, Bandung", text: "Barangnya sesuai foto dan admin membantu cek ukuran sebelum saya pesan.", rating: "5.0" }, { name: "Rizky, Cimahi", text: "Banyak pilihan untuk rumah. Tinggal tanya, langsung dibantu carikan.", rating: "4.9" }, { name: "Mira, Bandung", text: "Pengemasan rapi dan bisa ambil langsung di toko dekat rumah.", rating: "5.0" }] },
  },
  {
    type: "gallery", name: "Suasana & Pilihan", icon: "Images", titleKey: "title", subtitleKey: "subtitle", collectionKey: "images", itemTitleKey: "caption", itemImageKey: "image",
    config: { title: "Temukan sudut favoritmu", subtitle: "Pilihan produk dan suasana toko kami.", images: [{ image: IMAGES.productOne, caption: "Sudut rumah" }, { image: IMAGES.productTwo, caption: "Teman bepergian" }, { image: IMAGES.productThree, caption: "Pilihan harian" }, { image: IMAGES.productFour, caption: "Ruang dapur" }] },
  },
  {
    type: "location", name: "Kunjungi Toko", icon: "MapPin", titleKey: "title", subtitleKey: "note", special: "location",
    config: { title: "Mampir ke toko kami", address: "Jl. Melati No. 18, Bandung", hours: "Senin-Sabtu, 09.00-20.00", note: "Ambil pesanan atau lihat pilihan produk langsung di toko." },
  },
  {
    type: "faq", name: "Tanya Jawab", icon: "CircleHelp", titleKey: "title", subtitleKey: "subtitle", collectionKey: "items", itemTitleKey: "question", itemTextKey: "answer",
    config: { title: "Sebelum kamu belanja", subtitle: "Jawaban singkat untuk pertanyaan yang sering muncul.", items: [{ question: "Bagaimana cara memastikan stok?", answer: "Hubungi toko melalui tautan kontak untuk memastikan stok dan pilihan warna." }, { question: "Apakah produk bisa diambil di toko?", answer: "Bisa. Konfirmasi dahulu agar pesanan disiapkan sebelum kamu datang." }, { question: "Bagaimana jika perlu bantuan memilih?", answer: "Sampaikan kategori dan kebutuhanmu, tim toko akan membantu memberi pilihan." }] },
  },
  {
    type: "contact", name: "Hubungi Toko", icon: "Phone", titleKey: "title", subtitleKey: "subtitle", special: "contact",
    config: { title: "Ada yang ingin ditanyakan?", subtitle: "Tim toko siap membantu memilih produk dan mengecek ketersediaan.", phone: "0812-3456-7890", email: "halo@pasarmodern.id", address: "Bandung, Jawa Barat", cta_text: "Hubungi Toko", cta_link: "#kontak" },
  },
  {
    type: "about", name: "Tentang Toko", icon: "Store", titleKey: "title", subtitleKey: "content", special: "about",
    config: { title: "Belanja yang tumbuh dari sekitar", content: "Pasar Modern menghubungkan kebutuhan sehari-hari dengan pilihan toko lokal. Kami mengutamakan produk berguna, informasi yang jelas, dan layanan yang terasa dekat.", image: IMAGES.home, cta_text: "Kenali Toko", cta_link: "#kontak" },
  },
  {
    type: "video", name: "Cerita Produk", icon: "Play", titleKey: "title", subtitleKey: "subtitle", special: "video",
    config: { title: "Lihat pilihan lebih dekat", subtitle: "Kenali produk, bahan, dan cara pakainya sebelum menentukan pilihan.", video_url: "https://www.youtube.com/" },
  },
  {
    type: "team", name: "Tim Toko", icon: "Users", titleKey: "title", subtitleKey: "subtitle", collectionKey: "members", itemTitleKey: "name", itemTextKey: "role", itemImageKey: "image",
    config: { title: "Orang-orang di balik toko", subtitle: "Tim kecil yang siap membantu kebutuhan belanjamu.", members: [{ name: "Rina", role: "Kurasi Produk", image: IMAGES.team }, { name: "Dimas", role: "Layanan Pelanggan", image: IMAGES.home }, { name: "Ayu", role: "Operasional Toko", image: IMAGES.productSix }] },
  },
  {
    type: "newsletter", name: "Info Promo", icon: "Mail", titleKey: "title", subtitleKey: "subtitle", special: "newsletter",
    config: { title: "Kabar pilihan baru", subtitle: "Ikuti tautan untuk melihat produk dan promo terbaru.", button_text: "Lihat Promo", button_link: "#promo" },
  },
  {
    type: "divider", name: "Pemisah Visual", icon: "Minus", special: "divider",
    config: { label: "Pilihan lokal, untuk kebutuhan sehari-hari" },
  },
  {
    type: "marquee", name: "Pita Pengumuman", icon: "MoveHorizontal", collectionKey: "items", itemTitleKey: "text", special: "marquee",
    config: { items: [{ text: "Pilihan toko lokal" }, { text: "Koleksi baru setiap pekan" }, { text: "Tanya stok langsung ke toko" }] },
  },
  {
    type: "menu_board", name: "Jelajah Kategori", icon: "List", titleKey: "title", subtitleKey: "subtitle", collectionKey: "items", itemTitleKey: "name", itemTextKey: "description", itemMetaKey: "count",
    config: { title: "Jelajah kategori", subtitle: "Mulai dari yang kamu butuhkan.", items: [{ name: "Rumah & Dekorasi", description: "Perlengkapan untuk ruang yang lebih nyaman.", count: "24 pilihan" }, { name: "Dapur & Makan", description: "Teman menyiapkan dan menikmati hidangan.", count: "18 pilihan" }, { name: "Gaya & Aksesori", description: "Detail kecil untuk rutinitas harian.", count: "31 pilihan" }, { name: "Kebutuhan Harian", description: "Barang praktis untuk dibawa dan digunakan.", count: "16 pilihan" }] },
  },
  {
    type: "steps", name: "Cara Belanja", icon: "ListOrdered", titleKey: "title", subtitleKey: "subtitle", collectionKey: "items", itemTitleKey: "title", itemTextKey: "description", itemMetaKey: "number",
    config: { title: "Belanja dalam tiga langkah", subtitle: "Pilih, tanyakan, lalu tentukan cara menerima pesanan.", items: [{ number: "01", title: "Jelajahi", description: "Cari produk dan kategori yang kamu perlukan." }, { number: "02", title: "Tanyakan", description: "Konfirmasi detail, stok, atau pilihan yang tersedia." }, { number: "03", title: "Atur pesanan", description: "Hubungi toko untuk membahas pengambilan atau pengiriman." }] },
  },
  {
    type: "cta", name: "Ajakan Belanja", icon: "ArrowRight", titleKey: "title", subtitleKey: "text", special: "cta",
    config: { title: "Ada kebutuhan yang ingin dicari?", text: "Mulai dari kategori pilihan dan temukan produk yang pas untuk harimu.", cta_text: "Lihat Katalog", cta_link: "#produk" },
  },
];

const VARIANTS = [
  { suffix: "market-row", label: "Etalase", description: "Komposisi etalase editorial dengan kolom informasi." },
  { suffix: "market-grid", label: "Katalog", description: "Komposisi katalog berpusat dengan bidang lega." },
  { suffix: "market-ledger", label: "Pilihan", description: "Komposisi kontras dengan panel konten bertingkat." },
] as const;

function titleMarkup(spec: SectionSpec): string {
  if (!spec.titleKey) return "";
  const title = `{{${spec.titleKey}}}`;
  const subtitle = spec.subtitleKey ? ` <p style="${BODY}font-size:0.95rem;line-height:1.6;color:var(--color-text-muted);margin:8px 0 0 0;">{{${spec.subtitleKey}}}</p>` : "";
  return `<div style="margin-bottom:20px;"><h2 style="${HEADING}font-size:1.6rem;line-height:1.2;color:var(--color-text);margin:0;">${title}</h2>${subtitle}</div>`;
}

function itemMarkup(spec: SectionSpec, layout: number): string {
  const title = spec.itemTitleKey ? `{{${spec.itemTitleKey}}}` : "";
  const text = spec.itemTextKey && spec.type !== "product_grid" ? `<p style="${BODY}font-size:0.82rem;line-height:1.5;color:var(--color-text-muted);margin:6px 0 0 0;">{{${spec.itemTextKey}}}</p>` : "";
  const meta = spec.itemMetaKey ? `<span style="${BODY}font-size:0.82rem;font-weight:700;color:var(--color-primary);">{{${spec.itemMetaKey}}}</span>` : "";
  const image = spec.itemImageKey ? `<img src="{{${spec.itemImageKey}}}" alt="${title}" style="display:block;width:100%;aspect-ratio:1.1/1;object-fit:cover;border-radius:10px;" />` : "";
  const link = spec.itemLinkKey ? `<a href="{{${spec.itemLinkKey}}}" style="${BODY}display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 12px;border-radius:8px;background:var(--color-background);border:1px solid var(--color-border);color:var(--color-primary);font-size:0.78rem;font-weight:700;text-decoration:none;transition:transform 0.2s;">Lihat</a>` : "";
  const label = spec.itemTextKey && spec.type === "product_grid" ? `<span style="${BODY}display:inline-block;font-size:0.72rem;font-weight:700;letter-spacing:0.04em;color:var(--color-text-muted);text-transform:uppercase;">{{${spec.itemTextKey}}}</span>` : "";

  if (layout === 0) {
    return `{{#${spec.collectionKey}}}<article style="display:flex;flex-direction:column;gap:10px;min-width:0;background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:16px;transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s;background:var(--color-background);" onmouseover="this.style.borderColor='var(--color-primary)';this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)';" onmouseout="this.style.borderColor='var(--color-border)';this.style.transform='translateY(0)';this.style.boxShadow='none';">${image}<div style="display:flex;flex-direction:column;gap:4px;">${label}<div style="${HEADING}font-size:0.95rem;line-height:1.35;color:var(--color-text);font-weight:700;">${title}</div>${text}</div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">${meta ? `<strong style="${HEADING}font-size:0.95rem;color:var(--color-text);">${meta}</strong>` : "<span></span>"}</div></div></article>{{/${spec.collectionKey}}}`;
  }
  if (layout === 1) {
    return `{{#${spec.collectionKey}}}<article style="display:flex;align-items:center;gap:12px;min-width:230px;max-width:340px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:12px;transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s;background:var(--color-background);" onmouseover="this.style.borderColor='var(--color-primary)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(0,0,0,0.08)';" onmouseout="this.style.borderColor='var(--color-border)';this.style.transform='translateY(0)';this.style.boxShadow='none';">${image ? `<div style="width:82px;flex:none;">${image}</div>` : `<span style="${ACCENT}display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:10px;background:var(--color-background);color:var(--color-primary);font-size:1rem;">${meta || "•"}</span>`}<div style="min-width:0;flex:1;display:flex;flex-direction:column;gap:6px;"><div style="${HEADING}font-size:0.97rem;line-height:1.3;color:var(--color-text);font-weight:700;">${title}</div>${text}${meta ? `<div style="${BODY}font-size:0.8rem;font-weight:700;color:var(--color-primary);">${meta}</div>` : ""}</div>${link ? `<div style="flex:none;">${link}</div>` : ""}</article>{{/${spec.collectionKey}}}`;
  }
  return `{{#${spec.collectionKey}}}<article style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;background:var(--color-surface);border:1px solid var(--color-border);border-left:4px solid var(--color-accent);border-radius:12px;padding:14px 16px;transition:transform 0.2s, box-shadow 0.2s;">${image ? `<div style="grid-column:1/-1;">${image}</div>` : ""}<div><div style="${HEADING}font-size:1rem;line-height:1.25;color:var(--color-text);font-weight:700;">${title}</div>${text}</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">${meta ? `<strong style="${HEADING}font-size:1rem;color:var(--color-text);">${meta}</strong>` : ""}</div></article>{{/${spec.collectionKey}}}`;
}

function specialBody(spec: SectionSpec, layout: number): string | null {
  if (spec.special === "hero") {
    if (layout === 0) {
      return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:28px;align-items:center;"><div style="padding:8px 0;"><span style="display:inline-block;background:var(--color-primary);color:var(--color-on-primary);font-size:0.72rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;border-radius:999px;padding:6px 14px;${BODY}transition:background 0.2s;">{{badge}}</span><h1 style="${HEADING}font-size:clamp(2.4rem,5vw,3.8rem);line-height:1.05;color:var(--color-text);margin:16px 0 14px;font-weight:800;">{{headline}}</h1><p style="${BODY}font-size:1.02rem;line-height:1.65;color:var(--color-text-muted);max-width:38rem;margin:0;">{{subheadline}}</p><div style="display:flex;gap:12px;margin-top:20px;"><a href="{{cta_link}}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;background:var(--color-primary);color:var(--color-on-primary);border-radius:999px;padding:0 22px;font-weight:800;text-decoration:none;${BODY}transition:transform 0.2s, box-shadow 0.2s;font-size:0.95rem;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">{{cta_text}}</a></div></div><img src="{{image}}" alt="Pilihan produk Pasar Modern" style="display:block;width:100%;height:auto;aspect-ratio:1.15/1;object-fit:cover;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);" /></div>`;
    }
    }
    if (layout === 1) {
      return `<div style="max-width:760px;margin:0 auto;text-align:center;"><span style="${ACCENT}font-size:0.9rem;color:var(--color-primary);font-weight:800;text-transform:uppercase;">{{badge}}</span><h1 style="${HEADING}font-size:2.2rem;line-height:1.08;color:var(--color-text);margin:14px 0 10px;">{{headline}}</h1><p style="${BODY}font-size:1rem;line-height:1.65;color:var(--color-text-muted);max-width:44rem;margin:0 auto;">{{subheadline}}</p><div style="display:flex;justify-content:center;gap:12px;margin:20px 0 22px;"><a href="{{cta_link}}" style="display:inline-flex;align-items:center;min-height:46px;background:var(--color-primary);color:var(--color-on-primary);border-radius:999px;padding:0 22px;font-weight:700;text-decoration:none;transition:transform 0.2s, box-shadow 0.2s;">{{cta_text}}</a></div><img src="{{image}}" alt="Pilihan produk Pasar Modern" style="display:block;width:100%;height:auto;aspect-ratio:2/1;object-fit:cover;border-radius:16px;" /></div>`;
    }
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:18px;align-items:stretch;"><div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:22px;"><span style="${ACCENT}color:var(--color-primary);font-size:0.9rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">{{badge}}</span><h1 style="${HEADING}font-size:2rem;line-height:1.1;color:var(--color-text);margin:14px 0 8px;">{{headline}}</h1><p style="${BODY}line-height:1.6;color:var(--color-text-muted);margin:0 0 16px;">{{subheadline}}</p><a href="{{cta_link}}" style="display:inline-flex;align-items:center;min-height:46px;background:var(--color-accent);color:var(--color-on-accent);padding:0 18px;border-radius:999px;font-weight:700;text-decoration:none;transition:transform 0.2s, box-shadow 0.2s;">{{cta_text}}</a></div><img src="{{image}}" alt="Pilihan produk Pasar Modern" style="width:100%;height:100%;min-height:240px;object-fit:cover;border-radius:14px;" /></div>`;
  }
  if (spec.special === "cta") return layout === 0
    ? `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:22px 24px;"><div><h2 style="${HEADING}font-size:1.7rem;color:var(--color-text);margin:0;">{{title}}</h2><p style="${BODY}line-height:1.6;color:var(--color-text-muted);margin:8px 0 0;">{{text}}</p></div><a href="{{cta_link}}" style="display:inline-flex;align-items:center;min-height:48px;background:var(--color-primary);color:var(--color-on-primary);padding:0 20px;border-radius:999px;${BODY}font-weight:700;text-decoration:none;">{{cta_text}}</a></div>`
    : layout === 1
      ? `<div style="max-width:700px;margin:auto;text-align:center;background:var(--color-surface);border:1px solid var(--color-border);border-radius:18px;padding:24px;"><span style="${ACCENT}font-size:0.9rem;color:var(--color-primary);font-weight:800;text-transform:uppercase;letter-spacing:0.08em;">PILIHAN LOKAL</span><h2 style="${HEADING}font-size:2rem;color:var(--color-text);margin:12px 0 8px;">{{title}}</h2><p style="${BODY}line-height:1.6;color:var(--color-text-muted);">{{text}}</p><a href="{{cta_link}}" style="display:inline-flex;align-items:center;min-height:48px;margin-top:10px;background:var(--color-accent);color:var(--color-on-accent);padding:0 22px;border-radius:999px;${BODY}font-weight:700;text-decoration:none;">{{cta_text}}</a></div>`
      : `<div style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:20px;background:var(--color-surface);border:1px solid var(--color-border);padding:20px;border-radius:12px;"><div><h2 style="${HEADING}font-size:1.7rem;color:var(--color-text);margin:0;">{{title}}</h2><p style="${BODY}line-height:1.6;color:var(--color-text-muted);margin:8px 0 0;">{{text}}</p></div><a href="{{cta_link}}" style="display:inline-flex;align-items:center;min-height:48px;background:var(--color-primary);color:var(--color-on-primary);padding:0 18px;border-radius:999px;${BODY}font-weight:700;text-decoration:none;">{{cta_text}}</a></div>`;
  if (spec.special === "contact") return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:18px;align-items:center;"><div><h2 style="${HEADING}font-size:1.8rem;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2><p style="${BODY}line-height:1.6;color:var(--color-text-muted);">{{subtitle}}</p></div><div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:10px;padding:18px;${BODY}color:var(--color-text);">{{phone}}<br />{{email}}<br />{{address}}</div><a href="{{cta_link}}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;background:var(--color-primary);color:var(--color-on-primary);padding:0 18px;border-radius:6px;${BODY}font-weight:700;text-decoration:none;">{{cta_text}}</a></div>`;
  if (spec.special === "location") {
  ${"{{title}}"}<h2 style="${HEADING}font-size:1.9rem;color:var(--color-text);margin:10px 0;">Datang dan lihat langsung</h2></div><div style="background:var(--color-surface);padding:20px;border-radius:12px;${BODY}color:var(--color-text);">{{address}}<br /><strong>{{hours}}</strong><p style="color:var(--color-text-muted);">{{note}}</p></div></div>`
    return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:18px;"><span style="color:var(--color-primary);${BODY}font-weight:800;">LOCAL STORE</span><div style="flex:1;min-width:220px;"><h2 style="${HEADING}font-size:1.8rem;color:var(--color-text);margin:0 0 8px 0;">{{title}}</h2><p style="${BODY}color:var(--color-text-muted);">{{address}} · {{hours}}</p><p style="${BODY}color:var(--color-text-muted);">{{note}}</p></div></div>`;
  }
  if (spec.special === "about") return layout === 0
    ? `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:22px;align-items:center;"><img src="{{image}}" alt="Suasana Pasar Modern" style="width:100%;aspect-ratio:1.2/1;object-fit:cover;border-radius:14px;"/><div><h2 style="${HEADING}font-size:1.9rem;color:var(--color-text);">{{title}}</h2><p style="${BODY}line-height:1.7;color:var(--color-text-muted);">{{content}}</p><a href="{{cta_link}}" style="${BODY}color:var(--color-primary);font-weight:700;">{{cta_text}}</a></div></div>`
    : layout === 1
      ? `<div style="max-width:700px;margin:auto;text-align:center;"><span style="${ACCENT}color:var(--color-primary);">CERITA TOKO</span><h2 style="${HEADING}font-size:1.9rem;color:var(--color-text);">{{title}}</h2><p style="${BODY}line-height:1.7;color:var(--color-text-muted);">{{content}}</p><a href="{{cta_link}}" style="${BODY}color:var(--color-primary);font-weight:700;">{{cta_text}}</a><img src="{{image}}" alt="Suasana Pasar Modern" style="display:block;width:100%;margin-top:20px;aspect-ratio:2/1;object-fit:cover;border-radius:14px;"/></div>`
      : `<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:18px;align-items:center;background:var(--color-surface);padding:20px;border-radius:14px;"><div><h2 style="${HEADING}font-size:1.8rem;color:var(--color-text);">{{title}}</h2><p style="${BODY}line-height:1.7;color:var(--color-text-muted);">{{content}}</p><a href="{{cta_link}}" style="${BODY}color:var(--color-primary);font-weight:700;">{{cta_text}}</a></div><img src="{{image}}" alt="Suasana Pasar Modern" style="width:100%;aspect-ratio:1.3/1;object-fit:cover;border-radius:10px;"/></div>`;
  if (spec.special === "video") return `<div style="max-width:780px;margin:auto;text-align:center;"><span style="display:inline-flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:50%;background:var(--color-accent);color:var(--color-on-accent);font-size:1.2rem;">▶</span><h2 style="${HEADING}font-size:1.8rem;color:var(--color-text);">{{title}}</h2><p style="${BODY}line-height:1.6;color:var(--color-text-muted);">{{subtitle}}</p><a href="{{video_url}}" style="${BODY}color:var(--color-primary);font-weight:700;">Lihat cerita produk</a></div>`;
  if (spec.special === "newsletter") return `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:12px;padding:22px;"><div><h2 style="${HEADING}font-size:1.6rem;color:var(--color-text);margin:0;">{{title}}</h2><p style="${BODY}color:var(--color-text-muted);">{{subtitle}}</p></div><a href="{{button_link}}" style="display:inline-flex;align-items:center;min-height:46px;background:var(--color-primary);color:var(--color-on-primary);padding:0 18px;border-radius:6px;${BODY}font-weight:700;text-decoration:none;">{{button_text}}</a></div>`;
  if (spec.special === "divider") return layout === 0
    ? `<div style="display:flex;align-items:center;gap:14px;color:var(--color-primary);${BODY}font-weight:700;"><span style="height:1px;background:var(--color-border);flex:1;"></span><span>{{label}}</span><span style="height:1px;background:var(--color-border);flex:1;"></span></div>`
    : layout === 1
      ? `<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;"><span style="height:4px;background:var(--color-accent);border-radius:4px;"></span><span style="${ACCENT}font-size:1rem;color:var(--color-primary);">{{label}}</span><span style="height:1px;background:var(--color-border);"></span></div>`
      : `<div style="text-align:center;padding:12px;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border);"><span style="${HEADING}font-size:1rem;color:var(--color-text);">{{label}}</span></div>`;
  if (spec.special === "marquee") return `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;${BODY}font-size:0.8rem;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:var(--color-on-accent);">{{#items}}<span style="display:inline-flex;align-items:center;min-height:38px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:999px;padding:0 16px;color:var(--color-primary);">{{text}}</span>{{/items}}</div>`;
  return null;
}

function genericBody(spec: SectionSpec, layout: number): string {
  const list = itemMarkup(spec, layout);
  if (layout === 0) {
    const minCardWidth = spec.type === "product_grid" ? 150 : 190;
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,${minCardWidth}px),1fr));gap:12px;">${list}</div>`;
  }
  if (layout === 1) return `<div style="display:flex;overflow-x:auto;gap:12px;padding:4px 2px 12px;scrollbar-width:thin;">${list}</div>`;
  return `<div style="display:grid;gap:8px;">${list}</div>`;
}

function sectionHtml(spec: SectionSpec, layout: number): string {
  const variant = VARIANTS[layout];
  const slug = `${spec.type}-${variant.suffix}`;
  const data = `data-tpl-type="${spec.type}" data-tpl-variant="${vid(slug)}"`;
  const title = spec.special ? "" : titleMarkup(spec);
  const body = specialBody(spec, layout) ?? genericBody(spec, layout);
  if (spec.special === "marquee") {
    return `<section ${data} style="background:var(--color-accent);color:var(--color-on-accent);padding:14px 16px;${BODY}">${body}</section>`;
  }
  if (spec.special) {
    return `<section ${data} style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:40px 20px;margin:24px 0;"><div style="max-width:1152px;margin:0 auto;">${body}</div></section>`;
  }
  if (layout === 0) {
    return `<section ${data} style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:16px;padding:40px 20px;margin:24px 0;"><div style="max-width:1152px;margin:0 auto;">${title}${body}</div></section>`;
  }
  if (layout === 1) {
    return `<section ${data} style="background:var(--color-background);border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border);padding:40px 20px;margin:24px 0;"><div style="max-width:1152px;margin:0 auto;"><div style="max-width:720px;margin:0 auto;text-align:center;">${title}</div>${body}</div></section>`;
  }
  return `<section ${data} style="background:linear-gradient(135deg, var(--color-primary) 0%, #8B5CF6 100%);color:var(--color-on-primary);padding:40px 20px;border-radius:16px;margin:24px 0;"><div style="max-width:1152px;margin:0 auto;background:rgba(255,255,255,0.12);border-radius:12px;padding:28px;box-shadow:0 8px 32px rgba(0,0,0,0.15);">${title}${body}</div></section>`;
}

function makeVariant(spec: SectionSpec, layout: number) {
  const variant = VARIANTS[layout];
  const slug = `${spec.type}-${variant.suffix}`;
  return {
    id: vid(slug),
    name: `${spec.name} ${variant.label}`,
    description: variant.description,
    layout: vid(slug),
    configFields: inferFields(spec.config),
    defaultConfig: { ...spec.config },
    mockup: vid(slug),
    html: sectionHtml(spec, layout),
  };
}

export const SECTIONS: SectionTypeDefinition[] = sectionSpecs.map((spec) => ({
  type: spec.type,
  name: spec.name,
  icon: spec.icon,
  variants: spec.special === "marquee"
    ? [makeVariant(spec, 0)]
    : [makeVariant(spec, 0), makeVariant(spec, 1), makeVariant(spec, 2)],
}));