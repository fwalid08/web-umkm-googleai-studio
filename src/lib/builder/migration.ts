import type { Template, TemplateSectionInstance } from './template-types';
import { PANGKAS_RAPI_TEMPLATE } from './templates/pangkas-rapi';

function generateId(): string {
  return crypto.randomUUID();
}

const SECTION_TYPE_MAP: Record<string, string> = {
  hero: 'hero',
  features: 'features',
  product_grid: 'product_grid',
  testimonials: 'testimonials',
  faq: 'faq',
  cta: 'cta',
  contact: 'contact',
  booking: 'booking',
  about: 'about',
  gallery: 'gallery',
  video: 'video',
  team: 'team',
  pricing: 'pricing',
  newsletter: 'newsletter',
  divider: 'divider',
  marquee: 'marquee',
  menu_board: 'menu_board',
  steps: 'steps',
  location: 'location',
};

const VARIANT_MAP: Record<string, Record<string, string>> = {
  hero: {
    'hero-full': 'hero-full',
    'hero-left': 'hero-split',
    'hero-right': 'hero-split',
    'hero-bg-image': 'hero-full',
  },
  features: {
    'features-3col': 'features-3col',
    'features-2col': 'features-list',
    'features-list': 'features-list',
  },
  product_grid: {
    'product-4col': 'product-4col',
    'product-3col': 'product-3col',
    'product-2col': 'product-2col',
  },
  testimonials: {
    'testimonials-grid': 'testimonials-grid',
    'testimonials-carousel': 'testimonials-carousel',
    'testimonials-single': 'testimonials-single',
  },
  faq: {
    'faq-accordion': 'faq-accordion',
    'faq-list': 'faq-list',
    'faq-grid': 'faq-grid',
  },
  cta: {
    'cta-banner': 'cta-banner',
    'cta-card': 'cta-card',
    'cta-split': 'cta-split',
  },
  contact: {
    'contact-form': 'contact-form',
    'contact-form-map': 'contact-form-map',
    'contact-split': 'contact-split',
  },
  booking: {
    'booking-single': 'booking-single',
    'booking-split': 'booking-split',
  },
  about: {
    'about-left': 'about-left',
    'about-right': 'about-right',
    'about-centered': 'about-centered',
  },
  gallery: {
    'gallery-grid': 'gallery-grid',
    'gallery-masonry': 'gallery-masonry',
    'gallery-carousel': 'gallery-carousel',
  },
  video: {
    'video-full': 'video-full',
    'video-centered': 'video-centered',
    'video-bg': 'video-full',
  },
  team: {
    'team-grid': 'team-grid',
    'team-list': 'team-list',
    'team-carousel': 'team-grid',
  },
  pricing: {
    'pricing-3tier': 'pricing-3tier',
    'pricing-2tier': 'pricing-2tier',
    'pricing-single': 'pricing-3tier',
  },
  newsletter: {
    'newsletter-inline': 'newsletter-inline',
    'newsletter-card': 'newsletter-card',
    'newsletter-split': 'newsletter-inline',
  },
  divider: {
    'divider-line': 'divider-line',
    'divider-spacer': 'divider-spacer',
    'divider-image': 'divider-line',
  },
  marquee: {
    'marquee-band': 'marquee-band',
  },
  menu_board: {
    'menu-tabs': 'menu-tabs',
    'menu-list': 'menu-list',
  },
  steps: {
    'steps-3col': 'steps-3col',
  },
  location: {
    'location-hours': 'location-hours',
  },
};

export function migrateOldConfig(oldConfig: Record<string, unknown>): Record<string, unknown> {
  const template = PANGKAS_RAPI_TEMPLATE;
  const oldSections = Array.isArray(oldConfig.sections) ? oldConfig.sections : [];

  const newSections: TemplateSectionInstance[] = oldSections.map((oldSection: Record<string, unknown>) => {
    const oldType = oldSection.type as string;
    const oldVariant = oldSection.variant as string;
    const newType = SECTION_TYPE_MAP[oldType] || 'hero';
    const newVariant = VARIANT_MAP[newType]?.[oldVariant] || template.sections.find((s) => s.type === newType)?.variants[0]?.id || 'hero-full';

    const variant = template.sections.find((s) => s.type === newType)?.variants.find((v) => v.id === newVariant);

    return {
      id: generateId(),
      type: newType,
      variantId: newVariant,
      config: { ...(variant?.defaultConfig ?? {}), ...(oldSection.config as Record<string, unknown> ?? {}) },
      style: {
        padding: { top: 64, right: 24, bottom: 64, left: 24, ...(oldSection.style as Record<string, unknown>)?.padding as object },
        background: ((oldSection.style as Record<string, unknown>)?.background as 'color' | 'image' | 'gradient' | 'transparent') || 'transparent',
        backgroundColor: (oldSection.style as Record<string, unknown>)?.backgroundColor as string | undefined,
        backgroundImage: (oldSection.style as Record<string, unknown>)?.backgroundImage as string | undefined,
        backgroundGradient: (oldSection.style as Record<string, unknown>)?.backgroundGradient as string | undefined,
      },
      responsive: (oldSection.responsive as Record<string, boolean>) ?? {},
    };
  });

  return {
    template_id: 'pangkas-rapi',
    header_variant_id: template.headers[0].id,
    footer_variant_id: template.footers[0].id,
    sections: newSections,
  };
}

export function isOldConfig(config: Record<string, unknown>): boolean {
  return !config.template_id && !config.header_variant_id && !config.footer_variant_id;
}
