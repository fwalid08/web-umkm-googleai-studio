/**
 * OpenWA WhatsApp Gateway Implementation
 * Self-hosted WhatsApp API — https://github.com/open-wa/wa-automate-nodejs
 * Atau bisa pakai wrapper seperti whatsapp-web.js
 */

import type {
  WaGatewayProvider,
  WaProviderConfig,
  WaMessage,
  WaSendResult,
  WaConnectionStatus,
  WaWebhookPayload,
  WaProviderCapabilities,
} from "./types";

interface OpenWASendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface OpenWAStatusResponse {
  connected: boolean;
  phone?: string;
  deviceName?: string;
  battery?: number;
  lastSeen?: string;
}

export class OpenWAProvider implements WaGatewayProvider {
  readonly id = "openwa";
  readonly name = "OpenWA (Self-hosted)";
  readonly capabilities: WaProviderCapabilities = {
    supportsText: true,
    supportsImage: true,
    supportsDocument: true,
    supportsLocation: true,
    supportsContact: true,
    supportsButtons: true,
    supportsList: true,
    supportsTemplate: false, // Butuh Meta Business API terpisah
    supportsWebhook: true,
    supportsMultiDevice: true,
    maxMessageLength: 65536,
    maxFileSizeMb: 100,
  };

  private readonly apiUrl: string;
  private readonly deviceId: string;
  private readonly apiKey?: string; // Optional auth untuk self-hosted
  private readonly timeoutMs: number;
  private readonly retryConfig: NonNullable<WaProviderConfig["retry"]>;

  constructor(config: WaProviderConfig) {
    this.apiUrl = config.apiUrl || "http://localhost:3000";
    this.deviceId = config.deviceId || "default";
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs || 15000; // OpenWA butuh timeout lebih lama
    this.retryConfig = config.retry || {
      maxAttempts: 3,
      baseDelayMs: 2000,
      maxDelayMs: 60000,
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  private async sendWithRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= this.retryConfig.maxAttempts) throw err;
      const delay = Math.min(
        this.retryConfig.baseDelayMs * Math.pow(2, attempt - 1),
        this.retryConfig.maxDelayMs
      );
      await new Promise((r) => setTimeout(r, delay));
      return this.sendWithRetry(fn, attempt + 1);
    }
  }

  private buildBaseUrl(endpoint: string): string {
    return `${this.apiUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
  }

  async sendText(message: WaMessage): Promise<WaSendResult> {
    return this.sendWithRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(this.buildBaseUrl(`send-text`), {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            phone: message.to,
            message: message.message,
            session: this.deviceId,
            messageId: message.messageId,
          }),
          signal: controller.signal,
        });

        const data = (await res.json()) as OpenWASendResponse;

        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || `HTTP ${res.status}`,
            rawResponse: data,
          };
        }

        return {
          success: true,
          messageId: message.messageId,
          providerMessageId: data.messageId,
          rawResponse: data,
        };
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  async sendMedia(
    message: WaMessage & { mediaUrl: string; mediaType: "image" | "document"; caption?: string }
  ): Promise<WaSendResult> {
    return this.sendWithRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const endpoint = message.mediaType === "image" ? "send-image" : "send-file";
        const res = await fetch(this.buildBaseUrl(endpoint), {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify({
            phone: message.to,
            mediaUrl: message.mediaUrl,
            caption: message.caption || message.message,
            session: this.deviceId,
            messageId: message.messageId,
          }),
          signal: controller.signal,
        });

        const data = (await res.json()) as OpenWASendResponse;

        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || `HTTP ${res.status}`,
            rawResponse: data,
          };
        }

        return {
          success: true,
          messageId: message.messageId,
          providerMessageId: data.messageId,
          rawResponse: data,
        };
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  async sendTemplate(
    message: WaMessage & { templateName: string; templateParams: string[] }
  ): Promise<WaSendResult> {
    // OpenWA bisa kirim template via buttons/list message
    // Tapi butuh Meta Business API approval untuk template resmi
    // Fallback: kirim sebagai text dengan format struktur
    const templateMessage = `📋 *${message.templateName}*\n${message.templateParams.map((p, i) => `${i + 1}. ${p}`).join("\n")}`;
    return this.sendText({ ...message, message: templateMessage });
  }

  async getConnectionStatus(): Promise<WaConnectionStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch(this.buildBaseUrl(`session-status/${this.deviceId}`), {
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = (await res.json()) as OpenWAStatusResponse;

      return {
        connected: data.connected,
        provider: this.id,
        phoneNumber: data.phone,
        deviceName: data.deviceName,
        lastSeen: data.lastSeen,
      };
    } catch (err) {
      return {
        connected: false,
        provider: this.id,
        error: err instanceof Error ? err.message : "Connection check failed",
      };
    }
  }

  async getQrCode(): Promise<{ qrCode: string; expiresAt: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.buildBaseUrl(`qr/${this.deviceId}`), {
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json();
      return {
        qrCode: data.qrCode || data.qr,
        expiresAt: new Date(Date.now() + 60000).toISOString(), // QR biasanya expired 60s
      };
    } catch (err) {
      throw new Error(`Failed to get QR code: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    // OpenWA bisa dikonfigurasi dengan secret untuk webhook
    // Implementasi tergantung setup self-hosted
    if (!this.apiKey) return true; // No auth = trust
    // TODO: Implement HMAC verification jika pakai secret
    return true;
  }

  parseWebhook(payload: unknown): WaWebhookPayload | null {
    const data = payload as Record<string, unknown>;
    if (!data || typeof data !== "object") return null;

    // OpenWA webhook format (bisa dikustomisasi)
    if (data.event === "message" && data.data) {
      const msg = data.data as Record<string, unknown>;
      return {
        event: "message",
        data: {
          messageId: msg.id as string,
          from: msg.from as string,
          to: msg.to as string,
          body: msg.body as string,
          timestamp: msg.timestamp as number,
        },
      };
    }

    if (data.event === "status" && data.data) {
      const status = data.data as Record<string, unknown>;
      return {
        event: "status",
        data: {
          messageId: status.id as string,
          status: status.status as WaWebhookPayload["data"]["status"],
        },
      };
    }

    if (data.event === "qr" && data.data) {
      const qrData = data.data as Record<string, unknown>;
      return {
        event: "qr",
        data: {
          qrCode: qrData.qrCode as string,
        },
      };
    }

    return null;
  }

  async testConnection(testPhone: string): Promise<WaSendResult> {
    return this.sendText({
      to: testPhone,
      message: `✅ Test koneksi OpenWA berhasil! Waktu: ${new Date().toLocaleString("id-ID")}`,
      messageId: `test-${Date.now()}`,
    });
  }
}

/**
 * Factory function untuk membuat OpenWAProvider dari env
 */
export function createOpenWAProvider(): OpenWAProvider {
  const apiUrl = process.env.OPENWA_API_URL;
  const deviceId = process.env.OPENWA_DEVICE_ID;

  if (!apiUrl || !deviceId) {
    throw new Error("OPENWA_API_URL and OPENWA_DEVICE_ID required");
  }

  return new OpenWAProvider({
    provider: "openwa",
    apiKey: process.env.OPENWA_API_KEY || "",
    apiUrl: apiUrl!,
    deviceId: deviceId!,
    timeoutMs: Number(process.env.OPENWA_TIMEOUT_MS) || 15000,
  });
}