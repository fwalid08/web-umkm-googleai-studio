#!/usr/bin/env node
// lint-module-prefix.mjs — CI guard konvensi prefix §5.6 untuk feature modules.
// Perluas lint-prefix.mjs: validasi prefix feature modules + migration files per feature.

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registrySrc = readFileSync(join(root, "src/lib/modules/prefixes.ts"), "utf8");

function extractBlock(startMarker, endMarker) {
  const s = registrySrc.indexOf(startMarker);
  if (s === -1) throw new Error(`Marker tidak ketemu: ${startMarker}`);
  const e = registrySrc.indexOf(endMarker, s);
  if (e === -1) throw new Error(`Marker akhir tidak ketemu: ${endMarker}`);
  return registrySrc.slice(s, e);
}

function extractStrings(block) {
  return [...block.matchAll(/"([a-z_][a-z0-9_]*)"/g)].map((m) => m[1]);
}

// Nilai prefix = semua string pendek berpola ^[a-z]{2,5}_$ di blok MODULE_PREFIXES.
const prefixBlock = extractBlock("MODULE_PREFIXES = {", "} as const");
const prefixes = extractStrings(prefixBlock).filter((v) => /^[a-z]{2,5}_$/.test(v));
if (prefixes.length === 0) throw new Error("Tidak ada prefix terbaca dari MODULE_PREFIXES");

const allowBlock = extractBlock(
  "TABLE_WITHOUT_PREFIX_ALLOWLIST: ReadonlySet<string> = new Set([",
  "]);"
);
const legacyBlock = extractBlock(
  "LEGACY_TABLES_WITHOUT_PREFIX: ReadonlySet<string> = new Set([",
  "]);"
);
const allowed = new Set([...extractStrings(allowBlock), ...extractStrings(legacyBlock)]);

const isAllowed = (t) =>
  prefixes.some((p) => t.startsWith(p)) || allowed.has(t);

// Validasi migrasi di supabase/migrations/
const migrationsDir = join(root, "supabase", "migrations");
const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
let bad = 0;

for (const f of migrationFiles) {
  const sql = readFileSync(join(migrationsDir, f), "utf8");
  // Handles quoted + schema-qualified names: "public"."foo", public.foo, foo
  for (const m of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:"?[\w$]+"?\.)?"?([\w$]+)"?/g)) {
    if (!isAllowed(m[1])) {
      console.error(`❌ ${f}: tabel "${m[1]}" tanpa prefix (§5.6) — daftarkan prefix/modul dulu`);
      bad++;
    }
  }
}

// Validasi feature modules: setiap folder features/*/ harus punya prefix.ts
const featuresDir = join(root, "src", "lib", "modules", "features");
if (existsSync(featuresDir)) {
  const featureFolders = readdirSync(featuresDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
    .map((d) => d.name);

  for (const folder of featureFolders) {
    const prefixFile = join(featuresDir, folder, "prefix.ts");
    if (!existsSync(prefixFile)) {
      console.error(`❌ features/${folder}: tidak ada prefix.ts — wajib export const PREFIX = 'xxx_'`);
      bad++;
      continue;
    }
    const content = readFileSync(prefixFile, "utf8");
    const match = content.match(/export const PREFIX = ['"]([a-z]{2,5}_)['"]/);
    if (!match) {
      console.error(`❌ features/${folder}/prefix.ts: format salah — harus export const PREFIX = 'xxx_'`);
      bad++;
      continue;
    }
    const prefix = match[1];
    if (!prefixes.includes(prefix)) {
      console.error(`❌ features/${folder}/prefix.ts: prefix "${prefix}" tidak terdaftar di MODULE_PREFIXES`);
      bad++;
    }
    // Validasi migration.sql exists
    const migrationFile = join(featuresDir, folder, "migration.sql");
    if (!existsSync(migrationFile)) {
      console.warn(`⚠️  features/${folder}: tidak ada migration.sql (disarankan ada)`);
    }
  }
}

// Validasi core modules
const coreDir = join(root, "src", "lib", "modules", "core");
if (existsSync(coreDir)) {
  const coreFolders = readdirSync(coreDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
    .map((d) => d.name);

  for (const folder of coreFolders) {
    const migrationFile = join(coreDir, folder, "migration.sql");
    if (!existsSync(migrationFile)) {
      console.warn(`⚠️  core/${folder}: tidak ada migration.sql (disarankan ada)`);
    }
  }
}

if (bad > 0) {
  console.error(`\n❌ lint-module-prefix: ${bad} pelanggaran konvensi prefix.`);
  process.exit(1);
}

console.log(`✅ lint-module-prefix OK: ${migrationFiles.length} file migrasi, ${prefixes.length} prefix terdaftar [${prefixes.join(", ")}].`);