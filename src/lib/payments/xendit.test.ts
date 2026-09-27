import { describe, expect, it, afterEach, vi } from "vitest";
import { mapXenditStatus, XenditProvider } from "./xendit";
import {
  createPaymentProviderFromEnv,
  defaultPaymentProviderId,
  getPaymentProvider,
  getSupportedPaymentProviders,
  isPaymentProviderSupported,
  MockPaymentProvider,
  resetPaymentProvider,
  setPaymentProvider,
} from "./factory";
import { MidtransProvider } from "./midtrans";

const ENV_KEYS = ["PAYMENT_PROVIDER", "ALLOW_MOCK_PAYMENT", "MIDTRANS_SERVER_KEY", "XENDIT_SECRET_KEY", "XENDIT_CALLBACK_TOKEN"] as const;

function setEnv(patch: Record<string, string | undefined>) {
  for (const k of ENV_KEYS) {
    if (patch[k] === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, patch[k] as string);
  }
  for (const k of ENV_KEYS) {
    if (process.env[k] === "") delete process.env[k];
  }
}

function setNodeEnv(value: string) {
  vi.stubEnv("NODE_ENV", value);
}

afterEach(() => {
  vi.unstubAllEnvs();
  resetPaymentProvider();
});

describe("XenditProvider", () => {
  it("mapXenditStatus: PAID/SETTLED->paid, PENDING->pending, EXPIRED->canceled, FAILED->failed", () => {
    expect(mapXenditStatus("PAID")).toBe("paid");
    expect(mapXenditStatus("SETTLED")).toBe("paid");
    expect(mapXenditStatus("PENDING")).toBe("pending");
    expect(mapXenditStatus("EXPIRED")).toBe("canceled");
    expect(mapXenditStatus("FAILED")).toBe("failed");
    expect(mapXenditStatus("ANEH")).toBe("unknown");
  });

  it("verifyWebhook: x-callback-token cocok -> true (timing-safe)", () => {
    const p = new XenditProvider({ secretKey: "xnd_test", callbackToken: "cb-secret" });
    expect(p.verifyWebhook({ headers: { "x-callback-token": "cb-secret" }, rawBody: "", json: {} })).toBe(true);
    expect(p.verifyWebhook({ headers: { "x-callback-token": "salah" }, rawBody: "", json: {} })).toBe(false);
    expect(p.verifyWebhook({ headers: {}, rawBody: "", json: {} })).toBe(false);
  });

  it("verifyWebhook fail-closed bila callback token belum dikonfigurasi", () => {
    const p = new XenditProvider({ secretKey: "xnd_test", callbackToken: "" });
    expect(p.verifyWebhook({ headers: { "x-callback-token": "apapun" }, rawBody: "", json: {} })).toBe(false);
  });

  it("parseNotification memetakan external_id + status + amount + paid_at", () => {
    const p = new XenditProvider({ secretKey: "xnd_test" });
    const n = p.parseNotification({
      external_id: "domain-abc-1",
      status: "PAID",
      amount: 214500,
      paid_at: "2026-10-01T00:00:00Z",
    });
    expect(n.orderId).toBe("domain-abc-1");
    expect(n.status).toBe("paid");
    expect(n.grossAmount).toBe(214500);
    expect(n.paidAt).toBe("2026-10-01T00:00:00Z");
    expect(() => p.parseNotification({ status: "PAID" })).toThrow(/external_id/);
  });

  it("constructor menolak tanpa secret key", () => {
    setEnv({ XENDIT_SECRET_KEY: undefined });
    expect(() => new XenditProvider()).toThrow(/XENDIT_SECRET_KEY/);
  });

  it("createTransaction memakai Invoice API dan mengembalikan invoice_url", async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ id: "inv-1", invoice_url: "https://pay.xendit/inv-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
    const p = new XenditProvider({ secretKey: "xnd_test", fetchFn });
    const r = await p.createTransaction({ orderId: "domain-abc-1", grossAmount: 214500, itemName: "Domain tokoku.com" });
    expect(r.provider).toBe("xendit");
    expect(r.redirectUrl).toBe("https://pay.xendit/inv-1");
    expect(r.token).toBe("inv-1");
  });

  it("createTransaction menolak grossAmount <= 0", async () => {
    const p = new XenditProvider({ secretKey: "xnd_test" });
    await expect(p.createTransaction({ orderId: "x", grossAmount: 0, itemName: "x" })).rejects.toThrow(/grossAmount/);
  });
});

describe("payment factory (driver switchable)", () => {
  it("mendukung midtrans, xendit, mock", () => {
    expect(getSupportedPaymentProviders()).toEqual(["midtrans", "xendit", "mock"]);
    expect(isPaymentProviderSupported("xendit")).toBe(true);
    expect(isPaymentProviderSupported("stripe")).toBe(false);
  });

  it("default tanpa env -> midtrans", () => {
    setEnv({ PAYMENT_PROVIDER: undefined });
    expect(defaultPaymentProviderId()).toBe("midtrans");
  });

  it("PAYMENT_PROVIDER=xendit memakai XenditProvider (singleton)", () => {
    setEnv({ PAYMENT_PROVIDER: "xendit", XENDIT_SECRET_KEY: "xnd_test" });
    const p = getPaymentProvider();
    expect(p).toBeInstanceOf(XenditProvider);
    expect(getPaymentProvider()).toBe(p);
  });

  it("mock dilarang di production kecuali ALLOW_MOCK_PAYMENT=true", () => {
    setEnv({ PAYMENT_PROVIDER: "mock", ALLOW_MOCK_PAYMENT: undefined });
    setNodeEnv("production");
    expect(() => getPaymentProvider()).toThrow(/dilarang di production/);
  });

  it("createPaymentProviderFromEnv midtrans membaca server key", () => {
    setEnv({ MIDTRANS_SERVER_KEY: "SK-test" });
    expect(createPaymentProviderFromEnv("midtrans")).toBeInstanceOf(MidtransProvider);
  });

  it("setPaymentProvider menimpa singleton (injeksi test)", () => {
    const mock = new MockPaymentProvider();
    setPaymentProvider(mock);
    expect(getPaymentProvider()).toBe(mock);
  });

  it("MockPaymentProvider.createTransaction mengembalikan redirect mock", async () => {
    const r = await new MockPaymentProvider().createTransaction({ orderId: "domain-x-1", grossAmount: 1000, itemName: "x" });
    expect(r.mock).toBe(true);
    expect(r.redirectUrl).toContain("mock=1");
  });

  it("provider tak dikenal -> throw", () => {
    expect(() => createPaymentProviderFromEnv("stripe" as never)).toThrow(/Unknown payment provider/);
  });
});
