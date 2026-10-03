/**
 * Template ZIP export — import-compatible & round-trip safe.
 *
 * Kontrak format (lihat docs/AI_TEMPLATE_PROMPT.md §2 + import route):
 * - `template.json` di root (wajib) — dibaca import apa adanya.
 * - `thumbnail.<png|jpg|jpeg|webp>` di root (opsional) — di-upload jadi thumbnail_url.
 * - `assets/*` (opsional) — di-upload; string `assets/<nama>` di template.json
 *   diganti URL fresh sekali-pass via `replaceAssetUrls`. `assets/meta.json`
 *   dilewati import (hanya referensi).
 * - `behaviours/*.json` per-file (opsional, meta.json dilewati) — DIGABUNG
 *   dengan behaviours inline template.json. Karena itu export TIDAK menulis
 *   file behaviour individual: behaviours + animations hidup inline di
 *   template.json supaya re-import menghasilkan data yang identik (tanpa duplikat).
 * - TIDAK ada pembaca folder `animations/` di import — animations hanya
 *   selamat via inline template.json.
 *
 * Masalah yang diselesaikan helper ini (dulu export ≠ import):
 * 1. Export kadang JSON bukan ZIP → sekarang SELALU ZIP.
 * 2. template.json dulu menyimpan absolute signed-URL (kedaluwarsa 7 hari).
 *    Sekarang URL storage dipetakan balik ke path relatif `assets/<nama>`
 *    memakai metadata `assets` di DB (yang selalu tersinkron dengan
 *    template_data berkat self-healing refresh di GET [id]), sehingga
 *    re-import me-remap ke URL fresh.
 * 3. File thumbnail tidak pernah disertakan → sekarang diunduh (best-effort).
 * 4. `template.json` dulu dibentuk ulang secara lossy (picking key tertentu).
 *    Sekarang data tersimpan dipakai apa adanya (hanya URL yang ditulis ulang).
 */

import { zipSync, strToU8 } from "fflate";
import { parseSupabaseSignUrl, replaceAssetUrls } from "./template-urls";

export const EXPORT_MAX_ASSETS = 50;
export const EXPORT_MAX_ASSET_BYTES = 10 * 1024 * 1024; // 10 MB per file (sama seperti import)
export const EXPORT_FETCH_TIMEOUT_MS = 20000;

const ALLOWED_ASSET_EXTS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "ico",
  "avif",
  "js",
  "css",
]);

const ALLOWED_THUMB_EXTS = new Set(["png", "jpg", "jpeg", "webp"]);

export interface ExportAssetMeta {
  name?: unknown;
  path?: unknown;
  url?: unknown;
  type?: unknown;
  size?: unknown;
  storagePath?: unknown;
}

export interface ExportTemplateRow {
  id: string;
  name: string;
  description?: string | null;
  template_data: unknown;
  assets?: unknown;
  thumbnail_url?: unknown;
}

/** Dependensi I/O (di-inject agar bisa di-test tanpa network/storage). */
export interface ExportFetchDeps {
  /** Unduh bytes dari URL absolut. Kembalikan null bila gagal. */
  fetchBytes: (url: string) => Promise<Uint8Array | null>;
  /** Buat signed URL fresh dari storage path (fallback bila URL tersimpan kedaluwarsa). */
  signStoragePath?: (storagePath: string) => Promise<string | null>;
}

export interface BuiltTemplateZip {
  /** Tipe persis return zipSync agar bisa langsung jadi body NextResponse. */
  bytes: ReturnType<typeof zipSync>;
  fileName: string;
  warnings: string[];
  assetFiles: string[];
  thumbnailFile: string | null;
}

