/**
 * Hapus total aset template hasil import ZIP lama.
 *
 * Yang dihapus: seluruh objek di bawah prefix `template-assets/` pada bucket
 * `product-images` (signed-URL 7 hari milik baris templates_library yang
 * sudah di-drop di migrasi 040). Foto produk user (`<websiteId>/...`)
 * TIDAK tersentuh.
 *
 * Pemakaian:
 *   bun scripts/purge-template-assets.ts            # dry-run (daftar saja)
 *   bun scripts/purge-template-assets.ts --execute  # hapus beneran
 *
 * Butuh env: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (lihat .env.example).
 */
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
const PREFIX = "template-assets";
const EXECUTE = process.argv.includes("--execute");

async function listRecursive(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  prefix: string,
  out: string[],
): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) throw new Error(`list ${prefix}: ${error.message}`);
  for (const entry of data ?? []) {
    if (!entry.name) continue;
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id == null) {
      // entri folder — telusuri
      await listRecursive(supabase, full, out);
    } else {
      out.push(full);
    }
  }
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi.");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const files: string[] = [];
  await listRecursive(supabase, PREFIX, files);
  console.log(`Ditemukan ${files.length} objek di ${BUCKET}/${PREFIX}/`);
  for (const f of files.slice(0, 50)) console.log(`  ${f}`);
  if (files.length > 50) console.log(`  ... +${files.length - 50} lainnya`);

  if (!EXECUTE) {
    console.log("DRY-RUN: tidak ada yang dihapus. Tambahkan --execute untuk menghapus.");
    return;
  }
  if (files.length === 0) {
    console.log("Sudah bersih.");
    return;
  }
  // Hapus per batch 100 (batas API storage).
  for (let i = 0; i < files.length; i += 100) {
    const batch = files.slice(i, i + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw new Error(`remove batch ${i}: ${error.message}`);
    console.log(`Terhapus ${Math.min(i + 100, files.length)}/${files.length}`);
  }
  console.log("SELESAI.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
