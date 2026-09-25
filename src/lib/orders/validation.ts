import type { OrderStatus } from "@/types";

/**
 * Sprint 02 Sesi A — Order helpers.
 * Workflow: baru → konfirmasi → dikirim → selesai.
 * Aturan transisi: maju/mundur MAKSIMAL 1 langkah; selesai = terminal.
 */

export const ORDER_STATUSES: OrderStatus[] = ["baru", "konfirmasi", "dikirim", "selesai"];

const ORDER_INDEX: Record<OrderStatus, number> = {
  baru: 0,
  konfirmasi: 1,
  dikirim: 2,
  selesai: 3,
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);
}

/** Boleh pindah status? Maju/mundur 1 langkah, tidak boleh diam, selesai terminal. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  if (from === "selesai") return false;
  return Math.abs(ORDER_INDEX[from] - ORDER_INDEX[to]) === 1;
}

/** Total selalu dihitung server — client value diabaikan. */
export function calcTotal(price: number, qty: number): number {
  const p = Math.floor(Number(price));
  const q = Math.floor(Number(qty));
  if (!Number.isFinite(p) || !Number.isFinite(q) || p < 0 || q < 1 || q > 99) return -1;
  return p * q;
}

/** Rate-limit sederhana: max N submit per window per key (IP). Memory-only (MVP). */
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, max = 10, windowMs = 60_000, now = Date.now()): boolean {
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return true;
  }
  list.push(now);
  hits.set(key, list);
  return false;
}
