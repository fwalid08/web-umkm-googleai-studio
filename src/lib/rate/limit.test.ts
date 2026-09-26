import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimit } from "./limit";

describe("checkRateLimit (fallback memori tanpa env Upstash)", () => {
  beforeEach(() => {
    resetRateLimit();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("under-limit → ok:true + remaining berkurang", async () => {
    const first = await checkRateLimit("test:under", 3, 60_000);
    expect(first.ok).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await checkRateLimit("test:under", 3, 60_000);
    expect(second.ok).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("over-limit → ok:false + remaining 0", async () => {
    const key = "test:over";
    expect((await checkRateLimit(key, 2, 60_000)).ok).toBe(true);
    expect((await checkRateLimit(key, 2, 60_000)).ok).toBe(true);
    const blocked = await checkRateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("window reset → ok:true lagi setelah window berlalu", async () => {
    const key = "test:window";
    await checkRateLimit(key, 1, 30);
    expect((await checkRateLimit(key, 1, 30)).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 50));
    const after = await checkRateLimit(key, 1, 30);
    expect(after.ok).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it("fallback tanpa env → tetap jalan walau Upstash tidak dikonfigurasi", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const res = await checkRateLimit("test:noenv", 5, 60_000);
    expect(res.ok).toBe(true);
    expect(res.remaining).toBe(4);
  });
});
