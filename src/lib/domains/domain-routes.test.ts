import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function repoFile(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf-8");
}

const SEARCH_API = repoFile("app", "api", "domains", "search", "route.ts");
const CHECKOUT_API = repoFile("app", "api", "domains", "checkout", "route.ts");
const WEBHOOK_API = repoFile("app", "api", "domains", "webhook", "route.ts");
const ORDERS_API = repoFile("app", "api", "domains", "orders", "route.ts");
const RENEW_API = repoFile("app", "api", "domains", "renew", "[id]", "route.ts");
const VERIFY_API = repoFile("app", "api", "domains", "verify", "route.ts");
const REMINDERS_API = repoFile("app", "api", "domains", "renewal-reminders", "route.ts");
const AUTORENEW_API = repoFile("app", "api", "domains", "auto-renew", "route.ts");

/**
 * Sprint 2 Batch 1 contract guard (static check, model update-api.test.ts):
 * search/checkout/webhook WAJIB lewat driver + boundary + idempotency —
 * regresi ke fetch langsung / simulasi / active instan harus ketahuan di CI.
 */
describe("GET /api/domains/search — driver + cache + rate limit + zod", () => {
  it("pakai registrar driver (bukan simulasi langsung)", () => {
    expect(SEARCH_API).toContain("getRegistrarProvider()");
    expect(SEARCH_API).toContain("checkAvailability");
    expect(SEARCH_API).not.toContain("simulateAvailability(domain)) {\n");
  });

  it("rate limit 30/menit/user → 429", () => {
    expect(SEARCH_API).toContain('checkRateLimit(`domain-search:${userId}`');
    expect(SEARCH_API).toContain("status: 429");
  });

  it("query divalidasi zod + harga via retailPriceForProvider", () => {
    expect(SEARCH_API).toContain("searchQuerySchema.safeParse");
    expect(SEARCH_API).toContain("retailPriceForProvider(");
  });

  it("cache 5 menit + warning estimasi saat fallback katalog", () => {
    expect(SEARCH_API).toContain("SEARCH_CACHE_TTL_MS");
    expect(SEARCH_API).toContain("estimasi");
  });
});

describe("POST /api/domains/checkout — gate + driver payment", () => {
  it("validasi domainCheckoutSchema + gate checkCustomDomainLimit (403 + upgrade_url)", () => {
    expect(CHECKOUT_API).toContain("domainCheckoutSchema.safeParse");
    expect(CHECKOUT_API).toContain("checkCustomDomainLimit(userId, tier)");
    expect(CHECKOUT_API).toContain("upgrade_url");
    expect(CHECKOUT_API).toContain("status: 403");
  });

  it("re-check registrar (409 bila laku, 502 bila down) + TLD buyable 422", () => {
    expect(CHECKOUT_API).toContain("registrar.checkAvailability(domain)");
    expect(CHECKOUT_API).toContain("status: 409");
    expect(CHECKOUT_API).toContain("status: 422");
  });

  it("order_id prefix domain- + status pending_payment + payment_reference", () => {
    expect(CHECKOUT_API).toContain("buildDomainOrderId(userId)");
    expect(CHECKOUT_API).toContain('status: "pending_payment"');
    expect(CHECKOUT_API).toContain("payment_reference: orderId");
  });

  it("transaksi lewat payment driver (bukan fetch Midtrans langsung)", () => {
    expect(CHECKOUT_API).toContain("getPaymentProvider()");
    expect(CHECKOUT_API).toContain("paymentProvider.createTransaction(");
    expect(CHECKOUT_API).not.toContain("snap/v1/transactions");
  });
});

