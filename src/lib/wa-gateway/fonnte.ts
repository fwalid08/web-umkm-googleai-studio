/**
 * Fonnte WhatsApp Gateway Implementation
 * Docs: https://fonnte.com/doc
 * Indonesian WA Gateway — affordable, local support
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

interface FonnteSendResponse {
  status: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
  };
}

interface FonnteStatusResponse {
  status: boolean;
  device: {
    name: string;
    phone: string;
    status: "connected" | "disconnected";
    last_seen: string;
  };
}

export class FonnteProvider implements WaGatewayProvider {
  readonly id = "fonnte";
  readonly name = "Fonnte";
  readonly capabilities: WaProviderCapabilities = {
    supportsText: true,
    supportsImage: true,
    supportsDocument: true,
    supportsLocation: false,
    supportsContact: false,
    supportsButtons: false,
    supportsList: false,
    supportsTemplate: false, // Fonnte tidak support Meta template
    supportsWebhook: true,
    supportsMultiDevice: false,
    maxMessageLength: 4096,
    maxFileSizeMb: 16,
  };

  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly senderId?: string;
  private readonly timeoutMs: number;
  private readonly retryConfig: NonNullable<WaProviderConfig["retry"]>;

  constructor(config: WaProviderConfig) {
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl || "https://api.fonnte.com/send";
    this.senderId = config.senderId;
    this.timeoutMs = config.timeoutMs || 10000;
    this.retryConfig = config.retry || {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 60000,
    };
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

  private buildPayload(message: WaMessage): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      target: message.to,
      message: message.message,
      countryCode: "62",
    };

    if (this.senderId) {
      payload.sender = this.senderId;
    }

    if (message.messageId) {
      payload.customId = message.messageId;
    }

    return payload;
  }

  async sendText(message: WaMessage): Promise<WaSendResult> {
    return this.sendWithRetry(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const res = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.apiKey,
          },
          body: JSON.stringify(this.buildPayload(message)),
          signal: controller.signal,
        });

        const data = (await res.json()) as FonnteSendResponse;

        if (!res.ok || !data.status) {
          return {
            success: false,
            error: data.message || `HTTP ${res.status}`,
            rawResponse: data,
          };
        }

        return {
          success: true,
          messageId: message.messageId,
          providerMessageId: data.data?.id,
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
        const payload = this.buildPayload(message);
        payload.url = message.mediaUrl;
        payload.type = message.mediaType;
        if (message.caption) payload.caption = message.caption;

        const res = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.apiKey,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const data = (await res.json()) as FonnteSendResponse;

        if (!res.ok || !data.status) {
          return {
            success: false,
            error: data.message || `HTTP ${res.status}`,
            rawResponse: data,
          };
        }

        return {
          success: true,
          messageId: message.messageId,
          providerMessageId: data.data?.id,
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
    // Fonnte tidak support template Meta Business API
    // Fallback: kirim sebagai text biasa dengan format template
    const templateMessage = `[Template: ${message.templateName}] ${message.templateParams.join(" | ")}`;
    return this.sendText({ ...message, message: templateMessage });
  }

  async getConnectionStatus(): Promise<WaConnectionStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

      const res = await fetch("https://api.fonnte.com/device/status", {
        headers: { Authorization: this.apiKey },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = (await res.json()) as FonnteStatusResponse;

      if (!data.status || !data.device) {
        return {
          connected: false,
          provider: this.id,
          error: "Invalid response",
        };
      }

      return {
        connected: data.device.status === "connected",
        provider: this.id,
        phoneNumber: data.device.phone,
        deviceName: data.device.name,
        lastSeen: data.device.last_seen,
      };
    } catch (err) {
      return {
        connected: false,
        provider: this.id,
        error: err instanceof Error ? err.message : "Connection check failed",
      };
    }
  }

  verifyWebhook(payload: string, signature: string): boolean {
    // Fonnte tidak provide signature verification secara default
    // Bisa implement custom jika perlu
    return true;
  }

  parseWebhook(payload: unknown): WaWebhookPayload | null {
    const data = payload as Record<string, unknown>;
    if (!data || typeof data !== "object") return null;

    // Fonnte webhook format
    if (data.type === "message" && data.data) {
      const msg = data.data as Record<string, unknown>;
      return {
        event: "message",
        data: {
          messageId: msg.id as string,
          from: msg.from as string,
          to: msg.to as string,
          body: msg.message as string,
          timestamp: msg.timestamp as number,
        },
      };
    }

    if (data.type === "status" && data.data) {
      const status = data.data as Record<string, unknown>;
      return {
        event: "status",
        data: {
          messageId: status.id as string,
          status: status.status as WaWebhookPayload["data"]["status"],
        },
      };
    }

    return null;
  }

  async testConnection(testPhone: string): Promise<WaSendResult> {
    return this.sendText({
      to: testPhone,
      message: `✅ Test koneksi Fonnte berhasil! Waktu: ${new Date().toLocaleString("id-ID")}`,
      messageId: `test-${Date.now()}`,
    });
  }
}

/**
 * Factory function untuk membuat FonnteProvider dari env
 */
export function createFonnteProvider(): FonnteProvider {
  const apiKey = process.env.FONNTE_API_KEY;
  const senderId = process.env.FONNTE_SENDER_ID;

  if (!apiKey) {
    throw new Error("FONNTE_API_KEY required");
  }

  return new FonnteProvider({
    provider: "fonnte",
    apiKey,
    senderId,
    apiUrl: process.env.FONNTE_API_URL,
    timeoutMs: Number(process.env.FONNTE_TIMEOUT_MS) || 10000,
  });
}