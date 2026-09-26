/** Single source of truth untuk subdomain/host tenant. Dipakai proxy.ts, public.ts, tenant.ts, urls.ts. */

export const SUBDOMAIN_RE = /^[a-z0-9-]{3,50}$/;

export const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "www",
  "root",
  "app",
  "dashboard",
  "auth",
  "login",
  "signin",
  "signup",
  "support",
  "help",
  "docs",
  "blog",
  "mail",
  "ftp",
  "cdn",
  "static",
  "assets",
]);

export function isValidSubdomain(sub: string): boolean {
  const s = sub.toLowerCase();
  return SUBDOMAIN_RE.test(s) && !RESERVED_SUBDOMAINS.has(s);
}

/** Generator subdomain acak: `tenant-` + 8 char lowercase alnum. Prefix opsional. */
export function generateSubdomain(prefix = "tenant-"): string {
  const raw = (prefix || "tenant-").toLowerCase();
  const base = raw.endsWith("-") ? raw : `${raw}-`;
  let rand = "";
  while (rand.length < 8) {
    rand += Math.random().toString(36).slice(2);
  }
  rand = rand
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "a")
    .slice(0, 8)
    .padEnd(8, "x");
  return `${base}${rand}`;
}

function randomSuffix(len = 4): string {
  let s = "";
  while (s.length < len) s += Math.random().toString(36).slice(2);
  return s.toLowerCase().replace(/[^a-z0-9]/g, "a").slice(0, len).padEnd(len, "x");
}

/**
 * Clash retry 3x loop (testable via callback).
 * @param base subdomain awal (sudah lowercase/diupload caller).
 * @param isTaken callback async: true = sudah dipakai/clash, false = tersedia.
 * @param maxAttempts default 3. Attempt 0 = base, 1..n = base + suffix `-xxxx`.
 * @returns subdomain unik pertama; jika semua clash, kembalikan kandidat terakhir
 * (caller biarkan DB unique constraint yang menolak → 500 handled).
 */
export async function ensureUniqueSubdomain(
  base: string,
  isTaken: (s: string) => Promise<boolean>,
  maxAttempts = 3
): Promise<string> {
  const clean = (base || "").trim().toLowerCase() || generateSubdomain().toLowerCase();
  let candidate = clean;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) candidate = `${clean}-${randomSuffix(4)}`;
    let taken = false;
    try {
      taken = await isTaken(candidate);
    } catch {
      // fail-open: cek gagal → pakai kandidat, biarkan insert yang memutuskan
      return candidate;
    }
    if (!taken) return candidate;
  }
  return candidate;
}

/**
 * Payload insert website (kolom yang ditulis helper retry).
 */
export type WebsiteInsertPayload = {
  user_id: string;
  name: string;
  business_type: string | null;
  subdomain: string;
};

type WebsiteInsertResult = { data: any; error: any };

/**
 * Insert website dengan retry anti-TOCTOU race subdomain.
 *
 * Masalah: pola check-then-insert (cek clash via SELECT lalu INSERT) punya
 * jeda race — dua request konkuren bisa lolos cek dengan subdomain sama,
 * lalu satu gagal di DB unique constraint (Postgres 23505).
 *
 * Strategi: langsung INSERT dengan subdomain base (tanpa pre-check, hemat
 * 1 query). Jika DB menolak dengan code 23505, generate kandidat baru via
 * {@link ensureUniqueSubdomain} (tidak pernah mengulang subdomain yang sudah
 * gagal) dan coba lagi, maksimal `maxAttempts` kali. Error selain 23505
 * langsung dilempar tanpa retry.
 *
 * @param supabase service-role client (`any` agar kompatibel — konsisten dengan repo).
 * @param payload kolom website; `subdomain` = base attempt-0.
 * @param maxAttempts default 3.
 * @param deps injeksi untuk test: `insertFn(subdomain)` dan `isTaken(s)`.
 *   Jika `insertFn` diisi tanpa `isTaken`, cek clash default return false
 *   (supabase tidak disentuh — aman dilepas `null` di test).
 * @returns `{ data, attempts }` — data row website, attempts = jumlah insert dicoba.
 * @throws error Supabase terakhir (23505 setelah habis retry, atau error non-23505).
 */
