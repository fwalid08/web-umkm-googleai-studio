import type { ConfigField, HeaderVariant, FooterVariant, SectionTypeDefinition } from '../template-types';

/**
 * Pabrik `ConfigField` bersama untuk template Bengkel.
 *
 * Field di sini dipakai ulang oleh varian header/footer/section. Tujuannya:
 * tiap `defaultConfig` punya form field yang cocok (kontrak "tidak ada konten
 * hardcoded" di `templates/catalog.test.ts`), tanpa mengulang definisi yang
 * sama puluhan kali.
 */

/** Field "Lebar Konten" — sama dengan `CONTENT_WIDTH_FIELD` pangkas-rapi. */
export const CONTENT_WIDTH_FIELD: ConfigField = {
  key: 'contentWidth',
  label: 'Lebar Konten',
  type: 'select',
  defaultValue: '6xl',
  options: [
    { label: 'Penuh (mengikuti layar)', value: 'full' },
    { label: 'Lebar — 1152px (disarankan)', value: '6xl' },
    { label: 'Sedang — 1024px', value: '5xl' },
    { label: 'Sempit — 896px', value: '4xl' },
  ],
};

export const LOGO_FIELD: ConfigField = { key: 'logoUrl', label: 'Logo', type: 'image' };
export const TITLE_FIELD: ConfigField = { key: 'siteTitle', label: 'Nama Bengkel', type: 'text' };
export const TAGLINE_FIELD: ConfigField = { key: 'tagline', label: 'Tagline', type: 'text' };
export const STICKY_FIELD: ConfigField = { key: 'sticky', label: 'Header menempel', type: 'switch' };
export const SHOW_CTA_FIELD: ConfigField = { key: 'showCta', label: 'Tampilkan tombol CTA', type: 'switch' };
export const CTA_TEXT_FIELD: ConfigField = { key: 'ctaText', label: 'Teks CTA', type: 'text' };
export const CTA_LINK_FIELD: ConfigField = { key: 'ctaLink', label: 'Link CTA', type: 'text' };

export const NAV_FIELD: ConfigField = {
  key: 'navItems',
  label: 'Menu Navigasi',
  type: 'list',
  itemFields: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'url', label: 'URL', type: 'text' },
  ],
};

export const TOPBAR_TEXT_FIELD: ConfigField = { key: 'topbarText', label: 'Pesan Promo', type: 'text' };
export const TOPBAR_PHONE_FIELD: ConfigField = { key: 'topbarPhone', label: 'Telepon Topbar', type: 'text' };
export const TOPBAR_EMAIL_FIELD: ConfigField = { key: 'topbarEmail', label: 'Email Topbar', type: 'text' };

export const WA = 'https://wa.me/6281234567890';
export const ADDRESS = 'Jl. Raya Industri No. 45, Jakarta Timur';

/** Nav utama bengkel — dipakai varian header yang butuh menu. */
const NAV = [
  { id: 'bk-layanan', label: 'Layanan', url: '#layanan', isExternal: false, enabled: true },
  { id: 'bk-harga', label: 'Harga', url: '#harga', isExternal: false, enabled: true },
  { id: 'bk-booking', label: 'Booking', url: '#booking', isExternal: false, enabled: true },
  { id: 'bk-galeri', label: 'Galeri', url: '#galeri', isExternal: false, enabled: true },
  { id: 'bk-kontak', label: 'Kontak', url: '#kontak', isExternal: false, enabled: true },
];

/**
 * Lima varian header template bengkel.
 *
 * Semua `maxNavDepth: 1` (menu datar — bengkel tidak butuh submenu), dijaga
 * kontrak di `templates/catalog.test.ts`.
 *
 * Bentuk tiap varian benar-benar berbeda satu sama lain, bukan hanya geser
 * rata kiri/tengah/kanan: ada topbar promo, ada tombol melayang, ada blok
 * brand besar, ada ultra minimal.
 */
export const BENGKEL_HEADERS: HeaderVariant[] = [
  {
    id: 'bk-hdr-workshop',
    name: 'Bar Pabrik',
    description: 'Bar technical dengan label tier servis dan CTA oranye di kanan',
    layout: 'standard',
    mockup: 'header-standard',
    maxNavDepth: 1,
    configFields: [
      LOGO_FIELD, TITLE_FIELD, TAGLINE_FIELD, NAV_FIELD,
      CTA_TEXT_FIELD, CTA_LINK_FIELD, SHOW_CTA_FIELD, STICKY_FIELD, CONTENT_WIDTH_FIELD,
    ],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      tagline: 'Servis Motor & Mobil',
      navItems: NAV,
      ctaText: 'Booking Servis',
      ctaLink: WA,
      showCta: true,
      sticky: true,
      contentWidth: '6xl',
    },
  },
  {
    id: 'bk-hdr-topbar-promo',
    name: 'Topbar Promo',
    description: 'Baris promo garansi di atas, navigasi utama di bawahnya',
    layout: 'with-topbar',
    mockup: 'header-with-topbar',
    maxNavDepth: 1,
    configFields: [
      TOPBAR_TEXT_FIELD, TOPBAR_PHONE_FIELD, TOPBAR_EMAIL_FIELD,
      LOGO_FIELD, TITLE_FIELD, NAV_FIELD,
      CTA_TEXT_FIELD, CTA_LINK_FIELD, SHOW_CTA_FIELD, STICKY_FIELD, CONTENT_WIDTH_FIELD,
    ],
    defaultConfig: {
      topbarText: 'Garansi servis 30 hari · Spare part original',
      topbarPhone: '021-5550123',
      topbarEmail: 'halo@bengkeljayamotor.id',
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      navItems: NAV,
      ctaText: 'Chat Mekanik',
      ctaLink: WA,
      showCta: true,
      sticky: true,
      contentWidth: '6xl',
    },
  },
  {
    id: 'bk-hdr-brand-block',
    name: 'Blok Brand',
    description: 'Blok brand besar dengan tagline, menu dan CTA menumpuk di kanan',
    layout: 'split-nav',
    mockup: 'header-split-nav',
    maxNavDepth: 1,
    configFields: [
      LOGO_FIELD, TITLE_FIELD, TAGLINE_FIELD, NAV_FIELD,
      CTA_TEXT_FIELD, CTA_LINK_FIELD, SHOW_CTA_FIELD, STICKY_FIELD, CONTENT_WIDTH_FIELD,
    ],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      tagline: 'Mekanik berpengalaman 10 tahun',
      navItems: NAV,
      ctaText: 'Cek Estimasi Biaya',
      ctaLink: '#harga',
      showCta: true,
      sticky: false,
      contentWidth: '6xl',
    },
  },
  {
    id: 'bk-hdr-float-bar',
    name: 'Bar Melayang',
    description: 'Bar mengambang membulat dengan glow, melayang di atas hero',
    layout: 'floating',
    mockup: 'header-floating',
    maxNavDepth: 1,
    configFields: [
      LOGO_FIELD, TITLE_FIELD, NAV_FIELD,
      CTA_TEXT_FIELD, CTA_LINK_FIELD, SHOW_CTA_FIELD, STICKY_FIELD, CONTENT_WIDTH_FIELD,
    ],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      navItems: NAV,
      ctaText: 'Booking Sekarang',
      ctaLink: WA,
      showCta: true,
      sticky: true,
      contentWidth: '6xl',
    },
  },
  {
    id: 'bk-hdr-ultra-minimal',
    name: 'Ultra Minimal',
    description: 'Hanya logo dan tombol menu, sisanya lewat hamburger',
    layout: 'minimal',
    mockup: 'header-minimal',
    maxNavDepth: 1,
    configFields: [
      LOGO_FIELD, TITLE_FIELD, NAV_FIELD,
      CTA_TEXT_FIELD, CTA_LINK_FIELD, SHOW_CTA_FIELD, STICKY_FIELD, CONTENT_WIDTH_FIELD,
    ],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      navItems: NAV,
      ctaText: 'Booking',
      ctaLink: WA,
      showCta: true,
      sticky: true,
      contentWidth: 'full',
    },
  },
];

/** Field konfigurasi footer bengkel. */
const F_TEXT: ConfigField = { key: 'text', label: 'Teks Copyright', type: 'text' };
const F_SHOW_NAV: ConfigField = { key: 'showNav', label: 'Tampilkan menu', type: 'switch' };
const F_SHOW_SOCIAL: ConfigField = { key: 'showSocial', label: 'Tampilkan ikon sosial', type: 'switch' };
const F_NAV: ConfigField = {
  key: 'navItems',
  label: 'Menu Footer',
  type: 'list',
  itemFields: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'url', label: 'URL', type: 'text' },
  ],
};
const F_GROUPS: ConfigField = {
  key: 'navGroups',
  label: 'Grup Navigasi',
  type: 'list',
  itemFields: [
    { key: 'title', label: 'Judul Grup', type: 'text' },
    {
      key: 'items',
      label: 'Link dalam Grup',
      type: 'list',
      itemFields: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'url', label: 'URL', type: 'text' },
      ],
    },
  ],
};
const F_ADDRESS: ConfigField = { key: 'address', label: 'Alamat', type: 'textarea' };
const F_PHONE: ConfigField = { key: 'phone', label: 'Telepon', type: 'text' };
const F_EMAIL: ConfigField = { key: 'email', label: 'Email', type: 'text' };

/**
 * Lima varian footer. Tiap `layout` di sini benar-benar punya branch di
 * `site-footer-shared.tsx` — bukan sekadar beda warna.
 */
