import { describe, expect, it } from "vitest";
import {
  computeMidtransSignature,
  mapMidtransStatus,
  MidtransProvider,
} from "./midtrans";

describe("MidtransProvider", () => {
  it("computeMidtransSignature = sha512(order_id+status_code+gross_amount+serverKey)", () => {
    const sig = computeMidtransSignature("order-1", "200", "99000", "SK-test");
    expect(sig).toMatch(/^[0-9a-f]{128}$/);
    // deterministik
    expect(computeMidtransSignature("order-1", "200", "99000", "SK-test")).toBe(sig);
    expect(computeMidtransSignature("order-2", "200", "99000", "SK-test")).not.toBe(sig);
  });

  it("verifyWebhook: signature valid -> true, salah -> false, payload tak lengkap -> false", () => {
    const serverKey = "SK-test";
    const p = new MidtransProvider({ serverKey });
    const base = { order_id: "umkm-abc-123", status_code: "200", gross_amount: "99000", transaction_status: "settlement" };
    const good = { ...base, signature_key: computeMidtransSignature("umkm-abc-123", "200", "99000", serverKey) };
    expect(p.verifyWebhook({ headers: {}, rawBody: "", json: good })).toBe(true);
    expect(p.verifyWebhook({ headers: {}, rawBody: "", json: { ...good, signature_key: "0".repeat(128) } })).toBe(false);
    expect(p.verifyWebhook({ headers: {}, rawBody: "", json: { order_id: "x" } })).toBe(false);
  });

  it("parseNotification memetakan semua status Midtrans", () => {
    const p = new MidtransProvider({ serverKey: "SK-test" });
    expect(p.parseNotification({ order_id: "o1", transaction_status: "settlement" }).status).toBe("paid");
    expect(p.parseNotification({ order_id: "o1", transaction_status: "capture", fraud_status: "accept" }).status).toBe("paid");
    expect(p.parseNotification({ order_id: "o1", transaction_status: "capture", fraud_status: "challenge" }).status).toBe("challenged");
    expect(p.parseNotification({ order_id: "o1", transaction_status: "deny" }).status).toBe("failed");
    expect(p.parseNotification({ order_id: "o1", transaction_status: "expire" }).status).toBe("canceled");
    expect(p.parseNotification({ order_id: "o1", transaction_status: "cancel" }).status).toBe("canceled");
    expect(p.parseNotification({ order_id: "o1", transaction_status: "pending" }).status).toBe("pending");
    expect(() => p.parseNotification({ transaction_status: "settlement" })).toThrow(/order_id/);
  });

  it("mapMidtransStatus pure mapping", () => {
    expect(mapMidtransStatus("settlement", "")).toBe("paid");
    expect(mapMidtransStatus("capture", "challenge")).toBe("challenged");
    expect(mapMidtransStatus("weird", "")).toBe("unknown");
  });

  it("constructor menolak tanpa server key", () => {
    const saved = process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    try {
      expect(() => new MidtransProvider()).toThrow(/MIDTRANS_SERVER_KEY/);
    } finally {
      if (saved !== undefined) process.env.MIDTRANS_SERVER_KEY = saved;
    }
  });

  it("createTransaction memakai Snap API dan mengembalikan token+redirect", async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ token: "snap-tok", redirect_url: "https://snap.pay/abc" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    const p = new MidtransProvider({ serverKey: "SK-test", fetchFn });
    const r = await p.createTransaction({ orderId: "domain-abc-1", grossAmount: 214500, itemName: "Domain tokoku.com (1 tahun)" });
    expect(r.provider).toBe("midtrans");
    expect(r.token).toBe("snap-tok");
    expect(r.redirectUrl).toBe("https://snap.pay/abc");
    expect(r.mock).toBe(false);
  });

  it("createTransaction error Snap -> throw dengan pesan jelas", async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ error_messages: ["Order ID sudah dipakai"] }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    const p = new MidtransProvider({ serverKey: "SK-test", fetchFn });
    await expect(
      p.createTransaction({ orderId: "domain-abc-1", grossAmount: 1000, itemName: "x" })
    ).rejects.toThrow(/Midtrans/);
  });
});
