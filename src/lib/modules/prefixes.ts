/**
 * Registry prefix unik per modul — single source of truth konvensi §5.6
 * `docs/PLANNING_TEMPLATE_MODULE.md`.
 *
 * Aturan:
 * - 1 modul = 1 prefix (`^[a-z]{2,5}_$`), turunan nama folder `src/lib/*`.
 * - Berlaku untuk: nama tabel, view, index, nama RLS policy, dan
 *   konstanta/type/enum yang di-export. Tidak berlaku untuk nama kolom.
 * - `mod_` khusus inti sistem modul; tabel non-modul dilarang pakai `mod_`.
 * - Prefix baru = tambah 1 baris di `MODULE_PREFIXES` + pastikan
 *   `prefixes.test.ts` dan `scripts/lint-prefix.mjs` hijau.
 */

// Format dijaga sederhana agar bisa di-parse regex oleh scripts/lint-prefix.mjs.
export const MODULE_PREFIXES = {
  billing: "bill_",
  websites: "ws_",
  products: "prod_",
  orders: "ord_",
  domains: "dom_",
  builder: "bld_",
  users: "usr_",
  modules: "mod_",
} as const;

export type ModuleId = keyof typeof MODULE_PREFIXES;

/** Tabel inti auth — satu-satunya pengecualian tanpa prefix (lihat §5.6). */
export const TABLE_WITHOUT_PREFIX_ALLOWLIST: ReadonlySet<string> = new Set([
  "users",
]);

/**
 * Tabel lama pra-konvensi: boleh muncul di migrasi 001..046 apa adanya,
 * TAPI dilarang dipakai untuk tabel baru. Dikosongkan bertahap saat
 * retrofit Fase B→D selesai (RENAME + drop view compat).
 * Format dijaga sederhana agar bisa di-parse regex oleh scripts/lint-prefix.mjs.
 */
export const LEGACY_TABLES_WITHOUT_PREFIX: ReadonlySet<string> = new Set([
  "plans",
  "tier_limits",
  "subscriptions",
  "websites",
  "website_settings",
  "store_pages",
  "products",
  "product_images",
  "product_variants",
  "stock_movements",
  "orders",
  "domain_orders",
  "templates",
  "templates_library",
  "user_templates",
  "user_template_library",
  "layout_nodes",
  "navigation_groups",
  "navigation_items",
  "design_styles",
  "bookings",
]);

const PREFIX_RE = /^[a-z]{2,5}_$/;

/** Validasi registry; kembalikan daftar error (kosong = valid). */
export function validateRegistry(): string[] {
  const errors: string[] = [];
  const seen = new Map<string, string>();
  for (const [mod, prefix] of Object.entries(MODULE_PREFIXES)) {
    if (!PREFIX_RE.test(prefix)) {
      errors.push(`Prefix modul "${mod}" ("${prefix}") harus cocok ^[a-z]{2,5}_$`);
    }
    const owner = seen.get(prefix);
    if (owner) {
      errors.push(`Prefix "${prefix}" diklaim ganda oleh "${owner}" dan "${mod}"`);
    } else {
      seen.set(prefix, mod);
    }
  }
  for (const t of TABLE_WITHOUT_PREFIX_ALLOWLIST) {
    if ([...seen.keys()].some((p) => t.startsWith(p))) {
      errors.push(`Allowlist "${t}" redundan (sudah ber-prefix) — hapus dari allowlist`);
    }
  }
  for (const t of LEGACY_TABLES_WITHOUT_PREFIX) {
    if ([...seen.keys()].some((p) => t.startsWith(p))) {
      errors.push(`Tabel legacy "${t}" sudah ber-prefix — hapus dari LEGACY_TABLES_WITHOUT_PREFIX`);
    }
  }
  return errors;
}

/** Prefix untuk satu modul. */
export function prefixFor(module: ModuleId): string {
  return MODULE_PREFIXES[module];
}

/** Tebak modul pemilik dari nama tabel; null bila tak ber-prefix terdaftar. */
export function moduleOfTable(table: string): ModuleId | null {
  for (const [mod, prefix] of Object.entries(MODULE_PREFIXES)) {
    if (table.startsWith(prefix)) return mod as ModuleId;
  }
  return null;
}

/** True bila nama tabel boleh ada: ber-prefix terdaftar, allowlist, atau legacy. */
export function isAllowedTableName(table: string): boolean {
  if (moduleOfTable(table)) return true;
  if (TABLE_WITHOUT_PREFIX_ALLOWLIST.has(table)) return true;
  if (LEGACY_TABLES_WITHOUT_PREFIX.has(table)) return true;
  return false;
}
