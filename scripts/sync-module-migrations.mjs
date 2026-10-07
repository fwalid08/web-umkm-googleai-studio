#!/usr/bin/env node
/**
 * sync-module-migrations.mjs
 * Sync module migration.sql files to supabase/migrations/ with proper numbering.
 *
 * Usage:
 *   bun scripts/sync-module-migrations.mjs        # Dry run (show plan)
 *   bun scripts/sync-module-migrations.mjs --apply # Write migrations
 *
 * Reads: src/lib/modules/ migration.sql files
 * Writes: supabase/migrations/NNN_name.sql (sequential from last existing)
 *
 * DEPRECATED (2026-10-07): supabase/migrations/ is now a hand-maintained
 * squashed baseline (001-009) generated from the verified remote dump.
 * DO NOT run --apply: it would overwrite the squash with per-module files
 * using stale 062+ numbering. Update this script before any future use.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const modulesDir = join(root, "src", "lib", "modules");
const migrationsDir = join(root, "supabase", "migrations");
const apply = process.argv.includes("--apply");
const DRY_RUN = !apply;

console.log(`${DRY_RUN ? "🔍 DRY RUN" : "🚀 APPLY MODE"} — Sync module migrations\n`);

function getNextMigrationNumber() {
  const files = readdirSync(migrationsDir).filter(f => f.endsWith(".sql"));
  const nums = files.map(f => parseInt(f.split("_")[0], 10)).filter(n => !isNaN(n));
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}

const nextNum = getNextMigrationNumber();
console.log(`📋 Last migration: ${nextNum - 1}, next: ${nextNum}\n`);

const MIGRATION_PLAN = [
  {
    id: "mod_features",
    label: "mod_features",
    source: "core/features/migration.sql",
    tables: ["mod_features", "mod_packs", "mod_pack_features", "mod_site_prices"],
    deps: [],
    description: "Feature catalog, packs, pack features, site pricing matrix",
  },
  {
    id: "mod_subscriptions",
    label: "mod_subscriptions",
    source: "core/subscriptions/migration.sql",
    tables: ["mod_sub_addons", "mod_global_subs", "mod_usage"],
    deps: ["mod_features"],
    description: "Website addons, global subscriptions, usage metering",
  },
  {
    id: "site_types",
    label: "site_types",
    source: "core/site-types/migration.sql",
    tables: ["ws_websites.site_type", "bill_subscriptions.site_type", "bill_subscriptions.pack_id"],
    deps: [],
    description: "Add site_type to websites & subscriptions",
  },
  {
    id: "entitlements",
    label: "entitlements",
    source: "core/entitlements/migration.sql",
    tables: ["indexes", "RLS policies"],
    deps: ["mod_features", "mod_subscriptions", "site_types"],
    description: "Entitlements indexes & RLS policies",
  },
  {
    id: "core_products",
    label: "prod_products",
    source: "features/core-products/migration.sql",
    tables: ["prod_products", "prod_images", "prod_variants", "prod_stock_movements", "prod_categories"],
    deps: ["mod_features", "site_types"],
    description: "Products, images, variants, stock movements, categories",
  },
  {
    id: "core_orders",
    label: "ord_orders",
    source: "features/core-orders/migration.sql",
    tables: ["ord_orders"],
    deps: ["mod_features", "site_types", "core_products"],
    description: "WhatsApp checkout orders",
  },
  {
    id: "core_template",
    label: "bld_templates",
    source: "features/core-template/migration.sql",
    tables: ["bld_templates", "bld_user_templates"],
    deps: ["mod_features"],
    description: "Built-in templates & user template assignments",
  },
  {
    id: "stock_tracking",
    label: "stock_tracking",
    source: "features/stock-tracking/migration.sql",
    tables: ["prod_stock_movements (extend)", "RLS"],
    deps: ["core_products"],
    description: "Stock tracking extension",
  },
  {
    id: "customer_list",
    label: "customer_list",
    source: "features/customer-list/migration.sql",
    tables: ["uses ord_orders"],
    deps: ["core_orders"],
    description: "Customer list from orders",
  },
  {
    id: "custom_domain",
    label: "custom_domain",
    source: "features/custom-domain/migration.sql",
    tables: ["dom_orders", "ws_websites.custom_domain"],
    deps: ["site_types"],
    description: "Custom domain orders & website field",
  },
  {
    id: "template_premium",
    label: "template_premium",
    source: "features/template-premium/migration.sql",
    tables: ["bld_templates (tier gate)"],
    deps: ["core_template"],
    description: "Premium template tier gating",
  },
  {
    id: "analytics_export",
    label: "analytics_export",
    source: "features/analytics-export/migration.sql",
    tables: ["anl_exports", "anl_reports"],
    deps: ["mod_features"],
    description: "Analytics export tables",
  },
  {
    id: "cek_ongkir",
    label: "ong_cek_ongkir",
    source: "features/cek-ongkir/migration.sql",
    tables: ["ong_rates_cache", "ong_usage_log"],
    deps: ["core_products", "core_orders", "mod_subscriptions"],
    description: "Shipping rate cache & usage log",
  },
  {
    id: "payment_online",
    label: "pay_online",
    source: "features/payment-online/migration.sql",
    tables: ["pay_transactions", "pay_refunds"],
    deps: ["core_products", "core_orders", "mod_subscriptions"],
    description: "Online payment transactions",
  },
  {
    id: "pages_extra",
    label: "pages_extra",
    source: "features/pages-extra/migration.sql",
    tables: ["ws_websites.max_pages"],
    deps: ["site_types"],
    description: "Extra pages quota",
  },
  {
    id: "akunting_dasar",
    label: "acc_dasar",
    source: "features/akunting-dasar/migration.sql",
    tables: ["acc_journals", "acc_accounts", "acc_ledgers"],
    deps: ["core_orders"],
    description: "Basic accounting journals & ledgers",
  },
  {
    id: "akunting_lanjutan",
    label: "acc_lanjutan",
    source: "features/akunting-lanjutan/migration.sql",
    tables: ["acc_reports", "acc_tax_calculations"],
    deps: ["akunting_dasar"],
    description: "Advanced accounting reports & tax",
  },
  {
    id: "hrm_core",
    label: "hrm_core",
    source: "features/hrm-core/migration.sql",
    tables: ["hrm_employees", "hrm_attendance", "hrm_shifts"],
    deps: [],
    description: "HRM core: employees, attendance, shifts",
  },
  {
    id: "payroll",
    label: "pay_payroll",
    source: "features/payroll/migration.sql",
    tables: ["pay_payslips", "pay_thr", "pay_tax"],
    deps: ["hrm_core", "akunting_dasar"],
    description: "Payroll: payslips, THR, PPh21",
  },
  {
    id: "wa_gateway",
    label: "wgt_gateway",
    source: "features/wa-gateway/migration.sql",
    tables: ["wgt_templates", "wgt_broadcasts", "wgt_deliveries"],
    deps: [],
    description: "WhatsApp gateway templates & broadcasts",
  },
];

function topologicalSort(plan) {
  const nodes = new Map(plan.map(p => [p.id, p]));
  const edges = new Map(plan.map(p => [p.id, new Set(p.deps)]));
  const inDegree = new Map(plan.map(p => [p.id, p.deps.length]));
  const queue = [...nodes.keys()].filter(id => inDegree.get(id) === 0);
  const sorted = [];

  while (queue.length > 0) {
    const id = queue.shift();
    sorted.push(nodes.get(id));
    for (const [nid, deps] of edges) {
      if (deps.has(id)) {
        deps.delete(id);
        const newDegree = (inDegree.get(nid) || 0) - 1;
        inDegree.set(nid, newDegree);
        if (newDegree === 0) queue.push(nid);
      }
    }
  }

  if (sorted.length !== plan.length) {
    const remaining = plan.filter(p => !sorted.includes(p));
    throw new Error(`Circular dependency detected: ${remaining.map(r => r.id).join(" -> ")}`);
  }
  return sorted;
}

const sortedPlan = topologicalSort(MIGRATION_PLAN);

function readMigrationSource(sourcePath) {
  const fullPath = join(modulesDir, sourcePath);
  if (!existsSync(fullPath)) {
    return null;
  }
  return readFileSync(fullPath, "utf8");
}

function generateMigrationContent(plan, number) {
  const header = `-- Migration ${String(number).padStart(3, "0")}: ${plan.label}
-- ${plan.description}
-- Source: src/lib/modules/${plan.source}
-- Generated by sync-module-migrations.mjs
-- DO NOT EDIT MANUALLY - edit source file instead

`;
  const source = readMigrationSource(plan.source);
  if (!source) return null;
  return header + source + "\n";
}

console.log("📦 Migration Plan (topologically sorted):\n");

let currentNum = nextNum;
for (const plan of sortedPlan) {
  const sourcePath = join(modulesDir, plan.source);
  const exists = existsSync(sourcePath);
  const status = exists ? "✅" : "⚠️  (missing source)";
  console.log(`  ${String(currentNum).padStart(3, "0")}_${plan.label}.sql  ${status}`);
  console.log(`    Tables: ${plan.tables.join(", ")}`);
  console.log(`    Deps: ${plan.deps.length > 0 ? plan.deps.join(", ") : "(none)"}`);
  console.log();
  currentNum++;
}

if (DRY_RUN) {
  console.log("💡 Run with --apply to write migrations");
  process.exit(0);
}

console.log("📝 Writing migrations...\n");

currentNum = nextNum;
for (const plan of sortedPlan) {
  const content = generateMigrationContent(plan, currentNum);
  if (!content) {
    console.warn(`  ⏭️  Skipping ${plan.label} (no source)`);
    continue;
  }

  const filename = `${String(currentNum).padStart(3, "0")}_${plan.label}.sql`;
  const outPath = join(migrationsDir, filename);

  if (existsSync(outPath)) {
    console.warn(`  ⚠️  ${filename} already exists, skipping`);
  } else {
    writeFileSync(outPath, content);
    console.log(`  ✅ ${filename}`);
  }
  currentNum++;
}

console.log("\n✅ Done! Run 'supabase db push' to apply.");
