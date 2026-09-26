import { describe, expect, it } from "vitest";
import {
  buildCustomers,
  buildDailyTrend,
  buildTopProducts,
  escapeCsvCell,
  normalizePhoneDigits,
  type AnalyticsOrderRow,
} from "./aggregate";

function row(partial: Partial<AnalyticsOrderRow> & { order_date: string }): AnalyticsOrderRow {
  return {
    product_name: "Kopi",
    quantity: 1,
    total_amount: 10000,
    customer_name: "Budi",
    customer_phone: "0812",
    customer_email: "",
    ...partial,
  };
}

describe("buildTopProducts", () => {
  it("agregat qty & revenue per produk, urut qty desc, batasi limit", () => {
    const rows = [
      row({ product_name: "Kopi", quantity: 2, total_amount: 20000, order_date: "2026-09-20T10:00:00Z" }),
      row({ product_name: "Teh", quantity: 5, total_amount: 25000, order_date: "2026-09-21T10:00:00Z" }),
      row({ product_name: "Kopi", quantity: 1, total_amount: 10000, order_date: "2026-09-22T10:00:00Z" }),
    ];
    const top = buildTopProducts(rows, 5);
    expect(top).toHaveLength(2);
    expect(top[0].product_name).toBe("Teh");
    expect(top[0].total_qty).toBe(5);
    expect(top[1]).toMatchObject({ product_name: "Kopi", total_qty: 3, total_revenue: 30000, orders_count: 2 });
    expect(buildTopProducts(rows, 1)).toHaveLength(1);
  });

  it("rows kosong → array kosong", () => {
    expect(buildTopProducts([])).toEqual([]);
  });
});

describe("buildDailyTrend", () => {
  it("14 titik urut naik, order masuk bucket tanggal lokal yang benar", () => {
    const now = new Date(2026, 8, 26, 12, 0, 0); // 26 Sep 2026 lokal
    const rows = [
      row({ order_date: "2026-09-26T08:00:00", total_amount: 50000 }),
      row({ order_date: "2026-09-26T09:00:00", total_amount: 30000 }),
      row({ order_date: "2026-09-20T10:00:00", total_amount: 10000 }),
      row({ order_date: "2026-08-01T10:00:00", total_amount: 99999 }), // di luar jendela
    ];
    const trend = buildDailyTrend(rows, 14, now);
    expect(trend).toHaveLength(14);
    expect(trend[0].date).toBe("2026-09-13");
    expect(trend[13]).toMatchObject({ date: "2026-09-26", orders: 2, revenue: 80000 });
    const total = trend.reduce((s, p) => s + p.revenue, 0);
    expect(total).toBe(90000);
  });
});

describe("buildCustomers", () => {
  it("dedup per telepon, jumlah order & spent terakumulasi, field dari order terbaru", () => {
    const rows = [
      row({ customer_name: "Budi", customer_phone: "0812-345", total_amount: 10000, order_date: "2026-09-20T10:00:00Z" }),
      row({ customer_name: "Budi Santoso", customer_phone: "0812345", total_amount: 20000, order_date: "2026-09-22T10:00:00Z" }),
      row({ customer_name: "Siti", customer_phone: "0899", total_amount: 5000, order_date: "2026-09-21T10:00:00Z" }),
    ];
    const list = buildCustomers(rows);
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({
      name: "Budi Santoso",
      total_orders: 2,
      total_spent: 30000,
      last_order: "2026-09-22T10:00:00Z",
    });
    expect(list[1].name).toBe("Siti");
  });

  it("tanpa telepon → kunci nama|email", () => {
    const rows = [
      row({ customer_name: "Ani", customer_phone: "", customer_email: "ani@x.id", total_amount: 7000, order_date: "2026-09-20T10:00:00Z" }),
      row({ customer_name: "ANI", customer_phone: "", customer_email: "ani@x.id", total_amount: 3000, order_date: "2026-09-21T10:00:00Z" }),
    ];
    expect(buildCustomers(rows)).toHaveLength(1);
  });
});

describe("normalizePhoneDigits + escapeCsvCell", () => {
  it("telepon dinormalisasi ke digit", () => {
    expect(normalizePhoneDigits("0812-345 678")).toBe("0812345678");
    expect(normalizePhoneDigits(null)).toBe("");
  });

  it("CSV escape koma, kutip, newline", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('kata "kutip"')).toBe('"kata ""kutip"""');
    expect(escapeCsvCell("baris1\nbaris2")).toBe('"baris1\nbaris2"');
    expect(escapeCsvCell(null)).toBe('""');
  });
});
