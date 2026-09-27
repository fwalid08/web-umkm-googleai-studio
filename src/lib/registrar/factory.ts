/**
 * Registrar Factory — driver switchable antar provider registrar.
 *
 *   REGISTRAR_PROVIDER=porkbun|domainnameapi|mock   (default: mock di dev, porkbun di prod)
 *
 * - porkbun:       PORKBUN_API_KEY + PORKBUN_API_SECRET (+ PORKBUN_API_URL opsional)
 * - domainnameapi: DOMAINNAMEAPI_*_RESELLER_ID + *_API_KEY (+ _OTE_ varian sandbox,
 *                  DOMAINNAMEAPI_SANDBOX=false untuk produksi)
 * - mock:          simulasi deterministik (dev/test saja; DITOLAK di production)
 *
 * Provider baru cukup implement `RegistrarProvider` lalu daftarkan di switch
 * `createRegistrarProvider()` — tanpa mengubah caller (search/checkout/register).
 */
import type { RegistrarProvider, RegistrarConfig, RegistrarProviderType } from "./types";
import { PorkbunProvider } from "./porkbun";
import { DomainNameAPIProvider } from "./domainnameapi";
import { MockRegistrarProvider } from "./mock";
import { REGISTRAR_PROVIDERS } from "./types";

let _registrarProvider: RegistrarProvider | null = null;

function defaultProviderType(): RegistrarProviderType {
  const raw = (process.env.REGISTRAR_PROVIDER || "").trim().toLowerCase();
  if (raw === "porkbun" || raw === "domainnameapi" || raw === "mock") return raw;
  // Default aman: mock di dev/test agar tanpa kredensial tetap jalan;
  // di production default porkbun (akan throw eksplisit bila key belum diset).
  return process.env.NODE_ENV === "production" ? "porkbun" : "mock";
}

function defaultNameservers(): string[] | undefined {
  const raw = process.env.DEFAULT_NAMESERVERS;
  if (!raw) return undefined;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : undefined;
}

export function getRegistrarProvider(): RegistrarProvider {
  if (_registrarProvider) return _registrarProvider;
  _registrarProvider = createRegistrarProviderFromEnv(defaultProviderType());
  return _registrarProvider;
}

export function createRegistrarProviderFromEnv(provider: RegistrarProviderType): RegistrarProvider {
  switch (provider) {
    case "porkbun": {
      const apiKey = process.env.PORKBUN_API_KEY;
      const apiSecret = process.env.PORKBUN_API_SECRET;
      if (!apiKey || !apiSecret) {
        throw new Error("PORKBUN_API_KEY and PORKBUN_API_SECRET required (atau set REGISTRAR_PROVIDER=mock untuk dev)");
      }
      return new PorkbunProvider({
        provider: "porkbun",
        apiKey,
        apiSecret,
        apiUrl: process.env.PORKBUN_API_URL,
        defaultNameservers: defaultNameservers(),
      });
    }
    case "domainnameapi": {
      const isTest = process.env.DOMAINNAMEAPI_SANDBOX !== "false";
      const resellerId = (isTest ? process.env.DOMAINNAMEAPI_OTE_RESELLER_ID : process.env.DOMAINNAMEAPI_RESELLER_ID)
        ?? process.env.DOMAINNAMEAPI_RESELLER_ID;
      const apiKey = (isTest ? process.env.DOMAINNAMEAPI_OTE_API_KEY : process.env.DOMAINNAMEAPI_API_KEY)
        ?? process.env.DOMAINNAMEAPI_API_KEY;
      if (!resellerId || !apiKey) {
        throw new Error("DomainNameAPI credentials not configured (atau set REGISTRAR_PROVIDER=mock untuk dev)");
      }
      return new DomainNameAPIProvider({
        provider: "domainnameapi",
        apiKey,
        apiSecret: apiKey,
        resellerId,
        isTest,
        defaultNameservers: defaultNameservers(),
      });
    }
    case "mock": {
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_REGISTRAR !== "true") {
        throw new Error("Mock registrar dilarang di production (set REGISTRAR_PROVIDER=porkbun|domainnameapi)");
      }
      return new MockRegistrarProvider();
    }
    default:
      throw new Error(`Unknown registrar provider: ${String(provider)}`);
  }
}

/** Injeksi manual (test / worker). Menimpa singleton. */
export function setRegistrarProvider(provider: RegistrarProvider): void {
  _registrarProvider = provider;
}

/** Reset singleton (test). */
export function resetRegistrarProvider(): void {
  _registrarProvider = null;
}

/** Buat provider dari config eksplisit (tanpa env). */
export function createRegistrarProvider(config: RegistrarConfig): RegistrarProvider {
  switch (config.provider) {
    case "porkbun":
      return new PorkbunProvider(config);
    case "domainnameapi":
      return new DomainNameAPIProvider(config);
    case "mock":
      return new MockRegistrarProvider();
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
