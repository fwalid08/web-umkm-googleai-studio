import { describe, expect, it } from "vitest";
import { resolveMaxWebsites } from "./limits";

describe("resolveMaxWebsites", () => {
  it("pakai max plan dari DB jika ada", () => {
    expect(resolveMaxWebsites("free", 2)).toBe(2);
    expect(resolveMaxWebsites("starter", 10)).toBe(10);
  });

  it("fallback tier sesuai seed 006 + revisi 007 jika plan null", () => {
    expect(resolveMaxWebsites("free", null)).toBe(1);
    expect(resolveMaxWebsites("starter", null)).toBe(3);
    expect(resolveMaxWebsites("growth", null)).toBe(10);
    expect(resolveMaxWebsites("enterprise", null)).toBe(999);
  });

  it("tier tak dikenal → 1", () => {
    expect(resolveMaxWebsites("ngawur", null)).toBe(1);
    expect(resolveMaxWebsites(null, null)).toBe(1);
  });
});
