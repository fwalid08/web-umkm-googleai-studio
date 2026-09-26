import { describe, expect, it } from "vitest";
import { isTrialExpired } from "./limits";

describe("isTrialExpired", () => {
  it("trial aktif (free + ends di masa depan) → false", () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isTrialExpired(future, "free")).toBe(false);
  });

  it("trial expired (free + ends di masa lalu) → true", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isTrialExpired(past, "free")).toBe(true);
  });

  it("trial_ends_at null (free murni) → false", () => {
    expect(isTrialExpired(null, "free")).toBe(false);
    expect(isTrialExpired(undefined, "free")).toBe(false);
  });

  it("tier berbayar tidak pernah expired walau tanggal lewat → false", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(isTrialExpired(past, "starter")).toBe(false);
    expect(isTrialExpired(past, "growth")).toBe(false);
    expect(isTrialExpired(past, "enterprise")).toBe(false);
  });
});
