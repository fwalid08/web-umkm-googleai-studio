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

/** Strip port dari host/env (aman IPv6 [::1]:3000). */
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
