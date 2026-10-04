'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useBuilderStore } from '@/lib/builder/store';
import { useTemplateStore } from '@/lib/builder/template-store';
import { MIN_SEO_TITLE } from '@/lib/builder/builder-ui';

/**
 * Panel pengaturan SEO (meta title + description + skor).
 *
 * Dipisah dari `builder-sidebar` supaya bisa dipakai di dua tempat:
 *  - builder (`level: 'seo'`) — dulu hanya di sini,
 *  - halaman dashboard `/seo` — SEO dipindah ke menu sendiri, di bawah
 *    "Desain Website", karena pengaturan ini bukan bagian dari template.
 *
 * Sumber kebenaran tetap `useBuilderStore().seo` (dan `template-store` untuk
 * menghitung jumlah blok pada skor), jadi keduanya konsisten.
 */
export function SeoConfigPanel() {
  const seo = useBuilderStore((s) => s.seo);
  const updateSeo = useBuilderStore((s) => s.updateSeo);
  const sections = useTemplateStore((s) => s.sections);

  const checks = [
    { label: `Meta title terisi (${seo.title.length}/60)`, ok: seo.title.trim().length >= MIN_SEO_TITLE && seo.title.length <= 60 },
    { label: `Meta description terisi (${seo.description.length}/160)`, ok: seo.description.trim().length >= 50 && seo.description.length <= 160 },
    { label: `Minimal 3 section konten (${sections.length})`, ok: sections.length >= 3 },
    { label: 'Template dipilih', ok: true },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Meta Tags</h4>
        <div className="space-y-2">
          <Label>Meta Title</Label>
          <Input
            value={seo.title}
            onChange={(e) => updateSeo({ title: e.target.value, description: seo.description })}
            placeholder="Toko Saya - Produk Berkualitas"
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">{seo.title.length}/60 karakter</p>
        </div>
        <div className="space-y-2">
          <Label>Meta Description</Label>
          <Textarea
            className="min-h-[100px]"
            value={seo.description}
            onChange={(e) => updateSeo({ title: seo.title, description: e.target.value })}
            placeholder="Deskripsi toko Anda untuk mesin pencari"
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground">{seo.description.length}/160 karakter</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Social Preview</h4>
        <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
          Preview sosial (OG image) dibuat otomatis dari judul, deskripsi, dan logo toko saat website dipublish.
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">SEO Score</h4>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full ${
              score >= 75
                ? 'bg-emerald-100 text-emerald-700'
                : score >= 50
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {score}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="p-3 border rounded-lg bg-muted/40">
          <ul className="text-xs space-y-1.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${c.ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={c.ok ? 'text-foreground' : 'text-muted-foreground'}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}