/**
 * Generate `catalog.generated.ts` — registry semua template folder-based.
 *
 * Kontrak: setiap folder di `src/lib/builder/templates/<id>/` yang berisi
 * `index.ts` dengan `export default` objek CatalogTemplate otomatis terdaftar
 * di katalog. Nama folder WAJIB kebab-case dan sama dengan `template.id`
 * (ditegakkan oleh test kontrak di catalog.test.ts).
 *
 * Skrip ini jalan otomatis via prehook npm (predev/prebuild/pretest/dst),
 * jadi developer tidak perlu menyentuh file lain saat menambah template.
 */
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatesDir = join(root, "src", "lib", "builder", "templates");
const outFile = join(templatesDir, "catalog.generated.ts");

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const folders = readdirSync(templatesDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((name) => existsSync(join(templatesDir, name, "index.ts")))
  .sort((a, b) => a.localeCompare(b));

if (folders.length === 0) {
  console.error(
    "gen-template-catalog: tidak ada folder template ber-index.ts di",
    templatesDir
  );
  process.exit(1);
}

for (const name of folders) {
  if (!KEBAB.test(name)) {
    console.error(
      `gen-template-catalog: nama folder "${name}" harus kebab-case (mis. "laundry-emerald").`
    );
    process.exit(1);
  }
}

/** Nama folder → identifier JS yang aman ("laundry-emerald" → "laundry_emerald"). */
const ident = (name) => {
  const id = name.replace(/[^a-zA-Z0-9_$]/g, "_");
  return /^[0-9]/.test(id) ? `_${id}` : id;
};

const source = `// AUTO-GENERATED oleh scripts/gen-template-catalog.mjs — JANGAN edit manual.
// Tambah template = buat folder <id>/ berisi index.ts (export default
// CatalogTemplate) di src/lib/builder/templates/. Skrip generate jalan
// otomatis sebelum dev/build/test via prehook npm.
import type { CatalogTemplate } from "./catalog";
${folders.map((f) => `import ${ident(f)} from "./${f}";`).join("\n")}

/** Nama folder tiap template, sejajar index dengan GENERATED_CATALOG. */
export const GENERATED_TEMPLATE_FOLDERS = [
${folders.map((f) => `  "${f}",`).join("\n")}
] as const;

export const GENERATED_CATALOG: CatalogTemplate[] = [
${folders.map((f) => `  ${ident(f)},`).join("\n")}
];
`;

writeFileSync(outFile, source);
console.log(
  `✓ catalog.generated.ts — ${folders.length} template: ${folders.join(", ")}`
);