export const BENGKEL_FOOTERS: FooterVariant[] = [
  {
    id: 'bk-ftr-inline',
    name: 'Baris Servis',
    description: 'Satu baris: brand, menu, sosmed, copyright',
    layout: 'simple',
    mockup: 'footer-simple',
    configFields: [LOGO_FIELD, TITLE_FIELD, F_TEXT, F_NAV, F_SHOW_NAV, F_SHOW_SOCIAL],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      text: '© {year} Bengkel Jaya Motor. Setiap mesin kami rawat dengan hati-hati.',
      navItems: [
        { id: 'bf-layanan', label: 'Layanan', url: '#layanan' },
        { id: 'bf-harga', label: 'Harga', url: '#harga' },
        { id: 'bf-booking', label: 'Booking', url: '#booking' },
        { id: 'bf-kontak', label: 'Kontak', url: '#kontak' },
      ],
      showNav: true,
      showSocial: true,
    },
  },
  {
    id: 'bk-ftr-kolom',
    name: 'Kolom Workshop',
    description: 'Grup navigasi plus blok kontak, aksen gradasi di atas',
    layout: 'columns',
    mockup: 'footer-columns',
    configFields: [
      LOGO_FIELD, TITLE_FIELD, F_TEXT, F_GROUPS, F_SHOW_NAV, F_SHOW_SOCIAL,
      F_ADDRESS, F_PHONE, F_EMAIL,
    ],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      text: '© {year} Bengkel Jaya Motor. Setiap mesin kami rawat dengan hati-hati.',
      navGroups: [
        {
          id: 'bfg-layanan',
          title: 'Layanan',
          items: [
            { id: 'bfg-1', label: 'Ganti Oli', url: '#layanan' },
            { id: 'bfg-2', label: 'Kampas Rem', url: '#layanan' },
            { id: 'bfg-3', label: 'Tune Up', url: '#layanan' },
          ],
        },
        {
          id: 'bfg-info',
          title: 'Informasi',
          items: [
            { id: 'bfg-4', label: 'Paket Servis', url: '#harga' },
            { id: 'bfg-5', label: 'Cara Booking', url: '#prosedur' },
            { id: 'bfg-6', label: 'Lokasi', url: '#lokasi' },
          ],
        },
      ],
      showNav: true,
      showSocial: true,
      address: ADDRESS,
      phone: '021-5550123',
      email: 'halo@bengkeljayamotor.id',
    },
  },
  {
    id: 'bk-ftr-brand-tengah',
    name: 'Brand Tengah',
    description: 'Nama bengkel besar di tengah, menu simetris di bawahnya',
    layout: 'centered',
    mockup: 'footer-centered',
    configFields: [LOGO_FIELD, TITLE_FIELD, F_TEXT, F_NAV, F_SHOW_NAV, F_SHOW_SOCIAL],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      text: '© {year} Bengkel Jaya Motor. Setiap mesin kami rawat dengan hati-hati.',
      navItems: [
        { id: 'bfc-1', label: 'Layanan', url: '#layanan' },
        { id: 'bfc-2', label: 'Harga', url: '#harga' },
        { id: 'bfc-3', label: 'Booking', url: '#booking' },
      ],
      showNav: true,
      showSocial: true,
    },
  },
  {
    id: 'bk-ftr-sosial',
    name: 'Fokus Sosial',
    description: 'Ikon sosial besar di tengah, navigasi rapat di bawahnya',
    layout: 'social',
    mockup: 'footer-social',
    configFields: [LOGO_FIELD, TITLE_FIELD, F_TEXT, F_NAV, F_SHOW_NAV, F_SHOW_SOCIAL],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      text: '© {year} Bengkel Jaya Motor',
      navItems: [
        { id: 'bfs-1', label: 'Layanan', url: '#layanan' },
        { id: 'bfs-2', label: 'Harga', url: '#harga' },
        { id: 'bfs-3', label: 'Booking', url: '#booking' },
        { id: 'bfs-4', label: 'Kontak', url: '#kontak' },
      ],
      showNav: true,
      showSocial: true,
    },
  },
  {
    id: 'bk-ftr-cta',
    name: 'Ajakan Booking',
    description: 'Blok CTA oranye penuh lebar dengan tombol booking besar',
    layout: 'cta-overlap',
    mockup: 'footer-cta',
    configFields: [
      LOGO_FIELD, TITLE_FIELD, F_TEXT, F_NAV, F_SHOW_NAV, F_SHOW_SOCIAL,
      { key: 'ctaTitle', label: 'Judul Ajakan', type: 'text' },
      { key: 'ctaText', label: 'Teks Ajakan', type: 'textarea' },
      { key: 'ctaButtonText', label: 'Teks Tombol', type: 'text' },
      { key: 'ctaButtonLink', label: 'Link Tombol', type: 'text' },
    ],
    defaultConfig: {
      logoUrl: 'assets/logo-bengkel.png',
      siteTitle: 'Bengkel Jaya Motor',
      text: '© {year} Bengkel Jaya Motor',
      navItems: [
        { id: 'bfa-1', label: 'Layanan', url: '#layanan' },
        { id: 'bfa-2', label: 'Kontak', url: '#kontak' },
      ],
      showNav: true,
      showSocial: true,
      ctaTitle: 'Motor Bermasalah?',
      ctaText: 'Kirim WhatsApp sekarang, mekanik kami bantu estimasi biaya tanpa pungutan.',
      ctaButtonText: 'Chat via WhatsApp',
      ctaButtonLink: WA,
    },
  },
];
import type { FullTemplateData } from "../types";
import type { Template } from "../template-types";

/**
 * Palet "Industrial Noir". Semua pasangan teks/latar >= 4.5:1, dijaga
 * `validateStyleContrast()` lewat `catalog.test.ts`.
 */
const PALETTE = {
  primary: "#f97316", // high-vis orange
  secondary: "#1e293b", // slate 800
  accent: "#fbbf24", // amber 400
  background: "#0b1220", // near-black navy
  surface: "#131c2e", // kartu
  text: "#f1f5f9", // slate 100
  textMuted: "#94a3b8", // slate 400 — abu-abu 400 aman di atas gelap
  border: "#1e293b",
};

/* ============================================================
 * Field helper untuk section bengkel.
 *
 * Dipakai ulang lintas tipe section supaya tiap `defaultConfig` punya form
 * field yang cocok — syarat "tidak ada konten hardcoded" (kontrak di
 * `templates/catalog.test.ts`). Konten spesifik bengkel (oli, kampas, AC)
 * tetap ditulis eksplisit di `defaultConfig` tiap varian.
 * ========================================================== */

const TITLE_F = (label = 'Judul'): ConfigField => ({ key: 'title', label, type: 'text' });
const SUBTITLE_F = (label = 'Subjudul'): ConfigField => ({ key: 'subtitle', label, type: 'textarea' });

const IMAGE_F = (label = 'Gambar'): ConfigField => ({ key: 'image', label, type: 'image' });
const GALLERY_F = (label = 'Galeri'): ConfigField => ({ key: 'images', label, type: 'gallery' });

const SWITCH_F = (key: string, label: string): ConfigField => ({ key, label, type: 'switch' });
const NUMBER_F = (key: string, label: string): ConfigField => ({ key, label, type: 'number' });
const SELECT_F = (key: string, label: string, options: [string, string][]): ConfigField => ({
  key,
  label,
  type: 'select',
  options: options.map(([l, v]) => ({ label: l, value: v })),
});

const CTA_FIELDS: ConfigField[] = [
  { key: 'cta_text', label: 'Teks Tombol', type: 'text' },
  { key: 'cta_link', label: 'Link Tombol', type: 'text' },
];

/** List teks + gambar (testimoni, tim, galeri, dsb). */
const LIST_F = (key: string, label: string, itemFields: ConfigField[], maxItems = 12): ConfigField => ({
  key,
  label,
  type: 'list',
  itemFields,
  maxItems,
});

/**
 * Fitur paket (dipakai `pricing[].features`).
 *
 * Tipe datanya `string[]` — `PricingSection` melakukan `item.features.map()`
 * lalu merender hasilnya sebagai React child. Kalau diisi objek (`{ v: ... }`),
 * render melempar "Objects are not valid as a React child".
 */
export const FEATURES_F: ConfigField = {
  key: 'features',
  label: 'Fitur Paket',
  type: 'list',
  maxItems: 8,
  itemFields: [{ key: 'v', label: 'Fitur', type: 'text' }],
};

/** List baris layanan: nama + deskripsi + harga (menu board, tabel harga). */
const ROWS_F = (key: string, label: string, withPrice = true): ConfigField => ({
  key,
  label,
  type: 'list',
  maxItems: 12,
  itemFields: withPrice
    ? [
        { key: 'name', label: 'Nama', type: 'text' },
        { key: 'desc', label: 'Deskripsi', type: 'textarea' },
        { key: 'price', label: 'Harga', type: 'text' },
      ]
    : [
        { key: 'name', label: 'Nama', type: 'text' },
        { key: 'desc', label: 'Deskripsi', type: 'textarea' },
      ],
});

/** Key config yang boleh ada tanpa form field (lihat IMPLICIT_CONFIG_KEYS). */
const IMPLICIT = new Set(['show_map', 'map_embed', 'autoplay', 'rating']);

/* ============================================================
 * Section — 19 tipe predefined, masing-masing >=3 varian.
 *
 * Setiap varian punya `configFields` sendiri, jadi saat user ganti varian di
 * sidebar, form konfigurasi ikut berubah (config tidak disatukan antar varian).
 * Varian yang tidak dipakai di seed default tetap dideklarasikan supaya
 * tersedia di SectionPicker.
 * ========================================================== */

