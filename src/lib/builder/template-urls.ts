/**
 * Refresh signed URL aset template (bom waktu 7 hari).
 *
 * Bucket `product-images` bersifat PRIVATE: setiap URL aset/thumbnail hasil
 * import adalah signed URL kedaluwarsa 7 hari (`expiresIn: 604800`). Tanpa
 * refresh, gambar template mati sendiri seminggu setelah import meski tidak
 * ada yang diubah.
 *
 * Strategi: saat template library DIBACA (GET list & GET item — jalur yang
 * dipakai galeri, preview, dan apply), URL yang akan kedaluwarsa < 24 jam
 * di-sign ulang dan hasilnya disimpan kembali ke DB (self-healing).
 * Semua kegagalan bersifat fail-soft: URL lama tetap dipakai.
 */

/** Dianggap "hampir kedaluwarsa" bila sisa < 24 jam. */
export const URL_REFRESH_THRESHOLD_SECS = 24 * 3600;

/** Masa berlaku URL hasil refresh: 7 hari (sama seperti saat import). */
export const URL_REFRESH_EXPIRES_SECS = 7 * 24 * 3600;

export interface ParsedSignUrl {
  bucket: string;
  path: string;
  token: string;
}

/** Ambil bucket+path+token dari Supabase signed URL (`/object/sign/...`). */
export function parseSupabaseSignUrl(url: string): ParsedSignUrl | null {
  if (typeof url !== 'string') return null;
  // Lazy `[^#]*?`: ambil kemunculan `token=` PERTAMA. Versi greedy melompat ke
  // `token=` terakhir sehingga URL ganda (5 segmen) terbaca seolah valid.
  const m = url.match(/\/storage\/v1\/object\/sign\/([^/?]+)\/([^?]+)\?[^#]*?token=([^&#]+)/);
  if (!m) return null;
  try {
    return { bucket: m[1], path: decodeURIComponent(m[2]), token: decodeURIComponent(m[3]) };
  } catch {
    return null;
  }
}

/** Baca klaim `exp` dari JWT tanpa verifikasi (hanya untuk jadwal refresh). */
export function readJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Ganti SEMUA path lokal aset dengan URL storage dalam SATU pass.
 *
 * JANGAN loop split/join per entri: URL hasil penggantian memuat nama file
 * yang sama (mis. `.../hero.svg?token=...`), sehingga entri berikutnya
 * (`hero.svg`) cocok DI DALAM URL yang baru disisipkan dan menempelkan
 * signed URL kedua — token menjadi 5 segmen → Supabase menolak dengan
 * 400 InvalidJWT dan gambar mati. Single-pass: hasil sisipan tidak pernah
 * dipindai ulang. Dipakai import ZIP (penggantian `assets/...` → URL).
 */
export function replaceAssetUrls(obj: unknown, assetMap: Map<string, string>): unknown {
  const entries = [...assetMap.entries()].filter(([k, v]) => !!k && !!v);
  if (entries.length === 0) return obj;
  // Terpanjang dulu agar `assets/hero.svg` menang atas `hero.svg`.
  entries.sort((a, b) => b[0].length - a[0].length);
  const pattern = new RegExp(entries.map(([k]) => escapeRegExp(k)).join('|'), 'g');
  const lookup = new Map(entries);
  const replaceOne = (str: string): string =>
    str.replace(pattern, (match) => lookup.get(match) ?? match);
  const walk = (value: unknown): unknown => {
    if (typeof value === 'string') return replaceOne(value);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = walk(val);
      }
      return result;
    }
    return value;
  };
  return walk(obj);
}

/** True bila URL adalah signed URL yang kedaluwarsa dalam `withinSecs`. */
export function signUrlNeedsRefresh(url: string, withinSecs = URL_REFRESH_THRESHOLD_SECS): boolean {
  const parsed = parseSupabaseSignUrl(url);
  if (!parsed) return false;
  if (!isValidSignToken(parsed.token)) return false;
  const exp = readJwtExp(parsed.token);
  if (exp === null) return false;
  return exp - Math.floor(Date.now() / 1000) < withinSecs;
}

/** Token signed URL valid = tepat 3 segmen JWS kompak. */
export function isValidSignToken(token: string): boolean {
  return token.split('.').length === 3;
}