describe("POST /api/domains/webhook — verify + idempotency + orchestrator", () => {
  it("verify via provider TERCATAT di baris (bukan env aktif) → 403 bila invalid", () => {
    expect(WEBHOOK_API).toContain("createPaymentProviderFromEnv(providerId)");
    expect(WEBHOOK_API).toContain("provider.verifyWebhook(");
    expect(WEBHOOK_API).toContain("status: 403");
  });

  it("lookup by payment_reference; tak dikenal → 200 (gateway tak retry)", () => {
    expect(WEBHOOK_API).toContain('eq("payment_reference", ref)');
    expect(WEBHOOK_API).toContain("Order tidak ditemukan");
  });

  it("idempotency active+paid_at → deduped:true; paid → registering → orchestrator", () => {
    expect(WEBHOOK_API).toContain("deduped: true");
    expect(WEBHOOK_API).toContain('status: "registering"');
    expect(WEBHOOK_API).toContain("processDomainRegistration(order.id)");
  });

  it("webhook JANGAN langsung active; challenged/canceled ditangani eksplisit", () => {
    // Satu-satunya penulisan "active" adalah via orchestrator (return), bukan update webhook.
    expect(WEBHOOK_API).not.toMatch(/\.update\(\{\s*status:\s*"active",\s*paid_at/);
    expect(WEBHOOK_API).toContain('"challenged"');
    expect(WEBHOOK_API).toContain('status: "expired"');
  });

  it("renewal: paid untuk active/expired + paid_at NULL → renewDomain (registrar tercatat)", () => {
    expect(WEBHOOK_API).toContain("renewDomain(order.domain, 1)");
    expect(WEBHOOK_API).toContain("createRegistrarProviderFromEnv(");
    expect(WEBHOOK_API).toContain("renewed: true");
  });

  it("payment renewal gagal/canceled JANGAN expire domain aktif", () => {
    expect(WEBHOOK_API).toContain('order.status !== "pending_payment"');
  });
});

describe("GET /api/domains/orders — daftar milik sendiri", () => {
  it("auth + rate limit + filter user_id + kolom eksplisit", () => {
    expect(ORDERS_API).toContain("getSessionUserId(session)");
    expect(ORDERS_API).toContain("checkRateLimit(`domain-orders:${userId}`");
    expect(ORDERS_API).toContain('eq("user_id", userId)');
    expect(ORDERS_API).toContain("ORDER_COLUMNS");
    expect(ORDERS_API).not.toContain('select("*")');
  });

  it("respons { orders: DomainOrder[] } + status dinormalisasi via domainStatusSchema", () => {
    expect(ORDERS_API).toContain("data: { orders }");
    expect(ORDERS_API).toContain("domainStatusSchema.safeParse");
  });
});

describe("POST /api/domains/renew/[id] — payment perpanjangan", () => {
  it("ownership + hanya active/expired (409 bila status lain)", () => {
    expect(RENEW_API).toContain('eq("user_id", userId)');
    expect(RENEW_API).toContain("RENEWABLE_STATUSES");
    expect(RENEW_API).toContain("status: 409");
  });

  it("payment_reference BARU + paid_at NULL (status tak diubah) → payment driver", () => {
    expect(RENEW_API).toContain("buildDomainOrderId(userId)");
    expect(RENEW_API).toContain("paid_at: null");
    expect(RENEW_API).toContain("paymentProvider.createTransaction(");
  });

  it("gagal createTransaction → kembalikan penanda lama (best-effort)", () => {
    expect(RENEW_API).toContain("payment_reference: prevRef");
    expect(RENEW_API).toContain("paid_at: prevPaidAt");
  });
});

describe("Cron domain — auth + best-effort", () => {
  it("semua cron pakai isAuthorizedCronRequest (header ATAU ?secret=)", () => {
    for (const [name, src] of [
      ["verify", VERIFY_API],
      ["renewal-reminders", REMINDERS_API],
      ["auto-renew", AUTORENEW_API],
    ] as const) {
      expect(src, name).toContain("isAuthorizedCronRequest(request)");
      expect(src, name).toContain("status: 401");
    }
  });

  it("verify: TXT cocok → Vercel verify + token NULL + retry add (cap 20)", () => {
    expect(VERIFY_API).toContain("verifyDomainOnVercel(");
    expect(VERIFY_API).toContain("verification_token: null");
    expect(VERIFY_API).toContain("addDomainToVercel(");
    expect(VERIFY_API).toContain(".limit(20)");
  });

  it("renewal-reminders: expired sweep + anti-spam shouldSendReminder + stamp", () => {
    expect(REMINDERS_API).toContain('eq("status", "active")');
    expect(REMINDERS_API).toContain('status: "expired"');
    expect(REMINDERS_API).toContain("custom_domain: null");
    expect(REMINDERS_API).toContain("shouldSendReminder(");
    expect(REMINDERS_API).toContain("renewal_reminder_sent_at: nowIso");
  });

  it("auto-renew: hanya active+auto_renew ≤14 hari, skip pending/mock, via payment driver", () => {
    expect(AUTORENEW_API).toContain('eq("auto_renew", true)');
    expect(AUTORENEW_API).toContain("o.paid_at === null");
    expect(AUTORENEW_API).toContain('paymentProvider.id === "mock"');
    expect(AUTORENEW_API).toContain("paymentProvider.createTransaction(");
    expect(AUTORENEW_API).not.toContain("snap/v1/transactions");
    expect(AUTORENEW_API).not.toContain("xendit.co");
  });
});