export const BENGKEL_SECTIONS: SectionTypeDefinition[] = [
  {
    type: 'hero',
    name: 'Hero',
    icon: 'Layout',
    variants: [
      {
        id: 'hero-split',
        name: 'Split Teknis',
        description: 'Teks rata kiri, foto workshop di kanan',
        layout: 'hero-left',
        mockup: 'hero-split',
        configFields: [
          { key: 'headline', label: 'Headline', type: 'text' },
          { key: 'subheadline', label: 'Subheadline', type: 'textarea' },
          IMAGE_F('Foto Workshop'),
          SELECT_F('text_align', 'Rata Teks', [['Kiri', 'left'], ['Tengah', 'center'], ['Kanan', 'right']]),
          ...CTA_FIELDS,
        ],
        defaultConfig: {
          headline: 'Bengkel Tercepat di Area Anda',
          subheadline:
            'Servis motor dan mobil dikerjakan mekanik berpengalaman 10 tahun. Spare part original, estimasi biaya transparan sebelum pekerjaan dimulai.',
          image: 'assets/workshop-bengkel.jpg',
          text_align: 'left',
          cta_text: 'Booking Servis Sekarang',
          cta_link: '#booking',
        },
      },
      {
        id: 'hero-full',
        name: 'Full Pabrik',
        description: 'Headline besar di tengah dengan foto latar',
        layout: 'hero-bg-image',
        mockup: 'hero-bg-image',
        configFields: [
          { key: 'headline', label: 'Headline', type: 'text' },
          { key: 'subheadline', label: 'Subheadline', type: 'textarea' },
          IMAGE_F('Foto Latar'),
          ...CTA_FIELDS,
        ],
        defaultConfig: {
          headline: 'Mesin Anda Mulai Bermasalah?',
          subheadline: 'Diagnosa gratis, estimasi biaya transparan, dikerjakan mekanik bersertifikat.',
          image: 'assets/workshop-bengkel.jpg',
          cta_text: 'Lihat Paket Servis',
          cta_link: '#harga',
        },
      },
      {
        id: 'hero-card',
        name: 'Kartu Timbul',
        description: 'Kartu gelap mengambang di atas latar foto',
        layout: 'hero-card',
        mockup: 'hero-card',
        configFields: [
          { key: 'headline', label: 'Headline', type: 'text' },
          { key: 'subheadline', label: 'Subheadline', type: 'textarea' },
          ...CTA_FIELDS,
        ],
        defaultConfig: {
          headline: 'Servis Ori, Dibenahi Betulan',
          subheadline: 'Tanpa biaya siluman, tanpa komponen murah, tanpa pengerjaan terburu-buru.',
          cta_text: 'Booking Sekarang',
          cta_link: '#booking',
        },
      },
    ],
  },
  {
    type: 'features',
    name: 'Keunggulan',
    icon: 'Grid',
    variants: [
      {
        id: 'features-3col',
        name: 'Grid Tiga Kolom',
        description: 'Tiga kartu keunggulan berikon',
        layout: 'features-3col',
        mockup: 'features-3col',
        configFields: [
          TITLE_F(), SUBTITLE_F(),
          LIST_F('items', 'Keunggulan', [
            { key: 'icon', label: 'Ikon', type: 'text' },
            { key: 'title', label: 'Judul', type: 'text' },
            { key: 'description', label: 'Deskripsi', type: 'textarea' },
          ], 6),
        ],
        defaultConfig: {
          title: 'Kenapa Bengkel Jaya Motor',
          subtitle: 'Tiga hal yang jadi alasan pelanggan kembali.',
          items: [
            { icon: '🔧', title: 'Mekanik Berpengalaman', description: '10 tahun menangani motor dan mobil, sudah ribuan kendaraan.' },
            { icon: '⚙️', title: 'Spare Part Original', description: 'Komponen resmi bergaransi, bukan barang tiruan murahan.' },
            { icon: '🛡️', title: 'Garansi Servis', description: 'Garansi 30 hari untuk pekerjaan yang kami kerjakan.' },
          ],
        },
      },
      {
        id: 'features-list',
        name: 'Daftar Ikon',
        description: 'Daftar horizontal dengan ikon di kiri',
        layout: 'features-list',
        mockup: 'features-list',
        configFields: [
          TITLE_F(), SUBTITLE_F(),
          LIST_F('items', 'Keunggulan', [
            { key: 'icon', label: 'Ikon', type: 'text' },
            { key: 'title', label: 'Judul', type: 'text' },
            { key: 'description', label: 'Deskripsi', type: 'textarea' },
          ], 6),
        ],
        defaultConfig: {
          title: 'Standar Servis Kami',
          subtitle: '',
          items: [
            { icon: 'check', title: 'Estimasi Gratis', description: 'Kami cek dulu, baru kerjakan setelah Anda setuju.' },
            { icon: 'check', title: 'Spare Part Original', description: 'Bisa tunjukkan pricelist bila Anda mau.' },
            { icon: 'check', title: 'Garansi 30 Hari', description: 'Untuk semua pekerjaan yang kami kerjakan.' },
          ],
        },
      },
      {
        id: 'features-stacked',
        name: 'Bertumpuk',
        description: 'Baris lebar bertumpuk dengan baris aksen oranye',
        layout: 'features-stacked',
        mockup: 'features-stacked',
        configFields: [
          TITLE_F(), SUBTITLE_F(),
          LIST_F('items', 'Keunggulan', [
            { key: 'title', label: 'Judul', type: 'text' },
            { key: 'description', label: 'Deskripsi', type: 'textarea' },
          ], 5),
        ],
        defaultConfig: {
          title: 'Kenapa Bengkel Jaya Motor',
          subtitle: '',
          items: [
            { title: 'Diagnosa Gratis', description: 'Cek kerusakan tanpa dipungut biaya sebelum pekerjaan dimulai.' },
            { title: 'Spare Part Original', description: 'Komponen resmi atau OEM bergaransi, bisa kami tunjukkan pricelistnya.' },
            { title: 'Garansi 30 Hari', description: 'Kalau ada keluhan setelah servis, kami tangani tanpa biaya tambahan.' },
          ],
        },
      },
    ],
  },
  {
    type: 'product_grid',
    name: 'Produk / Layanan',
    icon: 'Package',
    variants: [
      {
        id: 'product-3col', name: 'Grid Tiga', description: 'Tiga kartu produk per baris',
        layout: 'product-3col', mockup: 'product-3col',
        configFields: [TITLE_F(), NUMBER_F('columns', 'Jumlah Kolom')],
        defaultConfig: { title: 'Produk Unggulan', columns: 3 },
      },
      {
        id: 'product-2col', name: 'Grid Dua Lebar', description: 'Dua kartu besar per baris',
        layout: 'product-2col', mockup: 'product-2col',
        configFields: [TITLE_F(), NUMBER_F('columns', 'Jumlah Kolom')],
        defaultConfig: { title: 'Paket Servis Terlaris', columns: 2 },
      },
      {
        id: 'product-carousel', name: 'Carousel', description: 'Geser horizontal satu baris',
        layout: 'product-carousel', mockup: 'product-carousel',
        configFields: [TITLE_F(), NUMBER_F('columns', 'Jumlah Kolom')],
        defaultConfig: { title: 'Layanan Kami', columns: 4 },
      },
    ],
  },
  {
    type: 'testimonials',
    name: 'Testimoni',
    icon: 'Quote',
    variants: [
      {
        id: 'testimonials-grid', name: 'Grid', description: 'Kartu testimoni dengan rating bintang',
        layout: 'testimonials-grid', mockup: 'testimonials-grid',
        configFields: [TITLE_F(), LIST_F('items', 'Testimoni', [
          { key: 'name', label: 'Nama', type: 'text' },
          { key: 'text', label: 'Testimoni', type: 'textarea' },
          { key: 'rating', label: 'Rating', type: 'number' },
        ], 8)],
        defaultConfig: {
          title: 'Kata Pelanggan',
          items: [
            { name: 'Rudi', text: 'Oli diganti cepat, kampas baru, motornya lancar lagi. Estimasi biaya jujur.', rating: 5 },
            { name: 'Sarah', text: 'AC mobil saya sudah tidak dingin, sekarang beres. Pelayanannya ramah.', rating: 5 },
            { name: 'Bpak Joko', text: 'Sudah beberapa kali servis tune up di sini. Konsisten.', rating: 5 },
          ],
        },
      },
      {
        id: 'testimonials-single', name: 'Kutipan Tunggal', description: 'Satu testimoni besar dengan tanda kutip',
        layout: 'testimonials-single', mockup: 'testimonials-single',
        configFields: [TITLE_F(), LIST_F('items', 'Testimoni', [
          { key: 'name', label: 'Nama', type: 'text' },
          { key: 'text', label: 'Testimoni', type: 'textarea' },
          { key: 'rating', label: 'Rating', type: 'number' },
        ], 3)],
        defaultConfig: {
          title: '',
          items: [
            { name: 'Ibu Ratna', text: 'Ini bengkel paling jujur yang pernah saya temui. Semua dijelaskan dulu sebelum dikerjakan.', rating: 5 },
          ],
        },
      },
      {
        id: 'testimonials-carousel', name: 'Carousel', description: 'Geser antar testimoni',
        layout: 'testimonials-carousel', mockup: 'testimonials-carousel',
        configFields: [TITLE_F(), LIST_F('items', 'Testimoni', [
          { key: 'name', label: 'Nama', type: 'text' },
          { key: 'text', label: 'Testimoni', type: 'textarea' },
          { key: 'rating', label: 'Rating', type: 'number' },
        ], 8)],
        defaultConfig: {
          title: 'Review Pelanggan',
          items: [
            { name: 'Andi', text: 'Sangat recommended, cepat dan rapi.', rating: 5 },
            { name: 'Budi', text: 'Harga terjangkau, hasil bagus.', rating: 4 },
          ],
        },
      },
    ],
  },
  {
    type: 'faq',
    name: 'FAQ',
    icon: 'HelpCircle',
    variants: [
      {
        id: 'faq-accordion', name: 'Accordion', description: 'Pertanyaan yang bisa dilipat',
        layout: 'faq-accordion', mockup: 'faq-accordion',
        configFields: [TITLE_F(), LIST_F('items', 'Pertanyaan', [
          { key: 'question', label: 'Pertanyaan', type: 'text' },
          { key: 'answer', label: 'Jawaban', type: 'textarea' },
        ], 10)],
        defaultConfig: {
          title: 'Sering Ditanyakan',
          items: [
            { question: 'Apakah harus booking dulu?', answer: 'Tidak wajib, tapi booking memastikan kendaraan langsung dikerjakan tanpa menunggu antrean.' },
            { question: 'Bagaimana cara kerjanya?', answer: 'Kirim WhatsApp atau isi form booking. Kami cek dulu, lalu kirim estimasi sebelum mulai.' },
            { question: 'Spare part-nya original?', answer: 'Ya. Komponen resmi atau OEM bergaransi, dan bisa kami tunjukkan pricelist.' },
          ],
        },
      },
      {
        id: 'faq-list', name: 'List Terbuka', description: 'Jawaban selalu terlihat tanpa dilipat',
        layout: 'faq-list', mockup: 'faq-list',
        configFields: [TITLE_F(), LIST_F('items', 'Pertanyaan', [
          { key: 'question', label: 'Pertanyaan', type: 'text' },
          { key: 'answer', label: 'Jawaban', type: 'textarea' },
        ], 10)],
        defaultConfig: {
          title: 'Tanya Jawab Servis',
          items: [
            { question: 'Berapa lama servis?', answer: 'Ganti oli 30-45 menit, servis berat 1-3 jam tergantung kondisi kendaraan.' },
            { question: 'Jam operasional?', answer: 'Senin-Sabtu 08.00-19.00, Minggu 09.00-15.00.' },
          ],
        },
      },
      {
        id: 'faq-grid', name: 'Grid Dua Kolom', description: 'Pertanyaan tersusun dalam grid',
        layout: 'faq-grid', mockup: 'faq-grid',
        configFields: [TITLE_F(), LIST_F('items', 'Pertanyaan', [
          { key: 'question', label: 'Pertanyaan', type: 'text' },
          { key: 'answer', label: 'Jawaban', type: 'textarea' },
        ], 8)],
        defaultConfig: {
          title: 'Pertanyaan Umum',
          items: [
            { question: 'Minimum pembelian?', answer: 'Tidak ada minimum, kami layani REQUEST apa pun.' },
            { question: 'Bisa retur?', answer: 'Untuk spare part,bergantung kebijakan garansi vendor.' },
          ],
        },
      },
    ],
  },
  {
    type: 'cta',
    name: 'Ajakan Bertindak',
    icon: 'MousePointerClick',
    variants: [
      {
        id: 'cta-banner', name: 'Banner', description: 'Pita lebar dengan tombol di tengah',
        layout: 'cta-banner', mockup: 'cta-banner',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'button_text', label: 'Teks Tombol', type: 'text' }, { key: 'button_link', label: 'Link Tombol', type: 'text' }],
        defaultConfig: { title: 'Butuh servis sekarang?', subtitle: 'Estimasi gratis, tanpa biaya siluman.', button_text: 'Booking Servis', button_link: '#booking' },
      },
      {
        id: 'cta-card', name: 'Kartu', description: 'Kartu elevasi dengan latar warna tema',
        layout: 'cta-card', mockup: 'cta-card',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'button_text', label: 'Teks Tombol', type: 'text' }, { key: 'button_link', label: 'Link Tombol', type: 'text' }],
        defaultConfig: { title: 'Motor Anda trouble?', subtitle: 'Mekanik kami bisa datang ke lokasi Anda.', button_text: 'Hubungi Kami', button_link: '#kontak' },
      },
      {
        id: 'cta-split', name: 'Split', description: 'Teks kiri dan tombol besar kanan',
        layout: 'cta-split', mockup: 'cta-split',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'button_text', label: 'Teks Tombol', type: 'text' }, { key: 'button_link', label: 'Link Tombol', type: 'text' }],
        defaultConfig: { title: 'Garansi Servis 30 Hari', subtitle: 'Kalau ada keluhan setelah servis, kami tangani tanpa biaya tambahan.', button_text: 'Pelajari Garansi', button_link: '#harga' },
      },
    ],
  },
  {
    type: 'contact',
    name: 'Kontak',
    icon: 'Phone',
    variants: [
      {
        id: 'contact-form', name: 'Form Saja', description: 'Form kontak tanpa peta',
        layout: 'contact-form', mockup: 'contact-form',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'address', label: 'Alamat', type: 'textarea' }, { key: 'phone', label: 'Telepon', type: 'text' }, { key: 'email', label: 'Email', type: 'text' }],
        defaultConfig: { title: 'Hubungi Kami', subtitle: 'Ada pertanyaan? Kirim pesan atau mampir langsung.', address: ADDRESS, phone: '021-5550123', email: 'halo@bengkeljayamotor.id' },
      },
      {
        id: 'contact-form-map', name: 'Form dan Peta', description: 'Form kontak dengan peta di samping',
        layout: 'contact-form-map', mockup: 'contact-form-map',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'address', label: 'Alamat', type: 'textarea' }, { key: 'phone', label: 'Telepon', type: 'text' }, { key: 'email', label: 'Email', type: 'text' }],
        defaultConfig: { title: 'Kunjungi Bengkel Kami', subtitle: 'Parkir luas untuk motor dan mobil.', address: ADDRESS, phone: '021-5550123', email: 'halo@bengkeljayamotor.id' },
      },
      {
        id: 'contact-split', name: 'Split Kontak', description: 'Informasi kontak dan form bersebelahan',
        layout: 'contact-split', mockup: 'contact-split',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'address', label: 'Alamat', type: 'textarea' }, { key: 'phone', label: 'Telepon', type: 'text' }, { key: 'email', label: 'Email', type: 'text' }],
        defaultConfig: { title: 'Hubungi Bengkel Jaya', subtitle: 'Kontak cepat via WhatsApp atau telepon.', address: ADDRESS, phone: '021-5550123', email: 'halo@bengkeljayamotor.id' },
      },
    ],
  },
  {
    type: 'booking',
    name: 'Booking',
    icon: 'CalendarCheck',
    variants: [
      {
        id: 'booking-single', name: 'Booking Lengkap', description: 'Form booking dengan daftar layanan dan jam',
        layout: 'booking-single', mockup: 'booking-single',
        configFields: [
          TITLE_F(), SUBTITLE_F(),
          LIST_F('services', 'Layanan', [
            { key: 'name', label: 'Nama Layanan', type: 'text' },
            { key: 'duration', label: 'Durasi', type: 'text' },
            { key: 'price', label: 'Harga', type: 'text' },
          ], 8),
          { key: 'address', label: 'Alamat Bengkel', type: 'textarea' },
          { key: 'hours', label: 'Jam Operasional', type: 'text' },
          { key: 'success_message', label: 'Pesan Sukses', type: 'textarea' },
          { key: 'forward_wa', label: 'Nomor WhatsApp', type: 'text' },
        ],
        defaultConfig: {
          title: 'Booking Servis',
          subtitle: 'Isi form, tim kami konfirmasi via WhatsApp dalam 1 jam kerja.',
          services: [
            { name: 'Ganti Oli dan Filter', duration: '30-45 menit', price: 'Mulai Rp 150rb' },
            { name: 'Ganti Kampas Rem', duration: '45-60 menit', price: 'Mulai Rp 180rb' },
            { name: 'Tune Up', duration: '1-2 jam', price: 'Mulai Rp 250rb' },
            { name: 'Servis AC', duration: '45-90 menit', price: 'Mulai Rp 200rb' },
          ],
          address: ADDRESS,
          hours: 'Senin-Sabtu, 08.00-19.00',
          success_message: 'Booking diterima! Tim kami akan menghubungi Anda via WhatsApp untuk konfirmasi.',
          forward_wa: '',
        },
      },
      {
        id: 'booking-split', name: 'Booking Ringkas', description: 'Form booking dengan pilihan layanan sedikit',
        layout: 'booking-single', mockup: 'booking-single',
        configFields: [
          TITLE_F(), SUBTITLE_F(),
          LIST_F('services', 'Layanan', [
            { key: 'name', label: 'Nama Layanan', type: 'text' },
            { key: 'duration', label: 'Durasi', type: 'text' },
            { key: 'price', label: 'Harga', type: 'text' },
          ], 4),
          { key: 'address', label: 'Alamat Bengkel', type: 'textarea' },
          { key: 'hours', label: 'Jam Operasional', type: 'text' },
          { key: 'success_message', label: 'Pesan Sukses', type: 'textarea' },
          { key: 'forward_wa', label: 'Nomor WhatsApp', type: 'text' },
        ],
        defaultConfig: {
          title: 'Ajukan Booking',
          subtitle: 'Respon rata-rata 1 jam kerja.',
          services: [
            { name: 'Ganti Oli dan Filter', duration: '30-45 menit', price: 'Mulai Rp 150rb' },
            { name: 'Tune Up', duration: '1-2 jam', price: 'Mulai Rp 250rb' },
          ],
          address: ADDRESS,
          hours: 'Senin-Sabtu, 08.00-19.00',
          success_message: 'Booking diterima!',
          forward_wa: '',
        },
      },
    ],
  },
  {
    type: 'about',
    name: 'Tentang',
    icon: 'Info',
    variants: [
      {
        id: 'about-left', name: 'Teks Kiri', description: 'Teks di kiri, gambar di kanan',
        layout: 'about-left', mockup: 'about-left',
        configFields: [TITLE_F(), { key: 'content', label: 'Isi Cerita', type: 'textarea' }, IMAGE_F('Gambar')],
        defaultConfig: {
          title: 'Tentang Bengkel Jaya Motor',
          content: 'Bengkel Jaya Motor berdiri tahun 2015 dengan satu workshop kecil di Jakarta Timur. Kini kami melayani ratusan pelanggan setiap bulan dengan mekanik yang pengalaman lebih dari sepuluh tahun.',
          image: 'assets/workshop-bengkel.jpg',
        },
      },
      {
        id: 'about-right', name: 'Teks Kanan', description: 'Gambar di kiri, teks di kanan',
        layout: 'about-right', mockup: 'about-right',
        configFields: [TITLE_F(), { key: 'content', label: 'Isi Cerita', type: 'textarea' }, IMAGE_F('Gambar')],
        defaultConfig: {
          title: 'Kenapa Kami Terpercaya',
          content: 'Kami percaya servis yang baik dimulai dari estimasi yang jujur. Semua pekerjaan selesai dengan spare part original bergaransi dan garansi servis 30 hari.',
          image: 'assets/workshop-bengkel.jpg',
        },
      },
      {
        id: 'about-centered', name: 'Tengah', description: 'Teks terpusat tanpa gambar',
        layout: 'about-centered', mockup: 'about-centered',
        configFields: [TITLE_F(), { key: 'content', label: 'Isi Cerita', type: 'textarea' }],
        defaultConfig: {
          title: 'Komitmen Kami',
          content: 'Estimasi transparan sebelum kerja dimulai, spare part original, dan garansi 30 hari untuk setiap pekerjaan yang kami kerjakan.',
        },
      },
    ],
  },
  {
    type: 'gallery',
    name: 'Galeri',
    icon: 'Images',
    variants: [
      {
        id: 'gallery-grid', name: 'Grid', description: 'Grid foto pekerjaan',
        layout: 'gallery-grid', mockup: 'gallery-grid',
        configFields: [TITLE_F(), GALLERY_F('Foto Galeri')],
        defaultConfig: { title: 'Galeri Pekerjaan', images: ['assets/workshop-bengkel.jpg', 'assets/logo-bengkel.png'] },
      },
      {
        id: 'gallery-masonry', name: 'Masonry', description: 'Tata letak semenit',
        layout: 'gallery-masonry', mockup: 'gallery-masonry',
        configFields: [TITLE_F(), GALLERY_F('Foto Galeri')],
        defaultConfig: { title: 'Dokumentasi Servis', images: ['assets/workshop-bengkel.jpg', 'assets/logo-bengkel.png'] },
      },
      {
        id: 'gallery-carousel', name: 'Carousel', description: 'Geser foto satu per satu',
        layout: 'gallery-carousel', mockup: 'gallery-carousel',
        configFields: [TITLE_F(), GALLERY_F('Foto Galeri')],
        defaultConfig: { title: 'Galeri Bengkel', images: ['assets/workshop-bengkel.jpg', 'assets/logo-bengkel.png'] },
      },
    ],
  },
  {
    type: 'video',
    name: 'Video',
    icon: 'Video',
    variants: [
      {
        id: 'video-full', name: 'Video Lebar', description: 'Video selebar penuh',
        layout: 'video-full', mockup: 'video-full',
        configFields: [TITLE_F(), { key: 'url', label: 'URL Video', type: 'text' }],
        defaultConfig: { title: 'Video Servis', url: '' },
      },
      {
        id: 'video-centered', name: 'Video Terpusat', description: 'Video terpusat dengan judul',
        layout: 'video-centered', mockup: 'video-centered',
        configFields: [TITLE_F(), { key: 'url', label: 'URL Video', type: 'text' }],
        defaultConfig: { title: 'Tur Bengkel', url: '' },
      },
      {
        id: 'video-bg', name: 'Video Latar', description: 'Video sebagai latar section',
        layout: 'video-bg', mockup: 'video-bg',
        configFields: [TITLE_F(), { key: 'url', label: 'URL Video', type: 'text' }],
        defaultConfig: { title: 'Lihat Proses Servis', url: '' },
      },
    ],
  },
  {
    type: 'team',
    name: 'Tim',
    icon: 'Users',
    variants: [
      {
        id: 'team-grid', name: 'Grid Tim', description: 'Kartu anggota tim dengan foto',
        layout: 'team-grid', mockup: 'team-grid',
        configFields: [TITLE_F(), LIST_F('members', 'Anggota Tim', [
          { key: 'name', label: 'Nama', type: 'text' },
          { key: 'role', label: 'Jabatan', type: 'text' },
          IMAGE_F('Foto'),
        ], 6)],
        defaultConfig: {
          title: 'Mekanik Kami',
          members: [
            { name: 'Ahmad', role: 'Mekanik Kepala', image: 'assets/logo-bengkel.png' },
            { name: 'Dedi', role: 'Mekanik', image: 'assets/logo-bengkel.png' },
          ],
        },
      },
      {
        id: 'team-list', name: 'Daftar Tim', description: 'Daftar memanjang dengan foto',
        layout: 'team-list', mockup: 'team-list',
        configFields: [TITLE_F(), LIST_F('members', 'Anggota Tim', [
          { key: 'name', label: 'Nama', type: 'text' },
          { key: 'role', label: 'Jabatan', type: 'text' },
          IMAGE_F('Foto'),
        ], 6)],
        defaultConfig: {
          title: 'Siapa yang Mengerjakan',
          members: [
            { name: 'Ahmad', role: 'Mekanik Kepala', image: 'assets/logo-bengkel.png' },
            { name: 'Dedi', role: 'Mekanik', image: 'assets/logo-bengkel.png' },
          ],
        },
      },
      {
        id: 'team-carousel', name: 'Carousel Tim', description: 'Geser antar anggota tim',
        layout: 'team-carousel', mockup: 'team-carousel',
        configFields: [TITLE_F(), LIST_F('members', 'Anggota Tim', [
          { key: 'name', label: 'Nama', type: 'text' },
          { key: 'role', label: 'Jabatan', type: 'text' },
          IMAGE_F('Foto'),
        ], 6)],
        defaultConfig: {
          title: 'Tim Bengkel',
          members: [
            { name: 'Ahmad', role: 'Mekanik Kepala', image: 'assets/logo-bengkel.png' },
            { name: 'Dedi', role: 'Mekanik', image: 'assets/logo-bengkel.png' },
          ],
        },
      },
    ],
  },
  {
    type: 'pricing',
    name: 'Paket Harga',
    icon: 'Tag',
    variants: [
      {
        id: 'pricing-3tier', name: 'Tiga Paket', description: 'Tiga kartu paket berdampingan',
        layout: 'pricing-3tier', mockup: 'pricing-3tier',
        configFields: [TITLE_F(), LIST_F('items', 'Paket', [
          { key: 'name', label: 'Nama Paket', type: 'text' },
          { key: 'price', label: 'Harga', type: 'text' },
          FEATURES_F,
        ], 3)],
        defaultConfig: {
          title: 'Paket Servis',
          items: [
            { name: 'Servis Ringan', price: 'Mulai Rp 150rb', features: ['Ganti oli', 'Cek rem dan lampu', 'Pengeimbangan ban'] },
            { name: 'Servis Reguler', price: 'Mulai Rp 350rb', features: ['Semua paket ringan', 'Tune up', 'Cek AC'] },
            { name: 'Servis Lengkap', price: 'Mulai Rp 850rb', features: ['Semua paket reguler', 'Bersih injektor', 'Garansi 30 hari'] },
          ],
        },
      },
      {
        id: 'pricing-2tier', name: 'Dua Paket', description: 'Dua kartu paket besar',
        layout: 'pricing-2tier', mockup: 'pricing-2tier',
        configFields: [TITLE_F(), LIST_F('items', 'Paket', [
          { key: 'name', label: 'Nama Paket', type: 'text' },
          { key: 'price', label: 'Harga', type: 'text' },
          FEATURES_F,
        ], 2)],
        defaultConfig: {
          title: 'Paket Servis',
          items: [
            { name: 'Servis Reguler', price: 'Mulai Rp 250rb', features: ['Ganti oli dan filter', 'Cek rem dan lampu', 'Estimasi biaya di depan'] },
            { name: 'Servis Lengkap', price: 'Mulai Rp 850rb', features: ['Semua paket reguler', 'Tune up dan bersih injektor', 'Garansi 30 hari'] },
          ],
        },
      },
      {
        id: 'pricing-single', name: 'Satu Paket', description: 'Satu paket menonjol',
        layout: 'pricing-single', mockup: 'pricing-single',
        configFields: [TITLE_F(), LIST_F('items', 'Paket', [
          { key: 'name', label: 'Nama Paket', type: 'text' },
          { key: 'price', label: 'Harga', type: 'text' },
          FEATURES_F,
        ], 1)],
        defaultConfig: {
          title: 'Paket Servis Lengkap',
          items: [
            { name: 'Servis Lengkap', price: 'Mulai Rp 850rb', features: ['Ganti oli dan filter', 'Tune up dan bersih injektor', 'Cek AC dan kelistrikan', 'Garansi 30 hari'] },
          ],
        },
      },
    ],
  },
  {
    type: 'newsletter',
    name: 'Newsletter',
    icon: 'Mail',
    variants: [
      {
        id: 'newsletter-inline', name: 'Inline', description: 'Baris signup ringkas',
        layout: 'newsletter-inline', mockup: 'newsletter-inline',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'placeholder', label: 'Placeholder Email', type: 'text' }, { key: 'button_text', label: 'Teks Tombol', type: 'text' }],
        defaultConfig: { title: 'Dapatkan Info Promo', subtitle: 'Kirim promo dan jadwal servis ke email Anda.', placeholder: 'Email Anda', button_text: 'Daftar' },
      },
      {
        id: 'newsletter-card', name: 'Kartu', description: 'Signup dalam kartu',
        layout: 'newsletter-card', mockup: 'newsletter-card',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'placeholder', label: 'Placeholder Email', type: 'text' }, { key: 'button_text', label: 'Teks Tombol', type: 'text' }],
        defaultConfig: { title: 'Jangan Lewatkan Promo', subtitle: 'Daftar untuk info servis dan diskon.', placeholder: 'nama@email.com', button_text: 'Saya Mau Daftar' },
      },
      {
        id: 'newsletter-split', name: 'Split', description: 'Teks kiri, form kanan',
        layout: 'newsletter-split', mockup: 'newsletter-split',
        configFields: [TITLE_F(), SUBTITLE_F(), { key: 'placeholder', label: 'Placeholder Email', type: 'text' }, { key: 'button_text', label: 'Teks Tombol', type: 'text' }],
        defaultConfig: { title: 'Tetap Terhubung', subtitle: 'Buletin bulanan tentang tips perawatan kendaraan.', placeholder: 'Email Anda', button_text: 'Berlangganan' },
      },
    ],
  },
  {
    type: 'divider',
    name: 'Pembatas',
    icon: 'Minus',
    variants: [
      {
        id: 'divider-line', name: 'Garis', description: 'Garis pemisah tipis',
        layout: 'divider-line', mockup: 'divider-line',
        configFields: [SELECT_F('style', 'Bentuk', [['Garis', 'solid'], ['Tersegmentasi', 'dashed'], ['Ganda', 'double']]), { key: 'color', label: 'Warna Garis', type: 'color' }],
        defaultConfig: { style: 'solid', color: '' },
      },
      {
        id: 'divider-spacer', name: 'Spasi', description: 'Ruang kosong pemisah',
        layout: 'divider-spacer', mockup: 'divider-spacer',
        configFields: [NUMBER_F('height', 'Tinggi (px)')],
        defaultConfig: { height: 48 },
      },
      {
        id: 'divider-image', name: 'Gambar', description: 'Pemisah berupa gambar',
        layout: 'divider-image', mockup: 'divider-image',
        configFields: [IMAGE_F('Gambar Pemisah')],
        defaultConfig: { image: 'assets/workshop-bengkel.jpg' },
      },
    ],
  },
  {
    type: 'marquee',
    name: 'Teks Berjalan',
    icon: 'MoveHorizontal',
    variants: [
      {
        id: 'marquee-band', name: 'Pita Berjalan', description: 'Teks berjalan tanpa henti',
        layout: 'marquee-band', mockup: 'marquee-band',
        configFields: [LIST_F('items', 'Teks', [{ key: 'text', label: 'Teks', type: 'text' }], 10)],
        defaultConfig: {
          items: [
            { text: 'GRATIS KONSULTASI KERUSAKAN' },
            { text: 'SPARE PART ORIGINAL' },
            { text: 'GARANSI SERVIS 30 HARI' },
            { text: 'ESTIMASI BIAYA TRANSPARAN' },
          ],
        },
      },
    ],
  },
  {
    type: 'menu_board',
    name: 'Menu / Harga',
    icon: 'ListOrdered',
    variants: [
      {
        id: 'menu-tabs', name: 'Tab Kategori', description: 'Kategori sebagai tab di atas',
        layout: 'menu-tabs', mockup: 'menu-tabs',
        configFields: [TITLE_F(), SUBTITLE_F(), LIST_F('groups', 'Kategori', [
          { key: 'label', label: 'Nama Kategori', type: 'text' },
          LIST_F('items', 'Item', [
            { key: 'name', label: 'Nama', type: 'text' },
            { key: 'desc', label: 'Deskripsi', type: 'textarea' },
            { key: 'price', label: 'Harga', type: 'text' },
          ], 10),
        ], 4)],
        defaultConfig: {
          title: 'Layanan dan Harga',
          subtitle: 'Pilih kategori layanan untuk melihat estimasi biaya.',
          groups: [
            { label: 'Perawatan Berkala', items: [
              { name: 'Ganti Oli dan Filter', desc: 'Oli sesuai tipe mesin, filter oli dan udara baru.', price: 'Mulai Rp 150rb' },
              { name: 'Ganti Kampas Rem', desc: 'Kampas depan dan belakang, termasuk jasa pasang.', price: 'Mulai Rp 180rb' },
            ] },
            { label: 'Servis Berat', items: [
              { name: 'Tune Up', desc: 'Setel katup, bersih injektor, cek karburasi.', price: 'Mulai Rp 250rb' },
            ] },
          ],
        },
      },
      {
        id: 'menu-list', name: 'Daftar Datar', description: 'Semua kategori ditampilkan sekaligus',
        layout: 'menu-list', mockup: 'menu-list',
        configFields: [TITLE_F(), SUBTITLE_F(), LIST_F('groups', 'Kategori', [
          { key: 'label', label: 'Nama Kategori', type: 'text' },
          LIST_F('items', 'Item', [
            { key: 'name', label: 'Nama', type: 'text' },
            { key: 'desc', label: 'Deskripsi', type: 'textarea' },
            { key: 'price', label: 'Harga', type: 'text' },
          ], 10),
        ], 4)],
        defaultConfig: {
          title: 'Daftar Harga Lengkap',
          subtitle: 'Semua layanan beserta estimasi biaya.',
          groups: [
            { label: 'Perawatan Berkala', items: [
              { name: 'Ganti Oli dan Filter', desc: 'Oli sesuai tipe mesin.', price: 'Mulai Rp 150rb' },
            ] },
            { label: 'Kelistrikan dan AC', items: [
              { name: 'Servis AC', desc: 'Isi ulang refrigerant.', price: 'Mulai Rp 200rb' },
            ] },
          ],
        },
      },
    {
        id: 'menu-grid', name: 'Grid Kartu', description: 'Semua kategori sebagai kartu dua kolom',
        layout: 'menu-grid', mockup: 'menu-tabs',
        configFields: [TITLE_F(), SUBTITLE_F(), LIST_F('groups', 'Kategori', [
          { key: 'label', label: 'Nama Kategori', type: 'text' },
          LIST_F('items', 'Item', [
            { key: 'name', label: 'Nama', type: 'text' },
            { key: 'desc', label: 'Deskripsi', type: 'textarea' },
            { key: 'price', label: 'Harga', type: 'text' },
          ], 10),
        ], 4)],
        defaultConfig: {
          title: 'Layanan dan Harga',
          subtitle: 'Semua kategori layanan beserta estimasi biaya.',
          groups: [
            { label: 'Perawatan Berkala', items: [
              { name: 'Ganti Oli dan Filter', desc: 'Oli sesuai tipe mesin.', price: 'Mulai Rp 150rb' },
              { name: 'Ganti Kampas Rem', desc: 'Kampas depan dan belakang.', price: 'Mulai Rp 180rb' },
            ] },
            { label: 'Servis Berat', items: [
              { name: 'Tune Up', desc: 'Setel katup, bersih injektor.', price: 'Mulai Rp 250rb' },
            ] },
          ],
        },
      },
    ],
  },
  {
    type: 'steps',
    name: 'Langkah',
    icon: 'ListOrdered',
    variants: [
      {
        id: 'steps-3col', name: 'Tiga Kolom', description: 'Kartu langkah tiga kolom',
        layout: 'steps-3col', mockup: 'steps-3col',
        configFields: [TITLE_F(), SUBTITLE_F(), LIST_F('items', 'Langkah', [
          { key: 'title', label: 'Judul', type: 'text' },
          { key: 'description', label: 'Deskripsi', type: 'textarea' },
        ], 5)],
        defaultConfig: {
          title: 'Cara Booking',
          subtitle: 'Tiga langkah mudah, tanpa datang sebelum dikonfirmasi.',
          items: [
            { title: 'Pilih Layanan', description: 'Tentukan jenis servis dan kendaraan Anda.' },
            { title: 'Isi Form Booking', description: 'Lengkapi nama, nomor kendaraan, dan jadwal.' },
            { title: 'Konfirmasi', description: 'Kami balas estimasi biaya dan slot pengerjaan.' },
          ],
        },
      },
      {
        id: 'steps-horizontal', name: 'Horizontal', description: 'Satu baris penuh dengan garis penghubung',
        layout: 'steps-horizontal', mockup: 'steps-3col',
        configFields: [TITLE_F(), SUBTITLE_F(), LIST_F('items', 'Langkah', [
          { key: 'title', label: 'Judul', type: 'text' },
          { key: 'description', label: 'Deskripsi', type: 'textarea' },
        ], 5)],
        defaultConfig: {
          title: 'Alur Booking',
          subtitle: 'Dari tanya sampai kendaraan selesai.',
          items: [
            { title: 'Kirim Pesan', description: 'Chat WhatsApp atau isi form.' },
            { title: 'Cek Kendaraan', description: 'Kami cek kerusakannya.' },
            { title: 'Kerjakan', description: 'Estimasi disetujui, lalu dikerjakan.' },
          ],
        },
      },
    {
        id: 'steps-numbered', name: 'Nomor Berurutan', description: 'Daftar baris dengan nomor besar di kiri',
        layout: 'steps-numbered', mockup: 'steps-3col',
        configFields: [TITLE_F(), SUBTITLE_F(), LIST_F('items', 'Langkah', [
          { key: 'title', label: 'Judul', type: 'text' },
          { key: 'description', label: 'Deskripsi', type: 'textarea' },
        ], 5)],
        defaultConfig: {
          title: 'Alur Pengerjaan',
          subtitle: 'Empat tahap dari فحص sampai selesai.',
          items: [
            { title: 'Pemeriksaan', description: 'Mekanik mengecek kondisi kendaraan.' },
            { title: 'Estimasi', description: 'Kami kirim estimasi biaya dan menunggu persetujuan.' },
            { title: 'Pengerjaan', description: 'Servis dikerjakan dengan spare part original.' },
            { title: 'Serah Terima', description: 'Kendaraan kembali dengan garansi 30 hari.' },
          ],
        },
      },
    ],
  },
  {
    type: 'location',
    name: 'Lokasi',
    icon: 'MapPin',
    variants: [
      {
        id: 'location-hours', name: 'Dua Kolom', description: 'Alamat di kiri, jam di kanan',
        layout: 'location-hours', mockup: 'location-hours',
        configFields: [
          TITLE_F(), { key: 'address', label: 'Alamat', type: 'textarea' },
          { key: 'note', label: 'Catatan Lokasi', type: 'textarea' },
          { key: 'button_text', label: 'Teks Tombol', type: 'text' },
          { key: 'button_link', label: 'Link Tombol', type: 'text' },
          LIST_F('hours', 'Jam Operasional', [
            { key: 'days', label: 'Hari', type: 'text' },
            { key: 'time', label: 'Jam', type: 'text' },
          ], 7),
        ],
        defaultConfig: {
          title: 'Kunjungi Bengkel Kami',
          address: ADDRESS,
          note: 'Parkir luas untuk motor dan mobil.',
          button_text: 'Chat via WhatsApp',
          button_link: WA,
          hours: [
            { days: 'Senin-Sabtu', time: '08.00-19.00' },
            { days: 'Minggu', time: '09.00-15.00' },
          ],
        },
      },
      {
        id: 'location-hours-wide', name: 'Jam Lebar', description: 'Jam operasional jadi blok lebar penuh',
        layout: 'location-hours-wide', mockup: 'location-hours',
        configFields: [
          TITLE_F(), { key: 'address', label: 'Alamat', type: 'textarea' },
          { key: 'note', label: 'Catatan Lokasi', type: 'textarea' },
          { key: 'button_text', label: 'Teks Tombol', type: 'text' },
          { key: 'button_link', label: 'Link Tombol', type: 'text' },
          LIST_F('hours', 'Jam Operasional', [
            { key: 'days', label: 'Hari', type: 'text' },
            { key: 'time', label: 'Jam', type: 'text' },
          ], 7),
        ],
        defaultConfig: {
          title: 'Jam Operasional',
          address: ADDRESS,
          note: 'Parkir luas untuk motor dan mobil.',
          button_text: 'Chat via WhatsApp',
          button_link: WA,
          hours: [
            { days: 'Senin-Sabtu', time: '08.00-19.00' },
            { days: 'Minggu', time: '09.00-15.00' },
          ],
        },
      },
    {
        id: 'location-card', name: 'Kartu Terpusat', description: 'Alamat dan jam dalam satu kartu',
        layout: 'location-card', mockup: 'location-hours',
        configFields: [
          TITLE_F(), { key: 'address', label: 'Alamat', type: 'textarea' },
          { key: 'note', label: 'Catatan Lokasi', type: 'textarea' },
          { key: 'button_text', label: 'Teks Tombol', type: 'text' },
          { key: 'button_link', label: 'Link Tombol', type: 'text' },
          LIST_F('hours', 'Jam Operasional', [
            { key: 'days', label: 'Hari', type: 'text' },
            { key: 'time', label: 'Jam', type: 'text' },
          ], 7),
        ],
        defaultConfig: {
          title: 'Mampir ke Bengkel Kami',
          address: ADDRESS,
          note: 'Parkir luas, akses mudah dari Jalan Tol Poris.',
          button_text: 'Chat via WhatsApp',
          button_link: WA,
          hours: [
            { days: 'Senin-Sabtu', time: '08.00-19.00' },
            { days: 'Minggu', time: '09.00-15.00' },
          ],
        },
      },
    ],
  },
];

