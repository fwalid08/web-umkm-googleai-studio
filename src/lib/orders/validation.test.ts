import { describe, expect, it } from "vitest";
import { calcTotal, canTransition, isRateLimited } from "./validation";

describe("canTransition", () => {
  it("maju 1 langkah diizinkan", () => {
    expect(canTransition("baru", "konfirmasi")).toBe(true);
    expect(canTransition("konfirmasi", "dikirim")).toBe(true);
    expect(canTransition("dikirim", "selesai")).toBe(true);
  });

  it("mundur 1 langkah diizinkan", () => {
    expect(canTransition("konfirmasi", "baru")).toBe(true);
    expect(canTransition("dikirim", "konfirmasi")).toBe(true);
  });

  it("lompat 2 langkah ditolak", () => {
    expect(canTransition("baru", "dikirim")).toBe(false);
    expect(canTransition("baru", "selesai")).toBe(false);
  });

  it("selesai terminal + diam ditolak", () => {
    expect(canTransition("selesai", "baru")).toBe(false);
    expect(canTransition("baru", "baru")).toBe(false);
  });
});

describe("calcTotal", () => {
  it("hitung price × qty, abaikan input client", () => {
    expect(calcTotal(25000, 2)).toBe(50000);
  });

  it("tolak qty di luar 1–99", () => {
    expect(calcTotal(10000, 0)).toBe(-1);
    expect(calcTotal(10000, 100)).toBe(-1);
  });
});

describe("isRateLimited", () => {
  it("blokir setelah 10x dalam 1 menit", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 10; i++) expect(isRateLimited(key, 10, 60_000, 1000 + i)).toBe(false);
    expect(isRateLimited(key, 10, 60_000, 1010)).toBe(true);
  });
});
