import { afterEach, describe, expect, it, vi } from "vitest";
import { formatNewOrderMessage, notifyNewOrder } from "./notify";

const base = {
  subdomain: "toko-demo",
  orderId: "order-123",
  total: 50000,
  customerName: "Budi",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("notifyNewOrder", () => {
  it("tanpa provider → log rapi + sent:false (tidak memanggil fetch)", async () => {
    vi.stubEnv("NOTIF_PROVIDER", "");
    vi.stubEnv("NOTIF_API_KEY", "");
    const fetchFn = vi.fn();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const res = await notifyNewOrder(base, { fetchFn: fetchFn as unknown as typeof fetch });

    expect(res).toEqual({ sent: false, reason: "no-provider" });
    expect(fetchFn).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledOnce();
    expect(logSpy.mock.calls[0][0]).toContain("[new-order]");
    expect(logSpy.mock.calls[0][0]).toContain("order-123");
  });

  it("dengan provider+key → POST payload benar dan sent:true", async () => {
    vi.stubEnv("NOTIF_PROVIDER", "fonoo");
    vi.stubEnv("NOTIF_API_KEY", "secret-key");
    const fetchFn = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));

    const res = await notifyNewOrder(
      { ...base, ownerPhone: "6281234567890" },
      {
        apiUrl: "https://contoh.test/kirim",
        fetchFn: fetchFn as unknown as typeof fetch,
      }
    );

    expect(res).toEqual({ sent: true, reason: "sent" });
    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://contoh.test/kirim");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret-key");
    const body = JSON.parse(init.body as string);
    expect(body.to).toBe("6281234567890");
    expect(body.order_id).toBe("order-123");
    expect(body.total).toBe(50000);
    expect(body.message).toBe(formatNewOrderMessage({ ...base, ownerPhone: "6281234567890" }));
  });

  it("fetch gagal → tidak throw, return sent:false", async () => {
    vi.stubEnv("NOTIF_PROVIDER", "wablas");
    vi.stubEnv("NOTIF_API_KEY", "secret-key");
    const fetchFn = vi.fn().mockRejectedValue(new Error("jaringan putus"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await notifyNewOrder(base, {
      apiUrl: "https://contoh.test/kirim",
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    expect(res).toEqual({ sent: false, reason: "send-failed" });
    expect(errSpy).toHaveBeenCalled();
  });
});
