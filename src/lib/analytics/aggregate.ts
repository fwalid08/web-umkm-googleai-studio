/**
 * Agregasi analytics/customers dari rows orders (pure, testable).
 * Dipakai: /api/user/dashboard (N9), /api/customers (N10),
 * /api/orders/export (escape CSV, N8), dan demo store.
 */

export interface AnalyticsOrderRow {
  product_name: string;
  quantity: number;
  total_amount: number;
  order_date: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
}

export interface TopProduct {
  product_name: string;
  total_qty: number;
  total_revenue: number;
  orders_count: number;
}

export interface DailyPoint {
  /** YYYY-MM-DD (waktu lokal server) */
  date: string;
  orders: number;
  revenue: number;
}

export interface CustomerSummary {
  name: string;
  phone: string;
  email: string;
  total_orders: number;
  total_spent: number;
  /** ISO string order terakhir */
  last_order: string;
}

function toDayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Agregat produk terlaris per product_name, urut qty desc. */
export function buildTopProducts(rows: AnalyticsOrderRow[], limit = 5): TopProduct[] {
  const map = new Map<string, TopProduct>();
  for (const r of rows) {
    const name = (r.product_name ?? "").trim() || "(tanpa nama)";
    const cur = map.get(name) ?? { product_name: name, total_qty: 0, total_revenue: 0, orders_count: 0 };
    cur.total_qty += Number(r.quantity) || 0;
    cur.total_revenue += Number(r.total_amount) || 0;
    cur.orders_count += 1;
    map.set(name, cur);
  }
  return [...map.values()].sort((a, b) => b.total_qty - a.total_qty).slice(0, Math.max(1, limit));
}

/** Tren harian N hari terakhir (termasuk hari ini), urut tanggal naik. */
export function buildDailyTrend(rows: AnalyticsOrderRow[], days = 14, now: Date = new Date()): DailyPoint[] {
  const n = Math.min(90, Math.max(1, days));
  const points: DailyPoint[] = [];
  const idx = new Map<string, DailyPoint>();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = toDayKey(d);
    const p: DailyPoint = { date: key, orders: 0, revenue: 0 };
    points.push(p);
    idx.set(key, p);
  }
  const oldest = points[0].date;
  for (const r of rows) {
    const t = new Date(r.order_date);
    if (Number.isNaN(t.getTime())) continue;
    const key = toDayKey(t);
    if (key < oldest) continue;
    const p = idx.get(key);
    if (!p) continue; // order di masa depan / di luar jendela
    p.orders += 1;
    p.revenue += Number(r.total_amount) || 0;
  }
  return points;
}

/** Normalisasi telepon ke digit saja untuk kunci dedup customer. */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[^0-9]/g, "");
}

/**
 * Ringkas orders menjadi daftar customer unik.
 * Kunci: digit telepon bila ada, else nama+email lower.
 * Field nama/telepon/email diambil dari order terbaru.
 * Urut: last_order desc.
 */
export function buildCustomers(rows: AnalyticsOrderRow[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary & { _ts: number }>();
  // Pastikan order terbaru diproses terakhir agar field display = terbaru.
  const sorted = [...rows].sort(
    (a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
  );
  for (const r of sorted) {
    const digits = normalizePhoneDigits(r.customer_phone);
    const key = digits || `${(r.customer_name ?? "").trim().toLowerCase()}|${(r.customer_email ?? "").trim().toLowerCase()}`;
    if (!key || key === "|") continue;
    const ts = new Date(r.order_date).getTime();
    const cur = map.get(key);
    if (!cur) {
      map.set(key, {
        name: (r.customer_name ?? "").trim(),
        phone: r.customer_phone ?? "",
        email: r.customer_email ?? "",
        total_orders: 1,
        total_spent: Number(r.total_amount) || 0,
        last_order: r.order_date,
        _ts: Number.isNaN(ts) ? 0 : ts,
      });
    } else {
      cur.total_orders += 1;
      cur.total_spent += Number(r.total_amount) || 0;
      if (!Number.isNaN(ts) && ts >= cur._ts) {
        cur.name = (r.customer_name ?? "").trim() || cur.name;
        cur.phone = r.customer_phone ?? cur.phone;
        cur.email = r.customer_email ?? cur.email;
        cur.last_order = r.order_date;
        cur._ts = ts;
      }
    }
  }
  return [...map.values()]
    .sort((a, b) => b._ts - a._ts)
    .map((c) => ({
      name: c.name,
      phone: c.phone,
      email: c.email,
      total_orders: c.total_orders,
      total_spent: c.total_spent,
      last_order: c.last_order,
    }));
}

/** Escape satu sel CSV (kutip ganda digandakan, selalu dibungkus kutip). */
export function escapeCsvCell(value: unknown): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}
