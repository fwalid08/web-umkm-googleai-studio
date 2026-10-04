/**
 * N2 — Notifikasi order baru (mock → provider WA best-effort).
 *
 * - Tanpa env (`NOTIF_PROVIDER` + `NOTIF_API_KEY` kosong) → log terstruktur
 *   `[new-order] ...` dan return `{ sent: false, reason: "no-provider" }`.
 * - Dengan env → POST best-effort ke provider (fonoo/wablas) dengan timeout
 *   5 detik. Gagal kirim TIDAK throw — caller (POST /api/orders) tidak boleh
 *   menggagalkan order karena notify gagal.
 *
 * Env:
 *   NOTIF_PROVIDER=fonoo|wablas   provider WA gateway
 *   NOTIF_API_KEY=...             API key provider (server-only, jangan expose)
 *   NOTIF_API_URL=...             (opsional) override endpoint provider
 */

export interface NewOrderNotification {
  subdomain: string;
  orderId: string;
  total: number;
  customerName: string;
  ownerPhone?: string;
}

export interface NotifyResult {
  sent: boolean;
  reason: string;
}

export interface NotifyOptions {
  provider?: string;
  apiKey?: string;
  apiUrl?: string;
  /** Inject fetch untuk test. Default: global fetch. */
  fetchFn?: typeof fetch;
  /** Timeout ms untuk POST provider. Default 5000. */
  timeoutMs?: number;
}

const SUPPORTED_PROVIDERS = ["fonoo", "wablas"] as const;

const DEFAULT_ENDPOINTS: Record<string, string> = {
  fonoo: "https://api.fonoo.id/v1/messages",
  wablas: "https://phone.wablas.com/api/send-message",
};

function resolveOptions(opts: NotifyOptions = {}): {
  provider: string;
  apiKey: string;
  apiUrl: string;
  timeoutMs: number;
  fetchFn: typeof fetch;
} {
  return {
    provider: (opts.provider ?? process.env.NOTIF_PROVIDER ?? "").trim().toLowerCase(),
    apiKey: (opts.apiKey ?? process.env.NOTIF_API_KEY ?? "").trim(),
    apiUrl: (opts.apiUrl ?? process.env.NOTIF_API_URL ?? "").trim(),
    timeoutMs: opts.timeoutMs ?? 5000,
    fetchFn: opts.fetchFn ?? fetch,
  };
}

export function formatNewOrderMessage(n: NewOrderNotification): string {
  return (
    `Order baru #${n.orderId} di ${n.subdomain}: ` +
    `${n.customerName} — total Rp${n.total.toLocaleString("id-ID")}`
  );
}

/**
 * Kirim notifikasi order baru. Tidak pernah throw untuk kegagalan kirim;
 * hanya melempar untuk kesalahan programmer (payload tidak valid).
 */
export async function notifyNewOrder(
  n: NewOrderNotification,
  opts: NotifyOptions = {}
): Promise<NotifyResult> {
  if (!n || !n.subdomain || !n.orderId || !n.customerName) {
    throw new Error("notifyNewOrder: subdomain/orderId/customerName wajib diisi");
  }

  const { provider, apiKey, apiUrl, timeoutMs, fetchFn } = resolveOptions(opts);

  // Jalur mock (default): provider belum dikonfigurasi → log rapi, order tetap sukses.
  if (!provider || !SUPPORTED_PROVIDERS.includes(provider as (typeof SUPPORTED_PROVIDERS)[number])) {
    console.log(
      `[new-order] tenant=${n.subdomain} order=${n.orderId} total=${n.total} customer=${n.customerName}`
    );
    return { sent: false, reason: "no-provider" };
  }
  if (!apiKey) {
    console.log(
      `[new-order] tenant=${n.subdomain} order=${n.orderId} total=${n.total} customer=${n.customerName} (provider=${provider} tanpa API key)`
    );
    return { sent: false, reason: "no-api-key" };
  }

  const endpoint = apiUrl || DEFAULT_ENDPOINTS[provider];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchFn(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        to: n.ownerPhone ?? undefined,
        message: formatNewOrderMessage(n),
        order_id: n.orderId,
        total: n.total,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[new-order] notify gagal: provider=${provider} status=${res.status} order=${n.orderId}`);
      return { sent: false, reason: "send-failed" };
    }
    return { sent: true, reason: "sent" };
  } catch (err) {
    console.error(`[new-order] notify gagal: provider=${provider} order=${n.orderId}`, err);
    return { sent: false, reason: "send-failed" };
  } finally {
    clearTimeout(timer);
  }
}
