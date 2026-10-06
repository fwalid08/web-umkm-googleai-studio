import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest, type NextResponse } from "next/server";
import nextConfig from "../next.config";

const { getTokenMock } = vi.hoisted(() => ({ getTokenMock: vi.fn() }));
vi.mock("next-auth/jwt", () => ({ getToken: getTokenMock }));

let runProxy: (request: NextRequest) => Promise<NextResponse>;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
  runProxy = (await import("../proxy")).default;
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("admin host routing", () => {
  it("does not apply legacy websites redirects on the admin host", async () => {
    const redirects = await nextConfig.redirects?.();
    const websitesRedirects = redirects?.filter((rule) => rule.source.startsWith("/websites"));
    const adminHost = nextConfig.allowedDevOrigins?.find((origin) => origin.startsWith("admin."));

    expect(websitesRedirects).toHaveLength(2);
    expect(adminHost).toBeTruthy();
    for (const rule of websitesRedirects ?? []) {
      expect(rule.missing).toContainEqual({ type: "host", value: adminHost });
    }
  });

  it("redirects unauthenticated admin root to signin with dashboard callback", async () => {
    getTokenMock.mockResolvedValueOnce(null);

    const response = await runProxy(new NextRequest("http://admin.localhost:3000/"));
    const location = new URL(response.headers.get("location")!);

    expect(location.origin).toBe("http://admin.localhost:3000");
    expect(location.pathname).toBe("/signin");
    expect(location.searchParams.get("callbackUrl")).toBe("/");
  });

  it("rewrites authenticated admin root to the existing dashboard route", async () => {
    getTokenMock.mockResolvedValueOnce({ email: "merchant@example.com" });

    const response = await runProxy(new NextRequest("http://admin.localhost:3000/"));

    expect(new URL(response.headers.get("x-middleware-rewrite")!).pathname).toBe("/dashboard");
  });

  it("redirects dashboard-prefixed paths to canonical root paths and preserves query", async () => {
    const nested = await runProxy(new NextRequest("http://admin.localhost:3000/dashboard/settings?tab=account"));
    const nestedLocation = new URL(nested.headers.get("location")!);
    expect(nestedLocation.pathname).toBe("/settings");
    expect(nestedLocation.searchParams.get("tab")).toBe("account");

    const root = await runProxy(new NextRequest("http://admin.localhost:3000/dashboard"));
    expect(new URL(root.headers.get("location")!).pathname).toBe("/");
  });

  it("rewrites canonical root dashboard aliases to existing dashboard routes", async () => {
    getTokenMock.mockResolvedValueOnce({ email: "merchant@example.com" });
    const settings = await runProxy(new NextRequest("http://admin.localhost:3000/settings"));
    expect(new URL(settings.headers.get("x-middleware-rewrite")!).pathname).toBe("/dashboard/settings");

    getTokenMock.mockResolvedValueOnce({ email: "merchant@example.com" });
    const reports = await runProxy(new NextRequest("http://admin.localhost:3000/reports"));
    expect(new URL(reports.headers.get("x-middleware-rewrite")!).pathname).toBe("/dashboard/reports");

    getTokenMock.mockResolvedValueOnce(null);
    const protectedSettings = await runProxy(new NextRequest("http://admin.localhost:3000/settings"));
    const signin = new URL(protectedSettings.headers.get("location")!);
    expect(signin.pathname).toBe("/signin");
    expect(signin.searchParams.get("callbackUrl")).toBe("/settings");
  });

  it("rewrites canonical root web-design alias to the existing dashboard route", async () => {
    getTokenMock.mockResolvedValueOnce({ email: "merchant@example.com" });
    const webDesign = await runProxy(new NextRequest("http://admin.localhost:3000/web-design"));
    expect(new URL(webDesign.headers.get("x-middleware-rewrite")!).pathname).toBe("/dashboard/web-design");

    getTokenMock.mockResolvedValueOnce(null);
    const protectedWebDesign = await runProxy(new NextRequest("http://admin.localhost:3000/web-design"));
    const signin = new URL(protectedWebDesign.headers.get("location")!);
    expect(signin.pathname).toBe("/signin");
    expect(signin.searchParams.get("callbackUrl")).toBe("/web-design");
  });

  it("redirects dashboard-prefixed web-design to the canonical root path", async () => {
    const response = await runProxy(new NextRequest("http://admin.localhost:3000/dashboard/web-design"));
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/web-design");
  });

  it("protects onboarding and preserves its return path", async () => {
    getTokenMock.mockResolvedValueOnce(null);

    const protectedOnboarding = await runProxy(
      new NextRequest("http://admin.localhost:3000/onboarding?returnTo=%2Fsettings")
    );
    const signin = new URL(protectedOnboarding.headers.get("location")!);
    expect(signin.pathname).toBe("/signin");
    expect(signin.searchParams.get("callbackUrl")).toBe("/onboarding?returnTo=%2Fsettings");

    getTokenMock.mockResolvedValueOnce({ email: "merchant@example.com" });
    const onboarding = await runProxy(new NextRequest("http://admin.localhost:3000/onboarding"));
    expect(onboarding.status).toBe(200);
    expect(onboarding.headers.get("x-is-tenant")).toBe("admin");
  });

  it.each(["/signin", "/signup"])("redirects authenticated users from %s to the dashboard", async (pathname) => {
    getTokenMock.mockResolvedValueOnce({ email: "merchant@example.com" });

    const response = await runProxy(new NextRequest(`http://admin.localhost:3000${pathname}`));

    expect(new URL(response.headers.get("location")!).pathname).toBe("/");
  });

  it.each(["/signin", "/signup"])("keeps %s available to anonymous users", async (pathname) => {
    getTokenMock.mockResolvedValueOnce(null);

    const response = await runProxy(new NextRequest(`http://admin.localhost:3000${pathname}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects public signin and preserves its query string", async () => {
    const response = await runProxy(new NextRequest("http://localhost:3000/signin?registered=true"));
    const location = new URL(response.headers.get("location")!);

    expect(location.origin).toBe("http://admin.localhost:3000");
    expect(location.pathname).toBe("/signin");
    expect(location.searchParams.get("registered")).toBe("true");
  });

  it("redirects password recovery routes to the admin host", async () => {
    const response = await runProxy(new NextRequest("http://localhost:3000/reset-password?code=abc"));
    const location = new URL(response.headers.get("location")!);

    expect(location.origin).toBe("http://admin.localhost:3000");
    expect(location.pathname).toBe("/reset-password");
    expect(location.searchParams.get("code")).toBe("abc");
  });

  it.each(["/privacy", "/terms"])("allows public legal page %s on the admin host", async (pathname) => {
    const response = await runProxy(new NextRequest(`http://admin.localhost:3000${pathname}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it.each(["/thumbnails/food.jpg", "/thumbnails/laundry-emerald.jpg"])(
    "lets public asset %s through on the admin host (no signin redirect)",
    async (pathname) => {
      // Regresi: matcher + early-return harus meloloskan aset `public/`
      // (thumbnail kartu /web-design + modal galeri). Sebelumnya request ini
      // jatuh ke branch "unknown path → /signin" sehingga <img> menerima
      // HTML 307 dan kartu hanya menampilkan gradien.
      // NOTE: getTokenMock dibersihkan dulu — mock ini kumulatif antar-test
      // (vi.fn global), jadi `toHaveBeenCalled` tanpa clear akan bocor dari
      // test sebelumnya. Yang penting: request aset lolos TANPA redirect
      // signin dan tanpa memicu pemanggilan getToken BARU di test ini.
      getTokenMock.mockClear();
      getTokenMock.mockResolvedValueOnce(null);

      const response = await runProxy(new NextRequest(`http://admin.localhost:3000${pathname}`));

      expect(getTokenMock).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    },
  );
});

describe("tenant host routing", () => {
  it("recognizes .localhost tenant hosts", async () => {
    const response = await runProxy(new NextRequest("http://toko-x.localhost:3000/"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-tenant-subdomain")).toBe("toko-x");
    expect(response.headers.get("x-is-tenant")).toBe("true");
  });
});