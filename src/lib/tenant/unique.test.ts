import { describe, expect, it, vi } from "vitest";
import { ensureUniqueSubdomain } from "./index";

describe("ensureUniqueSubdomain", () => {
  it("kembalikan base jika tersedia", async () => {
    const check = vi.fn(async (): Promise<boolean> => false);
    const out = await ensureUniqueSubdomain("tenant-abc12345", check);
    expect(out).toBe("tenant-abc12345");
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith("tenant-abc12345");
  });

  it("retry dengan suffix saat clash single-shot", async () => {
    const check = vi.fn(async (s: string) => s === "tenant-abc12345");
    const out = await ensureUniqueSubdomain("tenant-abc12345", check);
    expect(out).not.toBe("tenant-abc12345");
    expect(out.startsWith("tenant-abc12345-")).toBe(true);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it("loop maksimal 3x saat selalu clash", async () => {
    const check = vi.fn(async (): Promise<boolean> => true);
    const out = await ensureUniqueSubdomain("tenant-abc12345", check);
    expect(check).toHaveBeenCalledTimes(3);
    // kandidat terakhir tetap dikembalikan (DB constraint yang menolak)
    expect(out.startsWith("tenant-abc12345")).toBe(true);
  });

  it("fail-open saat check throw", async () => {
    const check = vi.fn(async (): Promise<boolean> => {
      throw new Error("db down");
    });
    const out = await ensureUniqueSubdomain("tenant-abc12345", check);
    expect(out).toBe("tenant-abc12345");
  });
});
