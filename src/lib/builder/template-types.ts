import type { DesignStylePalette, DesignStyleTypography, DesignStyleComponents, DesignStyleEffects } from './types';

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
  };
  mockup: string;
}

export interface SectionTypeDefinition {
  type: string;
  name: string;
  icon: string;
  variants: SectionVariant[];
}

export interface HeaderVariant {
  id: string;
  name: string;
  description: string;
  layout: string;
  configFields: ConfigField[];
  defaultConfig: Record<string, unknown>;
  mockup: string;
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
  };
  responsive: {
    hideOnMobile?: boolean;
    hideOnTablet?: boolean;
    hideOnDesktop?: boolean;
  };
}
