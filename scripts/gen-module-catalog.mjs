/**
 * Generate `catalog.generated.ts` — registry semua module folder-based.
 *
 * Kontrak: setiap folder di `src/lib/modules/features/<id>/` dan
 * `src/lib/modules/core/<id>/` yang berisi `index.ts` dengan `export default`
 * atau `export const <FEATURE_NAME>_FEATURE` otomatis terdaftar di katalog.
 * Nama folder WAJIB kebab-case.
 *
 * Skrip ini jalan otomatis via prehook npm (predev/prebuild/pretest/dst),
 * jadi developer tidak perlu menyentuh file lain saat menambah module.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const featuresDir = join(root, "src", "lib", "modules", "features");
const coreDir = join(root, "src", "lib", "modules", "core");
const outFile = join(root, "src", "lib", "modules", "catalog.generated.ts");

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Scan directory for folders with index.ts */
function scanModules(dir, type) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((name) => existsSync(join(dir, name, "index.ts")))
    .filter((name) => KEBAB.test(name))
    .sort((a, b) => a.localeCompare(b));
}

const featureFolders = scanModules(featuresDir, "feature");
const coreFolders = scanModules(coreDir, "core");

if (featureFolders.length === 0 && coreFolders.length === 0) {
  console.error("gen-module-catalog: tidak ada folder module ber-index.ts di", featuresDir, "atau", coreDir);
  process.exit(1);
}

/** Nama folder → identifier JS yang aman ("cek-ongkir" → "cek_ongkir"). */
const ident = (name) => {
  const id = name.replace(/[^a-zA-Z0-9_$]/g, "_");
  return /^[0-9]/.test(id) ? `_${id}` : id;
};

/** Extract feature export name from index.ts (e.g., CEK_ONGOIR_FEATURE) */
function getFeatureExportName(folderPath) {
  const content = readFileSync(join(folderPath, "index.ts"), "utf8");
  // Match: export const XXX_FEATURE = ... or export default ...
  const constMatch = content.match(/export\s+const\s+([A-Z_]+_FEATURE)\s*=/);
  if (constMatch) return constMatch[1];
  const defaultMatch = content.match(/export\s+default\s+(\w+)/);
  if (defaultMatch) return defaultMatch[1];
  // Fallback: use folder name uppercased + _FEATURE
  return ident(folderPath.split("/").pop()).toUpperCase() + "_FEATURE";
}

const featureImports = featureFolders.map((f) => {
  const exportName = getFeatureExportName(join(featuresDir, f));
  return `import ${ident(f)} from "./features/${f}"; // ${exportName}`;
}).join("\n");

const coreImports = coreFolders.map((f) => {
  return `import ${ident(f)} from "./core/${f}";`;
}).join("\n");

const source = `// AUTO-GENERATED oleh scripts/gen-module-catalog.mjs — JANGAN edit manual.
// Tambah module = buat folder <id>/ berisi index.ts (export const XXX_FEATURE)
// di src/lib/modules/features/ atau src/lib/modules/core/. Skrip generate jalan
// otomatis sebelum dev/build/test via prehook npm.
import type { Feature } from "./types";
import type { CoreModule } from "./types";

${featureImports}
${coreImports}

/** Nama folder tiap feature module, sejajar index dengan GENERATED_FEATURE_CATALOG. */
export const GENERATED_FEATURE_FOLDERS = [
${featureFolders.map((f) => `  "${f}",`).join("\n")}
] as const;

/** Nama folder tiap core module. */
export const GENERATED_CORE_FOLDERS = [
${coreFolders.map((f) => `  "${f}",`).join("\n")}
] as const;

/** Katalog semua feature modules (billable features). */
export const GENERATED_FEATURE_CATALOG = [
${featureFolders.map((f) => `  ${ident(f)},`).join("\n")}
];

/** Katalog core modules (infrastructure). */
export const GENERATED_CORE_CATALOG = [
${coreFolders.map((f) => `  ${ident(f)},`).join("\n")}
];
`;

writeFileSync(outFile, source);
console.log(`✓ catalog.generated.ts — ${featureFolders.length} features: ${featureFolders.join(", ")}`);
console.log(`✓ catalog.generated.ts — ${coreFolders.length} core modules: ${coreFolders.join(", ")}`);