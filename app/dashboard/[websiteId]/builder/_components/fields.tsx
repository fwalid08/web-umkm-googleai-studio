"use client";

/**
 * Sprint 01 Week 2 — Field editor generik untuk Builder.
 * Prinsip Bu Toni: form sederhana (input/toggle/tambah-hapus), tanpa drag & drop.
 * Dipakai galeri editor untuk style, content, theme, dan SEO.
 */

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
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-green-600" : "bg-gray-300"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      aria-label={label ?? "Toggle"}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
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
  const cls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 capitalize">{label.replace(/_/g, " ")}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
    </label>
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
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 capitalize">{label.replace(/_/g, " ")}</span>
      <input
        type="number"
        value={Number.isNaN(value) ? 0 : value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </label>
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
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500 capitalize">{label.replace(/_/g, " ")}</span>
      <span className="flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#15803D"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
        />
      </span>
    </label>
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
        <span className="text-xs text-gray-500 capitalize">{fieldKey.replace(/_/g, " ")}</span>
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
          <input
            value={it}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={label === "images" ? "https://... (URL gambar)" : "Tulis di sini..."}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
          >
            Hapus
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="text-sm text-green-700 border border-green-200 rounded-lg px-3 py-2 hover:bg-green-50"
      >
        + Tambah
      </button>
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
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-xs text-red-600 hover:underline"
            >
              Hapus
            </button>
          </div>
          <ObjectEditor data={it} onChange={(next) => onChange(items.map((x, j) => (j === i ? next : x)))} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { ...blank }])}
        className="text-sm text-green-700 border border-green-200 rounded-lg px-3 py-2 hover:bg-green-50"
      >
        + Tambah
      </button>
    </div>
  );
}
