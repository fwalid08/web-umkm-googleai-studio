'use client';

import { useTemplateStore } from '@/lib/builder/template-store';
import { PALETTE_FIELDS, COLOR_SCHEMES } from '@/lib/builder/design-styles';
import { Check, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function StyleSelector() {
  const template = useTemplateStore((s) => s.template);
  const themeOverride = useTemplateStore((s) => s.themeOverride);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ganti skema warna website Anda. Semua preset sudah lolos kontras baca WCAG AA (teks vs latar ≥ 4.5:1).
          Perubahan berlaku di semua section, navigasi, dan footer.
        </p>
      </div>

      <PaletteEditor />
    </div>
  );
}

function PaletteEditor() {
  const template = useTemplateStore((s) => s.template);
  const themeOverride = useTemplateStore((s) => s.themeOverride);
  const updateThemeOverride = useTemplateStore((s) => s.updateThemeOverride);
  const resetThemeOverride = useTemplateStore((s) => s.resetThemeOverride);

  const basePalette = template.theme.palette;
  const effective: Record<string, string> = { ...basePalette, ...themeOverride };
  const overrideCount = Object.values(themeOverride).filter(
    (v) => typeof v === 'string' && v.trim().length > 0,
  ).length;

  const setColor = (key: string, value: string) => {
    updateThemeOverride({ [key]: value });
  };

  return (
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
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetThemeOverride} title="Kembalikan ke warna bawaan template">
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
                onClick={() => updateThemeOverride({ ...scheme.palette })}
                title={`${scheme.name} — ${scheme.description}`}
                className={`w-full flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-sm'
                    : 'border-slate-200/70 dark:border-white/10 hover:border-emerald-300'
                }`}
              >
                <span className="flex -space-x-1.5 shrink-0">
                  {[scheme.palette.primary, scheme.palette.secondary, scheme.palette.accent, scheme.palette.background].map((c) => (
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
                  <span className="block text-[10px] text-muted-foreground truncate">{scheme.description}</span>
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
  );
}
