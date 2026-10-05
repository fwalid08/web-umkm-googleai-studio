

export interface CoreConfig {
  site_title: string;
  tagline: string;
  favicon_url: string;
  logo_url: string;
  header_nav: NavItem[];
  footer_nav: NavItem[];
  footer_text: string;
}

export interface NavItem {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  enabled: boolean;
  /** Submenu 1 level (dropdown topnav). Max 5 anak, tanpa cucu. */
  children?: NavItem[];
}

export interface BuilderConfig {
  theme: {
    palette: Record<string, string>;
    typography: Record<string, string | number>;
  };
  seo: {
    title: string;
    description: string;
  };
  core: CoreConfig;
}



export interface StorePage {
  id: string;
  website_id: string;
  title: string;
  slug: string;
  type: 'custom' | 'about' | 'contact' | 'faq' | 'terms' | 'privacy';
  is_published: boolean;
  is_homepage: boolean;
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  /**
   * @deprecated Konten teks legacy — renderer publik HANYA membaca `layout.sections`.
   * Dipertahankan untuk kompatibilitas data lama; jangan tulis nilai baru.
   */
  content: string;
  /**
   * Layout per-halaman (kolom JSONB `store_pages.layout`).
   * Bentuk normal: `{ sections: Section[] }` — format builder.
   * Dibiarkan opsional karena baris lama/legacy bisa kosong `{}`.
   */
  layout?: {
    rows?: unknown[];
    sections?: Array<{
      id: string;
      type: string;
      variant: string;
      anchorId?: string;
      config?: Record<string, unknown>;
      style?: Record<string, unknown>;
      responsive?: Record<string, unknown>;
    }>;
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Tabel `templates_library` dihapus (migrasi 040). Template kini
 * hanya kode statis (`src/lib/builder/templates/`). Interface dipertahankan
 * sementara agar tidak merusak import lawas — jangan dipakai untuk kode baru.
 */
export interface TemplateLibraryItem {
  id: string;
  user_id: string;
  website_id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  template_data: BuilderConfig;
  scope: 'user' | 'public';
  imported_from: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Format template UTUH versi builder saat ini: style + navigasi (header) +
 * footer + section varian + seo. Dipakai template bawaan (templates/*.ts)
 * maupun hasil simpan galeri (snake_case dari DB).
 */
export interface FullTemplateData {
  /** Override warna tema (kunci camelCase atau snake_case). */
  paletteOverride?: Partial<DesignStylePalette>;
  palette_override?: Partial<DesignStylePalette>;
  /**
   * Section mana yang AKTIF untuk niche ini (v3.0, v3.4: boleh memuat tipe
   * kustom milik template). Template tetap mendefinisikan SEMUA 18 tipe
   * predefined di katalog `sections` (+ tipe kustom bila ada), tapi hanya
   * yang di sini yang di-seed ke kanvas awal. Lihat `Template.activeSections`.
   */
  activeSections?: string[];
  sections?: Array<{
    type: SectionType;
    variant: string;
    config?: Record<string, unknown>;
    style?: Partial<SectionStyle>;
    anchorId?: string;
  }>;
  header?: Partial<HeaderConfig>;
  footer?: Partial<FooterConfig>;
  seo?: { title?: string; description?: string };
  core?: Partial<CoreConfig>;
  /**
   * CSS bebas milik template. Ini yang memungkinkan desain yang tidak bisa
   * dicapai lewat `theme` + `style` section — glassmorphism, neo-brutalism,
   * neumorphism, claymorphism, bento grid, wave divider, gradient text.
   *
   * Sanitasi `sanitizeTemplateCss()` sebelum dipakai (blokir `</style>`,
   * `@import`, `url()` non-`data:`). Targetkan section lewat `data-tpl-type`
   * dan `data-tpl-variant` — jangan class Tailwind.
   */
  customCss?: string;
}

/** Definisi template bawaan siap terap (lihat templates/catalog.ts). */
export interface BuiltInTemplate {
  id: string;
  name: string;
  description: string;
  data: FullTemplateData;
}

export interface DesignStylePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface DesignStyleTypography {
  headingFont: string;
  bodyFont: string;
  baseSize: number;
  scaleRatio: number;
  headingWeight: number;
  bodyWeight: number;
}

export interface DesignStyleComponents {
  borderRadius: number;
  buttonStyle: 'solid' | 'outline' | 'ghost' | 'gradient';
  shadowStyle: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  navStyle: 'solid' | 'transparent' | 'glass' | 'bordered';
  footerStyle: 'simple' | 'columns' | 'centered' | 'minimal';
}

export interface DesignStyleEffects {
  glassmorphism?: boolean;
  gradientBackgrounds?: boolean;
  borderWidth?: number;
  uppercaseHeadings?: boolean;
}

export interface DesignStyle {
  id: string;
  name: string;
  description: string;
  palette: DesignStylePalette;
  typography: DesignStyleTypography;
  components: DesignStyleComponents;
  effects: DesignStyleEffects;
  thumbnailUrl: string;
}

export type SectionType =
  | 'hero'
  | 'features'
  | 'product_grid'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'about'
  | 'gallery'
  | 'video'
  | 'team'
  | 'pricing'
  | 'newsletter'
  | 'divider'
  | 'marquee'
  | 'menu_board'
  | 'steps'
  | 'location';

export interface SectionVariant {
  id: string;
  name: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  /** Padding/latar bawaan varian (mis. marquee tanpa padding vertikal). */
  defaultStyle?: Partial<SectionStyle>;
}

export interface SectionTypeDefinition {
  type: SectionType;
  name: string;
  icon: string;
  variants: SectionVariant[];
}

export interface SectionStyle {
  padding: { top: number; right: number; bottom: number; left: number };
  background: 'color' | 'image' | 'gradient' | 'transparent';
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  backgroundBlur?: number;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundOverlay?: 'none' | 'light' | 'dark' | 'primary';
  /** Kekuatan overlay 0-100 (%). Kosong = pakai default per jenis overlay. */
  backgroundOverlayOpacity?: number;
}

export interface Section {
  id: string;
  type: SectionType;
  variant: string;
  config: Record<string, unknown>;
  style: SectionStyle;
  responsive: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
  };
  anchorId?: string;
}

export interface HeaderConfig {
  /** ID varian header (lihat HEADER_VARIANTS di lib/builder/chrome.ts). */
  variant: string;
  logoUrl: string;
  siteTitle: string;
  tagline: string;
  navItems: NavItem[];
  ctaText: string;
  ctaLink: string;
  showCta: boolean;
  /** true = header menempel saat scroll (sticky/fixed), false = ikut scroll. */
  sticky: boolean;
  faviconUrl: string;
  seo?: {
    title: string;
    description: string;
  };
}

/**
 * Grup navigasi footer untuk layout kolom: tiap grup punya judul + daftar
 * link sendiri (mis. "Produk", "Bantuan", "Perusahaan").
 */
export interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export interface FooterConfig {
  /** ID varian footer (lihat FOOTER_VARIANTS di lib/builder/chrome.ts). */
  style: 'simple' | 'columns' | 'centered' | 'minimal';
  /** Copyright — SELALU tampil di semua varian footer. */
  text: string;
  /** Navigasi datar (layout inline). Untuk layout kolom pakai `navGroups`. */
  navItems: NavItem[];
  /** Navigasi terkelompok (layout kolom). */
  navGroups?: NavGroup[];
  /** Tampilkan blok sosmed — opsional, bisa dimatikan user. */
  showSocial: boolean;
  socialLinks?: Record<string, string>;
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  showWhatsApp?: boolean;
  /**
   * Tampilkan blok navigasi — opsional. Brand (logo & nama) dan copyright
   * tidak punya toggle: keduanya inti footer dan selalu tampil.
   */
  showNav?: boolean;
}

export interface BuilderConfigV2 {
  sections: Section[];
  header: HeaderConfig;
  footer: FooterConfig;
  seo: {
    title: string;
    description: string;
  };
}
