'use client';

import { useState } from 'react';
import { useTemplateStore } from '@/lib/builder/template-store';
import { useBuilderStore } from '@/lib/builder/store';
import { PALETTE_FIELDS } from '@/lib/builder/design-styles';
import { COLOR_SCHEMES } from '@/lib/builder/color-schemes';
import { FONT_CATEGORIES } from '@/lib/builder/font-categories';
import { Check, RotateCcw, Type, Palette, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const HEX_RE = /^#[0-9a-f]{6}$/i;

/**
 * Sentinel untuk opsi "Bawaan template". Radix Select memperlakukan
 * `value=""` sebagai keadaan placeholder (bukan pilihan aktif), sehingga
 * label "Bawaan template (X)" tidak akan tampil. Nilai balik ke store
 * tetap string kosong.
 */
const DEFAULT_FONT = '__default__';

export function StyleSelector() {
  // Tab warna: preset siap pakai vs kustom. Nilai di-steer otomatis —
  // pilih preset → loncat ke tab "Siap pakai", ubah warna manual → "Kustom".
  const [colorTab, setColorTab] = useState<'preset' | 'custom'>('preset');
  const template = useTemplateStore((s) => s.template);
  const themeOverride = useTemplateStore((s) => s.themeOverride);
  const updateThemeOverride = useTemplateStore((s) => s.updateThemeOverride);
  const resetThemeOverride = useTemplateStore((s) => s.resetThemeOverride);
  const builderUpdatePaletteOverride = useBuilderStore((s) => s.updatePaletteOverride);
  const builderResetPaletteOverride = useBuilderStore((s) => s.resetPaletteOverride);
  const typographyOverride = useBuilderStore((s) => s.typographyOverride);
  const updateTypographyOverride = useBuilderStore((s) => s.updateTypographyOverride);
  const resetTypographyOverride = useBuilderStore((s) => s.resetTypographyOverride);

  const effHeadingFont = typographyOverride.headingFont || template.theme.typography.headingFont;
  const effBodyFont = typographyOverride.bodyFont || template.theme.typography.bodyFont;
  const effAccentFont = typographyOverride.accentFont || template.theme.typography.accentFont || template.theme.typography.headingFont;
  const fontOverrideCount = [typographyOverride.headingFont, typographyOverride.bodyFont, typographyOverride.accentFont].filter(
    (v) => typeof v === 'string' && v.trim().length > 0,
  ).length;

  const basePalette = template.theme.palette;
  const effective: Record<string, string> = { ...basePalette, ...themeOverride };
  const overrideCount = Object.values(themeOverride).filter(
    (v) => typeof v === 'string' && v.trim().length > 0,
  ).length;

  const setColor = (key: string, value: string) => {
    updateThemeOverride({ [key]: value });
    builderUpdatePaletteOverride({ [key]: value });
    // Warna yang diubah manual = definisi "kustom", bukan hasil preset.
    setColorTab('custom');
  };

  const applyScheme = (palette: Record<string, string>) => {
    updateThemeOverride({ ...palette });
    builderUpdatePaletteOverride({ ...palette });
    setColorTab('preset');
  };

  const resetAll = () => {
    resetThemeOverride();
    builderResetPaletteOverride();
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ganti skema warna website Anda. Semua preset sudah lolos kontras baca WCAG AA (teks vs latar ≥ 4.5:1).
          Perubahan berlaku di semua section, navigasi, dan footer.
        </p>
      </div>

      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Palette className="w-4 h-4" />
              Warna Tema
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Kustomisasi skema warna {template.name}
              {overrideCount > 0 && ` • ${overrideCount} diubah`}
            </p>
          </div>
          {overrideCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetAll} title="Kembalikan ke warna bawaan template">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Bawaan
            </Button>
          )}
        </div>

        <Tabs value={colorTab} onValueChange={(v) => setColorTab(v as 'preset' | 'custom')}>
          <TabsList className="w-full h-9">
            <TabsTrigger value="preset" className="flex-1 gap-1.5 text-xs">
              <Check className="w-3.5 h-3.5" />
              Siap pakai
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 gap-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Kustom
              {overrideCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold leading-none">
                  {overrideCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-2">
            <p className="text-xs font-bold">Skema siap pakai (aman, lolos kontras)</p>
            <div className="space-y-1.5">
              {COLOR_SCHEMES.map((scheme) => {
                const active = (Object.keys(scheme.palette) as string[]).every(
                  (k) => effective[k] === scheme.palette[k as keyof typeof scheme.palette],
                );
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => applyScheme(scheme.palette)}
                    title={`${scheme.name} — skema ${scheme.category === 'dark' ? 'gelap' : 'terang'}`}
                    className={`w-full flex items-center gap-3 rounded-lg border-2 px-2.5 py-1.5 text-[13px] transition-all ${
                      active
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-sm'
                        : 'border-slate-200/70 dark:border-white/10 hover:border-emerald-300'
                    }`}
                  >
                    <span className="flex -space-x-1.5 shrink-0">
                      {[scheme.palette.primary, scheme.palette.accent, scheme.palette.surface, scheme.palette.background].map((c) => (
                        <span
                          key={c}
                          className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                          style={{ background: c }}
                        />
                      ))}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        {scheme.name}
                      </span>
                      <span className="block text-[10px] text-muted-foreground truncate">
                        Skema {scheme.category === 'dark' ? 'gelap' : 'terang'} • lolos kontras WCAG AA
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="space-y-3">
            <div className="space-y-1.5">
              {PALETTE_FIELDS.map((f) => {
                const value = effective[f.key];
                const isHex = HEX_RE.test(value);
                const overridden = typeof themeOverride[f.key] === 'string' && (themeOverride[f.key] as string).trim().length > 0;
                return (
                  <div key={f.key} className="space-y-1.5 rounded-lg px-1 py-1">
                    <p className="text-xs font-medium leading-tight flex items-center gap-1.5">
                      {f.label}
                      {overridden && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Diubah dari bawaan" />}
                    </p>
                    <div className="flex items-center gap-2">
                      {isHex ? (
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => setColor(f.key, e.target.value)}
                          title={`${f.label} — klik untuk ubah`}
                          className="w-8 h-8 rounded-lg border cursor-pointer shrink-0 bg-transparent p-0.5"
                        />
                      ) : (
                        <span
                          title="Warna non-hex (gradient/transparan) — tulis manual"
                          className="w-9 h-9 rounded-lg border shrink-0 border-dashed"
                          style={{ background: value }}
                        />
                      )}
                      <Input
                        value={value}
                        onChange={(e) => setColor(f.key, e.target.value)}
                        spellCheck={false}
                        className="flex-1 h-8 text-[11px] font-mono"
                        placeholder={basePalette[f.key]}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{f.hint}</p>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Tip: badge kontras pada kartu style ikut menilai warna kustom — bila merah, font berisiko tidak terbaca.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* ============ Card terpisah: Font ============ */}
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Type className="w-4 h-4" />
              Font (Google Fonts)
              {fontOverrideCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold leading-none">
                  {fontOverrideCount}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {fontOverrideCount > 0
                ? `${fontOverrideCount} diubah dari bawaan template`
                : `Mengikuti bawaan template ${template.name}`}
            </p>
          </div>
          {fontOverrideCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetTypographyOverride} title="Kembalikan ke font bawaan template">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Bawaan
            </Button>
          )}
        </div>
        {(
          [
            { key: 'headingFont' as const, label: 'Judul (heading)', current: effHeadingFont },
            { key: 'bodyFont' as const, label: 'Isi (body)', current: effBodyFont },
            { key: 'accentFont' as const, label: 'Aksen script (eyebrow)', current: effAccentFont },
          ]
        ).map((row) => (
          <div key={row.key} className="space-y-1">
            <label className="block text-[11px] font-medium text-muted-foreground">
              {row.label} •{' '}
              <span className="font-semibold text-foreground" style={{ fontFamily: `'${row.current}', sans-serif` }}>
                {row.current}
              </span>
            </label>
            <Select
              value={typographyOverride[row.key] ?? DEFAULT_FONT}
              onValueChange={(value) =>
                updateTypographyOverride({ [row.key]: value === DEFAULT_FONT ? '' : value })
              }
            >
              <SelectTrigger className="h-8 text-[12px] rounded-lg bg-slate-50 dark:bg-slate-900 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_FONT} className="text-xs">
                  Bawaan template ({row.current})
                </SelectItem>
                {FONT_CATEGORIES.map((cat) => (
                  <SelectGroup key={cat.id}>
                    <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {cat.name}
                    </SelectLabel>
                    {cat.fonts.map((f) => (
                      <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: `'${f}', sans-serif` }}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Font berlaku di kanvas dan website live setelah Simpan.
        </p>
      </div>
    </div>
  );
}

