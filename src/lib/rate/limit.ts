/**
 * Rate-limit terpusat: Upstash Redis (prod multi-instance) → fallback Map in-memory.
 *
 * - Tanpa dependensi npm baru (pakai fetch bawaan).
 * - Jika env UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN ada → INCR + PEXPIRE
 *   via REST API Upstash (best-effort). Gagal jaringan/parse → fallback memori.
 * - Jika env tidak ada → Map in-memory (pola lama route forgot). Reset saat
 *   restart/scale — cukup untuk dev/single-instance.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 5000;

function memoryHit(key: string, max: number, windowMs: number, now = Date.now()): RateLimitResult {
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    const next: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    if (buckets.size > MAX_KEYS) {
      const oldest = buckets.keys().next().value as string | undefined;
      if (oldest !== undefined && oldest !== key) buckets.delete(oldest);
    }
    return { ok: 1 <= max, remaining: Math.max(0, max - 1) };
  }
  entry.count += 1;
  buckets.set(key, entry);
  if (entry.count > max) return { ok: false, remaining: 0 };
  return { ok: true, remaining: max - entry.count };
}

function upstashConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  if (!url || !token) return null;
  return { url, token };
}

async function upstashHit(key: string, max: number, windowMs: number): Promise<RateLimitResult | null> {
  const cfg = upstashConfig();
  if (!cfg) return null;
  try {
    const headers = { Authorization: `Bearer ${cfg.token}` };
    const incrRes = await fetch(`${cfg.url}/incr/${encodeURIComponent(key)}`, { headers });
    if (!incrRes.ok) return null;
    const incrJson = (await incrRes.json().catch(() => null)) as { result?: unknown } | null;
    const count = typeof incrJson?.result === "number" ? incrJson.result : NaN;
    if (!Number.isFinite(count)) return null;
    // Set expiry hanya pada hit pertama (best-effort, jangan gagalkan request).
    if (count === 1) {
      try {
        await fetch(`${cfg.url}/pexpire/${encodeURIComponent(key)}/${Math.max(1, Math.floor(windowMs))}`, {
          headers,
        });
      } catch {
        // abaikan — window fallback tetap dijaga oleh TTL berikutnya / memori
      }
    }
    if (count > max) return { ok: false, remaining: 0 };
    return { ok: true, remaining: max - count };
  } catch {
    return null;
  }
}

/**
 * Cek rate-limit untuk `key`. Return `ok:false` jika over-limit.
 * Selalu resolve (tidak pernah throw): Upstash gagal → fallback memori.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const safeMax = Math.max(1, Math.floor(max));
  const safeWindow = Math.max(1, Math.floor(windowMs));
  const remote = await upstashHit(key, safeMax, safeWindow);
  if (remote) return remote;
  // Fallback memori: dipakai saat env Upstash kosong ATAU request Upstash gagal.
  return memoryHit(key, safeMax, safeWindow);
}

/** Reset bucket in-memory (untuk test). Tidak me-reset Upstash. */
export function resetRateLimit(key?: string): void {
  if (key) buckets.delete(key);
  else buckets.clear();
}
