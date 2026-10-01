'use client';

import { useTemplateStore, getSectionVariant } from '@/lib/builder/template-store';
import { ConfigForm } from '@/lib/builder/config-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { TemplateSectionInstance } from '@/lib/builder/template-types';

const UMKM_SWATCHES = ['#ffffff', '#f8fafc', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#ffedd5', '#111827'];

export function SectionConfig({ section }: { section: TemplateSectionInstance }) {
  const [copied, setCopied] = useState(false);
  const template = useTemplateStore((s) => s.template);
  const updateSection = useTemplateStore((s) => s.updateSection);
  const setSectionVariant = useTemplateStore((s) => s.setSectionVariant);
  const updateSectionConfig = useTemplateStore((s) => s.updateSectionConfig);
  const updateSectionStyle = useTemplateStore((s) => s.updateSectionStyle);
  const deleteSection = useTemplateStore((s) => s.deleteSection);
  const duplicateSection = useTemplateStore((s) => s.duplicateSection);

  const sectionType = template.sections.find((s) => s.type === section.type);
  const variant = getSectionVariant(template, section.type, section.variantId);

  const handleConfigChange = (key: string, value: unknown) => {
    updateSectionConfig(section.id, { [key]: value });
  };

  const handleStyleChange = (key: string, value: unknown) => {
    updateSectionStyle(section.id, { [key]: value });
  };

  if (!sectionType || !variant) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Section tidak ditemukan di template ini</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-white/[0.04] dark:to-transparent dark:border-white/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Jenis blok</Label>
            <div className="h-9 flex items-center px-3 rounded-xl bg-white/80 dark:bg-slate-900 text-[13px] font-bold">
              {sectionType.name}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Section ID</Label>
            <div className="flex items-center gap-1.5">
              <div
                className="flex-1 h-9 flex items-center px-3 rounded-xl bg-white/80 dark:bg-slate-900 text-[11px] font-mono text-muted-foreground truncate"
                title={section.id}
              >
                {section.id}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl shrink-0"
                title={copied ? 'ID tersalin!' : 'Salin Section ID'}
                onClick={() => {
                  try {
                    const done = navigator.clipboard?.writeText(section.id);
                    if (done) {
                      void done
                        .then(() => {
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1200);
                        })
                        .catch(() => undefined);
                    }
                  } catch {
                    // Clipboard tak tersedia — abaikan.
                  }
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Dipakai untuk link anchor (mis. <span className="font-mono">#beranda</span> via anchorId) dan debugging.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Gaya tampilan</Label>
            <Select
              value={section.variantId}
              onValueChange={(value) => setSectionVariant(section.id, value)}
            >
              <SelectTrigger className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-900 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectionType.variants.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variant && (
              <p className="text-xs text-muted-foreground leading-relaxed bg-white/60 dark:bg-slate-900/60 rounded-lg p-2">
                {variant.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white dark:bg-white/[0.03] dark:border-white/[0.06] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] space-y-3">
        <h4 className="text-sm font-extrabold flex items-center gap-1.5">Isi teks & gambar</h4>
        <ConfigForm fields={variant.configFields} config={section.config} onChange={handleConfigChange} />
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white dark:bg-white/[0.03] dark:border-white/[0.06] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] space-y-4">
        <h4 className="text-sm font-extrabold flex items-center gap-1.5">Gaya blok</h4>
        <div className="space-y-2">
          <Label className="text-xs font-bold">Latar blok</Label>
          <Select
            value={section.style.background}
            onValueChange={(value) => handleStyleChange('background', value)}
          >
            <SelectTrigger className="h-9 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-900 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent" className="text-xs">Transparan (ikut template)</SelectItem>
              <SelectItem value="color" className="text-xs">Warna sendiri</SelectItem>
              <SelectItem value="image" className="text-xs">Gambar</SelectItem>
              <SelectItem value="gradient" className="text-xs">Gradasi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {section.style.background === 'color' && (
          <div className="space-y-2">
            <Label className="text-xs font-bold">Warna latar</Label>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ikut tema</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'theme:primary', label: 'Primer', color: template.theme.palette.primary },
                  { key: 'theme:secondary', label: 'Sekunder', color: template.theme.palette.secondary },
                  { key: 'theme:accent', label: 'Aksen', color: template.theme.palette.accent },
                  { key: 'theme:background', label: 'Latar', color: template.theme.palette.background },
                  { key: 'theme:surface', label: 'Permukaan', color: template.theme.palette.surface },
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleStyleChange('backgroundColor', t.key)}
                    title={`${t.label} — ikut skema warna template`}
                    className={`w-8 h-8 rounded-xl border-2 shadow-sm transition-transform hover:scale-110 ${
                      section.style.backgroundColor === t.key
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-white dark:border-slate-700'
                    }`}
                    style={{ background: t.color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Warna kustom</p>
              <div className="flex flex-wrap gap-1.5">
                {UMKM_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleStyleChange('backgroundColor', c)}
                    title={c}
                    className={`w-8 h-8 rounded-xl border-2 shadow-sm transition-transform hover:scale-110 ${
                      (section.style.backgroundColor || '#ffffff').toLowerCase() === c.toLowerCase()
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-white dark:border-slate-700'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={section.style.backgroundColor?.startsWith('theme:') ? template.theme.palette.primary : (section.style.backgroundColor || '#ffffff')}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded-xl border cursor-pointer bg-white p-1"
                />
                <div className="flex-1">
                  <Input
                    value={section.style.backgroundColor?.startsWith('theme:') ? '' : (section.style.backgroundColor || '#ffffff')}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="h-9 text-xs rounded-xl font-mono"
                    placeholder="#ffffff atau theme:primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {section.style.background === 'image' && (
          <div className="space-y-3">
            <Label className="text-xs font-bold">Gambar latar</Label>
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">URL Gambar</p>
                <Input
                  value={section.style.backgroundImage || ''}
                  onChange={(e) => handleStyleChange('backgroundImage', e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-xs rounded-xl"
                />
                {section.style.backgroundImage && (
                  <div className="rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={section.style.backgroundImage} alt="Background" className="w-full h-24 object-cover" loading="lazy" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tingkat blur</p>
                <Select
                  value={String(section.style.backgroundBlur || 0)}
                  onValueChange={(value) => handleStyleChange('backgroundBlur', Number(value))}
                >
                  <SelectTrigger className="h-9 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-900 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" className="text-xs">Tidak ada</SelectItem>
                    <SelectItem value="2" className="text-xs">Sedikit (2px)</SelectItem>
                    <SelectItem value="4" className="text-xs">Sedang (4px)</SelectItem>
                    <SelectItem value="8" className="text-xs">Banyak (8px)</SelectItem>
                    <SelectItem value="16" className="text-xs">Sangat banyak (16px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cakupan</p>
                <Select
                  value={section.style.backgroundSize || 'cover'}
                  onValueChange={(value) => handleStyleChange('backgroundSize', value)}
                >
                  <SelectTrigger className="h-9 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-900 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cover" className="text-xs">Cover (isi penuh)</SelectItem>
                    <SelectItem value="contain" className="text-xs">Contain (muat penuh)</SelectItem>
                    <SelectItem value="auto" className="text-xs">Auto (ukuran asli)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overlay</p>
                <Select
                  value={section.style.backgroundOverlay || 'none'}
                  onValueChange={(value) => handleStyleChange('backgroundOverlay', value)}
                >
                  <SelectTrigger className="h-9 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-900 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">Tidak ada</SelectItem>
                    <SelectItem value="light" className="text-xs">Terang (putih 30%)</SelectItem>
                    <SelectItem value="dark" className="text-xs">Gelap (hitam 50%)</SelectItem>
                    <SelectItem value="primary" className="text-xs">Warna primer (60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        {section.style.background === 'gradient' && (
          <div className="space-y-3">
            <Label className="text-xs font-bold">Warna gradasi</Label>
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Warna awal</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={section.style.backgroundGradient?.split(',')[0]?.trim() || template.theme.palette.primary}
                    onChange={(e) => {
                      const current = section.style.backgroundGradient || '';
                      const parts = current.split(',');
                      const end = parts[1]?.trim() || template.theme.palette.secondary;
                      handleStyleChange('backgroundGradient', `${e.target.value}, ${end}`);
                    }}
                    className="w-10 h-10 rounded-xl border cursor-pointer bg-white p-1"
                  />
                  <div className="flex-1">
                    <Input
                      value={section.style.backgroundGradient?.split(',')[0]?.trim() || template.theme.palette.primary}
                      onChange={(e) => {
                        const current = section.style.backgroundGradient || '';
                        const parts = current.split(',');
                        const end = parts[1]?.trim() || template.theme.palette.secondary;
                        handleStyleChange('backgroundGradient', `${e.target.value}, ${end}`);
                      }}
                      className="h-9 text-xs rounded-xl font-mono"
                      placeholder="#047857"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Warna akhir</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={section.style.backgroundGradient?.split(',')[1]?.trim() || template.theme.palette.secondary}
                    onChange={(e) => {
                      const current = section.style.backgroundGradient || '';
                      const parts = current.split(',');
                      const start = parts[0]?.trim() || template.theme.palette.primary;
                      handleStyleChange('backgroundGradient', `${start}, ${e.target.value}`);
                    }}
                    className="w-10 h-10 rounded-xl border cursor-pointer bg-white p-1"
                  />
                  <div className="flex-1">
                    <Input
                      value={section.style.backgroundGradient?.split(',')[1]?.trim() || template.theme.palette.secondary}
                      onChange={(e) => {
                        const current = section.style.backgroundGradient || '';
                        const parts = current.split(',');
                        const start = parts[0]?.trim() || template.theme.palette.primary;
                        handleStyleChange('backgroundGradient', `${start}, ${e.target.value}`);
                      }}
                      className="h-9 text-xs rounded-xl font-mono"
                      placeholder="#065f46"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Arah</p>
                <Select
                  value={section.style.backgroundGradient?.split(',')[2]?.trim() || '135deg'}
                  onValueChange={(value) => {
                    const current = section.style.backgroundGradient || '';
                    const parts = current.split(',');
                    const start = parts[0]?.trim() || template.theme.palette.primary;
                    const end = parts[1]?.trim() || template.theme.palette.secondary;
                    handleStyleChange('backgroundGradient', `${start}, ${end}, ${value}`);
                  }}
                >
                  <SelectTrigger className="h-9 text-[13px] rounded-xl bg-slate-50 dark:bg-slate-900 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="135deg" className="text-xs">Diagonal (135°)</SelectItem>
                    <SelectItem value="90deg" className="text-xs">Kanan (90°)</SelectItem>
                    <SelectItem value="180deg" className="text-xs">Bawah (180°)</SelectItem>
                    <SelectItem value="45deg" className="text-xs">Kanan atas (45°)</SelectItem>
                    <SelectItem value="270deg" className="text-xs">Atas (270°)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs font-bold">Jarak dalam blok (padding)</Label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { k: 'top', label: 'Atas' },
              { k: 'right', label: 'Kanan' },
              { k: 'bottom', label: 'Bawah' },
              { k: 'left', label: 'Kiri' },
            ] as const).map((side) => (
              <div key={side.k} className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground">{side.label}</Label>
                <Input
                  type="number"
                  value={String(section.style.padding[side.k])}
                  onChange={(e) =>
                    handleStyleChange('padding', {
                      ...section.style.padding,
                      [side.k]: Number(e.target.value),
                    })
                  }
                  className="h-9 text-xs rounded-xl text-center font-bold"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-10 rounded-xl font-bold border-emerald-200 hover:bg-emerald-50"
          onClick={() => duplicateSection(section.id)}
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" />
          Duplikat
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1 h-10 rounded-xl font-bold shadow-md"
          onClick={() => {
            if (confirm('Hapus blok ini? Bisa di-undo (Ctrl+Z).')) {
              deleteSection(section.id);
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Hapus
        </Button>
      </div>
    </div>
  );
}

function Input({ value, onChange, className, type, placeholder }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className || ''}`}
    />
  );
}
