// AUTO-GENERATED oleh scripts/gen-module-catalog.mjs — JANGAN edit manual.
// Tambah module = buat folder <id>/ berisi index.ts (export const XXX_FEATURE)
// di src/lib/modules/features/ atau src/lib/modules/core/. Skrip generate jalan
// otomatis sebelum dev/build/test via prehook npm.
import type { Feature } from "./types";
import type { CoreModule } from "./types";

import { CEK_ONGOIR_FEATURE } from "./features/cek-ongkir";
import { ORDERS_WA_FEATURE } from "./features/core-orders";
import { PRODUCTS_DASAR_FEATURE } from "./features/core-products";
import * as entitlements from "./core/entitlements";
import * as site_types from "./core/site-types";

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
export const GENERATED_FEATURE_CATALOG: Feature[] = [
  CEK_ONGOIR_FEATURE,
  ORDERS_WA_FEATURE,
  PRODUCTS_DASAR_FEATURE,
];

/** Katalog core modules (infrastructure). */
export const GENERATED_CORE_CATALOG: CoreModule[] = [
  entitlements as unknown as CoreModule,
  site_types as unknown as CoreModule,
];
