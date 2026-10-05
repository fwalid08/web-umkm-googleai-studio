/**
 * Verifikasi URL foto template katalog benar-benar tersaji (HTTP 200).
 *
 * Latar: template laundry-emerald pernah memakai ID Pexels yang ternyata
 * foto sarapan — lolos semua unit test karena hanya string. Script ini
 * HEAD setiap URL gambar di BUILT_IN_CATALOG dan melaporkan yang mati.
 *
 * Pemakaian:
 *   bun scripts/verify-template-images.ts
 *
 * Catatan: hanya memeriksa status HTTP, BUKAN kesesuaian subjek foto.
 * Subjek tetap diverifikasi manual dari halaman Pexels-nya (lihat
 * docs/UNIQUE_TEMPLATE_SPEC.md) sebelum ID dimasukkan ke template.
 */
import { BUILT_IN_CATALOG } from "../src/lib/builder/templates/catalog";

function collectImageUrls(value: unknown, out: Set<string>): void {
  if (typeof value === "string") {
    const re = /https?:\/\/[^\s"'<>]+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(value)) !== null) {
      if (/\.(jpeg|jpg|png|webp|gif|svg|avif)(\?|$)/i.test(m[0])) out.add(m[0]);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectImageUrls(v, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) collectImageUrls(v, out);
  }
}

async function check(url: string): Promise<{ url: string; ok: boolean; status: number }> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return { url, ok: res.ok, status: res.status };
  } catch {
    return { url, ok: false, status: 0 };
  }
}

const urls = new Set<string>();
for (const t of BUILT_IN_CATALOG) collectImageUrls(t, urls);
console.log(`Memeriksa ${urls.size} URL gambar dari ${BUILT_IN_CATALOG.length} template...`);

const results = await Promise.all([...urls].map(check));
const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "OK  " : "FAIL"} ${r.status}  ${r.url}`);
}
if (failed.length > 0) {
  console.error(`\n${failed.length} URL mati — perbaiki sebelum merge.`);
  process.exit(1);
}
console.log("\nSemua URL gambar tersaji (HTTP 200).");