/**
 * Template Bengkel — servis motor & mobil.
 *
 * Turunan `PANGKAS_RAPI_TEMPLATE` (blueprint): ketujuh varian header dan 19
 * tipe section otomatis diwarisi lewat `.map()`; di bawah hanya override
 * konten, tema, dan gaya visual.
 *
 * ## Art direction — "Industrial Noir"
 *
 * Semua template bawaan terlihat mirip, dan penyebabnya bisa dihitung:
 * `grep "style: {"` di enam template itu → **0 hasil**, dan **0 animasi**.
 * Dua lever itu justru yang paling besar pengaruhnya, dan keduanya dipakai di
 * sini:
 *
 * 1. **`style` per-section** (`SectionStyle`) — gradasi hero, section foto
 *    dengan overlay gelap + blur, padding asimetris untuk ritme.
 * 2. **Animasi** — `animations[]` + `behaviours[]`, dijalankan
 *    `behaviour-runtime.tsx`. Steel semua template bawaan: nol.
 *
 * Catatan:
 * - Kategori `services` (bengkel = jasa).
 * - `maxNavDepth: 1`, seragam di seluruh varian header (dijaga test).
 * - `menu_board` untuk "Layanan & Harga" karena renderer-nya benar-benar
 *   menampilkan `name`/`desc`/`price`. Sengaja TIDAK memakai `product_grid`:
 *   di renderer v3 section itu masih placeholder kartu abu-abu.
 * - `designStyleId: "dark-mode"` — satu-satunya style gelap di DESIGN_STYLES,
 *   dan paling mendekati Industrial Noir. Palet tetap dioverride penuh supaya
 *   oranye high-vis tidak berubah jadi merah muda bawaannya.
 */
