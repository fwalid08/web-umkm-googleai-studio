// AUTO-GENERATED oleh scripts/gen-template-catalog.mjs — JANGAN edit manual.
// Tambah template = buat folder <id>/ berisi index.ts (export default
// CatalogTemplate) di src/lib/builder/templates/. Skrip generate jalan
// otomatis sebelum dev/build/test via prehook npm.
import type { CatalogTemplate } from "./catalog";
import laundry_emerald from "./laundry-emerald";
import marketplace_hybrid from "./marketplace-hybrid";
import nourivelle_wellness from "./nourivelle-wellness";
import retail_marketplace from "./retail-marketplace";

/** Nama folder tiap template, sejajar index dengan GENERATED_CATALOG. */
export const GENERATED_TEMPLATE_FOLDERS = [
  "laundry-emerald",
  "marketplace-hybrid",
  "nourivelle-wellness",
  "retail-marketplace",
] as const;

export const GENERATED_CATALOG: CatalogTemplate[] = [
  laundry_emerald,
  marketplace_hybrid,
  nourivelle_wellness,
  retail_marketplace,
];
