'use client';

import { useTemplateStore } from '@/lib/builder/template-store';
import { useBuilderStore } from '@/lib/builder/store';
import { PALETTE_FIELDS } from '@/lib/builder/design-styles';
import { COLOR_SCHEMES } from '@/lib/builder/color-schemes';
import { FONT_CATEGORIES } from '@/lib/builder/font-categories';
import { Check, RotateCcw, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function StyleSelector() {
  const template = useTemplateStore((s) => s.template);
  const themeOverride = useTemplateStore((s) => s.themeOverride);
  const updateThemeOverride = useTemplateStore((s) => s.updateThemeOverride);
  const resetThemeOverride = useTemplateStore((s) => s.resetThemeOverride);
  const builderPaletteOverride = useBuilderStore((s) => s.paletteOverride);
  const builderUpdatePaletteOverride = useBuilderStore((s) => s.updatePaletteOverride);
  const builderResetPaletteOverride = useBuilderStore((s) => s.resetPaletteOverride);
  const typographyOverride = useBuilderStore((s) => s.typographyOverride);
  const updateTypographyOverride = useBuilderStore((s) => s.updateTypographyOverride);
  const resetTypographyOverride = useBuilderStore((s) => s.resetTypographyOverride);

  const effHeadingFont = typographyOverride.headingFont || template.theme.typography.headingFont;
  const effBodyFont = typographyOverride.bodyFont || template.theme.typography.bodyFont;
  const fontOverrideCount = [typographyOverride.headingFont, typographyOverride.bodyFont].filter(
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
            <h4 className="text-sm font-semibold">Warna Tema</h4>
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
        <div className="space-y-1.5">
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
                  onClick={() => {
                    updateThemeOverride({ ...scheme.palette });
                    builderUpdatePaletteOverride({ ...scheme.palette });
                  }}
                  title={`${scheme.name} — skema ${scheme.category === 'dark' ? 'gelap' : 'terang'}`}
                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition-all ${
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
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              Font (Google Fonts)
              {fontOverrideCount > 0 && ` • ${fontOverrideCount} diubah`}
            </p>
            {fontOverrideCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2" onClick={resetTypographyOverride} title="Kembalikan ke font bawaan template">
                <RotateCcw className="w-3 h-3 mr-1" />
                Bawaan
              </Button>
            )}
          </div>
          {(
            [
              { key: 'headingFont' as const, label: 'Judul (heading)', current: effHeadingFont },
              { key: 'bodyFont' as const, label: 'Isi (body)', current: effBodyFont },
            ]
          ).map((row) => (
            <label key={row.key} className="block space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">
                {row.label} • <span style={{ fontFamily: `'${row.current}', sans-serif` }}>{row.current}</span>
              </span>
              <select
                value={typographyOverride[row.key] ?? ''}
                onChange={(e) => updateTypographyOverride({ [row.key]: e.target.value })}
                className="w-full h-9 rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
              >
                <option value="">Bawaan template ({row.current})</option>
                {FONT_CATEGORIES.map((cat) => (
                  <optgroup key={cat.id} label={cat.name}>
                    {cat.fonts.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          ))}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Font berlaku di kanvas dan website live setelah Simpan.
          </p>
        </div>
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
                      className="w-9 h-9 rounded-lg border cursor-pointer shrink-0 bg-transparent p-0.5"
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
      </div>
    </div>
  );
}
