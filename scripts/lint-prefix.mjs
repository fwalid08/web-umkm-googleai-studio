#!/usr/bin/env node
// lint-prefix.mjs — CI guard konvensi prefix §5.6 (tanpa deps, jalan di node murni).
// Aturan: setiap CREATE TABLE di supabase/migrations/*.sql wajib memakai prefix
// terdaftar di src/lib/modules/prefixes.ts (MODULE_PREFIXES), atau masuk
// TABLE_WITHOUT_PREFIX_ALLOWLIST / LEGACY_TABLES_WITHOUT_PREFIX.
// Tabel BARU tanpa prefix => fail. Sinkron otomatis dengan registry TS via regex.

import { readdirSync, readFileSync } from "node:fs";
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

const dir = join(root, "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
let bad = 0;
for (const f of files) {
  const sql = readFileSync(join(dir, f), "utf8");
  for (const m of sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/g)) {
    if (!isAllowed(m[1])) {
      console.error(`❌ ${f}: tabel "${m[1]}" tanpa prefix (§5.6) — daftarkan prefix/modul dulu`);
      bad++;
    }
  }
}

if (bad > 0) {
  console.error(`❌ lint-prefix: ${bad} tabel melanggar konvensi.`);
  process.exit(1);
}
console.log(
  `✅ lint-prefix OK: ${files.length} file migrasi, prefix terdaftar [${prefixes.join(", ")}].`
);
