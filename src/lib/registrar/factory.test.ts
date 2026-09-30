import { describe, expect, it, afterEach, vi } from "vitest";
import {
  createRegistrarProvider,
  createRegistrarProviderFromEnv,
  getRegistrarProvider,
  getSupportedProviders,
  isProviderSupported,
  resetRegistrarProvider,
  setRegistrarProvider,
} from "./factory";
import { MockRegistrarProvider } from "./mock";
import { PorkbunProvider } from "./porkbun";

const ENV_KEYS = [
  "REGISTRAR_PROVIDER",
  "ALLOW_MOCK_REGISTRAR",
  "PORKBUN_API_KEY",
  "PORKBUN_API_SECRET",
  "DEFAULT_NAMESERVERS",
] as const;

function setEnv(patch: Record<string, string | undefined>) {
  for (const k of ENV_KEYS) {
    if (patch[k] === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, patch[k] as string);
  }
  // stubEnv("") berarti kosong; normalisasi: string kosong == tidak diset
  for (const k of ENV_KEYS) {
    if (process.env[k] === "") delete process.env[k];
  }
}

function setNodeEnv(value: string) {
  vi.stubEnv("NODE_ENV", value);
}

afterEach(() => {
  vi.unstubAllEnvs();
  resetRegistrarProvider();
});

describe("registrar factory (driver switchable)", () => {
  it("mendukung porkbun, mock", () => {
    expect(getSupportedProviders()).toEqual(["porkbun", "mock"]);
    expect(isProviderSupported("porkbun")).toBe(true);
    expect(isProviderSupported("niagahoster")).toBe(false);
  });

  it("default dev tanpa env -> mock (tanpa kredensial tetap jalan)", () => {
    setEnv({ REGISTRAR_PROVIDER: undefined, ALLOW_MOCK_REGISTRAR: undefined });
    setNodeEnv("test");
    const p = getRegistrarProvider();
    expect(p.id).toBe("mock");
    expect(getRegistrarProvider()).toBe(p); // singleton
  });

  it("REGISTRAR_PROVIDER=porkbun tanpa key -> throw eksplisit", () => {
    setEnv({ REGISTRAR_PROVIDER: "porkbun", PORKBUN_API_KEY: undefined, PORKBUN_API_SECRET: undefined });
    expect(() => getRegistrarProvider()).toThrow(/PORKBUN_API_KEY/);
  });

  it("mock dilarang di production kecuali ALLOW_MOCK_REGISTRAR=true", () => {
    setEnv({ REGISTRAR_PROVIDER: "mock", ALLOW_MOCK_REGISTRAR: undefined });
    setNodeEnv("production");
    expect(() => getRegistrarProvider()).toThrow(/dilarang di production/);
  });

  it("createRegistrarProvider dari config eksplisit (tanpa env)", () => {
    expect(createRegistrarProvider({ provider: "mock", apiKey: "", apiSecret: "" })).toBeInstanceOf(MockRegistrarProvider);
    expect(
      createRegistrarProvider({ provider: "porkbun", apiKey: "k", apiSecret: "s" })
    ).toBeInstanceOf(PorkbunProvider);
    expect(() => createRegistrarProvider({ provider: "custom", apiKey: "", apiSecret: "" })).toThrow(/not implemented/);
  });

  it("setRegistrarProvider menimpa singleton (injeksi test)", () => {
    const mock = new MockRegistrarProvider();
    setRegistrarProvider(mock);
    expect(getRegistrarProvider()).toBe(mock);
  });

  it("createRegistrarProviderFromEnv porkbun membaca key dari env", () => {
    setEnv({ PORKBUN_API_KEY: "k", PORKBUN_API_SECRET: "s" });
    expect(createRegistrarProviderFromEnv("porkbun")).toBeInstanceOf(PorkbunProvider);
  });
});
