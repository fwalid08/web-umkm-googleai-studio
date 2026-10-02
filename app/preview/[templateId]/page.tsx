"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicWebsiteV3 } from "@/components/website/renderer-v3";
import { BUILTIN_TEMPLATES } from "@/lib/builder/template-store";
import {
  buildLibraryTemplate,
  pickLibraryFooterVariant,
  pickLibraryHeaderVariant,
} from "@/lib/builder/library-template";
import { applySectionAssets } from "@/lib/builder/template-assets";
import type {
  Template,
  TemplateSectionInstance,
  AnimationConfig,
  BehaviourConfig,
} from "@/lib/builder/template-types";

function generateId(): string {
  return crypto.randomUUID();
}

function toSection(s: any, template: Template): TemplateSectionInstance {
  const variant = template.sections.find((st) => st.type === s.type)?.variants.find((v) => v.id === s.variant)
    ?? template.sections.find((st) => st.type === s.type)?.variants[0];
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
  };
}

export default function PreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteData, setSiteData] = useState<{
    template: Template;
    headerVariantId: string;
    footerVariantId: string;
    sections: TemplateSectionInstance[];
    seo: { title: string; description: string };
    themeOverride?: Record<string, string>;
    headerConfig?: Record<string, unknown>;
    footerConfig?: Record<string, unknown>;
    animations?: AnimationConfig[];
    behaviours?: BehaviourConfig[];
    customCss?: string;
  } | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      const { templateId } = await params;

      try {
        const template = BUILTIN_TEMPLATES.find(t => `builtin-${t.id}` === templateId || t.id === templateId);

        if (!template) {
          // Bukan template bawaan → coba template library milik user (hasil
          // import ZIP). Tanpa fallback ini, pratinjau template library selalu
          // "Template tidak ditemukan" walau templatenya tersimpan benar.
          const res = await fetch(`/api/templates/library/${templateId}`);
          const json = (await res.json().catch(() => null)) as
            | { success?: boolean; data?: Record<string, unknown> }
            | null;

          if (!res.ok || !json?.success || !json.data) {
            setError("Template tidak ditemukan");
            return;
          }

          const row = json.data;
          const td = (row.template_data ?? {}) as Record<string, unknown>;
          const seed = (td.data ?? td) as Record<string, unknown>;
          const headerCfg = (seed.header ?? {}) as Record<string, unknown>;
          const footerCfg = (seed.footer ?? {}) as Record<string, unknown>;
          const paletteOverride = (seed.paletteOverride ?? seed.palette_override ?? {}) as Record<string, string>;
          const rawSections = Array.isArray(seed.sections) ? (seed.sections as Record<string, unknown>[]) : [];

          // Template library ADALAH sumber kebenaran untuk dirinya sendiri:
          // theme utuh (palet+tipografi+komponen+efek), katalog headers /
          // footers / sections, activeSections, customCss, dan aset dibaca
          // dari template_data hasil import. Blueprint bawaan hanya fallback
          // per-bagian bila kunci hilang (lihat library-template.ts).
          let library: ReturnType<typeof buildLibraryTemplate>;
          try {
            library = buildLibraryTemplate(td, {
              id: String(row.id),
              name: String(row.name ?? 'Template'),
              description: String(row.description ?? ''),
            });
          } catch {
            setError("Template tidak valid");
            return;
          }
          const headerVariant = pickLibraryHeaderVariant(
            library,
            (headerCfg.variant as string | undefined) ?? 'standard',
          );
          const footerVariant = pickLibraryFooterVariant(
            library,
            ((footerCfg.variant ?? footerCfg.style) as string | undefined) ?? 'simple',
          );
          const customCss =
            (typeof td.customCss === 'string' && td.customCss) ||
            (typeof seed.customCss === 'string' ? seed.customCss : '');

          setSiteData({
            template: library,
            headerVariantId: headerVariant.id,
            footerVariantId: footerVariant.id,
            sections: rawSections
              .map(s => toSection(s, library))
              .filter(Boolean),
            seo: {
              title: String((seed.seo as Record<string, unknown>)?.title ?? row.name ?? 'Template'),
              description: String((seed.seo as Record<string, unknown>)?.description ?? ''),
            },
            themeOverride: paletteOverride,
            headerConfig: headerCfg,
            footerConfig: footerCfg,
            animations: (Array.isArray(row.animations) ? row.animations : undefined) as AnimationConfig[] | undefined,
            behaviours: (Array.isArray(row.behaviours) ? row.behaviours : undefined) as BehaviourConfig[] | undefined,
            ...(customCss ? { customCss } : {}),
          });
          return;
        }

        setSiteData({
          template,
          headerVariantId: template.headers[0].id,
          footerVariantId: template.footers[0].id,
          sections: (template.sections.flatMap((st) => st.variants.slice(0, 1).map((v) => ({
            type: st.type,
            variant: v.id,
            config: v.defaultConfig,
          })))).map((s) => toSection(s, template)),
          seo: {
            title: template.name,
            description: template.description,
          },
        });
      } catch (err) {
        setError("Gagal memuat template");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4 text-center">
        <div className="max-w-md">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Pratinjau Tidak Tersedia</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button className="mt-6" onClick={() => window.close()}>
            Tutup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="tpl-canvas">
      <PublicWebsiteV3 site={siteData} />
    </div>
  );
}
