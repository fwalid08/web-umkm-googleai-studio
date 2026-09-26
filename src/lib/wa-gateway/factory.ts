/**
 * WA Gateway Factory — Switchable Provider
 * Sprint 3 — WA Notifications + Notification Center
 */

import type { WaGatewayProvider, WaProviderConfig, WaProviderType } from "./types";
import { FonnteProvider } from "./fonnte";
import { OpenWAProvider } from "./openwa";
import { WA_PROVIDERS } from "./types";

let _waProvider: WaGatewayProvider | null = null;

export function getWaProvider(): WaGatewayProvider {
  if (_waProvider) return _waProvider;

  const providerType = (process.env.WA_PROVIDER as WaProviderType) || "fonnte";

  switch (providerType) {
    case "fonnte": {
      const apiKey = process.env.FONNTE_API_KEY;
      if (!apiKey) throw new Error("FONNTE_API_KEY required for Fonnte provider");
      _waProvider = new FonnteProvider({
        provider: "fonnte",
        apiKey,
        senderId: process.env.FONNTE_SENDER_ID,
        apiUrl: process.env.FONNTE_API_URL,
        timeoutMs: Number(process.env.FONNTE_TIMEOUT_MS) || 10000,
      });
      break;
    }

    case "openwa": {
      if (!process.env.OPENWA_API_URL || !process.env.OPENWA_DEVICE_ID) {
        throw new Error("OPENWA_API_URL and OPENWA_DEVICE_ID required for OpenWA provider");
      }
      _waProvider = new OpenWAProvider({
        provider: "openwa",
        apiKey: process.env.OPENWA_API_KEY || "",
        apiUrl: process.env.OPENWA_API_URL!,
        deviceId: process.env.OPENWA_DEVICE_ID!,
        timeoutMs: Number(process.env.OPENWA_TIMEOUT_MS) || 15000,
      });
      break;
    }

    case "wablas":
      throw new Error("Wablas provider not implemented yet");

    case "custom":
      throw new Error("Custom provider not implemented yet");

    default:
      throw new Error(`Unknown WA provider: ${providerType}`);
  }

  return _waProvider;
}

export function setWaProvider(provider: WaGatewayProvider): void {
  _waProvider = provider;
}

export function createWaProvider(config: WaProviderConfig): WaGatewayProvider {
  switch (config.provider) {
    case "fonnte":
      return new FonnteProvider(config);
    case "openwa":
      return new OpenWAProvider(config);
    default:
      throw new Error(`Provider ${config.provider} not implemented`);
  }
}

export function getSupportedWaProviders(): WaProviderType[] {
  return Object.keys(WA_PROVIDERS) as WaProviderType[];
}

export function isWaProviderSupported(provider: string): provider is WaProviderType {
  return provider in WA_PROVIDERS;
}