// Path mengecualikan `:` agar match di URL luar yang rusak gagal dan engine
// maju ke URL dalam yang valid — tanpa ini `[^?#]+` menelan `.../p/https://...`
// sekaligus dan "perbaikan" mengembalikan string yang masih rusak.
const VALID_SIGN_URL_PATTERN =
  /https?:\/\/[^?#\/]+\/storage\/v1\/object\/sign\/[^?#:]+[?]token=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

/**
 * Perbaiki signed URL rusak akibat double-replacement saat import lama
 * (`replaceAssetUrls` versi loop menempelkan URL kedua di dalam URL pertama
 * sehingga token menjadi 5 segmen → 400 InvalidJWT).
 *
 * Bentuk rusak selalu memuat URL dalam yang valid di depannya, jadi perbaikan
 * = ambil kemunculan valid PERTAMA. Mengembalikan null bila tidak ada yang
 * bisa diselamatkan.
 */
export function repairDoubledSignUrl(url: string): string | null {
  if (typeof url !== 'string') return null;
  const parsed = parseSupabaseSignUrl(url);
  if (!parsed) return null;
  if (isValidSignToken(parsed.token)) return null;
  const m = url.match(VALID_SIGN_URL_PATTERN);
  return m ? m[0] : null;
}

function replaceUrlStrings(
  value: unknown,
  replacements: Map<string, string>,
): { value: unknown; changed: boolean } {
  if (typeof value === 'string') {
    let out = value;
    let changed = false;
    for (const [oldUrl, newUrl] of replacements) {
      if (oldUrl && newUrl && out.includes(oldUrl)) {
        out = out.split(oldUrl).join(newUrl);
        changed = true;
      }
    }
    return { value: out, changed };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const arr = value.map((v) => {
      const r = replaceUrlStrings(v, replacements);
      if (r.changed) changed = true;
      return r.value;
    });
    return { value: arr, changed };
  }
  if (value && typeof value === 'object') {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = replaceUrlStrings(v, replacements);
      if (r.changed) changed = true;
      out[k] = r.value;
    }
    return { value: out, changed };
  }
  return { value, changed: false };
}

function collectSignUrls(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    if (parseSupabaseSignUrl(value)) out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) collectSignUrls(v, out);
    return;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) collectSignUrls(v, out);
  }
}

export interface RefreshableTemplate {
  thumbnail_url?: unknown;
  assets?: unknown;
  template_data?: unknown;
}

export interface RefreshResult<T extends RefreshableTemplate> {
  row: T;
  changed: boolean;
  refreshed: number;
}

/**
 * Refresh semua signed URL yang hampir kedaluwarsa di baris template.
 *
 * `signer(path)` mengembalikan signed URL baru atau null bila gagal.
 * Tidak pernah melempar — kegagalan per-URL dilewati (URL lama dipakai).
 */
export async function refreshTemplateUrls<T extends RefreshableTemplate>(
  row: T,
  signer: (storagePath: string) => Promise<string | null>,
  withinSecs = URL_REFRESH_THRESHOLD_SECS,
): Promise<RefreshResult<T>> {
  // Pass 1 — perbaiki URL rusak (token ≠ 3 segmen) sebelum cek kedaluwarsa.
  // Tanpa ini URL 5-segmen lolos begitu saja dan gambar tetap 400.
  const repairMap = new Map<string, string>();
  {
    const candidates = new Set<string>();
    const collectAll = (v: unknown): void => {
      if (typeof v === 'string') {
        if (/\/storage\/v1\/object\/sign\//.test(v)) candidates.add(v);
        return;
      }
      if (Array.isArray(v)) {
        for (const x of v) collectAll(x);
        return;
      }
      if (v && typeof v === 'object') {
        for (const x of Object.values(v as Record<string, unknown>)) collectAll(x);
      }
    };
    collectAll(row.thumbnail_url);
    collectAll(row.assets);
    collectAll(row.template_data);
    for (const bad of candidates) {
      const fixed = repairDoubledSignUrl(bad);
      if (fixed && fixed !== bad) repairMap.set(bad, fixed);
    }
  }

  let working = row;
  let repairedCount = 0;
  if (repairMap.size > 0) {
    const next = { ...row } as Record<string, unknown>;
    let touched = false;
    for (const key of ['thumbnail_url', 'assets', 'template_data'] as const) {
      const r = replaceUrlStrings(next[key], repairMap);
      next[key] = r.value;
      if (r.changed) touched = true;
    }
    if (touched) {
      working = next as T;
      repairedCount = repairMap.size;
    }
  }

  const found = new Set<string>();
  collectSignUrls(working.thumbnail_url, found);
  collectSignUrls(working.assets, found);
  collectSignUrls(working.template_data, found);

  const stale = [...found].filter((u) => signUrlNeedsRefresh(u, withinSecs));
  if (stale.length === 0) {
    return repairedCount > 0
      ? { row: working, changed: true, refreshed: 0 }
      : { row, changed: false, refreshed: 0 };
  }

  const replacements = new Map<string, string>();
  for (const oldUrl of stale) {
    const parsed = parseSupabaseSignUrl(oldUrl);
    if (!parsed) continue;
    try {
      const fresh = await signer(parsed.path);
      if (fresh) replacements.set(oldUrl, fresh);
    } catch {
      // Fail-soft: URL lama tetap dipakai.
    }
  }
  if (replacements.size === 0) {
    return repairedCount > 0
      ? { row: working, changed: true, refreshed: 0 }
      : { row, changed: false, refreshed: 0 };
  }

  const next = { ...working } as Record<string, unknown>;
  let changed = false;
  for (const key of ['thumbnail_url', 'assets', 'template_data'] as const) {
    const r = replaceUrlStrings(next[key], replacements);
    next[key] = r.value;
    if (r.changed) changed = true;
  }
  return { row: next as T, changed: true, refreshed: replacements.size };
}
