import { afterEach, describe, expect, it, vi } from "vitest";
import { dashboardNavHref, isAdminHostHeader } from "./nav";

/**
 * `dashboardNavHref` murni: hasilnya hanya bergantung pada (path, isAdminHost).
 * Tak ada `window`/`Date.now()`, jadi aman dipanggil identik di SSR & client —
 * itulah yang mencegah hydration mismatch pada href sidebar.
 */
describe("dashboardNavHref", () => {
  describe("host selain admin (tenant/root/custom domain)", () => {
    it("selalu memakai path penuh /dashboard/*", () => {
      expect(dashboardNavHref("/products", false)).toBe("/dashboard/products");
      expect(dashboardNavHref("/orders", false)).toBe("/dashboard/orders");
      expect(dashboardNavHref("/customize", false)).toBe("/dashboard/customize");
      expect(dashboardNavHref("/domain", false)).toBe("/dashboard/domain");
      expect(dashboardNavHref("/analytics", false)).toBe("/dashboard/analytics");
    });

    it("path root tetap /dashboard", () => {
      expect(dashboardNavHref("/", false)).toBe("/dashboard");
    });
  });

  describe("admin host (punya alias kanonik di root)", () => {
    it("memakai path pendek", () => {
      expect(dashboardNavHref("/products", true)).toBe("/products");
      expect(dashboardNavHref("/orders", true)).toBe("/orders");
      expect(dashboardNavHref("/customers", true)).toBe("/customers");
      expect(dashboardNavHref("/customize", true)).toBe("/customize");
      expect(dashboardNavHref("/domain", true)).toBe("/domain");
      expect(dashboardNavHref("/websites", true)).toBe("/websites");
    });

    it("root TIDAK dipendekkan — tidak ada alias kanonik untuk /dashboard", () => {
      // proxy.ts me-redirect /dashboard → /, jadi path penuh di sini
      // memang disengaja (DASHBOARD_PATHS tidak memuat "/").
      expect(dashboardNavHref("/", true)).toBe("/dashboard");
    });

    it("page-builder tetap penuh — tidak ada alias (DASHBOARD_PATHS tidak memuatnya)", () => {
      expect(dashboardNavHref("/websites/page-builder", true)).toBe(
        "/dashboard/websites/page-builder"
      );
      expect(dashboardNavHref("/websites/page-builder/abc123", true)).toBe(
        "/dashboard/websites/page-builder/abc123"
      );
    });
  });

  describe("normalisasi input", () => {
    it("path tanpa leading slash dinormalisasi", () => {
      expect(dashboardNavHref("products", true)).toBe("/products");
      expect(dashboardNavHref("products", false)).toBe("/dashboard/products");
    });

    it("path kosong tetap berakar di /dashboard", () => {
      expect(dashboardNavHref("", true)).toBe("/dashboard");
      expect(dashboardNavHref("", false)).toBe("/dashboard");
    });

    it("path turunan ikut dipendekkan", () => {
      expect(dashboardNavHref("/products/123/edit", true)).toBe("/products/123/edit");
      expect(dashboardNavHref("/products/123/edit", false)).toBe(
        "/dashboard/products/123/edit"
      );
    });
  });

  it("deterministik — panggil berulang selalu sama (anti Date.now()/window)", () => {
    for (const admin of [true, false]) {
      const runs = Array.from({ length: 5 }, () => dashboardNavHref("/products", admin));
      expect(new Set(runs).size).toBe(1);
      expect(runs[0]).toBe(admin ? "/products" : "/dashboard/products");
    }
  });
});

describe("isAdminHostHeader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mengenali admin host pada domain lokal", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "localhost:3000");
    expect(isAdminHostHeader("admin.localhost:3000")).toBe(true);
    expect(isAdminHostHeader("admin.localhost")).toBe(true);
  });

  it("mengenali admin host pada domain produksi", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "saas-saya.com");
    expect(isAdminHostHeader("admin.saas-saya.com")).toBe(true);
  });

  it("menolak root, tenant, dan custom domain", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "saas-saya.com");
    expect(isAdminHostHeader("saas-saya.com")).toBe(false);
    expect(isAdminHostHeader("www.saas-saya.com")).toBe(false);
    expect(isAdminHostHeader("toko.saas-saya.com")).toBe(false);
    expect(isAdminHostHeader("tokokustom.com")).toBe(false);
  });

  it("tidak salahdamnai subdomain yang memuat kata 'admin'", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "saas-saya.com");
    expect(isAdminHostHeader("admin-toko.saas-saya.com")).toBe(false);
    expect(isAdminHostHeader("tokosayaadmin.com")).toBe(false);
  });

  it("host kosong/null → bukan admin host (fallback aman ke /dashboard/*)", () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "saas-saya.com");
    expect(isAdminHostHeader("")).toBe(false);
    expect(isAdminHostHeader(null)).toBe(false);
    expect(isAdminHostHeader(undefined)).toBe(false);
    // Konsekuensinya href tetap path penuh — sama dengan SSR non-admin.
    expect(dashboardNavHref("/products", isAdminHostHeader(null))).toBe(
      "/dashboard/products"
    );
  });
});