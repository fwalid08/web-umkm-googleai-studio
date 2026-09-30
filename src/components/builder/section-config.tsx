'use client';

import { useBuilderStore } from '@/lib/builder/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Copy } from 'lucide-react';
import { SECTION_REGISTRY, getSectionVariant } from '@/lib/builder/sections/registry';
import type { Section } from '@/lib/builder/types';

const UMKM_SWATCHES = ['#ffffff', '#f8fafc', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#ffedd5', '#111827'];

function SectionConfigForm({ section }: { section: Section }) {
  const updateSection = useBuilderStore((s) => s.updateSection);
  const deleteSection = useBuilderStore((s) => s.deleteSection);
  const duplicateSection = useBuilderStore((s) => s.duplicateSection);
  const sectionType = SECTION_REGISTRY[section.type];
  const variant = getSectionVariant(section.type, section.variant);

  const handleConfigChange = (key: string, value: unknown) => {
    updateSection(section.id, {
      config: { ...section.config, [key]: value },
    });
  };

  const handleStyleChange = (key: string, value: unknown) => {
    updateSection(section.id, {
      style: { ...section.style, [key]: value },
    });
  };

  const renderField = (key: string, value: unknown, label: string, type: 'text' | 'textarea' | 'number' | 'select' = 'text', options?: { label: string; value: string }[]) => {
    if (type === 'textarea') {
      return (
        <div key={key} className="space-y-1.5">
          <Label className="text-xs font-bold">{label}</Label>
          <Textarea
            className="min-h-[64px] text-[13px] rounded-xl bg-white dark:bg-slate-800 focus-visible:ring-emerald-400 leading-relaxed"
            value={(value as string) || ''}
            onChange={(e) => handleConfigChange(key, e.target.value)}
          />
        </div>
      );
    }
    if (type === 'select' && options) {
      // Alignment tampil sebagai segmented playful, bukan dropdown kaku
      if (key === 'text_align') {
        const current = (value as string) || 'left';
        const items = [
          { v: 'left', label: '⬅ Kiri' },
          { v: 'center', label: '↔ Tengah' },
          { v: 'right', label: 'Kanan ➡' },
        ];
        return (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs font-bold">{label}</Label>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border">
              {items.map((it) => (
                <button
                  key={it.v}
                  type="button"
                  onClick={() => handleConfigChange(key, it.v)}
                  className={`text-[11px] font-bold px-2 py-2 rounded-lg transition-all ${
                    current === it.v
                      ? 'bg-white dark:bg-slate-700 shadow-md text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {it.label}
                </button>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div key={key} className="space-y-1.5">
          <Label className="text-xs font-bold">{label}</Label>
          <Select
            value={(value as string) || ''}
            onValueChange={(val) => handleConfigChange(key, val)}
          >
            <SelectTrigger className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-800 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    const isImage = key.includes('image') || key.includes('logo') || key.includes('url') && typeof value === 'string' && (value as string).startsWith('http');
    return (
      <div key={key} className="space-y-1.5">
        <Label className="text-xs font-bold">{label}</Label>
        <Input
          type={type}
          className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-800 focus-visible:ring-emerald-400"
          value={(value as string | number) || ''}
          onChange={(e) => handleConfigChange(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        />
        {isImage && typeof value === 'string' && value.startsWith('http') && (
          <div className="rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="w-full h-24 object-cover" loading="lazy" />
          </div>
        )}
      </div>
    );
  };

  const renderArrayField = (key: string, items: unknown[], label: string, fields: { key: string; label: string; type: 'text' | 'textarea' }[]) => {
    return (
      <div key={key} className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground">{label}</Label>
        {(items as Record<string, unknown>[]).map((item, idx) => (
          <div key={idx} className="p-2.5 border rounded-md space-y-1.5">
            {fields.map((field) => (
              <div key={field.key} className="space-y-0.5">
                <Label className="text-[10px] text-muted-foreground">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    className="min-h-[60px] text-xs"
                    value={(item[field.key] as string) || ''}
                    onChange={(e) => {
                      const newItems = [...(items as Record<string, unknown>[])];
                      newItems[idx] = { ...newItems[idx], [field.key]: e.target.value };
                      handleConfigChange(key, newItems);
                    }}
                  />
                ) : (
                  <Input
                    className="h-7 text-xs"
                    value={(item[field.key] as string) || ''}
                    onChange={(e) => {
                      const newItems = [...(items as Record<string, unknown>[])];
                      newItems[idx] = { ...newItems[idx], [field.key]: e.target.value };
                      handleConfigChange(key, newItems);
                    }}
                  />
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                const newItems = (items as Record<string, unknown>[]).filter((_, i) => i !== idx);
                handleConfigChange(key, newItems);
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Hapus
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => {
            const blank = fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {});
            handleConfigChange(key, [...(items as Record<string, unknown>[]), blank]);
          }}
        >
          + Tambah Item
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-slate-200/50 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-white/[0.04] dark:to-transparent dark:border-white/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">🧱 Jenis blok</Label>
            <Input value={sectionType.name} disabled className="h-9 text-[13px] rounded-xl bg-white/80 dark:bg-slate-900 font-bold" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">✨ Gaya tampilan</Label>
            <Select
              value={section.variant}
              onValueChange={(value) => updateSection(section.id, { variant: value })}
            >
              <SelectTrigger className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-900 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectionType.variants.map((v) => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {variant && <p className="text-xs text-muted-foreground leading-relaxed bg-white/60 dark:bg-slate-900/60 rounded-lg p-2">{variant.description}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white dark:bg-white/[0.03] dark:border-white/[0.06] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] space-y-3">
        <h4 className="text-sm font-extrabold flex items-center gap-1.5">✏️ Isi teks & gambar</h4>
        {section.type === 'hero' && (
          <>
            {renderField('headline', section.config.headline, 'Headline')}
            {renderField('subheadline', section.config.subheadline, 'Subheadline', 'textarea')}
            {renderField('cta_text', section.config.cta_text, 'CTA Text')}
            {renderField('cta_link', section.config.cta_link, 'CTA Link')}
            {renderField('text_align', section.config.text_align, 'Text Align', 'select', [
              { label: 'Kiri', value: 'left' },
              { label: 'Tengah', value: 'center' },
              { label: 'Kanan', value: 'right' },
            ])}
            {renderField('background_type', section.config.background_type, 'Background Type', 'select', [
              { label: 'Warna', value: 'color' },
              { label: 'Gambar', value: 'image' },
              { label: 'Gradient', value: 'gradient' },
            ])}
          </>
        )}
        {section.type === 'features' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderArrayField('items', (section.config.items as unknown[]) || [], 'Items', [
              { key: 'icon', label: 'Icon', type: 'text' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ])}
          </>
        )}
        {section.type === 'testimonials' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderArrayField('items', (section.config.items as unknown[]) || [], 'Testimonials', [
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'text', label: 'Review', type: 'textarea' },
              { key: 'rating', label: 'Rating', type: 'text' },
            ])}
          </>
        )}
        {section.type === 'faq' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderArrayField('items', (section.config.items as unknown[]) || [], 'FAQ Items', [
              { key: 'question', label: 'Question', type: 'text' },
              { key: 'answer', label: 'Answer', type: 'textarea' },
            ])}
          </>
        )}
        {section.type === 'cta' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('subtitle', section.config.subtitle, 'Subtitle', 'textarea')}
            {renderField('button_text', section.config.button_text, 'Button Text')}
            {renderField('button_link', section.config.button_link, 'Button Link')}
          </>
        )}
        {section.type === 'contact' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('subtitle', section.config.subtitle, 'Subtitle', 'textarea')}
            {renderField('show_map', section.config.show_map, 'Show Map', 'select', [
              { label: 'Ya', value: 'true' },
              { label: 'Tidak', value: 'false' },
            ])}
            {renderField('address', section.config.address, 'Address')}
          </>
        )}
        {section.type === 'booking' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('subtitle', section.config.subtitle, 'Subtitle', 'textarea')}
            {renderArrayField('services', (section.config.services as unknown[]) || [], 'Layanan yang bisa dibooking', [
              { key: 'name', label: 'Nama layanan', type: 'text' },
              { key: 'duration', label: 'Durasi', type: 'text' },
              { key: 'price', label: 'Harga', type: 'text' },
            ])}
            {renderField('hours', section.config.hours, 'Jam operasional')}
            {renderField('address', section.config.address, 'Alamat (varian Form + Info)')}
            {renderField('success_message', section.config.success_message, 'Pesan sukses', 'textarea')}
            {renderField('forward_wa', section.config.forward_wa, 'No. WA pemilik (08…)')}
          </>
        )}
        {section.type === 'about' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('content', section.config.content, 'Content', 'textarea')}
            {renderField('image', section.config.image, 'Image URL')}
          </>
        )}
        {section.type === 'gallery' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            <div className="space-y-1.5">
              <Label className="text-xs">Images</Label>
              <Input
                placeholder="URL gambar (pisahkan dengan koma)"
                value={((section.config.images as string[]) || []).join(', ')}
                onChange={(e) => handleConfigChange('images', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              />
            </div>
          </>
        )}
        {section.type === 'video' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('url', section.config.url, 'Video URL (YouTube/Vimeo)')}
          </>
        )}
        {section.type === 'team' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderArrayField('members', (section.config.members as unknown[]) || [], 'Members', [
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'role', label: 'Role', type: 'text' },
              { key: 'image', label: 'Image URL', type: 'text' },
            ])}
          </>
        )}
        {section.type === 'pricing' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderArrayField('items', (section.config.items as unknown[]) || [], 'Pricing Items', [
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'price', label: 'Price', type: 'text' },
              { key: 'features', label: 'Features', type: 'textarea' },
            ])}
          </>
        )}
        {section.type === 'newsletter' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('subtitle', section.config.subtitle, 'Subtitle', 'textarea')}
            {renderField('placeholder', section.config.placeholder, 'Placeholder')}
            {renderField('button_text', section.config.button_text, 'Button Text')}
          </>
        )}
        {section.type === 'divider' && (
          <>
            {renderField('style', section.config.style, 'Style', 'select', [
              { label: 'Solid', value: 'solid' },
              { label: 'Dashed', value: 'dashed' },
              { label: 'Dotted', value: 'dotted' },
            ])}
            {renderField('color', section.config.color, 'Color')}
            {renderField('height', section.config.height, 'Height (px)', 'number')}
          </>
        )}
        {section.type === 'product_grid' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('columns', section.config.columns, 'Columns', 'number')}
            {renderField('show_price', section.config.show_price, 'Show Price', 'select', [
              { label: 'Ya', value: 'true' },
              { label: 'Tidak', value: 'false' },
            ])}
            {renderField('show_rating', section.config.show_rating, 'Show Rating', 'select', [
              { label: 'Ya', value: 'true' },
              { label: 'Tidak', value: 'false' },
            ])}
          </>
        )}
        {section.type === 'marquee' && (
          <>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Teks berjalan (satu per baris)</Label>
              <Textarea
                className="min-h-[120px] text-xs"
                value={((section.config.items as string[]) || []).join('\n')}
                onChange={(e) =>
                  handleConfigChange(
                    'items',
                    e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                  )
                }
                placeholder={'Gayo Aceh\nFlores Bajawa\nRobusta Temanggung'}
              />
            </div>
          </>
        )}
        {section.type === 'menu_board' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('subtitle', section.config.subtitle, 'Subtitle', 'textarea')}
            {section.variant === 'menu-list' ? (
              <>
                {renderArrayField('items', (section.config.items as unknown[]) || [], 'Menu', [
                  { key: 'name', label: 'Nama', type: 'text' },
                  { key: 'desc', label: 'Deskripsi', type: 'textarea' },
                  { key: 'price', label: 'Harga', type: 'text' },
                ])}
              </>
            ) : (
              <MenuGroupsEditor
                groups={((section.config.groups as Record<string, unknown>[]) || []) as Array<{ key: string; label: string; items: Array<{ name: string; desc: string; price: string }> }>}
                onChange={(groups) => handleConfigChange('groups', groups)}
              />
            )}
          </>
        )}
        {section.type === 'steps' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('subtitle', section.config.subtitle, 'Subtitle', 'textarea')}
            {renderArrayField('items', (section.config.items as unknown[]) || [], 'Langkah (nomor otomatis)', [
              { key: 'title', label: 'Judul langkah', type: 'text' },
              { key: 'description', label: 'Deskripsi', type: 'textarea' },
            ])}
          </>
        )}
        {section.type === 'location' && (
          <>
            {renderField('title', section.config.title, 'Judul')}
            {renderField('address', section.config.address, 'Alamat', 'textarea')}
            {renderField('note', section.config.note, 'Catatan (layanan)', 'textarea')}
            {renderField('button_text', section.config.button_text, 'Teks tombol')}
            {renderField('button_link', section.config.button_link, 'Link tombol (wa.me/…)')}
            {renderArrayField('hours', (section.config.hours as unknown[]) || [], 'Jam buka', [
              { key: 'days', label: 'Hari', type: 'text' },
              { key: 'time', label: 'Jam', type: 'text' },
            ])}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/50 bg-white dark:bg-white/[0.03] dark:border-white/[0.06] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] space-y-4">
        <h4 className="text-sm font-extrabold flex items-center gap-1.5">🎨 Gaya blok</h4>
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
              <SelectItem value="transparent" className="text-xs">✨ Transparan (ikut template)</SelectItem>
              <SelectItem value="color" className="text-xs">🎨 Warna sendiri</SelectItem>
              <SelectItem value="image" className="text-xs">🖼️ Gambar</SelectItem>
              <SelectItem value="gradient" className="text-xs">🌈 Gradasi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {section.style.background === 'color' && (
          <div className="space-y-2">
            <Label className="text-xs font-bold">Warna latar</Label>
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
                value={section.style.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-10 h-10 rounded-xl border cursor-pointer bg-white p-1"
              />
              <Input
                value={section.style.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="flex-1 h-9 text-xs rounded-xl font-mono"
              />
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-xs font-bold">Jarak dalam blok (padding)</Label>
          <div className="grid grid-cols-4 gap-2">
            {([
              { k: 'top', label: '⬆ Atas' },
              { k: 'right', label: '➡ Kanan' },
              { k: 'bottom', label: '⬇ Bawah' },
              { k: 'left', label: '⬅ Kiri' },
            ] as const).map((side) => (
              <div key={side.k} className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground">{side.label}</Label>
                <Input
                  type="number"
                  value={section.style.padding[side.k]}
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

export function SectionConfig({ section }: { section: Section }) {
  return (
    <div className="px-1 py-1">
      <SectionConfigForm section={section} />
    </div>
  );
}

interface MenuGroupItem {
  name: string;
  desc: string;
  price: string;
}

interface MenuGroup {
  key: string;
  label: string;
  items: MenuGroupItem[];
}

/** Editor kategori + item menu untuk varian menu-tabs (2 level). */
function MenuGroupsEditor({ groups, onChange }: { groups: MenuGroup[]; onChange: (groups: MenuGroup[]) => void }) {
  const updateGroup = (gi: number, patch: Partial<MenuGroup>) => {
    const next = groups.map((g, i) => (i === gi ? { ...g, ...patch } : g));
    onChange(next);
  };

  const updateItem = (gi: number, ii: number, patch: Partial<MenuGroupItem>) => {
    const next = groups.map((g, i) =>
      i === gi ? { ...g, items: g.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : g,
    );
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label className="text-[11px] text-muted-foreground">Kategori & Menu</Label>
      {groups.map((g, gi) => (
        <div key={`${g.key}-${gi}`} className="p-2.5 border rounded-md space-y-2 bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Input
              className="h-7 text-xs font-semibold"
              value={g.label}
              onChange={(e) => updateGroup(gi, { label: e.target.value, key: g.key || e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              placeholder="Nama kategori"
            />
            <button
              onClick={() => onChange(groups.filter((_, i) => i !== gi))}
              className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"
              title="Hapus kategori"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {(g.items || []).map((it, ii) => (
            <div key={ii} className="p-2 border rounded bg-background space-y-1.5">
              <Input
                className="h-7 text-xs"
                value={it.name}
                onChange={(e) => updateItem(gi, ii, { name: e.target.value })}
                placeholder="Nama menu"
              />
              <Textarea
                className="min-h-[44px] text-xs"
                value={it.desc}
                onChange={(e) => updateItem(gi, ii, { desc: e.target.value })}
                placeholder="Deskripsi"
              />
              <div className="flex items-center gap-1.5">
                <Input
                  className="h-7 text-xs"
                  value={it.price}
                  onChange={(e) => updateItem(gi, ii, { price: e.target.value })}
                  placeholder="Rp 20rb"
                />
                <button
                  onClick={() => updateGroup(gi, { items: g.items.filter((_, j) => j !== ii) })}
                  className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"
                  title="Hapus menu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => updateGroup(gi, { items: [...(g.items || []), { name: '', desc: '', price: '' }] })}
          >
            + Tambah menu
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => onChange([...groups, { key: `kategori-${groups.length + 1}`, label: 'Kategori Baru', items: [] }])}
      >
        + Tambah kategori
      </Button>
    </div>
  );
}