export const BENGKEL_TEMPLATE = ({
  id: "bengkel",
  name: "Bengkel Jaya Motor — Industrial Noir",
  description:
    "Bengkel servis motor & mobil bergaya industrial noir. Ganti oli, kampas, tune up, AC, dan servis berat. Booking online, estimasi biaya transparan, garansi 30 hari.",
  category: "services",
  // Bengkel: grid teknis, warna dingin + oranye safety, utilitas — tech.
  designType: "tech",
  tiers: ["free", "starter", "growth", "enterprise"],
  theme: {
    palette: PALETTE,
    typography: {
      // Keduanya terdaftar di `font-categories.ts` (tech & modern).
      headingFont: "Barlow",
      bodyFont: "Inter",
      baseSize: 16,
      scaleRatio: 1.3,
      headingWeight: 700,
      bodyWeight: 400,
    },
    components: {
      borderRadius: 2, // sudut tajam = kesan baja/pabrik
      buttonStyle: "solid",
      shadowStyle: "lg",
      navStyle: "solid",
      footerStyle: "columns",
    },
    effects: {
      borderWidth: 1,
      uppercaseHeadings: true,
    },
  },
  // Chrome ditulis sendiri (bukan `.map()` warisan pangkas-rapi): tiap varian
  // punya config field & bentuknya sendiri. Lihat `BENGKEL_HEADERS`/`BENGKEL_FOOTERS`.
  headers: BENGKEL_HEADERS,
  footers: BENGKEL_FOOTERS,
  // Katalog varian section. WAJIB ada di root — `template-gallery.tsx` membacanya
  // untuk `sectionsCount`, dan `builder-sidebar` untuk SectionPicker.
  // Sebaliknya, seed section yang benar-benar dipakai ada di `data.sections`.
  sections: BENGKEL_SECTIONS,
} as Template & { data: FullTemplateData });

