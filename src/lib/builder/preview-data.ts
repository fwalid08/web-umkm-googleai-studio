import { applySectionAssets } from '@/lib/builder/template-assets';
import type {
  AnimationConfig,
  BehaviourConfig,
  Template,
  TemplateSectionInstance,
} from '@/lib/builder/template-types';
import type { PublicSiteDataV3 } from '@/components/website/renderer-v3';

function generateId(): string {
  return crypto.randomUUID();
}

function toSectionInstance(
  s: { type: string; variant: string; config?: Record<string, unknown> },
  template: Template,
): TemplateSectionInstance {
  const variant =
    template.sections.find((st) => st.type === s.type)?.variants.find((v) => v.id === s.variant) ??
    template.sections.find((st) => st.type === s.type)?.variants[0];
  return {
    id: generateId(),
    type: s.type,
    variantId: variant?.id ?? 'default',
    // Fill foto per-niche SAMA seperti kanvas (template-store applyTemplate)
    // supaya preview = hasil apply. Setelah gating anti-berantakan, fill ini
    // hanya mengisi key gambar yang memang ada di config.
    config: applySectionAssets(
      { ...(variant?.defaultConfig ?? {}), ...(s.config ?? {}) },
      template.category,
    ),
    style: {
      padding: { top: 64, right: 24, bottom: 64, left: 24, ...(variant?.defaultStyle?.padding ?? {}) },
      background: variant?.defaultStyle?.background ?? ('transparent' as const),
      ...(variant?.defaultStyle?.backgroundColor ? { backgroundColor: variant.defaultStyle.backgroundColor } : {}),
      ...(variant?.defaultStyle?.backgroundImage ? { backgroundImage: variant.defaultStyle.backgroundImage } : {}),
      ...(variant?.defaultStyle?.backgroundGradient ? { backgroundGradient: variant.defaultStyle.backgroundGradient } : {}),
      ...(typeof variant?.defaultStyle?.backgroundBlur === 'number' ? { backgroundBlur: variant.defaultStyle.backgroundBlur } : {}),
      ...(variant?.defaultStyle?.backgroundSize ? { backgroundSize: variant.defaultStyle.backgroundSize } : {}),
      ...(variant?.defaultStyle?.backgroundOverlay ? { backgroundOverlay: variant.defaultStyle.backgroundOverlay } : {}),
      ...(typeof variant?.defaultStyle?.backgroundOverlayOpacity === 'number'
        ? { backgroundOverlayOpacity: variant.defaultStyle.backgroundOverlayOpacity }
        : {}),
    },
    responsive: {},
  } as TemplateSectionInstance;
}

/**
 * Data situs untuk pratinjau template katalog (varian pertama tiap section,
 * config bawaan). SATU-SATUNYA konstruksi preview — dipakai halaman
 * `/preview/[id]` DAN dialog pratinjau di modal galeri, supaya keduanya
 * tidak pernah melenceng (dulu logikanya diduplikasi).
 */
export function buildPreviewSiteData(template: Template): PublicSiteDataV3 {
  return {
    template,
    headerVariantId: template.headers[0].id,
    footerVariantId: template.footers[0].id,
    sections: template.sections.flatMap((st) =>
      st.variants.slice(0, 1).map((v) =>
        toSectionInstance({ type: st.type, variant: v.id, config: v.defaultConfig }, template),
      ),
    ),
    seo: {
      title: template.name,
      description: template.description,
    },
    bottomBar: (
      template as unknown as {
        data?: {
          bottomBar?: {
            enabled?: boolean;
            items?: Array<{
              id: string;
              label: string;
              icon: string;
              url: string;
              isExternal?: boolean;
              enabled?: boolean;
              badge?: string;
            }>;
          };
        };
      }
    ).data?.bottomBar,
    animations: [] as AnimationConfig[],
    behaviours: [] as BehaviourConfig[],
  };
}
