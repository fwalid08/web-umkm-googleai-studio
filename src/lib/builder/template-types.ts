import type { DesignStylePalette, DesignStyleTypography, DesignStyleComponents, DesignStyleEffects } from './types';

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
  | 'switch';

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
  theme: TemplateTheme;
  headers: HeaderVariant[];
  footers: FooterVariant[];
  sections: SectionTypeDefinition[];
  animations?: AnimationConfig[];
  behaviours?: BehaviourConfig[];
  assets?: AssetMetadata[];
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
