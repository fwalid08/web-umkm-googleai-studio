// AUTO-GENERATED oleh scripts/gen-module-catalog.mjs — JANGAN edit manual.
// Tambah module = buat folder <id>/ berisi index.ts (export const XXX_FEATURE)
// di src/lib/modules/features/ atau src/lib/modules/core/. Skrip generate jalan
// otomatis sebelum dev/build/test via prehook npm.
import type { Feature } from "./types";
import type { CoreModule } from "./types";

import cek_ongkir from "./features/cek-ongkir"; // CEK_ONGKIR_FEATURE
import core_orders from "./features/core-orders"; // CORE_ORDERS_FEATURE
import core_products from "./features/core-products"; // CORE_PRODUCTS_FEATURE
import entitlements from "./core/entitlements";
import site_types from "./core/site-types";

/** Nama folder tiap feature module, sejajar index dengan GENERATED_FEATURE_CATALOG. */
export const GENERATED_FEATURE_FOLDERS = [
  "cek-ongkir",
  "core-orders",
  "core-products",
] as const;

/** Nama folder tiap core module. */
export const GENERATED_CORE_FOLDERS = [
  "entitlements",
  "site-types",
] as const;

/** Katalog semua feature modules (billable features). */
export const GENERATED_FEATURE_CATALOG = [
  cek_ongkir,
  core_orders,
  core_products,
];

/** Katalog core modules (infrastructure). */
export const GENERATED_CORE_CATALOG = [
  entitlements,
  site_types,
];
