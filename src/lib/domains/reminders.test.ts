import { describe, expect, it } from "vitest";
import {
  daysUntilExpiry,
  reminderBucketFor,
  shouldSendReminder,
  DAY_MS,
} from "./reminders";

const now = new Date("2026-10-01T00:00:00Z");
const isoPlus = (days: number) => new Date(now.getTime() + days * DAY_MS).toISOString();

describe("reminderBucketFor — T-30/14/7/1", () => {
  it("batas bucket tepat", () => {
    expect(reminderBucketFor(30)).toBe(30);
    expect(reminderBucketFor(20)).toBe(30);
    expect(reminderBucketFor(15)).toBe(30);
    expect(reminderBucketFor(14)).toBe(14);
    expect(reminderBucketFor(10)).toBe(14);
    expect(reminderBucketFor(8)).toBe(14);
    expect(reminderBucketFor(7)).toBe(7);
    expect(reminderBucketFor(3)).toBe(7);
    expect(reminderBucketFor(2)).toBe(7);
    expect(reminderBucketFor(1)).toBe(1);
    expect(reminderBucketFor(0)).toBe(1);
  });

  it("di luar jangkauan → null (tak kirim)", () => {
    expect(reminderBucketFor(31)).toBeNull();
    expect(reminderBucketFor(365)).toBeNull();
    expect(reminderBucketFor(-1)).toBeNull();
    expect(reminderBucketFor(NaN)).toBeNull();
  });
});

describe("daysUntilExpiry — ceil + negatif", () => {
  it("ceil ke atas (12 jam → 1 hari)", () => {
    expect(daysUntilExpiry(new Date(now.getTime() + 12 * 3600 * 1000).toISOString(), now)).toBe(1);
  });

  it("lewat expiry → negatif", () => {
    expect(daysUntilExpiry(isoPlus(-2), now)).toBeLessThan(0);
  });

  it("tanggal invalid → NaN", () => {
    expect(daysUntilExpiry("bukan-tanggal", now)).toBeNaN();
  });
});

describe("shouldSendReminder — anti-spam progresif", () => {
  it("belum pernah kirim + dalam 30 hari → kirim bucket sekarang", () => {
    expect(shouldSendReminder(null, isoPlus(20), now)).toEqual({ send: true, bucket: 30 });
    expect(shouldSendReminder(undefined, isoPlus(5), now)).toEqual({ send: true, bucket: 7 });
    expect(shouldSendReminder(null, isoPlus(1), now)).toEqual({ send: true, bucket: 1 });
  });

  it(">30 hari atau sudah lewat → jangan kirim", () => {
    expect(shouldSendReminder(null, isoPlus(60), now).send).toBe(false);
    expect(shouldSendReminder(null, isoPlus(-1), now).send).toBe(false);
    expect(shouldSendReminder(null, "invalid", now).send).toBe(false);
  });

  it("bucket sama → JANGAN kirim ulang (anti-spam harian)", () => {
    // Kirim 5 hari lalu (sisa 25 hari, bucket 30); sekarang sisa 20 hari (masih bucket 30).
    const then = new Date(now.getTime() - 5 * DAY_MS); // kirim 5 hari lalu
    const d = shouldSendReminder(new Date(then).toISOString(), isoPlus(20), now);
    expect(d).toEqual({ send: false, bucket: 30 });
  });

  it("progresif 30 → 14 → 7 → 1 (simulasi penuh tanpa spam)", () => {
    const expires = isoPlus(30); // expiry 30 hari dari now
    // Hari 0 (sisa 30): kirim T-30.
    let t0 = new Date(now);
    expect(shouldSendReminder(null, expires, t0)).toEqual({ send: true, bucket: 30 });
    const sent30 = new Date(t0).toISOString();
    // Hari +10 (sisa 20, bucket 30): diam.
    t0 = new Date(now.getTime() + 10 * DAY_MS);
    expect(shouldSendReminder(sent30, expires, t0).send).toBe(false);
    // Hari +16 (sisa 14, bucket 14 < 30): kirim.
    t0 = new Date(now.getTime() + 16 * DAY_MS);
    const d14 = shouldSendReminder(sent30, expires, t0);
    expect(d14).toEqual({ send: true, bucket: 14 });
    const sent14 = new Date(t0).toISOString();
    // Hari +17 (sisa 13, bucket 14): diam.
    t0 = new Date(now.getTime() + 17 * DAY_MS);
    expect(shouldSendReminder(sent14, expires, t0).send).toBe(false);
    // Hari +23 (sisa 7): kirim T-7; Hari +29 (sisa 1): kirim T-1.
    t0 = new Date(now.getTime() + 23 * DAY_MS);
    expect(shouldSendReminder(sent14, expires, t0)).toEqual({ send: true, bucket: 7 });
    const sent7 = new Date(t0).toISOString();
    t0 = new Date(now.getTime() + 29 * DAY_MS);
    expect(shouldSendReminder(sent7, expires, t0)).toEqual({ send: true, bucket: 1 });
  });

  it("renewal (expires_at mundur) → tak kirim ulang", () => {
    // Kirim T-1 kemarin untuk expiry lama; domain diperpanjang +1 tahun.
    const sentAt = new Date(now.getTime() - 1 * DAY_MS).toISOString();
    expect(shouldSendReminder(sentAt, isoPlus(364), now).send).toBe(false);
  });

  it("cron tertinggal (lompat bucket) → kirim bucket sekarang (catch-up)", () => {
    const sent30 = new Date(now.getTime() - 25 * DAY_MS).toISOString();
    // Sisa 5 hari, terakhir kirim bucket 30 → kirim T-7 (bukan spam T-14+T-7).
    expect(shouldSendReminder(sent30, isoPlus(5), now)).toEqual({ send: true, bucket: 7 });
  });
});
