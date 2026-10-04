import { SECTION_REGISTRY } from "../sections/registry";
import type { ConfigField } from "../template-types";
import type { SectionTypeDefinition } from "../template-types";

/**
 * Komposer template statis dari registry generik.
 *
 * Template fase-1 berbagi katalog section (`SECTION_REGISTRY`) — yang
 * membedakan tiap niche adalah theme, seed (`data`), header/footer, dan
 * copywriting. Otomi varian per niche dilakukan belakangan (masuk
 * `MIGRATED_TEMPLATES` satu per satu).
 */

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function prettyLabel(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function fieldTypeFor(key: string, value: unknown): ConfigField["type"] {
  if (typeof value === "boolean") return "switch";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "list";
  const lower = key.toLowerCase();
  if (
    lower.includes("image") ||
    lower.includes("logo") ||
    lower.includes("favicon") ||
    lower === "videourl" ||
    lower === "video_url"
  )
    return "image";
  if (lower.includes("color") || lower.includes("warna")) return "color";
  if (typeof value === "string" && value.length > 120) return "textarea";
  return "text";
}

/**
 * Turunkan form field sidebar dari `defaultConfig` varian registry.
 * Registry tidak menyimpan `configFields`, tanpa ini sidebar kosong
 * (user tidak bisa mengedit section yang ditambah belakangan).
 */
export function inferConfigFields(
  config: Record<string, unknown>,
): ConfigField[] {
  return Object.entries(config).map(([key, value]) => {
    const field: ConfigField = {
      key,
      label: prettyLabel(key),
      type: fieldTypeFor(key, value),
    };
    if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
      field.itemFields = inferConfigFields(
        value[0] as Record<string, unknown>,
      ).slice(0, 8);
    }
    if (typeof value === "string" && value.length > 120) field.rows = 3;
    return field;
  });
}

/**
 * Katalog section milik template = seluruh registry, dipetakan ke bentuk
 * `template-types` (layout + configFields + mockup). Struktur ini yang
 * dibaca kanvas, sidebar, dan renderer — bukan `SECTION_REGISTRY` langsung
 * (lihat kontrak `catalog.test.ts`).
 */
export function registrySections(): SectionTypeDefinition[] {
  return Object.values(SECTION_REGISTRY).map((def) => ({
    type: def.type,
    name: def.name,
    icon: def.icon,
    variants: def.variants.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      layout: v.id,
      configFields: inferConfigFields(
        (v.defaultConfig ?? {}) as Record<string, unknown>,
      ),
      defaultConfig: { ...((v.defaultConfig ?? {}) as Record<string, unknown>) },
      mockup: v.id,
    })),
  }));
}