export function slugifyTemplateName(name: string): string {
  const slug = (name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "template";
}

/** Samakan normalisasi import: dukung wrapper `{ template: {...} }`. */
function normalizeTemplateData(data: unknown): Record<string, unknown> {
  const d = (data ?? {}) as Record<string, unknown>;
  if (d.template && typeof d.template === "object" && !Array.isArray(d.template)) {
    const inner = d.template as Record<string, unknown>;
    return { ...inner, description: d.description ?? inner.description };
  }
  return { ...d };
}

/** Sanitasi nama file aset untuk path ZIP. Kembalikan null bila tidak aman. */
function sanitizeAssetName(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  const forward = raw.replace(/\\/g, "/");
  if (forward.startsWith("/") || forward.includes("..")) return null;
  const parts = forward.split("/").filter((p) => p !== "" && p !== ".");
  if (parts.length === 0 || parts.some((p) => p === "..")) return null;
  return parts.join("/");
}

function extOf(filename: string): string {
  return filename.toLowerCase().split(".").pop() || "";
}

/** Tebak ekstensi gambar dari magic bytes. */
function sniffImageExt(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "webp";
  return null;
}

function thumbFileName(url: string, bytes: Uint8Array | null): string {
  let path = "";
  try {
    path = new URL(url).pathname;
  } catch {
    path = url.split("?")[0];
  }
  const urlExt = extOf(path.split("/").pop() || "");
  if (ALLOWED_THUMB_EXTS.has(urlExt)) return `thumbnail.${urlExt}`;
  const sniffed = bytes ? sniffImageExt(bytes) : null;
  if (sniffed && ALLOWED_THUMB_EXTS.has(sniffed)) return `thumbnail.${sniffed}`;
  return "thumbnail.png";
}

/**
 * Unduh bytes dengan fallback signed-URL fresh:
 * 1. Coba URL tersimpan apa adanya.
 * 2. Bila gagal dan URL adalah Supabase signed URL, sign ulang path-nya lalu unduh.
 */
async function downloadWithRefreshFallback(
  url: string,
  deps: ExportFetchDeps,
): Promise<Uint8Array | null> {
  try {
    const direct = await deps.fetchBytes(url);
    if (direct && direct.length > 0) return direct;
  } catch {
    // lanjut ke fallback
  }
  if (!deps.signStoragePath) return null;
  try {
    const parsed = parseSupabaseSignUrl(url);
    if (!parsed) return null;
    const fresh = await deps.signStoragePath(parsed.path);
    if (!fresh) return null;
    const retry = await deps.fetchBytes(fresh);
    return retry && retry.length > 0 ? retry : null;
  } catch {
    return null;
  }
}

/**
 * Bangun ZIP export yang bisa di-import ulang apa adanya (round-trip).
 * Tidak pernah melempar untuk masalah aset/thumbnail (best-effort + warnings);
 * hanya melempar bila template_data bukan objek.
 */
export async function buildTemplateExportZip(
  row: ExportTemplateRow,
  deps: ExportFetchDeps,
): Promise<BuiltTemplateZip> {
  if (!row.template_data || typeof row.template_data !== "object" || Array.isArray(row.template_data)) {
    throw new Error("Template data is not a valid object");
  }

  const warnings: string[] = [];
  const files: Record<string, Uint8Array> = {};
  const assetFiles: string[] = [];

  const data = normalizeTemplateData(row.template_data);
  const metas: ExportAssetMeta[] = Array.isArray(row.assets)
    ? (row.assets as ExportAssetMeta[]).slice(0, EXPORT_MAX_ASSETS)
    : [];

  // 1. Unduh thumbnail dulu (dibutuhkan sebelum rewrite URL).
  //    Prinsip: HANYA URL yang file-nya berhasil masuk ZIP yang ditulis ulang
  //    ke path relatif — kalau tidak, template.json akan mereferensikan file
  //    yang tidak ada (lebih rusak daripada URL lama).
  let thumbnailFile: string | null = null;
  let thumbnailBytes: Uint8Array | null = null;
  const thumbUrl = typeof row.thumbnail_url === "string" && /^https?:\/\//.test(row.thumbnail_url)
    ? row.thumbnail_url
    : null;
  if (thumbUrl) {
    const candidate = await downloadWithRefreshFallback(thumbUrl, deps);
    if (candidate && candidate.length > 0 && candidate.length <= EXPORT_MAX_ASSET_BYTES) {
      thumbnailBytes = candidate;
      thumbnailFile = thumbFileName(thumbUrl, candidate);
      files[thumbnailFile] = candidate;
    } else if (candidate) {
      warnings.push(`Thumbnail dilewati: ukuran ${candidate.length} bytes melebihi batas.`);
    } else {
      warnings.push("Thumbnail tidak bisa diunduh (URL kedaluwarsa/tidak bisa diakses); URL lama tetap dipakai.");
    }
  }

  // 2. Unduh file aset aktual (best-effort). Catat yang BERHASIL saja.
  const downloaded: { safeName: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const meta of metas) {
    const safeName = sanitizeAssetName(meta?.name);
    if (!safeName) {
      warnings.push("Aset dilewati: nama file tidak valid.");
      continue;
    }
    const zipPath = `assets/${safeName}`;
    if (seen.has(zipPath)) continue;
    seen.add(zipPath);
    if (downloaded.length >= EXPORT_MAX_ASSETS) {
      warnings.push(`Batas ${EXPORT_MAX_ASSETS} aset tercapai; sisanya dilewati.`);
      break;
    }
    const url = typeof meta?.url === "string" ? meta.url : null;
    if (!url || !/^https?:\/\//.test(url)) {
      warnings.push(`Aset dilewati (tanpa URL valid): ${safeName}.`);
      continue;
    }
    let bytes: Uint8Array | null = null;
    try {
      bytes = await downloadWithRefreshFallback(url, deps);
    } catch {
      bytes = null;
    }
    if (!bytes || bytes.length === 0) {
      warnings.push(`Aset tidak bisa diunduh, hanya referensi meta: ${safeName}.`);
      continue;
    }
    if (bytes.length > EXPORT_MAX_ASSET_BYTES) {
      warnings.push(`Aset dilewati (melebihi 10 MB): ${safeName}.`);
      continue;
    }
    files[zipPath] = bytes;
    assetFiles.push(zipPath);
    downloaded.push({ safeName, url });
  }

  // 3. Reverse-map: absolute storage URL -> path relatif assets/<nama>,
  //    HANYA untuk file yang benar-benar masuk ZIP. Dipakai replaceAssetUrls
  //    (single-pass, longest-first) agar re-import me-remap ke URL fresh.
  //    URL yang file-nya gagal diunduh dibiarkan apa adanya (jujur).
  const reverseMap = new Map<string, string>();
  for (const { safeName, url } of downloaded) {
    if (extOf(safeName) && !ALLOWED_ASSET_EXTS.has(extOf(safeName))) continue;
    reverseMap.set(url, `assets/${safeName}`);
  }
  if (thumbUrl && thumbnailBytes && thumbnailFile) {
    const serialized = JSON.stringify(data);
    if (serialized.includes(thumbUrl)) {
      const assetCopy = `assets/${thumbnailFile}`;
      files[assetCopy] = thumbnailBytes;
      assetFiles.push(assetCopy);
      reverseMap.set(thumbUrl, assetCopy);
    }
  }

  const rewritten = replaceAssetUrls(data, reverseMap) as Record<string, unknown>;

  // 4. assets/meta.json — referensi saja (import memang melewatinya by design).
  if (metas.length > 0) {
    files["assets/meta.json"] = strToU8(JSON.stringify(metas, null, 2));
  }

  // 5. template.json — data tersimpan apa adanya (hanya URL yang ditulis ulang).
  //    behaviours + animations tetap inline: import membacanya dari sini, dan
  //    menulis file behaviours/*.json justru akan menduplikasi saat re-import
  //    (import menggabung inline + folder). animations/ tidak punya pembaca
  //    di import, jadi tidak ditulis.
  files["template.json"] = strToU8(JSON.stringify(rewritten, null, 2));

  const bytes = zipSync(files, { level: 6 });
  return {
    bytes,
    fileName: `template-${slugifyTemplateName(row.name)}.zip`,
    warnings,
    assetFiles,
    thumbnailFile,
  };
}

/** Deps default untuk route: fetch dengan timeout + signer storage provider. */
export function createRouteFetchDeps(opts: {
  fetchImpl?: typeof fetch;
  signStoragePath?: (storagePath: string) => Promise<string | null>;
  timeoutMs?: number;
} = {}): ExportFetchDeps {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? EXPORT_FETCH_TIMEOUT_MS;
  return {
    fetchBytes: async (url: string) => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeoutMs);
        try {
          const res = await fetchImpl(url, { signal: ctrl.signal });
          if (!res.ok) return null;
          const buf = new Uint8Array(await res.arrayBuffer());
          return buf.length > 0 ? buf : null;
        } finally {
          clearTimeout(timer);
        }
      } catch {
        return null;
      }
    },
    signStoragePath: opts.signStoragePath,
  };
}
