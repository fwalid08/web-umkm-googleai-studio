import { describe, expect, it } from "vitest";
import { DomainNameAPIProvider } from "./domainnameapi";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeProvider(handler: (url: string, init?: RequestInit) => Response): DomainNameAPIProvider {
  const fetchFn = (async (url: unknown, init?: RequestInit) => handler(String(url), init)) as typeof fetch;
  return new DomainNameAPIProvider({
    provider: "domainnameapi",
    apiKey: "test-key",
    apiSecret: "test-key",
    resellerId: "reseller-1",
    baseUrl: "https://ote.example.test/v1",
    isTest: true,
    fetchFn,
  });
}

describe("DomainNameAPIProvider", () => {
  it("constructor menolak tanpa kredensial", () => {
    expect(() => new DomainNameAPIProvider({ provider: "domainnameapi", apiKey: "", apiSecret: "" })).toThrow(/resellerId and apiKey/);
  });

  it("mengirim resellerId + apiKey di body", async () => {
    let seenBody: Record<string, unknown> = {};
    let seenUrl = "";
    const p = makeProvider((url, init) => {
      seenUrl = url;
      seenBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return jsonResponse({ success: true, data: { domain: "tokoku.com", available: true, price: 11.31 } });
    });
    const r = await p.checkAvailability("tokoku.com");
    expect(seenUrl).toBe("https://ote.example.test/v1/domain/check");
    expect(seenBody.resellerId).toBe("reseller-1");
    expect(seenBody.apiKey).toBe("test-key");
    expect(r.available).toBe(true);
    expect(r.priceYearly).toBeGreaterThan(0); // USD 11.31 -> IDR via kurs
    expect(r.currency).toBe("IDR");
  });

  it("register sukses memetakan domainId + nameserver", async () => {
    const p = makeProvider(() =>
      jsonResponse({ success: true, data: { domainId: "dna-99", expiresAt: "2027-01-01T00:00:00Z" } })
    );
    const r = await p.registerDomain("tokoku.com", 1, ["tr.apiname.com", "eu.apiname.com"]);
    expect(r.success).toBe(true);
    expect(r.registrarOrderId).toBe("dna-99");
    expect(r.nameservers).toEqual(["tr.apiname.com", "eu.apiname.com"]);
    expect(r.expiresAt).toBe("2027-01-01T00:00:00.000Z");
  });

  it("register gagal -> success:false + error (tanpa throw)", async () => {
    const p = makeProvider(() => jsonResponse({ success: false, error: "Insufficient balance" }));
    const r = await p.registerDomain("tokoku.com");
    expect(r.success).toBe(false);
    expect(r.error).toBe("Insufficient balance");
  });

  it("network error pada check -> available:false + reason (tanpa throw)", async () => {
    const p = makeProvider(() => {
      throw new Error("fetch failed");
    });
    const r = await p.checkAvailability("tokoku.com");
    expect(r.available).toBe(false);
    expect(r.reason).toBe("API error");
  });
});
