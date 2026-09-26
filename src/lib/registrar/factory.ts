/**
 * Registrar Factory — Switchable Provider
 * Sprint 2 — Custom Domain Real Integration
 */

import type { RegistrarProvider, RegistrarConfig, RegistrarProviderType } from "./types";
import { PorkbunProvider } from "./porkbun";
import { REGISTRAR_PROVIDERS } from "./types";

let _registrarProvider: RegistrarProvider | null = null;

export function getRegistrarProvider(): RegistrarProvider {
  if (_registrarProvider) return _registrarProvider;

  const providerType = (process.env.REGISTRAR_PROVIDER as RegistrarProviderType) || "porkbun";

  switch (providerType) {
    case "porkbun":
      _registrarProvider = new PorkbunProvider({
        provider: "porkbun",
        apiKey: process.env.PORKBUN_API_KEY!,
        apiSecret: process.env.PORKBUN_API_SECRET!,
        apiUrl: process.env.PORKBUN_API_URL,
        defaultNameservers: process.env.DEFAULT_NAMESERVERS?.split(","),
      });
      break;

    case "niagahoster":
      // TODO: Implement NiagahosterProvider
      throw new Error("Niagahoster provider not implemented yet");

    case "idcloudhost":
      // TODO: Implement IDCloudHostProvider
      throw new Error("IDCloudHost provider not implemented yet");

    case "custom":
      // TODO: Implement CustomProvider
      throw new Error("Custom provider not implemented yet");

    default:
      throw new Error(`Unknown registrar provider: ${providerType}`);
  }

  return _registrarProvider;
}

export function setRegistrarProvider(provider: RegistrarProvider): void {
  _registrarProvider = provider;
}

export function createRegistrarProvider(config: RegistrarConfig): RegistrarProvider {
  switch (config.provider) {
    case "porkbun":
      return new PorkbunProvider(config);
    default:
      throw new Error(`Provider ${config.provider} not implemented`);
  }
}

export function getSupportedProviders(): RegistrarProviderType[] {
  return Object.keys(REGISTRAR_PROVIDERS) as RegistrarProviderType[];
}

export function isProviderSupported(provider: string): provider is RegistrarProviderType {
  return provider in REGISTRAR_PROVIDERS;
}