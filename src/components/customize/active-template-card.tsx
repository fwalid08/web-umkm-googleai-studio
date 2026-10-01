"use client";

import { useEffect, useState } from "react";
import { Sparkles, Home, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BUILT_IN_CATALOG, CATEGORY_LABELS } from "@/lib/builder/templates/catalog";
import { DESIGN_STYLES } from "@/lib/builder/design-styles";

interface ActiveTemplateCardProps {
  websiteId: string;
  homepagePageId: string | null;
  onOpenTemplateGallery: () => void;
  refreshKey?: number;
  /** template_id dari API (dipakai untuk match langsung ke katalog). */
  initialTemplateId?: string | null;
  /** design_style_id dari custom_config (fallback bila template_id tak cocok). */
  initialStyleId?: string | null;
  /** template_name dari API (category: 'services', 'food', dll) — untuk match langsung ke katalog. */
  initialTemplateCategory?: string | null;
}

type CatalogTemplate = (typeof BUILT_IN_CATALOG)[number];
type DesignStyle = (typeof DESIGN_STYLES)[number];

/**
 * Resolusi berlapis:
 * 1. cocok langsung id katalog (slug, mis. 'pangkas-rapi') — akurat untuk template builtin;
 * 2. cocok via template_category (dari API response template_name) — unik per template;
 * 3. fallback design_style_id — untuk config lama yang hanya menyimpan style
 *    (template_id dari API adalah UUID tabel DB, bukan slug katalog).
 */
function resolveTemplate(
  templateId: string | null | undefined,
  styleId: string | null | undefined,
  templateCategory?: string | null,
): { template: CatalogTemplate | null; style: DesignStyle | null } {
  if (templateId) {
    const byId = BUILT_IN_CATALOG.find((t) => t.id === templateId);
    if (byId) {
      const style =
        DESIGN_STYLES.find((s) => s.id === byId.data?.designStyleId) ??
        (styleId ? DESIGN_STYLES.find((s) => s.id === styleId) ?? null : null);
      return { template: byId, style };
    }
  }
  if (templateCategory) {
    const byCategory = BUILT_IN_CATALOG.find((t) => t.category === templateCategory);
    if (byCategory) {
      const style =
        DESIGN_STYLES.find((s) => s.id === byCategory.data?.designStyleId) ??
        (styleId ? DESIGN_STYLES.find((s) => s.id === styleId) ?? null : null);
      return { template: byCategory, style };
    }
  }
  if (styleId) {
    const byStyle = BUILT_IN_CATALOG.find((t) => t.data?.designStyleId === styleId);
    if (byStyle) {
      return {
        template: byStyle,
        style: DESIGN_STYLES.find((s) => s.id === styleId) ?? null,
      };
    }
    return {
      template: null,
      style: DESIGN_STYLES.find((s) => s.id === styleId) ?? null,
    };
  }
  return { template: null, style: null };
}