/**
 * CSS kustom — bagian yang membebaskan desain dari 47 layout bawaan.
 *
 * Semua ini mustahil dilakukan lewat `theme` atau `style` per-section, karena
 * `SectionRenderer` tidak pernah menghasilkan `clip-path`, `filter`,
 * `backdrop-filter`, `box-shadow`, atau `mask-image`.
 *
 * PENTING: menyasar `data-tpl-type` / `data-tpl-variant`, BUKAN class Tailwind
 * (`@md:grid-cols-3` dst) yang bisa berubah tiap build.
 *
 * Sanitasi: `sanitizeTemplateCss()` memblokir `</style>`, `@import`, dan
 * `url()` non-`data:` — karena itu semua aset gambar tetap lewat `assets/`,
 * bukan `url()` di dalam CSS.
 */
const CUSTOM_CSS = `/* ---- Tekstur grid halus di hero (cyberpunk/industri) ---- */
[data-tpl-type="hero"]::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(249, 115, 22, .07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(249, 115, 22, .07) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 78%);
}

/* ---- Wave divider: hero dipotong lengkung ke section berikutnya ---- */
[data-tpl-type="hero"] {
  clip-path: ellipse(78% 88% at 50% 0%);
  margin-bottom: -58px;
}

[data-tpl-type="features"] {
  padding-top: 108px;
}

/* ---- Neon glow pada tombol utama ---- */
[data-tpl-type="hero"] a[href="#booking"],
[data-tpl-type="booking"] a {
  box-shadow: 0 0 0 1px rgba(249, 115, 22, .55),
              0 8px 26px -8px rgba(249, 115, 22, .65);
  transition: transform .18s ease, box-shadow .18s ease;
}
[data-tpl-type="hero"] a[href="#booking"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 0 1px rgba(249, 115, 22, .8),
              0 14px 34px -10px rgba(249, 115, 22, .85);
}

/* ---- Judul besar dengan aksen garis oranye ---- */
[data-tpl-type="features"] > div > h2,
[data-tpl-type="gallery"] > div > h2 {
  position: relative;
  display: inline-block;
}
[data-tpl-type="features"] > div > h2::after,
[data-tpl-type="gallery"] > div > h2::after {
  content: "";
  display: block;
  height: 3px;
  width: 56px;
  margin: 10px auto 0;
  background: var(--color-primary);
  border-radius: 2px;
}

/* ---- Kartu: sedikit terangkat saat kursor masuk ---- */
[data-tpl-type="features"] > div > div > div {
  transition: transform .2s ease, border-color .2s ease;
}
[data-tpl-type="features"] > div > div > div:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
}
`;

