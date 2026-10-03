import { describe, expect, it } from "vitest";
import {
  allowedTierRequirements,
  isPublicTemplateVisible,
  sessionTier,
} from "@/lib/builder/template-access";

describe("allowedTierRequirements", () => {
  it("enterprise melihat semua tier", () => {
    expect(allowedTierRequirements("enterprise")).toBeNull();
  });

  it("growth melihat free, starter, growth", () => {
    expect(allowedTierRequirements("growth")).toEqual(["free", "starter", "growth"]);
  });

  it("starter melihat free, starter", () => {
    expect(allowedTierRequirements("starter")).toEqual(["free", "starter"]);
  });

  it("free dan tier tak dikenal hanya melihat free", () => {
    expect(allowedTierRequirements("free")).toEqual(["free"]);
    expect(allowedTierRequirements("unknown")).toEqual(["free"]);
    expect(allowedTierRequirements(null)).toEqual(["free"]);
    expect(allowedTierRequirements(undefined)).toEqual(["free"]);
  });
});

describe("isPublicTemplateVisible", () => {
  it("menolak scope non-public", () => {
    expect(
      isPublicTemplateVisible({ scope: "user", tier_requirement: "free" }, "free"),
    ).toBe(false);
  });

  it("tier_requirement NULL selalu boleh", () => {
    expect(
      isPublicTemplateVisible({ scope: "public", tier_requirement: null }, "free"),
    ).toBe(true);
  });

  it("free tidak boleh melihat template starter", () => {
    expect(
      isPublicTemplateVisible({ scope: "public", tier_requirement: "starter" }, "free"),
    ).toBe(false);
  });

  it("starter boleh melihat template starter, enterprise boleh semua", () => {
    expect(
      isPublicTemplateVisible({ scope: "public", tier_requirement: "starter" }, "starter"),
    ).toBe(true);
    expect(
      isPublicTemplateVisible({ scope: "public", tier_requirement: "enterprise" }, "enterprise"),
    ).toBe(true);
  });
});

describe("sessionTier", () => {
  it("fallback ke free bila session/tier kosong", () => {
    expect(sessionTier(null)).toBe("free");
    expect(sessionTier({})).toBe("free");
    expect(sessionTier({ user: {} })).toBe("free");
    expect(sessionTier({ user: { tier: "growth" } })).toBe("growth");
  });
});
