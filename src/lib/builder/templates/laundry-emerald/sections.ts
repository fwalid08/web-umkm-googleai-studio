import type { SectionTypeDefinition } from "../../template-types";
import { vid, inferFields, IMG, BODY, HEADING, SCRIPT } from "./shared";

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

export const HERO_CONFIG = {
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

export const FEATURES_CONFIG = {
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

export const ABOUT_CONFIG = {
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

export const PRICING_CONFIG = {
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

export const STATS_CONFIG = {
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

export const PROCESS_CONFIG = {
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

export const FAQ_CONFIG = {
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

export const TESTI_CONFIG = {
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

export const STEPS_CONFIG = {
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

export const GALLERY_CONFIG = {
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

export const ARTICLES_CONFIG = {
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

export const LOCATION_CONFIG = {
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

export const CONTACT_CONFIG = {
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

export const SECTIONS: SectionTypeDefinition[] = SECTION_SPECS.map((s) => ({
  type: s.type,
  name: s.name,
  icon: s.icon,
  variants: s.variants.map((v) => toVariant(v)),
}));

/* ------------------------------------------------------------------ */
/* Template                                                             */
/* ------------------------------------------------------------------ */
