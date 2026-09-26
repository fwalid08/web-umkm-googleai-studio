/**
 * WhatsApp Gateway Provider Abstraction
 * Sprint 3 — WA Notifications + Notification Center
 * Mendukung multiple provider: Fonnte, OpenWA, Wablas, dll.
 */

export interface WaMessage {
  to: string; // nomor tujuan (format: 628123456789)
  message: string;
  /** ID pesan untuk tracking (opsional) */
  messageId?: string;
  /** Metadata tambahan */
  metadata?: Record<string, unknown>;
}

export interface WaSendResult {
  success: boolean;
  messageId?: string;
  providerMessageId?: string;
  error?: string;
  /** Raw response dari provider untuk debugging */
  rawResponse?: unknown;
}

export interface WaConnectionStatus {
  connected: boolean;
  provider: string;
  phoneNumber?: string;
  deviceName?: string;
  lastSeen?: string;
  error?: string;
}

export interface WaWebhookPayload {
  /** Tipe event: message, status, connection */
  event: "message" | "status" | "connection" | "qr";
  /** Data event */
  data: {
    messageId?: string;
    from?: string;
    to?: string;
    body?: string;
    timestamp?: number;
    status?: "sent" | "delivered" | "read" | "failed";
    error?: string;
    qrCode?: string;
  };
  /** Signature untuk verifikasi (opsional) */
  signature?: string;
}

export interface WaProviderConfig {
  provider: string; // "fonnte" | "openwa" | "wablas" | "custom"
  apiKey: string;
  apiUrl?: string;
  senderId?: string; // untuk Fonnte
  deviceId?: string; // untuk OpenWA
  webhookSecret?: string; // untuk verifikasi webhook
  /** Timeout dalam ms */
  timeoutMs?: number;
  /** Retry config */
  retry?: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
  };
}

export interface WaProviderCapabilities {
  supportsText: boolean;
  supportsImage: boolean;
  supportsDocument: boolean;
  supportsLocation: boolean;
  supportsContact: boolean;
  supportsButtons: boolean;
  supportsList: boolean;
  supportsTemplate: boolean; // Meta Business API template
  supportsWebhook: boolean;
  supportsMultiDevice: boolean;
  maxMessageLength: number;
  maxFileSizeMb: number;
}

export interface WaGatewayProvider {
  /** Unique identifier */
  readonly id: string;
  /** Nama tampilan */
  readonly name: string;
  /** Capabilities */
  readonly capabilities: WaProviderCapabilities;

  /**
   * Kirim pesan teks
   */
  sendText(message: WaMessage): Promise<WaSendResult>;

  /**
   * Kirim pesan dengan media (image/document)
   */
  sendMedia(message: WaMessage & { mediaUrl: string; mediaType: "image" | "document"; caption?: string }): Promise<WaSendResult>;

  /**
   * Kirim template (Meta Business API approved template)
   */
  sendTemplate(message: WaMessage & { templateName: string; templateParams: string[] }): Promise<WaSendResult>;

  /**
   * Cek status koneksi
   */
  getConnectionStatus(): Promise<WaConnectionStatus>;

  /**
   * Dapatkan QR code untuk pairing (jika provider support)
   */
  getQrCode?(): Promise<{ qrCode: string; expiresAt: string }>;

  /**
   * Verifikasi webhook signature
   */
  verifyWebhook(payload: string, signature: string): boolean;

  /**
   * Parse webhook payload
   */
  parseWebhook(payload: unknown): WaWebhookPayload | null;

  /**
   * Test koneksi (kirim pesan test ke nomor sendiri)
   */
  testConnection(testPhone: string): Promise<WaSendResult>;
}

export type WaProviderType = "fonnte" | "openwa" | "wablas" | "custom";

export const WA_PROVIDERS: Record<WaProviderType, { name: string; defaultApiUrl: string }> = {
  fonnte: { name: "Fonnte", defaultApiUrl: "https://api.fonnte.com/send" },
  openwa: { name: "OpenWA", defaultApiUrl: "http://localhost:3000" }, // self-hosted
  wablas: { name: "Wablas", defaultApiUrl: "https://phone.wablas.com/api/send-message" },
  custom: { name: "Custom", defaultApiUrl: "" },
};

export const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
};