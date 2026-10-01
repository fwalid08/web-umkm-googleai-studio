

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

export type NavigationGroupKey = 'topnav' | 'footer' | 'custom';

export interface NavigationGroup {
  id: string;
  website_id: string;
  key: NavigationGroupKey;
  title: string;
  sort_order: number;
}

export interface NavigationItem {
  id: string;
  group_id: string;
  parent_id: string | null;
  label: string;
  url: string;
  page_id: string | null;
  open_in_new_tab: boolean;
  enabled: boolean;
  sort_order: number;
  children?: NavigationItem[];
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
  content: string;
  created_at: string;
  updated_at: string;
}

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
  designStyleId?: string;
  design_style_id?: string;
  /** Override warna tema (kunci camelCase atau snake_case). */
  paletteOverride?: Partial<DesignStylePalette>;
  palette_override?: Partial<DesignStylePalette>;
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
  | 'booking'
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

/** Satu layanan yang bisa dibooking (kontrak config section `booking`). */
export interface BookingService {
  name: string;
  duration: string;
  price: string;
}

/** Key config standar section `booking` — wajib disediakan tiap varian. */
export interface BookingSectionConfig {
  title: string;
  subtitle: string;
  services: BookingService[];
  address: string;
  hours: string;
  success_message: string;
  forward_wa: string;
}

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

export interface FooterConfig {
  /** ID varian footer (lihat FOOTER_VARIANTS di lib/builder/chrome.ts). */
  style: 'simple' | 'columns' | 'centered' | 'minimal';
  text: string;
  navItems: NavItem[];
  showSocial: boolean;
  socialLinks?: Record<string, string>;
  address?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  showWhatsApp?: boolean;
}

export interface BuilderConfigV2 {
  designStyleId: string;
  sections: Section[];
  header: HeaderConfig;
  footer: FooterConfig;
  seo: {
    title: string;
    description: string;
  };
}