export function ActiveTemplateCard({ websiteId, homepagePageId, onOpenTemplateGallery, refreshKey = 0, initialTemplateId = null, initialStyleId = null, initialTemplateCategory = null }: ActiveTemplateCardProps) {
  // Data awal dipasok parent (sudah fetch saat load halaman) → tidak ada flash
  // card kuning dan tidak ada double-fetch saat mount.
  const [currentTemplate, setCurrentTemplate] = useState<CatalogTemplate | null>(
    () => resolveTemplate(initialTemplateId, initialStyleId, initialTemplateCategory).template,
  );
  const [currentStyle, setCurrentStyle] = useState<DesignStyle | null>(
    () => resolveTemplate(initialTemplateId, initialStyleId, initialTemplateCategory).style,
  );
  // Skeleton hanya bila parent tidak punya data awal sama sekali.
  const [loading, setLoading] = useState(() => !initialTemplateId && !initialStyleId);

  useEffect(() => {
    // Fetch ulang saat websiteId atau refreshKey berubah (template baru diterapkan).
    // Data awal dari parent sudah cukup untuk avoid double-fetch di mount.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/websites/${websiteId}/website`);
        const json = await res.json();
        if (cancelled || !json?.success) return;
        const resolved = resolveTemplate(
          json.data?.template_id ?? null,
          json.data?.custom_config?.design_style_id ?? null,
          json.data?.template_name ?? null,
        );
        setCurrentTemplate(resolved.template);
        setCurrentStyle(resolved.style);
      } catch {
        // biarkan state sebelumnya (jangan tampilkan empty-state palsu)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // initialTemplateId/initialStyleId sengaja hanya dipakai saat mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId, refreshKey]);

  if (loading) {
    return (
      <Card className="overflow-hidden" aria-label="Memuat template aktif">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-72 flex-shrink-0 p-6 flex flex-col items-center justify-center gap-3 bg-muted/40 min-h-[240px]">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex-1 p-6 lg:p-8 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-2/3 max-w-xl" />
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!currentTemplate) {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="relative lg:w-72 flex-shrink-0 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500">
            <div className="relative p-6 min-h-[240px] flex flex-col items-center justify-center text-center">
              <Sparkles className="w-16 h-16 text-amber-100 mb-4" />
              <h3 className="font-semibold text-xl text-white">Belum Ada Template</h3>
              <p className="text-sm text-amber-100 mt-1 px-4">Pilih template untuk memulai</p>
            </div>
          </div>
          <div className="flex-1 p-6 lg:p-8 flex flex-col items-center justify-center text-center">
            <div className="py-8 max-w-md">
              <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Belum ada template aktif</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pilih template untuk memulai desain website Anda. Template mengatur style, warna, font, navigasi, footer, dan layout homepage.
              </p>
              <Button className="mt-4" onClick={onOpenTemplateGallery}>
                <Sparkles className="w-4 h-4 mr-2" />
                Pilih Template
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const styleColors = currentStyle?.palette ?? { primary: "#15803D", secondary: "#0d9488" };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Thumbnail / Visual Card */}
        <div className="relative lg:w-72 flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${styleColors.primary}, ${styleColors.secondary})`
          }} />
          <div className="relative p-6 h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-3xl border border-white/30">
              {currentTemplate.name.charAt(0)}
            </div>
            <div className="mt-4 text-center text-white">
              <p className="font-semibold text-lg">{currentTemplate.name}</p>
              <p className="text-sm text-white/80 mt-1">{CATEGORY_LABELS[currentTemplate.category]}</p>
              <Badge className="mt-3 bg-emerald-500 text-white gap-1" variant="default">
                <Check className="w-3 h-3" /> Aktif
              </Badge>
            </div>
            <div className="mt-auto flex flex-col gap-2 w-full">
              <Button
                variant="default"
                className="bg-white text-slate-900 hover:bg-white/90"
                onClick={() => homepagePageId && window.dispatchEvent(new CustomEvent('open-page-builder', { detail: { pageId: homepagePageId } }))}
                disabled={!homepagePageId}
              >
                <Home className="w-4 h-4 mr-2" />
                Customize Homepage
              </Button>
              <Button
                variant="default"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm"
                onClick={onOpenTemplateGallery}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ganti Template
              </Button>
            </div>
          </div>
        </div>

        {/* Info & Actions */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-sm">{CATEGORY_LABELS[currentTemplate.category]}</Badge>
            <Badge variant="outline" className="text-sm">{currentStyle?.name ?? currentTemplate.data?.designStyleId}</Badge>
            <Badge variant="outline" className="text-sm">{(currentTemplate.data?.sections ?? []).length} Section</Badge>
          </div>
          <h3 className="text-2xl font-bold mb-2">{currentTemplate.name}</h3>
          <p className="text-muted-foreground mb-6 max-w-xl">{currentTemplate.description}</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Style</p>
              <p className="font-medium">{currentStyle?.name ?? currentTemplate.data?.designStyleId}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Section</p>
              <p className="font-medium">{(currentTemplate.data?.sections ?? []).length} section</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Header</p>
              <p className="font-medium">{(currentTemplate.data?.header?.navItems?.length ?? 0)} menu</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Footer</p>
              <p className="font-medium">{currentTemplate.data?.footer?.style ?? 'simple'}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
