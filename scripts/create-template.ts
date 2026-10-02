/**
 * Kerangka template v3.0 siap isi AI (lihat docs/AI_TEMPLATE_PROMPT.md).
 *
 * AI eksternal tidak mengenal codebase — skrip ini memberi kerangka JSON
 * yang SUDAH kompatibel (semua 19 tipe section, ≥3 varian per tipe,
 * ≥5 header/footer, activeSections, configFields + defaultConfig,
 * slot variant.html + field html, animations/behaviours/customCss).
 *
 * Pakai:
 *   bun scripts/create-template.ts --category food --design organic --name "Warung Makan" > template.json
 *   bun scripts/create-template.ts --help
 *
 * Output: template.json v3.0 ke stdout (atau --out <file>).
 * Validasi: bun scripts/create-template.ts --validate template.json
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { validateTemplateV3 } from '../src/lib/builder/template-schema';

type Args = Record<string, string | boolean>;

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
}

const FIELD = (
  key: string,
  label: string,
  type: string,
  extra: Record<string, unknown> = {},
) => ({ key, label, type, ...extra });

function headerVariant(id: string, name: string, layout: string, siteTitle: string) {
  return {
    id,
    name,
    description: `${name} — varian header ${layout}`,
    layout,
    mockup: `header-${layout}`,
    maxNavDepth: 1,
    configFields: [
      FIELD('logoUrl', 'Logo URL', 'image', { placeholder: 'https://...' }),
      FIELD('siteTitle', 'Nama Toko', 'text', { placeholder: siteTitle }),
      FIELD('tagline', 'Tagline', 'text'),
      FIELD('navItems', 'Menu Navigasi', 'list', {
        itemFields: [
          FIELD('label', 'Label', 'text'),
          FIELD('url', 'URL', 'text'),
        ],
      }),
      FIELD('ctaText', 'Teks CTA', 'text'),
      FIELD('ctaLink', 'Link CTA', 'text'),
      FIELD('showCta', 'Tampilkan CTA', 'switch'),
      FIELD('sticky', 'Header menempel', 'switch'),
    ],
    defaultConfig: {
      logoUrl: '',
      siteTitle,
      tagline: '',
      navItems: [],
      ctaText: '',
      ctaLink: '#kontak',
      showCta: true,
      sticky: true,
      contentWidth: '6xl',
    },
  };
}

function footerVariant(id: string, name: string, layout: string, siteTitle: string) {
  return {
    id,
    name,
    description: `${name} — varian footer ${layout}`,
    layout,
    mockup: `footer-${layout}`,
    configFields: [
      FIELD('siteTitle', 'Nama Toko', 'text'),
      FIELD('logoUrl', 'Logo URL', 'image'),
      FIELD('text', 'Teks Copyright', 'text', { placeholder: `© {year} ${siteTitle}` }),
      FIELD('showNav', 'Tampilkan navigasi', 'switch'),
      FIELD('navItems', 'Menu Footer', 'list', {
        itemFields: [FIELD('label', 'Label', 'text'), FIELD('url', 'URL', 'text')],
      }),
      FIELD('showSocial', 'Tampilkan sosmed', 'switch'),
    ],
    defaultConfig: {
      siteTitle,
      logoUrl: '',
      text: `© {year} ${siteTitle}.`,
      navItems: [],
      showNav: true,
      showSocial: true,
    },
  };
}

function sectionVariant(
  type: string,
  id: string,
  name: string,
  fields: Array<Record<string, unknown>>,
  config: Record<string, unknown>,
  withHtml = false,
) {
  return {
    id,
    name,
    description: `${name} — varian ${type}`,
    layout: id,
    mockup: id,
    ...(withHtml
      ? {
          html: `<section data-tpl-type="${type}" data-tpl-variant="${id}">\n  <!-- GANTI dengan HTML kreatifmu. Placeholder: {{key}} = teks aman, {{{key}}} = HTML. -->\n</section>`,
        }
      : {}),
    configFields: fields,
    defaultConfig: config,
    defaultStyle: {
      padding: { top: 64, right: 24, bottom: 64, left: 24 },
      background: 'transparent',
    },
  };
}

const TEXT_TITLE = (label = 'Judul') => FIELD('title', label, 'text');
const TEXTAREA_SUB = (label = 'Sub Judul') => FIELD('subtitle', label, 'textarea');

function buildSections(): Array<Record<string, unknown>> {
  const list = (label: string, itemFields: Array<Record<string, unknown>>) =>
    FIELD('items', label, 'list', { itemFields });
  const t = (k: string, l: string) => FIELD(k, l, 'text');
  const ta = (k: string, l: string) => FIELD(k, l, 'textarea');

  const specs: Array<{ type: string; name: string; variants: Array<Record<string, unknown>> }> = [
    {
      type: 'hero', name: 'Hero',
      variants: ['hero-full', 'hero-split', 'hero-card'].map((id, i) =>
        sectionVariant('hero', id, `Hero ${i + 1}`,
          [t('headline', 'Headline'), ta('subheadline', 'Subheadline'), t('cta_text', 'Teks CTA'), t('cta_link', 'Link CTA'), FIELD('image', 'Gambar', 'image')],
          { headline: '', subheadline: '', cta_text: '', cta_link: '#kontak', image: '' }, i === 2),
      ),
    },
    {
      type: 'features', name: 'Fitur',
      variants: ['features-3col', 'features-list', 'features-masonry'].map((id, i) =>
        sectionVariant('features', id, `Fitur ${i + 1}`,
          [TEXT_TITLE(), list('Items', [t('icon', 'Icon'), t('title', 'Judul'), ta('description', 'Deskripsi')])],
          { title: '', items: [] }, i === 2),
      ),
    },
    {
      type: 'product_grid', name: 'Produk',
      variants: ['product-4col', 'product-3col', 'product-carousel'].map((id) =>
        sectionVariant('product_grid', id, id, [TEXT_TITLE()], { title: '' }),
      ),
    },
    {
      type: 'testimonials', name: 'Testimoni',
      variants: ['testimonials-grid', 'testimonials-carousel', 'testimonials-single'].map((id) =>
        sectionVariant('testimonials', id, id,
          [TEXT_TITLE(), list('Testimoni', [t('name', 'Nama'), ta('text', 'Review'), FIELD('rating', 'Rating', 'number')])],
          { title: '', items: [] }),
      ),
    },
    {
      type: 'faq', name: 'FAQ',
      variants: ['faq-accordion', 'faq-list', 'faq-grid'].map((id) =>
        sectionVariant('faq', id, id,
          [TEXT_TITLE(), list('FAQ', [t('question', 'Pertanyaan'), ta('answer', 'Jawaban')])],
          { title: '', items: [] }),
      ),
    },
    {
      type: 'cta', name: 'CTA',
      variants: ['cta-banner', 'cta-card', 'cta-split'].map((id) =>
        sectionVariant('cta', id, id,
          [t('title', 'Judul'), ta('text', 'Teks'), t('cta_text', 'Teks Tombol'), t('cta_link', 'Link')],
          { title: '', text: '', cta_text: '', cta_link: '#kontak' }),
      ),
    },
    {
      type: 'contact', name: 'Kontak',
      variants: ['contact-form', 'contact-form-map', 'contact-split'].map((id) =>
        sectionVariant('contact', id, id,
          [t('title', 'Judul'), ta('subtitle', 'Subtitle'), ta('address', 'Alamat'), t('phone', 'Telepon'), t('email', 'Email')],
          { title: '', subtitle: '', address: '', phone: '', email: '' }),
      ),
    },
    {
      type: 'booking', name: 'Booking',
      variants: [
        sectionVariant('booking', 'booking-single', 'Form Saja',
          [t('title', 'Judul'), ta('subtitle', 'Subtitle'),
            list('Layanan', [t('name', 'Nama'), t('duration', 'Durasi'), t('price', 'Harga')]),
            t('hours', 'Jam operasional'), ta('address', 'Alamat'), ta('success_message', 'Pesan sukses')],
          { title: '', subtitle: '', services: [], hours: '', address: '', success_message: '' }),
      ],
    },
    {
      type: 'about', name: 'Tentang',
      variants: ['about-left', 'about-right', 'about-centered'].map((id) =>
        sectionVariant('about', id, id,
          [t('title', 'Judul'), FIELD('content', 'Konten', 'html'), FIELD('image', 'Gambar', 'image')],
          { title: '', content: '', image: '' }),
      ),
    },
    {
      type: 'gallery', name: 'Galeri',
      variants: ['gallery-grid', 'gallery-masonry', 'gallery-carousel'].map((id) =>
        sectionVariant('gallery', id, id, [TEXT_TITLE(), FIELD('images', 'Gambar', 'gallery')], { title: '', images: [] }),
      ),
    },
    {
      type: 'video', name: 'Video',
      variants: ['video-full', 'video-centered', 'video-bg'].map((id) =>
        sectionVariant('video', id, id, [TEXT_TITLE(), t('video_url', 'URL Video')], { title: '', video_url: '' }),
      ),
    },
    {
      type: 'team', name: 'Tim',
      variants: ['team-grid', 'team-list', 'team-carousel'].map((id) =>
        sectionVariant('team', id, id,
          [TEXT_TITLE(), list('Anggota', [t('name', 'Nama'), t('role', 'Peran'), FIELD('image', 'Foto', 'image')])],
          { title: '', members: [] }),
      ),
    },
    {
      type: 'pricing', name: 'Harga',
      variants: ['pricing-3tier', 'pricing-2tier', 'pricing-single'].map((id) =>
        sectionVariant('pricing', id, id,
          [TEXT_TITLE(), list('Paket', [t('name', 'Nama'), t('price', 'Harga'),
            // Kontrak kanonis: features = string[] (lihat PricingSection).
            // Renderer menoleransi objek {text}/{v}, tapi AI WAJIB mengisi
            // plain strings: { name, price, features: ["...", "..."] }.
            FIELD('features', 'Fitur Paket (isi string polos)', 'list', { itemFields: [FIELD('v', 'Fitur', 'text')], maxItems: 8 })])],
          { title: '', items: [] }),
      ),
    },
    {
      type: 'newsletter', name: 'Newsletter',
      variants: ['newsletter-inline', 'newsletter-card', 'newsletter-split'].map((id) =>
        sectionVariant('newsletter', id, id,
          [t('title', 'Judul'), ta('subtitle', 'Subtitle'), t('placeholder', 'Placeholder'), t('button_text', 'Teks Tombol')],
          { title: '', subtitle: '', placeholder: '', button_text: '' }),
      ),
    },
    {
      type: 'divider', name: 'Divider',
      variants: ['divider-line', 'divider-spacer', 'divider-image'].map((id) =>
        sectionVariant('divider', id, id,
          [FIELD('style', 'Gaya', 'select', { options: [{ label: 'Garis', value: 'solid' }, { label: 'Spasi', value: 'spacer' }] }), FIELD('color', 'Warna', 'color')],
          { style: 'solid', color: '' }),
      ),
    },
    {
      type: 'marquee', name: 'Teks Berjalan',
      variants: [
        sectionVariant('marquee', 'marquee-band', 'Pita Berjalan',
          [FIELD('items', 'Teks', 'list', { itemFields: [FIELD('text', 'Teks', 'text')] })],
          { items: [] }),
      ],
    },
    {
      type: 'menu_board', name: 'Menu',
      variants: ['menu-tabs', 'menu-list', 'menu-grid'].map((id) =>
        sectionVariant('menu_board', id, id,
          [TEXT_TITLE(), TEXTAREA_SUB(),
            list('Grup', [t('label', 'Label'), FIELD('items', 'Item', 'list', { itemFields: [t('name', 'Nama'), ta('desc', 'Deskripsi'), t('price', 'Harga')] })])],
          { title: '', subtitle: '', groups: [] }),
      ),
    },
    {
      type: 'steps', name: 'Langkah',
      variants: ['steps-3col', 'steps-horizontal', 'steps-numbered'].map((id) =>
        sectionVariant('steps', id, id,
          [TEXT_TITLE(), TEXTAREA_SUB(), list('Langkah', [t('title', 'Judul'), ta('description', 'Deskripsi')])],
          { title: '', subtitle: '', items: [] }),
      ),
    },
    {
      type: 'location', name: 'Lokasi',
      variants: ['location-hours', 'location-hours-wide', 'location-card'].map((id) =>
        sectionVariant('location', id, id,
          [t('title', 'Judul'), ta('address', 'Alamat'), ta('note', 'Catatan'), t('button_text', 'Teks Tombol'), t('button_link', 'Link'),
            FIELD('hours', 'Jam', 'list', { itemFields: [FIELD('days', 'Hari', 'text'), FIELD('time', 'Jam', 'text')] })],
          { title: '', address: '', note: '', button_text: '', button_link: '', hours: [] }),
      ),
    },
  ];
  return specs;
}

function buildTemplate(opts: { category: string; design: string; name: string; description: string }) {
  const siteTitle = opts.name;
  return {
    version: '3.0',
    name: opts.name,
    description: opts.description || `Template ${opts.name} — isi deskripsi, palet, dan konten sesuai niche.`,
    category: opts.category,
    designType: opts.design,
    theme: {
      palette: {
        primary: '#111827', secondary: '#374151', accent: '#f59e0b',
        background: '#ffffff', surface: '#f9fafb',
        text: '#111827', textMuted: '#6b7280', border: '#e5e7eb',
      },
      typography: {
        headingFont: 'Inter', bodyFont: 'Inter',
        baseSize: 16, scaleRatio: 1.25, headingWeight: 700, bodyWeight: 400,
      },
      components: {
        borderRadius: 12, buttonStyle: 'solid', shadowStyle: 'md',
        navStyle: 'solid', footerStyle: 'columns',
      },
      effects: { borderWidth: 0, uppercaseHeadings: false },
    },
    headers: [
      headerVariant('hdr-klasik', 'Klasik', 'standard', siteTitle),
      headerVariant('hdr-melayang', 'Melayang', 'floating', siteTitle),
      headerVariant('hdr-hero', 'Hero', 'hero-overlay', siteTitle),
      headerVariant('hdr-split', 'Nav Kiri', 'split-nav', siteTitle),
      headerVariant('hdr-topbar', 'Promo Topbar', 'with-topbar', siteTitle),
    ],
    footers: [
      footerVariant('ftr-inline', 'Inline', 'simple', siteTitle),
      footerVariant('ftr-kolom', 'Kolom Aksen', 'columns', siteTitle),
      footerVariant('ftr-tengah', 'Brand Tengah', 'centered', siteTitle),
      footerVariant('ftr-mini', 'Mini', 'minimal', siteTitle),
      footerVariant('ftr-news', 'Newsletter', 'newsletter', siteTitle),
    ],
    sections: buildSections(),
    activeSections: ['hero', 'features', 'pricing', 'booking', 'testimonials', 'gallery', 'location', 'faq', 'contact'],
    data: {
      designStyleId: 'minimalist',
      paletteOverride: {
        primary: '#111827', secondary: '#374151', accent: '#f59e0b',
        background: '#ffffff', surface: '#f9fafb',
        text: '#111827', textMuted: '#6b7280', border: '#e5e7eb',
      },
      customCss: '/* Gaya kreatif template di sini — sasar [data-tpl-type] / [data-tpl-variant], pakai var(--color-*). */',
      activeSections: ['hero', 'features', 'pricing', 'booking', 'testimonials', 'gallery', 'location', 'faq', 'contact'],
      sections: [
        { type: 'hero', variant: 'hero-full', anchorId: 'beranda', config: { headline: '', subheadline: '', cta_text: '', cta_link: '#kontak' } },
        { type: 'features', variant: 'features-3col', anchorId: 'keunggulan', config: { title: '', items: [] } },
        { type: 'pricing', variant: 'pricing-3tier', anchorId: 'harga', config: { title: '', items: [] } },
        { type: 'booking', variant: 'booking-single', anchorId: 'booking', config: { title: '', subtitle: '', services: [], hours: '', address: '', success_message: '' } },
        { type: 'testimonials', variant: 'testimonials-grid', anchorId: 'testimoni', config: { title: '', items: [] } },
        { type: 'gallery', variant: 'gallery-grid', anchorId: 'galeri', config: { title: '', images: [] } },
        { type: 'location', variant: 'location-hours', anchorId: 'lokasi', config: { title: '', address: '', hours: [] } },
        { type: 'faq', variant: 'faq-accordion', anchorId: 'faq', config: { title: '', items: [] } },
        { type: 'contact', variant: 'contact-form', anchorId: 'kontak', config: { title: '', subtitle: '', address: '', phone: '', email: '' } },
      ],
      header: {
        variant: 'hdr-klasik', siteTitle, tagline: '',
        navItems: [], ctaText: '', ctaLink: '#kontak', showCta: true, sticky: true,
      },
      footer: { style: 'columns', text: `© {year} ${siteTitle}.`, navItems: [], showSocial: true },
      seo: { title: `${siteTitle} — Isi judul SEO`, description: 'Isi deskripsi SEO minimal 50 karakter agar template lolos checklist.' },
      core: { site_title: siteTitle, tagline: '' },
    },
    animations: [],
    behaviours: [],
    customCss: '',
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    console.log(`Buat kerangka template v3.0 siap isi AI.

Pakai:
  bun scripts/create-template.ts --category food --design organic --name "Warung Makan" [--out template.json]
  bun scripts/create-template.ts --validate template.json

Opsi:
  --category   food|fashion|retail|handicraft|services (default: services)
  --design     editorial|brutalist|organic|luxury|tech (default: organic)
  --name       Nama template (default: "Template Baru")
  --description Deskripsi template
  --out        Tulis ke file (default: stdout)
  --validate   Validasi file template.json (v3)
`);
    process.exit(0);
  }
  if (args.validate) {
    const path = String(args.validate === true ? args._ ?? '' : args.validate);
    const target = typeof args.validate === 'string' ? args.validate : String(args.out ?? '');
    const file = target || process.argv[process.argv.length - 1];
    if (!file || !existsSync(file)) {
      console.error('File tidak ditemukan. Pakai: bun scripts/create-template.ts --validate template.json');
      process.exit(1);
    }
    const json = JSON.parse(readFileSync(file, 'utf8'));
    const result = validateTemplateV3(json);
    if (!result.ok) {
      console.error('TIDAK VALID:');
      for (const e of result.errors) console.error(` - ${e}`);
      process.exit(1);
    }
    console.log('VALID v3.0');
    for (const w of result.warnings) console.log(`warning: ${w}`);
    process.exit(0);
  }
  const tpl = buildTemplate({
    category: String(args.category ?? 'services'),
    design: String(args.design ?? 'organic'),
    name: String(args.name ?? 'Template Baru'),
    description: String(args.description ?? ''),
  });
  const out = JSON.stringify(tpl, null, 2);
  if (args.out && typeof args.out === 'string') {
    writeFileSync(args.out, out);
    console.log(`Kerangka v3.0 ditulis ke ${args.out}`);
  } else {
    process.stdout.write(out);
  }
}

void main();
