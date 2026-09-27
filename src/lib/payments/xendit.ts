/**
 * Xendit Provider (Invoice API v2).
 * Docs: https://developers.xendit.co/api-reference/#create-invoice
 *   POST https://api.xendit.co/v2/invoices
 *   Auth: Basic base64(SECRET_KEY + ":")
 *   Webhook: header x-callback-token === XENDIT_CALLBACK_TOKEN (dashboard Xendit)
 *   Status invoice: PENDING | PAID | SETTLED | EXPIRED | FAILED
 */
import { timingSafeEqual } from "crypto";
import type {
  CheckoutResult,
  CreateTransactionInput,
  NormalizedPaymentStatus,
  ParsedNotification,
  PaymentProvider,
  WebhookVerifyInput,
} from "./types";

const API_BASE = "https://api.xendit.co";

export function mapXenditStatus(status: string): NormalizedPaymentStatus {
  const s = (status || "").toUpperCase();
  if (s === "PAID" || s === "SETTLED") return "paid";
  if (s === "PENDING") return "pending";
  if (s === "EXPIRED") return "canceled";
  if (s === "FAILED") return "failed";
  return "unknown";
}

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const v = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export interface XenditOptions {
  secretKey?: string;
  callbackToken?: string;
  fetchFn?: typeof fetch;
}

export class XenditProvider implements PaymentProvider {
  readonly id = "xendit" as const;
  readonly displayName = "Xendit";
  private readonly secretKey: string;
  private readonly callbackToken: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: XenditOptions = {}) {
    const key = opts.secretKey ?? process.env.XENDIT_SECRET_KEY;
    if (!key) throw new Error("XENDIT_SECRET_KEY required (atau set PAYMENT_PROVIDER=mock untuk dev)");
    this.secretKey = key;
    this.callbackToken = opts.callbackToken ?? process.env.XENDIT_CALLBACK_TOKEN ?? "";
    this.fetchFn = opts.fetchFn ?? fetch;
  }

  async createTransaction(input: CreateTransactionInput): Promise<CheckoutResult> {
    if (!Number.isInteger(input.grossAmount) || input.grossAmount <= 0) {
      throw new Error("grossAmount harus integer IDR > 0");
    }
    const res = await this.fetchFn(`${API_BASE}/v2/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${this.secretKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        external_id: input.orderId,
        amount: input.grossAmount,
        description: input.itemName.slice(0, 255),
        payer_email: input.customer?.email || undefined,
        customer: input.customer?.name ? { given_names: input.customer.name } : undefined,
        success_redirect_url: input.successRedirectUrl || undefined,
        failure_redirect_url: input.failureRedirectUrl || undefined,
        currency: "IDR",
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; invoice_url?: string; message?: string; error_code?: string };
    if (!res.ok || !json.invoice_url) {
      throw new Error(`Gagal membuat invoice Xendit: ${json.message || json.error_code || `HTTP ${res.status}`}`);
    }
    return {
      provider: "xendit",
      orderId: input.orderId,
      redirectUrl: json.invoice_url,
      token: json.id,
      grossAmount: input.grossAmount,
      mock: false,
    };
  }

  verifyWebhook({ headers }: WebhookVerifyInput): boolean {
    if (!this.callbackToken) return false; // fail-closed: tanpa token terkonfigurasi, tolak semua
    const got = headerValue(headers, "x-callback-token");
    if (typeof got !== "string" || got.length === 0) return false;
    return safeEqual(got, this.callbackToken);
  }

  parseNotification(json: Record<string, unknown>): ParsedNotification {
    // Xendit mengirim external_id (order milik kita) + id (invoice id) + status + amount + paid_at.
    const orderId = json.external_id;
    if (typeof orderId !== "string" || orderId.length === 0) throw new Error("external_id hilang di callback Xendit");
    const status = typeof json.status === "string" ? json.status : "";
    const amount = json.amount;
    const paidAt = typeof json.paid_at === "string" ? json.paid_at : undefined;
    return {
      orderId,
      status: mapXenditStatus(status),
      grossAmount: typeof amount === "string" || typeof amount === "number" ? Number(amount) : undefined,
      paidAt,
      rawStatus: status,
    };
  }
}
