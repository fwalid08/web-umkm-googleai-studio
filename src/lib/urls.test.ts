import { describe, expect, it, vi, afterEach } from "vitest";
import { appProtocol, rootHost, tenantDisplay, tenantUrl } from "./urls";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("urls (env-driven)", () => {
  it("lokal: http + port", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(rootHost()).toBe("localhost");
    expect(appProtocol()).toBe("http");
    expect(tenantUrl("toko-x")).toBe("http://toko-x.localhost:3000");
    expect(tenantDisplay("toko-x")).toBe("toko-x.localhost:3000");
  });

  it("prod: https tanpa port", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "saas-saya.com");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(appProtocol()).toBe("https");
    expect(tenantUrl("toko-x")).toBe("https://toko-x.saas-saya.com");
  });

  it("APP_URL eksplisit menang (mis. https lokal via mkcert)", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://localhost:3000");
    expect(appProtocol()).toBe("https");
    expect(tenantUrl("toko-x")).toBe("https://toko-x.localhost:3000");
  });

  it("null-safe", () => {
    expect(tenantUrl(null)).toBeNull();
    expect(tenantDisplay(undefined)).toBe("-");
  });
});
