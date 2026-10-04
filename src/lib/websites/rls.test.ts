import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveMaxWebsites } from "./limits";

function repoFile(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf-8");
}

/**
 * P0-4 RLS hardening — mock/static test, tanpa koneksi live Supabase.
 * - resolveMaxWebsites: unit murni.
 * - query builder: static check bahwa setiap query service-role owner-scoped
 *   selalu menyertakan .eq user_id / website_id via active check.
 * - migrasi 011: static check ENABLE RLS + defense-in-depth policies.
 */

describe("rls hardening: resolveMaxWebsites", () => {
  it("planMax valid selalu menang atas fallback tier", () => {
    expect(resolveMaxWebsites("free", 3)).toBe(3);
    expect(resolveMaxWebsites("growth", 10)).toBe(10);
  });

  it("fallback tier sinkron seed 006 + revisi 007", () => {
    expect(resolveMaxWebsites("free", null)).toBe(1);
    expect(resolveMaxWebsites("starter", null)).toBe(3);
    expect(resolveMaxWebsites("growth", null)).toBe(10);
    expect(resolveMaxWebsites("enterprise", null)).toBe(999);
  });

  it("planMax nol/negatif diabaikan (fail-safe ke fallback)", () => {
    expect(resolveMaxWebsites("free", 0)).toBe(1);
    expect(resolveMaxWebsites("starter", -5)).toBe(3);
  });
});

describe("rls hardening: owner-scoping query builder (static check)", () => {
  it("lib/websites/active.ts selalu scope user via RPC p_user_id (getActiveWebsite + getOwnedWebsite)", () => {
    const src = repoFile("src", "lib", "websites", "active.ts");
    // Sejak 026 otorisasi di RPC SECURITY DEFINER (bukan .eq di client):
    // kedua helper wajib meneruskan p_user_id.
    expect(src).toContain("p_user_id");
    expect(src).toContain("get_active_website");
    expect(src).toContain("get_website_by_id");
  });

  it("app/api/websites/route.ts list memfilter user_id milik sendiri", () => {
    const src = repoFile("app", "api", "websites", "route.ts");
    expect(src).toContain('.eq("user_id", userId)');
  });

  it("app/api/orders/route.ts GET mengisolasi user_id + website aktif", () => {
    const src = repoFile("app", "api", "orders", "route.ts");
    expect(src).toContain('.eq("user_id", userId)');
    expect(src).toContain('.eq("website_id", site.id)');
  });

  it("app/api/orders/[id]/status/route.ts update difilter id + user_id + website_id", () => {
    const src = repoFile("app", "api", "orders", "[id]", "status", "route.ts");
    expect(src).toContain('.eq("user_id", userId)');
    expect(src).toContain('.eq("website_id", site.id)');
  });
});

describe("rls hardening: migrasi 011 defense-in-depth (static check)", () => {
  it("ENABLE RLS untuk keempat tabel + policy owner authenticated", () => {
    const sql = repoFile("supabase", "migrations", "011_rls_hardening.sql");
    for (const table of ["websites", "orders", "user_templates", "subscriptions"]) {
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain("websites_owner_all");
    expect(sql).toContain("orders_owner_select");
    expect(sql).toContain("user_templates_owner_all");
    expect(sql).toContain("subscriptions_owner_select");
    expect(sql).toContain("TO authenticated");
  });

  it("tidak ada anon INSERT langsung ke orders (hanya via service-role di API)", () => {
    const sql = repoFile("supabase", "migrations", "011_rls_hardening.sql");
    expect(sql).not.toMatch(/CREATE POLICY[^;]*ON orders[^;]*FOR INSERT/i);
  });
});
