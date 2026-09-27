/**
 * Payment Gateway Abstraction — Sprint 2.
 * Driver switchable: midtrans | xendit | mock.
 *
 *   PAYMENT_PROVIDER=midtrans|xendit|mock   (default: midtrans)
 *
 * Semua provider mengembalikan kontrak yang sama sehingga route
 * checkout/webhook (subscription MAUPUN domain order) tidak perlu
 * tahu provider aktif. Webhook SELALU verifikasi signature/token
 * + caller wajib cek idempotency (paid_at / status) sebelum update DB.
 */

export type PaymentProviderId = "midtrans" | "xendit" | "mock";

/** Status ternormalisasi lintas provider. */
export type NormalizedPaymentStatus =
  | "paid" // settlement/capture-accept (midtrans) | PAID (xendit)
  | "pending" // pending/authorize | PENDING
  | "challenged" // capture-challenge (midtrans, CC perlu review)
  | "failed" // deny | FAILED
  | "canceled" // expire/cancel | EXPIRED
  | "unknown";

export interface PaymentCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

export interface CreateTransactionInput {
  orderId: string; // unik lintas provider (prefix "umkm-" subscription, "domain-" domain)
  grossAmount: number; // IDR utuh, integer > 0
  itemName: string; // mis. "Paket STARTER (Bulanan)" / "Domain tokoku.com (1 tahun)"
  itemId?: string;
  customer?: PaymentCustomer;
  /** Redirect sukses (Snap finish / Xendit success_redirect_url). */
  successRedirectUrl?: string;
  failureRedirectUrl?: string;
}

export interface CheckoutResult {
  provider: PaymentProviderId;
  orderId: string;
  redirectUrl: string; // Snap redirect_url ATAU Xendit invoice_url
  token?: string; // Snap token (midtrans) / invoice id (xendit)
  grossAmount: number;
  mock: boolean;
}

export interface WebhookVerifyInput {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string; // body mentah (untuk HMAC bila diperlukan)
  json: Record<string, unknown>;
}

export interface ParsedNotification {
  orderId: string;
  status: NormalizedPaymentStatus;
  grossAmount?: number;
  paidAt?: string; // ISO bila provider mengirimnya
  rawStatus?: string; // status asli provider (debug/log)
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  readonly displayName: string;
  createTransaction(input: CreateTransactionInput): Promise<CheckoutResult>;
  /** Return true bila signature/token valid. TIDAK PERNAH throw untuk payload invalid (return false). */
  verifyWebhook(input: WebhookVerifyInput): boolean;
  /** Petakan notifikasi provider -> status ternormalisasi. Throw bila orderId hilang. */
  parseNotification(json: Record<string, unknown>): ParsedNotification;
}

export const PAYMENT_PROVIDERS: Record<PaymentProviderId, { name: string }> = {
  midtrans: { name: "Midtrans" },
  xendit: { name: "Xendit" },
  mock: { name: "Mock (tanpa gateway)" },
};

/** Prefix order_id agar subscription vs domain bisa dibedakan di dashboard gateway. */
export const SUBSCRIPTION_ORDER_PREFIX = "umkm-";
export const DOMAIN_ORDER_PREFIX = "domain-";

export function isDomainOrderId(orderId: string): boolean {
  return orderId.startsWith(DOMAIN_ORDER_PREFIX);
}

export function isSubscriptionOrderId(orderId: string): boolean {
  return orderId.startsWith(SUBSCRIPTION_ORDER_PREFIX);
}

/** Bangun order_id domain yang unik + dapat dikenali. */
export function buildDomainOrderId(userIdFragment: string): string {
  const frag = (userIdFragment || "user").slice(0, 8).replace(/[^a-zA-Z0-9]/g, "");
  return `${DOMAIN_ORDER_PREFIX}${frag}-${Date.now()}`;
}