export async function insertWebsiteWithRetry(
  supabase: any,
  payload: WebsiteInsertPayload,
  maxAttempts = 3,
  deps?: {
    insertFn?: (subdomain: string) => Promise<WebsiteInsertResult>;
    isTaken?: (s: string) => Promise<boolean>;
  }
): Promise<{ data: any; attempts: number }> {
  const cleanBase =
    (payload.subdomain || "").trim().toLowerCase() || generateSubdomain().toLowerCase();

  const doInsert: (subdomain: string) => Promise<WebsiteInsertResult> =
    deps?.insertFn ??
    ((subdomain: string) =>
      supabase
        .from("websites")
        .insert({
          user_id: payload.user_id,
          name: payload.name,
          business_type: payload.business_type ?? null,
          subdomain,
        })
        .select("id, name, subdomain")
        .single());

  // Default cek clash via DB; tapi jika test menginjeksi insertFn saja,
  // jangan sentuh supabase (boleh null) → anggap tersedia.
  const isTaken: (s: string) => Promise<boolean> =
    deps?.isTaken ??
    (deps?.insertFn
      ? async () => false
      : async (s: string) => {
          try {
            const { data: clash } = await supabase
              .from("websites")
              .select("id")
              .eq("subdomain", s)
              .maybeSingle();
            return !!clash;
          } catch {
            return false;
          }
        });

  // Subdomain yang sudah dicoba & gagal — kandidat baru tidak boleh mengulang ini,
  // terlepas dari hasil isTaken (penting saat isTaken fail-open / di-mock false).
  const tried = new Set<string>();
  let candidate = cleanBase;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      candidate = await ensureUniqueSubdomain(
        cleanBase,
        async (s) => tried.has(s) || (await isTaken(s)),
        maxAttempts
      );
    }
    tried.add(candidate);

    const { data, error } = await doInsert(candidate);
    if (!error) return { data, attempts: attempt + 1 };
    lastError = error;
    if ((error as any)?.code !== "23505") throw error;
    if (attempt === maxAttempts - 1) throw error;
    // 23505 + sisa attempt → loop lagi dengan kandidat baru
  }
  throw lastError;
}
export function stripPort(host: string): string {
  const h = (host || "").trim().toLowerCase();
  if (h.startsWith("[")) {
    const end = h.indexOf("]");
    if (end !== -1) return h.slice(1, end);
    return h;
  }
  // hostname biasa: potong :port tunggal (abaikan IPv6 tanpa bracket)
  const parts = h.split(":");
  if (parts.length === 2) return parts[0];
  return h;
}

export function normalizeHost(host: string): string {
  return stripPort(host);
}

export function rootHost(rawRoot = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com"): string {
  return stripPort(rawRoot);
}

/** True jika host adalah root/central (bukan toko tenant). admin.* = central. */
export function isRootHost(host: string, root = rootHost()): boolean {
  const h = normalizeHost(host);
  const r = normalizeHost(root);
  if (!h) return true;
  return (
    h === r ||
    h === `www.${r}` ||
    h === "localhost" ||
    h === "127.0.0.1" ||
    h.startsWith("admin.") ||
    h.endsWith(".vercel.app")
  );
}

/** Ambil subdomain dari host bertipe sub.ROOT atau sub.localhost. Null jika bukan. */
export function subdomainFromHost(host: string, root = rootHost()): string | null {
  const h = normalizeHost(host);
  const r = normalizeHost(root);
  if (h.endsWith(".localhost") && h !== "localhost") {
    const sub = h.replace(/\.localhost$/, "");
    return isValidSubdomain(sub) ? sub : null;
  }
  if (h.endsWith(`.${r}`)) {
    const sub = h.slice(0, -(r.length + 1));
    return isValidSubdomain(sub) ? sub : null;
  }
  return null;
}
