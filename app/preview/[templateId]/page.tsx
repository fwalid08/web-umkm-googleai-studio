"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicWebsiteV3 } from "@/components/website/renderer-v3";
import { BUILTIN_TEMPLATES } from "@/lib/builder/template-store";
import type { Template, TemplateSectionInstance } from "@/lib/builder/template-types";

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
    config: { ...(variant?.defaultConfig ?? {}), ...(s.config ?? {}) },
    style: {
      padding: { top: 64, right: 24, bottom: 64, left: 24 },
      background: 'transparent' as const,
      ...(variant?.defaultStyle?.padding ? { padding: { top: 64, right: 24, bottom: 64, left: 24, ...variant.defaultStyle.padding } } : {}),
      ...(variant?.defaultStyle?.background ? { background: variant.defaultStyle.background } : {}),
      ...(variant?.defaultStyle?.backgroundColor ? { backgroundColor: variant.defaultStyle.backgroundColor } : {}),
      ...(variant?.defaultStyle?.backgroundImage ? { backgroundImage: variant.defaultStyle.backgroundImage } : {}),
      ...(variant?.defaultStyle?.backgroundGradient ? { backgroundGradient: variant.defaultStyle.backgroundGradient } : {}),
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
  } | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      const { templateId } = await params;

      try {
        const template = BUILTIN_TEMPLATES.find(t => `builtin-${t.id}` === templateId || t.id === templateId);

        if (!template) {
          setError("Template tidak ditemukan");
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

  return <PublicWebsiteV3 site={siteData} />;
}
