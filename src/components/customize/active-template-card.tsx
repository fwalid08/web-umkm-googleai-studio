"use client";

import { useEffect, useState } from "react";
import { Sparkles, Home, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_LABELS, BUILT_IN_CATALOG, type BusinessCategory } from "@/lib/builder/templates/catalog";
import { resolveTemplateId } from "@/lib/builder/apply-template";

interface ActiveTemplateCardProps {
  websiteId: string;
  onOpenTemplateGallery: () => void;
  refreshKey?: number;
  /** template_id dari API (dipakai untuk match langsung ke katalog). */
  initialTemplateId?: string | null;
  /** template_name dari API (category: 'services', 'food', dll) — untuk match langsung ke katalog. */
  initialTemplateCategory?: string | null;
}

interface SystemTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template_data: {
    sections?: any[];
    header?: any;
    footer?: any;
    theme?: any;
  };
}

/**
 * Katalog statis — tanpa fetch. Urutan: id slug → kategori → template
 * pertama. Concept "design style" & "design type" sudah dihapus (migrasi
 * 046), jadi warna sekarang diambil dari `theme.palette` template itu sendiri.
 */
function resolveTemplate(
  templateId: string | null | undefined,
  templateCategory?: string | null,
): SystemTemplate | null {
  const found =
    (templateId
      ? BUILT_IN_CATALOG.find((t) => t.id === resolveTemplateId(templateId))
      : undefined) ??
    (templateCategory
      ? BUILT_IN_CATALOG.find((t) => t.category === templateCategory)
      : undefined) ??
    BUILT_IN_CATALOG[0] ??
    null;
  if (!found) return null;
  return {
    id: found.id,
    name: found.name,
    category: found.category,
    description: found.description,
    template_data: {
      sections: found.data.sections,
      header: found.data.header,
      footer: found.data.footer,
      theme: found.theme.palette,
    },
  };
}

export function ActiveTemplateCard({ websiteId, onOpenTemplateGallery, refreshKey = 0, initialTemplateId = null, initialTemplateCategory = null }: ActiveTemplateCardProps) {
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
  const seeded = resolveTemplate(initialTemplateId, initialTemplateCategory);
  const [currentTemplate, setCurrentTemplate] = useState<SystemTemplate | null>(seeded);
  // Skeleton hanya bila parent tidak punya data awal sama sekali.
  const [loading, setLoading] = useState(!seeded);

  useEffect(() => {
    // Fetch ulang saat websiteId atau refreshKey berubah (template baru diterapkan).
    // Data awal dari parent sudah cukup untuk avoid double-fetch di mount.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/websites/${websiteId}/website`);
        const json = await res.json();
        if (cancelled || !json?.success) return;
        setCurrentTemplate(
          resolveTemplate(
            json.data?.template_id ?? null,
            json.data?.template_name ?? null,
          ),
        );
      } catch {
        // biarkan state sebelumnya (jangan tampilkan empty-state palsu)
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Sengaja TIDAK bergantung pada initialTemplateId/initialTemplateCategory:
    // nilai itu hanya untuk seed render pertama. Perubahan nyata datang lewat
    // refreshKey (setelah template diterapkan).
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

  const tplData = currentTemplate?.template_data ?? {};
  // Warna thumbnail sekarang dari palet template itu sendiri — katalog
  // Palet warna template (primary, secondary, accent, background, surface,
  // text, textMuted, border) — ditampilkan sebagai swatch di field "Palet".
  // Hanya entri string hex valid yang dipakai; sisanya disaring agar tidak
  // ada swatch rusak bila data theme tidak lengkap.
  const themePalette = (tplData.theme ?? {}) as Record<string, unknown>;
  // Fallback gradien kartu bila theme tidak lengkap (data fetch gagal).
  const fallbackPrimary = typeof themePalette.primary === "string" ? themePalette.primary : "#15803D";
  const fallbackSecondary = typeof themePalette.secondary === "string" ? themePalette.secondary : "#0d9488";
  const paletteEntries: Array<readonly [string, unknown]> = [
    ["Primer", themePalette.primary],
    ["Sekunder", themePalette.secondary],
    ["Aksen", themePalette.accent],
    ["Latar", themePalette.background],
    ["Permukaan", themePalette.surface],
    ["Teks", themePalette.text],
  ];
  const paletteSwatches: Array<{ label: string; hex: string }> = [];
  for (const [label, value] of paletteEntries) {
    if (typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value)) {
      paletteSwatches.push({ label, hex: value });
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        {/* Kolom kiri: tingginya mengikuti konten kolom kanan (stretch).
            Thumbnail flex-1 mengisi sisa ruang di atas baris nama+tombol. */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-border lg:self-stretch">
          {/* Row atas: thumbnail — min-h hanya untuk susunan vertikal (mobile);
              di lg min-h-0 agar tinggi murni mengikuti konten kanan. */}
          <div className="relative flex-1 min-h-64 sm:min-h-80 lg:min-h-0 overflow-hidden">
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${fallbackPrimary}, ${fallbackSecondary})`
            }} />
            {currentTemplate && (
              <img
                src={`/thumbnails/${currentTemplate.id}.jpg`}
                alt={`Pratinjau ${currentTemplate.name}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-top"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <Badge className="absolute top-2 right-2 bg-emerald-500 text-white gap-1" variant="default">
              <Check className="w-3 h-3" /> Aktif
            </Badge>
          </div>
          {/* Row bawah: nama + tombol rata bawah & tengah */}
          <div className="p-4 bg-card text-center flex flex-col items-center shrink-0">
            <p className="font-semibold text-base leading-tight">{currentTemplate.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{CATEGORY_LABELS[currentTemplate.category as BusinessCategory]}</p>
            <Button
              className="mt-3 w-full"
              onClick={() => window.dispatchEvent(new CustomEvent('open-page-builder'))}
            >
              <Home className="w-4 h-4 mr-2" />
              Customize
            </Button>
          </div>
        </div>

        {/* Info & Actions */}
        <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-sm">{CATEGORY_LABELS[currentTemplate.category as BusinessCategory]}</Badge>
            <Badge variant="outline" className="text-sm uppercase">{fallbackPrimary}</Badge>
            <Badge variant="outline" className="text-sm">{tplData.sections?.length ?? 0} Section</Badge>
          </div>
          <h3 className="text-2xl font-bold mb-2">{currentTemplate.name}</h3>
          <p className="text-muted-foreground mb-6 max-w-xl">{currentTemplate.description}</p>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-2">Skema warna</p>
              {paletteSwatches.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {paletteSwatches.map(({ label, hex }) => (
                    <span
                      key={label}
                      title={`${label}: ${hex}`}
                      aria-label={`${label}: ${hex}`}
                      className="w-7 h-7 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Palet tidak tersedia</p>
              )}
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