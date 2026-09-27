/**
 * Payment Factory — driver switchable antar payment gateway.
 *
 *   PAYMENT_PROVIDER=midtrans|xendit|mock   (default: midtrans)
 *
 * - midtrans: butuh MIDTRANS_SERVER_KEY (+ MIDTRANS_IS_PRODUCTION=true untuk prod)
 * - xendit:   butuh XENDIT_SECRET_KEY (+ XENDIT_CALLBACK_TOKEN untuk webhook)
 * - mock:     tanpa network; redirect ke dashboard dengan flag mock=1.
 *             DITOLAK di production kecuali ALLOW_MOCK_PAYMENT=true (preview saja).
 */
import type { PaymentProvider, PaymentProviderId } from "./types";
import { PAYMENT_PROVIDERS } from "./types";
import { MidtransProvider } from "./midtrans";
import { XenditProvider } from "./xendit";
import type { CheckoutResult, CreateTransactionInput } from "./types";

let _paymentProvider: PaymentProvider | null = null;

export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock" as const;
  readonly displayName = "Mock (tanpa gateway)";

  async createTransaction(input: CreateTransactionInput): Promise<CheckoutResult> {
    const orderId = input.orderId;
    return {
      provider: "mock",
      orderId,
      redirectUrl: `/dashboard/billing?mock=1&order_id=${encodeURIComponent(orderId)}`,
      token: `mock-token-${orderId}`,
      grossAmount: input.grossAmount,
      mock: true,
    };
  }

  verifyWebhook(): boolean {
    return true; // mock tidak dipakai di production
  }

  parseNotification(json: Record<string, unknown>): { orderId: string; status: "pending"; grossAmount?: number; rawStatus?: string } {
    const orderId = json.order_id;
    if (typeof orderId !== "string" || orderId.length === 0) throw new Error("order_id hilang di notifikasi mock");
    return { orderId, status: "pending", rawStatus: "mock" };
  }
}

export function defaultPaymentProviderId(): PaymentProviderId {
  const raw = (process.env.PAYMENT_PROVIDER || "").trim().toLowerCase();
  if (raw === "midtrans" || raw === "xendit" || raw === "mock") return raw;
  return "midtrans";
}

export function getPaymentProvider(): PaymentProvider {
  if (_paymentProvider) return _paymentProvider;
  _paymentProvider = createPaymentProviderFromEnv(defaultPaymentProviderId());
  return _paymentProvider;
}

export function createPaymentProviderFromEnv(provider: PaymentProviderId): PaymentProvider {
  switch (provider) {
    case "midtrans":
      return new MidtransProvider();
    case "xendit":
      return new XenditProvider();
    case "mock":
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PAYMENT !== "true") {
        throw new Error("Mock payment dilarang di production (set PAYMENT_PROVIDER=midtrans|xendit)");
      }
      return new MockPaymentProvider();
    default:
      throw new Error(`Unknown payment provider: ${String(provider)}`);
  }
}

/** Injeksi manual (test). Menimpa singleton. */
export function setPaymentProvider(provider: PaymentProvider): void {
  _paymentProvider = provider;
}

/** Reset singleton (test). */
export function resetPaymentProvider(): void {
  _paymentProvider = null;
}

export function getSupportedPaymentProviders(): PaymentProviderId[] {
  return Object.keys(PAYMENT_PROVIDERS) as PaymentProviderId[];
}

export function isPaymentProviderSupported(provider: string): provider is PaymentProviderId {
  return provider in PAYMENT_PROVIDERS;
}
