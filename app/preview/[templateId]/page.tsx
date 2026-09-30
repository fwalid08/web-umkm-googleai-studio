"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicWebsiteV3 } from "@/components/website/renderer-v3";
import { getDesignStyle } from "@/lib/builder/design-styles";
import { BUILT_IN_CATALOG } from "@/lib/builder/templates/catalog";
import { getSectionVariant } from "@/lib/builder/sections/registry";
import type { DesignStyle, Section, HeaderConfig, FooterConfig, SectionStyle } from "@/lib/builder/types";

function generateId(): string {
  return crypto.randomUUID();
}

function toSection(s: any): Section {
  const variant = getSectionVariant(s.type, s.variant);
  return {
    id: generateId(),
    type: s.type,
    variant: s.variant,
    config: { ...(variant?.defaultConfig ?? {}), ...(s.config ?? {}) },
    style: {
      padding: { top: 64, right: 24, bottom: 64, left: 24 },
      background: 'transparent' as const,
      ...(variant?.defaultStyle ?? {}),
      ...(s.style ?? {}),
    },
    responsive: {},
  };
}

export default function PreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteData, setSiteData] = useState<{
    designStyle: DesignStyle;
    paletteOverride?: Record<string, string>;
    sections: Section[];
    header: HeaderConfig;
    footer: FooterConfig;
    seo: { title: string; description: string };
  } | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      const { templateId } = await params;
      
      try {
        const template = BUILT_IN_CATALOG.find(t => `builtin-${t.id}` === templateId || t.id === templateId);
        
        if (!template) {
          setError("Template tidak ditemukan");
          return;
        }

        const designStyle = getDesignStyle(template.data.designStyleId ?? 'minimalist');
        if (!designStyle) {
          setError("Design style tidak ditemukan");
          return;
        }

        const h = template.data.header ?? {};
        const f = template.data.footer ?? {};

        setSiteData({
          designStyle,
          paletteOverride: (template.data.paletteOverride ?? template.data.palette_override ?? {}) as Record<string, string>,
          sections: (template.data.sections ?? []).map(toSection),
          header: {
            variant: (h as { variant?: string }).variant ?? "standard",
            logoUrl: h.logoUrl ?? "",
            siteTitle: h.siteTitle ?? template.name,
            tagline: h.tagline ?? "",
            navItems: h.navItems ?? [],
            ctaText: h.ctaText ?? "Hubungi Kami",
            ctaLink: h.ctaLink ?? "/kontak",
            showCta: h.showCta ?? false,
            sticky: h.sticky ?? true,
            faviconUrl: h.faviconUrl ?? "",
            seo: h.seo ?? { title: "", description: "" },
          },
          footer: {
            style: f.style ?? "simple",
            text: f.text ?? `© ${new Date().getFullYear()} ${template.name}`,
            navItems: f.navItems ?? [],
            showSocial: f.showSocial ?? false,
          },
          seo: {
            title: template.data.seo?.title ?? template.name,
            description: template.data.seo?.description ?? template.description,
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