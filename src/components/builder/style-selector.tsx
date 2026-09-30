'use client';

import { useBuilderStore } from '@/lib/builder/store';
import {
  DESIGN_STYLES,
  PALETTE_FIELDS,
  COLOR_SCHEMES,
  resolvePalette,
  validateStyleContrast,
  type PaletteOverride,
} from '@/lib/builder/design-styles';
import { Check, AlertTriangle, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function StyleSelector() {
  const designStyleId = useBuilderStore((s) => s.designStyleId);
  const setDesignStyle = useBuilderStore((s) => s.setDesignStyle);
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Pilih design style untuk website Anda. Style ini akan diterapkan ke semua section, navigasi, dan footer.
          Semua style bawaan sudah lolos kontras baca WCAG AA (teks vs latar ≥ 4.5:1).
        </p>
      </div>

      <PaletteEditor />

      <div className="grid grid-cols-1 gap-4">
        {DESIGN_STYLES.map((style) => {
          const isSelected = designStyleId === style.id;
          // Kartu aktif divalidasi dengan warna efektif (bawaan + override user)
          // sehingga masalah kontras akibat kustomisasi langsung terlihat.
          const effective = isSelected ? { ...style, palette: resolvePalette(style, paletteOverride) } : style;
          const validation = validateStyleContrast(effective);

          return (
            <button
              key={style.id}
              onClick={() => setDesignStyle(style.id)}
              className={`group relative p-5 border-2 rounded-2xl transition-all duration-300 text-left ${
                isSelected
                  ? 'border-primary bg-gradient-to-br from-primary/5 to-transparent shadow-lg scale-[1.02]'
                  : 'border-border hover:border-primary/40 hover:shadow-md'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-7 h-7 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${style.palette.primary}, ${style.palette.secondary})`,
                    borderRadius: `${style.components.borderRadius}px`,
                  }}
                >
                  {style.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold">{style.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{style.description}</p>

                  <div className="flex items-center gap-2 mt-3">
                    {[
                      style.palette.primary,
                      style.palette.secondary,
                      style.palette.accent,
                      style.palette.background,
                    ].map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border-2 shadow-md"
                        style={{ background: color, borderColor: style.palette.border }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-muted rounded-lg text-muted-foreground font-semibold">
                  {style.typography.headingFont}
                </span>
                <span className="px-2.5 py-1 bg-muted rounded-lg text-muted-foreground font-semibold">
                  {style.components.borderRadius}px radius
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold ${
                    validation.valid
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                  title={validation.valid ? 'Semua pasangan teks vs latar ≥ 4.5:1 (WCAG AA)' : validation.issues.join('\n')}
                >
                  {!validation.valid && <AlertTriangle className="w-3 h-3" />}
                  {validation.valid ? 'Kontras aman' : 'Kontras bermasalah'}
                </span>
              </div>
              {!validation.valid && (
                <ul className="mt-2 space-y-1 rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                  {validation.issues.map((issue) => (
                    <li key={issue}>• {issue}</li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Editor warna tema: ubah skema warna style aktif tanpa mengganti style.
 * Perubahan tersimpan per-website, berlaku di kanvas, preview, dan situs live.
 */
function PaletteEditor() {
  const designStyleId = useBuilderStore((s) => s.designStyleId);
  const paletteOverride = useBuilderStore((s) => s.paletteOverride);
  const updatePaletteOverride = useBuilderStore((s) => s.updatePaletteOverride);
  const resetPaletteOverride = useBuilderStore((s) => s.resetPaletteOverride);

  const style = DESIGN_STYLES.find((s) => s.id === designStyleId) ?? DESIGN_STYLES[0];
  const effective = resolvePalette(style, paletteOverride);
  const overrideCount = Object.values(paletteOverride).filter(
    (v) => typeof v === 'string' && v.trim().length > 0,
  ).length;

  const setColor = (key: keyof PaletteOverride, value: string) => {
    updatePaletteOverride({ [key]: value } as PaletteOverride);
  };

  return (
    <div className="rounded-2xl border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Warna Tema</h4>
          <p className="text-[11px] text-muted-foreground">
            Kustomisasi skema warna {style.name}
            {overrideCount > 0 && ` • ${overrideCount} diubah`}
          </p>
        </div>
        {overrideCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetPaletteOverride} title="Kembalikan ke warna bawaan style">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Bawaan
          </Button>
        )}
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-bold">🎨 Skema siap pakai (aman, lolos kontras)</p>
        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_SCHEMES.map((scheme) => {
            const active = (Object.keys(scheme.palette) as (keyof PaletteOverride)[]).every(
              (k) => effective[k] === scheme.palette[k],
            );
            return (
              <button
                key={scheme.id}
                type="button"
                onClick={() => updatePaletteOverride({ ...scheme.palette })}
                title={`${scheme.name} — ${scheme.description}`}
                className={`group rounded-xl border-2 p-1.5 transition-all hover:-translate-y-px ${
                  active
                    ? 'border-emerald-500 shadow-md'
                    : 'border-slate-200/70 dark:border-white/10 hover:border-emerald-300'
                }`}
              >
                <span className="flex -space-x-1.5 justify-center">
                  {[scheme.palette.primary, scheme.palette.secondary, scheme.palette.accent].map((c) => (
                    <span
                      key={c}
                      className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                <span className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold">
                  {active && <Check className="w-3 h-3 text-emerald-600" />}
                  {scheme.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1.5">
        {PALETTE_FIELDS.map((f) => {
          const value = effective[f.key];
          const isHex = HEX_RE.test(value);
          const overridden = typeof paletteOverride[f.key] === 'string' && (paletteOverride[f.key] as string).trim().length > 0;
          return (
            <div key={f.key} className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted/50">
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
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight flex items-center gap-1.5">
                  {f.label}
                  {overridden && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Diubah dari bawaan" />}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight">{f.hint}</p>
              </div>
              <Input
                value={value}
                onChange={(e) => setColor(f.key, e.target.value)}
                spellCheck={false}
                className="w-32 h-8 text-[11px] font-mono shrink-0"
                placeholder={style.palette[f.key]}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Tip: badge kontras pada kartu style ikut menilai warna kustom — bila merah, font berisiko tidak terbaca.
      </p>
    </div>
  );
}
