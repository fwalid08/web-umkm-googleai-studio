"use client";

import { useEffect, useState } from "react";
import { Sparkles, Home, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS, BUILT_IN_CATALOG, type BusinessCategory } from "@/lib/builder/templates/catalog";
import { DESIGN_STYLES } from "@/lib/builder/design-styles";
import { resolveTemplateId } from "@/lib/builder/apply-template";

interface ActiveTemplateCardProps {
  websiteId: string;
  onOpenTemplateGallery: () => void;
  refreshKey?: number;
  /** template_id dari API (dipakai untuk match langsung ke katalog). */
  initialTemplateId?: string | null;
  /** design_style_id dari custom_config (fallback bila template_id tak cocok). */
  initialStyleId?: string | null;
  /** template_name dari API (category: 'services', 'food', dll) — untuk match langsung ke katalog. */
  initialTemplateCategory?: string | null;
}

type DesignStyle = (typeof DESIGN_STYLES)[number];

interface SystemTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template_data: {
    designStyleId?: string;
    sections?: any[];
    header?: any;
    footer?: any;
    theme?: any;
  };
}

function resolveTemplate(
  templateId: string | null | undefined,
  styleId: string | null | undefined,
  templateCategory?: string | null,
): { template: SystemTemplate | null; style: DesignStyle | null } {
  // Katalog statis — tanpa fetch. Urutan: id slug → kategori → style.
  const found =
    (templateId
      ? BUILT_IN_CATALOG.find((t) => t.id === resolveTemplateId(templateId))
      : undefined) ??
    (templateCategory
      ? BUILT_IN_CATALOG.find((t) => t.category === templateCategory)
      : undefined) ??
    (styleId
      ? BUILT_IN_CATALOG.find(
          (t) => (t.data.designStyleId ?? t.data.design_style_id) === styleId,
        )
      : undefined) ??
    BUILT_IN_CATALOG[0] ??
    null;
  if (!found) return { template: null, style: null };
  const style =
    DESIGN_STYLES.find(
      (s) => s.id === (found.data.designStyleId ?? found.data.design_style_id),
    ) ?? null;
  return {
    template: {
      id: found.id,
      name: found.name,
      category: found.category,
      description: found.description,
      template_data: {
        designStyleId: found.data.designStyleId ?? found.data.design_style_id,
        sections: found.data.sections,
        header: found.data.header,
        footer: found.data.footer,
        theme: found.data.paletteOverride ?? found.data.palette_override,
      },
    },
    style,
  };
}

export function ActiveTemplateCard({ websiteId, onOpenTemplateGallery, refreshKey = 0, initialTemplateId = null, initialStyleId = null, initialTemplateCategory = null }: ActiveTemplateCardProps) {
  // Data awal dipasok parent (sudah fetch saat load halaman) → tidak ada flash
  // card kuning dan tidak ada double-fetch saat mount.
  //
  // PENTING: `initialTemplateId` harus benar-benar dipakai untuk SEED state,
  // bukan hanya untuk menentukan flag `loading`. Dulu state di-hardcode `null`
  // sementara `loading` sudah `false` (karena parent punya id), jadi render
  // pertama jatuh ke branch `!currentTemplate` → kartu KUNING "Belum Ada
  // Template" muncul sesaat, lalu hilang setelah effect fetch selesai.
  // `resolveTemplate` murni (baca BUILT_IN_CATALOG, tanpa fetch) sehingga aman
  // dipanggil saat render dan gratis. Dipanggil SEKALI di sini lalu dipakai
  // untuk seed ketiga state di bawah.
  const seeded = resolveTemplate(initialTemplateId, initialStyleId, initialTemplateCategory);
  const [currentTemplate, setCurrentTemplate] = useState<SystemTemplate | null>(seeded.template);
  const [currentStyle, setCurrentStyle] = useState<DesignStyle | null>(seeded.style);
  // Skeleton hanya bila parent tidak punya data awal sama sekali.
  const [loading, setLoading] = useState(!seeded.template);

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
    // Sengaja TIDAK bergantung pada initialTemplateId/initialStyleId/
    // initialTemplateCategory: nilai itu hanya untuk seed render pertama.
    // Perubahan nyata datang lewat refreshKey (setelah template diterapkan).
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
  const tplData = currentTemplate?.template_data ?? {};

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
              <p className="text-sm text-white/80 mt-1">{CATEGORY_LABELS[currentTemplate.category as BusinessCategory]}</p>
              <Badge className="mt-3 bg-emerald-500 text-white gap-1" variant="default">
                <Check className="w-3 h-3" /> Aktif
              </Badge>
            </div>
            <div className="mt-auto flex flex-col gap-2 w-full">
              <Button
                variant="default"
                className="bg-white text-slate-900 hover:bg-white/90"
                onClick={() => window.dispatchEvent(new CustomEvent('open-page-builder'))}
              >
                <Home className="w-4 h-4 mr-2" />
                Customize
              </Button>
            </div>
          </div>
        </div>

        {/* Info & Actions */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-sm">{CATEGORY_LABELS[currentTemplate.category as BusinessCategory]}</Badge>
            <Badge variant="outline" className="text-sm">{currentStyle?.name ?? tplData.designStyleId}</Badge>
            <Badge variant="outline" className="text-sm">{tplData.sections?.length ?? 0} Section</Badge>
          </div>
          <h3 className="text-2xl font-bold mb-2">{currentTemplate.name}</h3>
          <p className="text-muted-foreground mb-6 max-w-xl">{currentTemplate.description}</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Style</p>
              <p className="font-medium">{currentStyle?.name ?? tplData.designStyleId}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Section</p>
              <p className="font-medium">{tplData.sections?.length ?? 0} section</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Header</p>
              <p className="font-medium">{tplData.header?.navItems?.length ?? 0} menu</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Footer</p>
              <p className="font-medium">{tplData.footer?.style ?? 'simple'}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}