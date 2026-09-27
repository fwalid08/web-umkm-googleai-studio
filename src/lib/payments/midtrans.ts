/**
 * Midtrans Provider (Snap).
 * Docs: https://docs.midtrans.com/reference/snap-api
 *   POST https://app.{sandbox.|}midtrans.com/snap/v1/transactions
 *   Webhook: signature_key = sha512(order_id + status_code + gross_amount + SERVER_KEY)
 */
import { createHash, timingSafeEqual } from "crypto";
import type {
  CheckoutResult,
  CreateTransactionInput,
  NormalizedPaymentStatus,
  ParsedNotification,
  PaymentProvider,
  WebhookVerifyInput,
} from "./types";

export function midtransBaseUrl(isProduction: boolean): string {
  return isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
}

export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

/** Hitung signature_key Midtrans (pure, untuk test + verify). */
export function computeMidtransSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
  return createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function mapMidtransStatus(transactionStatus: string, fraudStatus: string): NormalizedPaymentStatus {
  const s = (transactionStatus || "").toLowerCase();
  const f = (fraudStatus || "").toLowerCase();
  if (s === "capture" || s === "settlement") {
    if (s === "capture" && f === "challenge") return "challenged";
    return "paid";
  }
  if (s === "deny") return "failed";
  if (s === "expire" || s === "cancel") return "canceled";
  if (s === "pending" || s === "authorize") return "pending";
  return "unknown";
}

export interface MidtransOptions {
  serverKey?: string;
  isProduction?: boolean;
  fetchFn?: typeof fetch;
}

export class MidtransProvider implements PaymentProvider {
  readonly id = "midtrans" as const;
  readonly displayName = "Midtrans";
  private readonly serverKey: string;
  private readonly production: boolean;
  private readonly fetchFn: typeof fetch;

  constructor(opts: MidtransOptions = {}) {
    const key = opts.serverKey ?? process.env.MIDTRANS_SERVER_KEY;
    if (!key) throw new Error("MIDTRANS_SERVER_KEY required (atau set PAYMENT_PROVIDER=mock untuk dev)");
    this.serverKey = key;
    this.production = opts.isProduction ?? isMidtransProduction();
    this.fetchFn = opts.fetchFn ?? fetch;
  }

  async createTransaction(input: CreateTransactionInput): Promise<CheckoutResult> {
    if (!Number.isInteger(input.grossAmount) || input.grossAmount < 0) {
      throw new Error("grossAmount harus integer IDR >= 0");
    }
    const res = await this.fetchFn(`${midtransBaseUrl(this.production)}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${this.serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: input.orderId, gross_amount: input.grossAmount },
        item_details: [
          {
            id: input.itemId ?? input.orderId,
            price: input.grossAmount,
            quantity: 1,
            name: input.itemName.slice(0, 50),
          },
        ],
        customer_details: {
          first_name: input.customer?.name || "Pelanggan UMKM",
          email: input.customer?.email || undefined,
          phone: input.customer?.phone || undefined,
        },
        ...(input.successRedirectUrl ? { callbacks: { finish: input.successRedirectUrl } } : {}),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
    if (!res.ok || !json.token) {
      const detail = Array.isArray(json.error_messages) ? json.error_messages.join("; ") : `HTTP ${res.status}`;
      throw new Error(`Gagal membuat transaksi Midtrans: ${detail}`);
    }
    return {
      provider: "midtrans",
      orderId: input.orderId,
      redirectUrl: json.redirect_url || "",
      token: json.token,
      grossAmount: input.grossAmount,
      mock: false,
    };
  }

  verifyWebhook({ json }: WebhookVerifyInput): boolean {
    const orderId = json.order_id;
    const statusCode = json.status_code;
    const grossAmount = json.gross_amount;
    const signature = json.signature_key;
    if (typeof orderId !== "string" || typeof statusCode !== "string" || typeof signature !== "string") return false;
    if (typeof grossAmount !== "string" && typeof grossAmount !== "number") return false;
    const expected = computeMidtransSignature(orderId, statusCode, String(grossAmount), this.serverKey);
    return safeEqualHex(String(signature), expected);
  }

  parseNotification(json: Record<string, unknown>): ParsedNotification {
    const orderId = json.order_id;
    if (typeof orderId !== "string" || orderId.length === 0) throw new Error("order_id hilang di notifikasi Midtrans");
    const txStatus = typeof json.transaction_status === "string" ? json.transaction_status : "";
    const fraud = typeof json.fraud_status === "string" ? json.fraud_status : "";
    const gross = json.gross_amount;
    return {
      orderId,
      status: mapMidtransStatus(txStatus, fraud),
      grossAmount: typeof gross === "string" || typeof gross === "number" ? Number(gross) : undefined,
      rawStatus: txStatus,
    };
  }
}
