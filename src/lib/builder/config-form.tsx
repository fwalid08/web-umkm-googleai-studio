'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ConfigField } from './template-types';

interface ConfigFormProps {
  fields: ConfigField[];
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function ConfigForm({ fields, config, onChange }: ConfigFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <ConfigFieldRenderer
          key={field.key}
          field={field}
          value={config[field.key]}
          onChange={(value) => onChange(field.key, value)}
          config={config}
          onChangeParent={onChange}
        />
      ))}
    </div>
  );
}

interface ConfigFieldRendererProps {
  field: ConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
  config: Record<string, unknown>;
  onChangeParent: (key: string, value: unknown) => void;
}

function ConfigFieldRenderer({ field, value, onChange }: ConfigFieldRendererProps) {
  switch (field.type) {
    case 'text':
      return <TextField field={field} value={value} onChange={onChange} />;
    case 'textarea':
      return <TextareaField field={field} value={value} onChange={onChange} />;
    case 'number':
      return <NumberField field={field} value={value} onChange={onChange} />;
    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} />;
    case 'image':
      return <ImageField field={field} value={value} onChange={onChange} />;
    case 'list':
      return <ListField field={field} value={value} onChange={onChange} />;
    case 'color':
      return <ColorField field={field} value={value} onChange={onChange} />;
    case 'background':
      return <BackgroundField field={field} value={value} onChange={onChange} />;
    case 'gallery':
      return <GalleryField field={field} value={value} onChange={onChange} />;
    case 'switch':
      return <SwitchField field={field} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

function TextField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{field.label}</Label>
      <Input
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-800 focus-visible:ring-emerald-400"
      />
    </div>
  );
}

function TextareaField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{field.label}</Label>
      <Textarea
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows || 3}
        className="min-h-[64px] text-[13px] rounded-xl bg-white dark:bg-slate-800 focus-visible:ring-emerald-400 leading-relaxed"
      />
    </div>
  );
}

function NumberField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{field.label}</Label>
      <Input
        type="number"
        value={(value as number) || 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-800 focus-visible:ring-emerald-400"
      />
    </div>
  );
}

function SelectField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{field.label}</Label>
      <Select value={(value as string) || ''} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-800 font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ImageField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  const url = (value as string) || '';
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{field.label}</Label>
      <Input
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || 'https://...'}
        className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-800 focus-visible:ring-emerald-400"
      />
      {url && (
        <div className="rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={field.label} className="w-full h-24 object-cover" loading="lazy" />
        </div>
      )}
    </div>
  );
}

function ListField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  const items = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
  const itemFields = field.itemFields || [];

  const addItem = () => {
    const blank = itemFields.reduce((acc, f) => ({ ...acc, [f.key]: f.defaultValue ?? '' }), {});
    onChange([...items, blank]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: string, val: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: val };
    onChange(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold">{field.label}</Label>
      {items.map((item, index) => (
        <div key={index} className="p-3 border rounded-xl space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground">Item {index + 1}</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => moveItem(index, 'up')}
                disabled={index === 0}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveItem(index, 'down')}
                disabled={index === items.length - 1}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeItem(index)}
                className="p-1 text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {itemFields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{f.label}</Label>
              {f.type === 'textarea' ? (
                <Textarea
                  value={(item[f.key] as string) || ''}
                  onChange={(e) => updateItem(index, f.key, e.target.value)}
                  rows={2}
                  className="min-h-[40px] text-xs rounded-lg"
                />
              ) : (
                <Input
                  value={(item[f.key] as string) || ''}
                  onChange={(e) => updateItem(index, f.key, e.target.value)}
                  className="h-7 text-xs rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={addItem}
      >
        <Plus className="w-3.5 h-3.5 mr-1" />
        Tambah Item
      </Button>
    </div>
  );
}

function ColorField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  const color = (value as string) || '#000000';
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold">{field.label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-xl border cursor-pointer bg-white p-1"
        />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-9 text-xs rounded-xl font-mono"
        />
      </div>
    </div>
  );
}

function BackgroundField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  const bgType = (value as string) || 'color';
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold">{field.label}</Label>
      <Select value={bgType} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="h-9 text-[13px] rounded-xl bg-white dark:bg-slate-800 font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="color" className="text-xs">Warna</SelectItem>
          <SelectItem value="image" className="text-xs">Gambar</SelectItem>
          <SelectItem value="gradient" className="text-xs">Gradient</SelectItem>
          <SelectItem value="transparent" className="text-xs">Transparan</SelectItem>
        </SelectContent>
      </Select>
      {bgType === 'color' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(value as string) || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-xl border cursor-pointer bg-white p-1"
          />
          <Input
            value={(value as string) || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 h-9 text-xs rounded-xl font-mono"
          />
        </div>
      )}
      {bgType === 'image' && (
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="h-9 text-[13px] rounded-xl"
        />
      )}
      {bgType === 'gradient' && (
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          className="h-9 text-[13px] rounded-xl font-mono"
        />
      )}
    </div>
  );
}

function GalleryField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  const images = (Array.isArray(value) ? value : []) as string[];

  const addImage = () => {
    onChange([...images, '']);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, url: string) => {
    const newImages = [...images];
    newImages[index] = url;
    onChange(newImages);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold">{field.label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, index) => (
          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border bg-slate-100 dark:bg-slate-800">
            {img ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        <button
          onClick={addImage}
          className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center hover:border-emerald-400 transition-colors"
        >
          <Plus className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>
      {images.length > 0 && (
        <div className="space-y-1">
          {images.map((img, index) => (
            <Input
              key={index}
              value={img}
              onChange={(e) => updateImage(index, e.target.value)}
              placeholder={`URL gambar ${index + 1}`}
              className="h-7 text-xs rounded-lg"
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SwitchField({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
      <Label className="text-xs font-bold">{field.label}</Label>
      <Switch
        checked={(value as boolean) || false}
        onCheckedChange={(v) => onChange(v)}
      />
    </div>
  );
}