BENGKEL_TEMPLATE.data = {
  designStyleId: "dark-mode",
  paletteOverride: PALETTE,
  customCss: CUSTOM_CSS,
  sections: [
    /* LEVER 1 — gradasi. Section ini jadi latar gradien gelap → oranye;
       teks tetap terbaca karena token on-section di-autofix ke terang. */
    {
      type: "hero",
      variant: "hero-split",
      anchorId: "beranda",
      style: {
        padding: { top: 96, right: 24, bottom: 96, left: 24 },
        background: "gradient",
        backgroundGradient: "linear-gradient(135deg, #0b1220 0%, #1e293b 52%, #7c2d12 100%)",
      },
      config: {
        headline: "Bengkel Tercepat di Area Anda",
        subheadline:
          "Servis motor dan mobil dikerjakan mekanik berpengalaman 10 tahun. Spare part original, estimasi biaya transparan sebelum pekerjaan dimulai, garansi servis 30 hari.",
        cta_text: "Booking Servis Sekarang",
        cta_link: "#booking",
        text_align: "left",
        image: "assets/workshop-bengkel.jpg",
      },
    },

    /* Strip promo. `defaultStyle` varian ini sudah memberi warna primary dan
       padding 0, jadi tidak perlu style manual. */
    {
      type: "marquee",
      variant: "marquee-band",
      config: {
        items: [
          { text: "GRATIS KONSULTASI KERUSAKAN" },
          { text: "SPARE PART ORIGINAL" },
          { text: "GARANSI SERVIS 30 HARI" },
          { text: "ESTIMASI BIAYA TRANSPARAN" },
        ],
      },
    },

    /* Target stagger untuk animasi: kartu = #keunggulan .grid > div:nth-child(N).
       Padding longgar di sini agar blok ini "bernapas" dibanding section padat. */
    {
      type: "features",
      variant: "features-3col",
      anchorId: "keunggulan",
      style: { padding: { top: 80, right: 24, bottom: 80, left: 24 } },
      config: {
        title: "Kenapa Bengkel Jaya Motor",
        items: [
          { icon: "🔧", title: "Mekanik Berpengalaman", description: "10 tahun menangani motor dan mobil, sudah ribuan kendaraan." },
          { icon: "⚙️", title: "Spare Part Original", description: "Komponen resmi bergaransi, bukan barang tiruan murahan." },
          { icon: "🛡️", title: "Garansi Servis", description: "Garansi 30 hari untuk pekerjaan yang kami kerjakan." },
        ],
      },
    },


    /* Latar `theme:surface` → kartu menu BOARD jadi lapisan berbeda dari
       halaman, memberi ritme tanpa perlu gambar. */
    {
      type: "menu_board",
      variant: "menu-tabs",
      anchorId: "layanan",
      style: {
        padding: { top: 72, right: 24, bottom: 72, left: 24 },
        background: "color",
        backgroundColor: "theme:surface",
      },
      config: {
        title: "Layanan dan Harga",
        subtitle: "Pilih kategori layanan untuk melihat estimasi biaya.",
        groups: [
          {
            key: "perawatan",
            label: "Perawatan Berkala",
            items: [
              { name: "Ganti Oli dan Filter", desc: "Oli sesuai tipe mesin, filter oli dan udara baru.", price: "Mulai Rp 150rb" },
              { name: "Ganti Kampas Rem", desc: "Kampas depan dan belakang, termasuk jasa pasang.", price: "Mulai Rp 180rb" },
              { name: "Tune Up", desc: "Setel katup, bersih injektor, cek karburasi.", price: "Mulai Rp 250rb" },
            ],
          },
          {
            key: "berat",
            label: "Servis Berat",
            items: [
              { name: "Ganti Transmisi", desc: "Clutch, bearing, dan synchronizer.", price: "Mulai Rp 900rb" },
              { name: "Overhaul Engine", desc: "Bongkar mesin, ganti komponen vital, kalibrasi ulang.", price: "Mulai Rp 2,5jt" },
              { name: "Ganti Rem Drum", desc: "Untuk roda belakang tipe drum.", price: "Mulai Rp 350rb" },
            ],
          },
          {
            key: "ac",
            label: "Kelistrikan dan AC",
            items: [
              { name: "Servis AC", desc: "Isi ulang refrigerant, bersihkan evaporator dan condenser.", price: "Mulai Rp 200rb" },
              { name: "Perbaikan Kelistrikan", desc: "Aki, alternator, wiring, dan sensor.", price: "Mulai Rp 120rb" },
              { name: "Ganti Baterai", desc: "Diagnosa baterai dan penggantian unit baru.", price: "Mulai Rp 400rb" },
            ],
          },
        ],
      },
    },

    {
      type: "pricing",
      variant: "pricing-2tier",
      anchorId: "harga",
      config: {
        title: "Paket Servis",
        items: [
          { name: "Servis Reguler", price: "Mulai Rp 250rb", features: ["Ganti oli dan filter", "Cek rem dan lampu", "Pengeimbangan tekanan ban", "Estimasi biaya di depan"] },
          { name: "Servis Lengkap", price: "Mulai Rp 850rb", features: ["Semua paket reguler", "Tune up dan bersih injektor", "Cek AC dan kelistrikan", "Garansi 30 hari", "Prioritas antrean"] },
        ],
      },
    },

    {
      type: "steps",
      variant: "steps-3col",
      anchorId: "prosedur",
      config: {
        title: "Cara Booking",
        subtitle: "Tiga langkah mudah, tanpa datang sebelum dikonfirmasi.",
        items: [
          { title: "Pilih Layanan", description: "Tentukan jenis servis dan kendaraan Anda." },
          { title: "Isi Form Booking", description: "Lengkapi nama, nomor kendaraan, dan jadwal." },
          { title: "Konfirmasi via WhatsApp", description: "Kami balas estimasi biaya dan slot pengerjaan." },
        ],
      },
    },


    /* LEVER 1 — foto + overlay gelap + blur. `background: "image"` tanpa
       overlay dipaksa `dark` oleh renderer demi keterbacaan; di sini dinaikkan
       ke 70 supaya judul section tetap menonjol di atas foto. */
    {
      type: "gallery",
      variant: "gallery-grid",
      anchorId: "galeri",
      style: {
        padding: { top: 88, right: 24, bottom: 88, left: 24 },
        background: "image",
        backgroundImage: "assets/workshop-bengkel.jpg",
        backgroundSize: "cover",
        backgroundOverlay: "dark",
        backgroundOverlayOpacity: 70,
        backgroundBlur: 3,
      },
      config: { title: "Galeri Pekerjaan" },
    },

    {
      type: "booking",
      variant: "booking-single",
      anchorId: "booking",
      style: {
        padding: { top: 80, right: 24, bottom: 80, left: 24 },
        background: "color",
        backgroundColor: "theme:surface",
      },
      config: {
        title: "Booking Servis",
        subtitle: "Isi form, tim kami konfirmasi via WhatsApp dalam 1 jam kerja.",
        services: [
          { name: "Ganti Oli dan Filter", duration: "30-45 menit", price: "Mulai Rp 150rb" },
          { name: "Ganti Kampas Rem", duration: "45-60 menit", price: "Mulai Rp 180rb" },
          { name: "Tune Up", duration: "1-2 jam", price: "Mulai Rp 250rb" },
          { name: "Servis AC", duration: "45-90 menit", price: "Mulai Rp 200rb" },
        ],
        address: "Jl. Raya Industri No. 45, Jakarta Timur",
        hours: "Senin-Sabtu, 08.00-19.00",
        success_message: "Booking diterima! Tim kami akan menghubungi Anda via WhatsApp untuk konfirmasi.",
        forward_wa: "",
      },
    },

    {
      type: "testimonials",
      variant: "testimonials-grid",
      anchorId: "testimoni",
      config: {
        title: "Kata Pelanggan",
        items: [
          { name: "Rudi", text: "Oli diganti cepat, kampas baru, motornya lancar lagi. Estimasi biaya jujur, tidak ada biaya siluman.", rating: 5 },
          { name: "Sarah", text: "AC mobil saya sudah tidak dingin, sekarang beres. Pelayanannya ramah dan rapi.", rating: 5 },
          { name: "Bpak Joko", text: "Sudah beberapa kali servis tune up di sini. Konsisten dan hasilnya bagus.", rating: 5 },
        ],
      },
    },

    {
      type: "location",
      variant: "location-hours",
      anchorId: "lokasi",
      config: {
        title: "Kunjungi Bengkel Kami",
        address: "Jl. Raya Industri No. 45, Jakarta Timur",
        note: "Parkir luas untuk motor dan mobil, akses mudah dari Jalan Tol Poris.",
        button_text: "Chat via WhatsApp",
        button_link: WA,
        hours: [
          { days: "Senin-Sabtu", time: "08.00-19.00" },
          { days: "Minggu", time: "09.00-15.00" },
        ],
      },
    },

    {
      type: "faq",
      variant: "faq-accordion",
      anchorId: "faq",
      config: {
        title: "Sering Ditanyakan",
        items: [
          { question: "Apakah harus booking dulu?", answer: "Tidak wajib, tapi booking memastikan kendaraan Anda langsung dikerjakan tanpa menunggu antrean." },
          { question: "Bagaimana cara kerjanya?", answer: "Kirim WhatsApp atau isi form booking. Kami cek dulu tipe kendaraan dan kerusakannya, lalu kirim estimasi biaya sebelum mulai." },
          { question: "Spare part-nya original?", answer: "Ya. Kami memakai komponen resmi atau OEM bergaransi, dan bisa tunjukkan pricelist bila Anda mau." },
          { question: "Kalau ternyata berbeda dari estimasi?", answer: "Kami kabari lebih dulu dan menunggu persetujuan Anda sebelum mengganti komponen tambahan. Tidak ada biaya tanpa konfirmasi." },
        ],
      },
    },

    {
      type: "contact",
      variant: "contact-form-map",
      anchorId: "kontak",
      config: {
        title: "Hubungi Kami",
        subtitle: "Ada pertanyaan? Kirim pesan atau mampir langsung ke bengkel.",
        show_map: true,
        address: "Jl. Raya Industri No. 45, Jakarta Timur",
      },
    },
  ],


  header: {
    variant: "standard",
    logoUrl: "assets/logo-bengkel.png",
    siteTitle: "Bengkel Jaya Motor",
    tagline: "Servis Motor dan Mobil Terpercaya",
    navItems: [
      { id: "bk-layanan", label: "Layanan", url: "#layanan", isExternal: false, enabled: true },
      { id: "bk-harga", label: "Harga", url: "#harga", isExternal: false, enabled: true },
      { id: "bk-booking", label: "Booking", url: "#booking", isExternal: false, enabled: true },
      { id: "bk-lokasi", label: "Lokasi", url: "#lokasi", isExternal: false, enabled: true },
      { id: "bk-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
    ],
    ctaText: "Booking Servis",
    ctaLink: WA,
    showCta: true,
    sticky: true,
  },
  footer: {
    style: "columns",
    text: "© {year} Bengkel Jaya Motor. Setiap mesin kami rawat dengan hati-hati.",
    navItems: [
      { id: "bk-f-layanan", label: "Layanan", url: "#layanan", isExternal: false, enabled: true },
      { id: "bk-f-harga", label: "Harga", url: "#harga", isExternal: false, enabled: true },
      { id: "bk-f-booking", label: "Booking", url: "#booking", isExternal: false, enabled: true },
      { id: "bk-f-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
    ],
    showSocial: true,
  },
  seo: {
    title: "Bengkel Jaya Motor — Servis Motor dan Mobil Jakarta Timur",
    description:
      "Bengkel servis motor dan mobil di Jakarta Timur. Ganti oli, kampas, tune up, dan AC. Booking online, spare part original, garansi 30 hari.",
  },
  core: {
    site_title: "Bengkel Jaya Motor",
    tagline: "Servis Motor dan Mobil Terpercaya",
    favicon_url: "",
    logo_url: "assets/logo-bengkel.png",
    header_nav: [
      { id: "bk-layanan", label: "Layanan", url: "#layanan", isExternal: false, enabled: true },
      { id: "bk-harga", label: "Harga", url: "#harga", isExternal: false, enabled: true },
      { id: "bk-booking", label: "Booking", url: "#booking", isExternal: false, enabled: true },
      { id: "bk-kontak", label: "Kontak", url: "#kontak", isExternal: false, enabled: true },
    ],
    footer_nav: [
      { id: "bk-f-layanan", label: "Layanan", url: "#layanan", isExternal: false, enabled: true },
      { id: "bk-f-harga", label: "Harga", url: "#harga", isExternal: false, enabled: true },
      { id: "bk-f-booking", label: "Booking", url: "#booking", isExternal: false, enabled: true },
    ],
    footer_text: "© {year} Bengkel Jaya Motor. Setiap mesin kami rawat dengan hati-hati.",
  },
};