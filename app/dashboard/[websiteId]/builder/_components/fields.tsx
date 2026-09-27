"use client";

/**
 * Sprint 01 Week 2 — Field editor generik untuk Builder.
 * Prinsip Bu Toni: form sederhana (input/toggle/tambah-hapus), tanpa drag & drop.
 * Dipakai galeri editor untuk style, content, theme, dan SEO.
 * Semua kontrol memakai komponen shadcn (Switch, Input, Textarea, Label, Button).
 */

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-label={label ?? "Toggle"}
    />
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const id = `builder-field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-gray-500 capitalize">
        {label.replace(/_/g, " ")}
      </Label>
      {textarea ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = `builder-field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-gray-500 capitalize">
        {label.replace(/_/g, " ")}
      </Label>
      <Input
        id={id}
        type="number"
        value={Number.isNaN(value) ? 0 : value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `builder-field-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-gray-500 capitalize">
        {label.replace(/_/g, " ")}
      </Label>
      <span className="flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#15803D"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-lg border border-gray-300 cursor-pointer bg-white px-1"
          aria-label={`${label} (pemilih warna)`}
        />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono"
        />
      </span>
    </div>
  );
}

/** Dispatch satu nilai ke input yang tepat berdasarkan tipenya. */
export function ValueField({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (typeof value === "boolean") {
    return (
      <span className="flex items-center gap-2">
        <Toggle checked={value} onChange={(v) => onChange(v)} label={fieldKey} />
        <span className="text-sm text-gray-500 capitalize">{fieldKey.replace(/_/g, " ")}</span>
      </span>
    );
  }
  if (typeof value === "number") {
    return <NumberInput label={fieldKey} value={value} onChange={(v) => onChange(v)} />;
  }
  if (typeof value === "string") {
    if (/^#[0-9a-fA-F]{6}$/.test(value) || fieldKey.includes("color") || fieldKey === "background") {
      return <ColorInput label={fieldKey} value={value} onChange={(v) => onChange(v)} />;
    }
    const long = value.length > 80 || fieldKey.includes("content") || fieldKey.includes("description") || fieldKey.includes("message");
    return <TextInput label={fieldKey} value={value} onChange={(v) => onChange(v)} textarea={long} />;
  }
  return null; // array/object ditangani ObjectEditor/ArrayEditor di parent
}

/** Editor generik untuk object dangkal (string/number/boolean per key). */
export function ObjectEditor({
  data,
  onChange,
  exclude = [],
}: {
  data: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  exclude?: string[];
}) {
  const keys = Object.keys(data).filter((k) => !exclude.includes(k));
  const scalars = keys.filter((k) => ["string", "number", "boolean"].includes(typeof data[k]));
  if (scalars.length === 0) return null;
  return (
    <div className="space-y-3">
      {scalars.map((k) => (
        <ValueField key={k} fieldKey={k} value={data[k]} onChange={(v) => onChange({ ...data, [k]: v })} />
      ))}
    </div>
  );
}

/** Editor list string (galeri gambar, features). */
export function StringArrayEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 capitalize">{label.replace(/_/g, " ")}</p>
      {items.map((it, i) => (
        <span key={i} className="flex gap-2">
          <Input
            value={it}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={label === "images" ? "https://... (URL gambar)" : "Tulis di sini..."}
            className="flex-1"
            aria-label={`${label} #${i + 1}`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            Hapus
          </Button>
        </span>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, ""])}
        className="text-green-700 border-green-200 hover:bg-green-50"
      >
        + Tambah
      </Button>
    </div>
  );
}

/** Editor list object (produk, testimoni, FAQ, promo). */
export function ObjectArrayEditor({
  label,
  items,
  blank,
  onChange,
}: {
  label: string;
  items: Record<string, unknown>[];
  blank: Record<string, unknown>;
  onChange: (next: Record<string, unknown>[]) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-gray-500 capitalize">
        {label.replace(/_/g, " ")} ({items.length})
      </p>
      {items.map((it, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">#{i + 1}</span>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-red-600 h-auto p-0"
            >
              Hapus
            </Button>
          </div>
          <ObjectEditor data={it} onChange={(next) => onChange(items.map((x, j) => (j === i ? next : x)))} />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, { ...blank }])}
        className="text-green-700 border-green-200 hover:bg-green-50"
      >
        + Tambah
      </Button>
    </div>
  );
}
