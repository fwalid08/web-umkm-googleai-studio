/**
 * Helper murni untuk impor ZIP template (dipakai user + admin route).
 *
 * Kontrak format (docs/AI_TEMPLATE_PROMPT.md §2):
 * - `template.json` di root (wajib).
 * - `thumbnail.<png|jpg|jpeg|webp>` di root (opsional).
 * - `assets/*` (opsional, `meta.json` dilewati — hanya referensi export).
 * - `behaviours/*.json` per-file (opsional, `meta.json` dilewati).
 * - `animations/meta.json` (opsional): array (atau objek tunggal) animasi
 *   deklaratif. Digabung SETELAH inline `template.json` (inline menang
 *   urutan, sama seperti behaviours).
 */

import { strFromU8 } from "fflate";

/** Batas jumlah animasi total (inline + folder). Samakan kedua route. */
export const IMPORT_MAX_ANIMATIONS = 100;

/** Batas ukuran satu file JSON animasi (sama seperti file behaviour). */
export const IMPORT_MAX_ANIMATION_FILE_BYTES = 200_000;

/** Nama file animasi yang dibaca import. Tepat satu path ini saja. */
export const ANIMATIONS_META_PATH = "animations/meta.json";

/**
 * Parse satu file `animations/meta.json`. Kembalikan array (kosong bila
 * rusak/terlalu besar/bukan objek) — tidak pernah melempar.
 */
export function parseAnimationsMetaFile(content: Uint8Array): unknown[] {
  if (!content || content.length === 0 || content.length > IMPORT_MAX_ANIMATION_FILE_BYTES) {
    return [];
  }
  try {
    const parsed = JSON.parse(strFromU8(content));
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") return [parsed];
    return [];
  } catch {
    return [];
  }
}

/**
 * Kumpulkan animasi dari `animations/meta.json` di dalam entri ZIP.
 * File rusak/terlalu besar dilewati diam-diam (konsisten dengan behaviours).
 */
export function collectAnimationsFromZip(
  entries: Array<[string, Uint8Array]>,
  max: number = IMPORT_MAX_ANIMATIONS,
): unknown[] {
  const out: unknown[] = [];
  for (const [path, content] of entries) {
    if (path !== ANIMATIONS_META_PATH) continue;
    out.push(...parseAnimationsMetaFile(content));
    if (out.length >= max) break;
  }
  return out.slice(0, max);
}

/**
 * Gabung animasi inline `template.json` + folder. Inline dulu (prioritas),
 * lalu folder; total dibatasi. Dipakai kedua route agar identik.
 */
export function mergeAnimations(
  inline: unknown,
  folder: unknown[],
  max: number = IMPORT_MAX_ANIMATIONS,
): unknown[] {
  const base = Array.isArray(inline) ? inline : [];
  return [...base, ...folder].slice(0, max);
}
