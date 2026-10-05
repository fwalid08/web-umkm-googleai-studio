import type { DesignStylePalette, DesignStyleTypography, DesignStyleComponents, DesignStyleEffects } from './types';
// Tipe saja — `contrast-contract.ts` mengimpor `design-styles` + `section-contrast`,
// jadi impor nilai di sini akan membuat siklus modul.
import type { ContrastContract } from './contrast-contract';

// Re-export agar impor lama dari template-types tetap jalan (mis. public.ts).
export type { DesignStylePalette, DesignStyleTypography } from './types';

export type BusinessCategory = 'food' | 'fashion' | 'retail' | 'handicraft' | 'services';

export type Tier = 'free' | 'starter' | 'growth' | 'enterprise';

export interface TemplateTheme {
  palette: DesignStylePalette;
  typography: DesignStyleTypography;
  components: DesignStyleComponents;
  effects?: DesignStyleEffects;
}

export type ConfigFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'image'
  | 'list'
  | 'color'
  | 'background'
  | 'gallery'
  | 'switch'
  | 'html';

export interface ConfigFieldOption {
  label: string;
  value: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: ConfigFieldOption[];
  itemFields?: ConfigField[];
  placeholder?: string;
  defaultValue?: unknown;
  maxItems?: number;
  rows?: number;
  hint?: string;
}

export interface SectionVariant {
  id: string;
  name: string;
  description: string;
  layout: string;
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  defaultStyle?: {
    padding?: { top?: number; right?: number; bottom?: number; left?: number };
    background?: 'color' | 'image' | 'gradient' | 'transparent';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundGradient?: string;
    backgroundBlur?: number;
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundOverlay?: 'none' | 'light' | 'dark' | 'primary';
    backgroundOverlayOpacity?: number;
  };
  mockup: string;
  /**
   * HTML kustom untuk varian ini (v3.0 — ekspresi HTML).
   *
   * Bila diisi, renderer mengutamakan `html` ini dibanding branch bawaan
   * `section-renderer.tsx`, sehingga desain kreatif template tidak terbatas
   * pada layout bawaan. Placeholder `{{key}}` diganti nilai `config[key]`
   * (sudah di-escape kecuali field bertipe `html` yang disanitasi).
   *
   * Variabel tema tersedia sebagai CSS vars: `--color-primary`, dst.
   * Targetkan section lewat `data-tpl-type` / `data-tpl-variant`.
   */
  html?: string;
}

export interface MobileMenuConfig {
  style: 'drawer-top' | 'drawer-sidebar';
  showCta: boolean;
  ctaText?: string;
  ctaLink?: string;
  subMenuSupport: boolean;
}

export interface SectionTypeDefinition {
  type: string;
  name: string;
  icon: string;
  variants: SectionVariant[];
  mobileMenu?: MobileMenuConfig;
}

export interface HeaderVariant {
  id: string;
  name: string;
  description: string;
  layout: string;
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  mockup: string;
  mobileMenu?: MobileMenuConfig;
  /**
   * HTML kustom untuk varian header ini (v3.0).
   * Placeholder `{{key}}` diganti nilai config. Lihat `SectionVariant.html`.
   */
  html?: string;
  /**
   * Kedalaman menu navigasi yang didukung varian ini (1 atau 2 tingkat).
   *
   * TEMPLATE yang memutuskan lewat nilai ini — bukan renderer:
   * - `1` (default) = menu datar, tanpa submenu.
   * - `2`           = boleh punya submenu (dropdown 1 level).
   *
   * Sidebar memakai nilai ini untuk menampilkan/menyembunyikan field
   * "Submenu", sehingga form mengikuti kemampuan template tersebut.
   */
  maxNavDepth?: 1 | 2;
}

export interface FooterVariant {
  id: string;
  name: string;
  description: string;
  layout: string;
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  mockup: string;
  /**
   * HTML kustom untuk varian footer ini (v3.0).
   * Placeholder `{{key}}` diganti nilai config. Lihat `SectionVariant.html`.
   */
  html?: string;
}

export interface AnimationConfig {
  id: string;
  name: string;
  type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'custom';
  duration: number;
  delay: number;
  easing: string;
  trigger: 'onLoad' | 'onScroll' | 'onClick' | 'onHover';
  keyframes?: string;
  target?: string;
}

export interface BehaviourConfig {
  id: string;
  name: string;
  script: string;
  trigger: 'onLoad' | 'onScroll' | 'onClick' | 'onHover' | 'onSubmit';
  target: string;
}

export interface AssetMetadata {
  id: string;
  name: string;
  path: string;
  url: string;
  type: 'image' | 'script' | 'style';
  size: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  tiers?: Tier[];
  tier_requirement?: Tier;
  theme: TemplateTheme;
  headers: HeaderVariant[];
  footers: FooterVariant[];
  sections: SectionTypeDefinition[];
  animations?: AnimationConfig[];
  behaviours?: BehaviourConfig[];
  assets?: AssetMetadata[];
  template_data?: {
    sections?: any[];
    header?: any;
    footer?: any;
    theme?: any;
  };
  /**
   * Section mana yang AKTIF secara default untuk niche ini (v3.0, v3.4:
   * boleh memuat tipe kustom milik template).
   *
   * Template WAJIB mendefinisikan SEMUA 18 tipe section di `sections`
   * (agar mendukung section predefined builder) + tipe kustom bila ada,
   * tapi hanya subset yang aktif di `data.sections` / kanvas awal —
   * ditentukan di sini sesuai kebutuhan konten jenis usaha UMKM.
   *
   * Contoh warung makan: ["hero","menu_board","testimonials","location",...]
   * Contoh bengkel: ["hero","features","pricing","contact",...]
   *
   * Kosong/undefined = semua tipe yang ada di `data.sections` dianggap aktif.
   */
  activeSections?: string[];

  /**
   * Kontrak rasio kontras milik template ini (v3.5, §19).
   *
   * Menjawab pertanyaan "warna teks mana yang aman di atas warna latar mana".
   * Tanpa kontrak ini, ganti skema warna bisa membuat teks tak terbaca di
   * bagian template yang tidak pernah disentuh renderer generik.
   *
   * Pasangan dideklarasikan manual (sumber kebenaran). `auditContrastCoverage`
   * hanya membandingkan deklarasi itu dengan hasil pindai `variant.html` dan
   * mengembalikan WARNING — tidak pernah memblokir.
   *
   * Lihat `contrast-contract.ts` untuk aturan token fg-only vs dual-role.
   */
  contrast?: ContrastContract;
}

export interface TemplateInstance {
  templateId: string;
  headerVariantId: string;
  footerVariantId: string;
  sections: TemplateSectionInstance[];
  themeOverride?: Partial<DesignStylePalette>;
}

export interface TemplateSectionInstance {
  id: string;
  type: string;
  variantId: string;
  config: Record<string, unknown>;
  style: {
    padding: { top: number; right: number; bottom: number; left: number };
    background: 'color' | 'image' | 'gradient' | 'transparent';
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundGradient?: string;
    backgroundBlur?: number;
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundOverlay?: 'none' | 'light' | 'dark' | 'primary';
    backgroundOverlayOpacity?: number;
  };
  responsive: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
  };
  anchorId?: string;
}
