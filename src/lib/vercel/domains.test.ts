import { describe, expect, it } from "vitest";
import { addDomainToVercel, removeDomainFromVercel, verifyDomainOnVercel } from "./domains";

function okResponse(status = 200): Response {
  return new Response(JSON.stringify({}), { status, headers: { "Content-Type": "application/json" } });
}

describe("vercel domains client", () => {
  it("melempar bila VERCEL_TOKEN belum diset", async () => {
    const saved = process.env.VERCEL_TOKEN;
    delete process.env.VERCEL_TOKEN;
    try {
      await expect(addDomainToVercel("tokoku.com")).rejects.toThrow(/VERCEL_TOKEN/);
    } finally {
      if (saved !== undefined) process.env.VERCEL_TOKEN = saved;
    }
  });

  it("add 200 -> ok, 409 (sudah ada) -> ok, 400 -> error berisi pesan", async () => {
    const ok = await addDomainToVercel("a.com", {
      token: "t",
      fetchFn: (async () => okResponse(200)) as typeof fetch,
    });
    expect(ok).toEqual({ ok: true });
    const conflict = await addDomainToVercel("a.com", {
      token: "t",
      fetchFn: (async () => okResponse(409)) as typeof fetch,
    });
    expect(conflict).toEqual({ ok: true });
    const bad = await addDomainToVercel("a.com", {
      token: "t",
      fetchFn: (async () =>
        new Response(JSON.stringify({ error: { message: "Invalid domain" } }), { status: 400 })) as typeof fetch,
    });
    expect(bad.ok).toBe(false);
    expect(bad.error).toBe("Invalid domain");
  });

  it("verify + remove memakai token Bearer dan mengembalikan typed result", async () => {
    let seenAuth = "";
    const fetchFn = (async (url: unknown, init?: RequestInit) => {
      seenAuth = String((init?.headers as Record<string, string>)?.Authorization);
      void url;
      return okResponse(200);
    }) as typeof fetch;
    expect(await verifyDomainOnVercel("a.com", { token: "tok", fetchFn })).toEqual({ ok: true });
    expect(await removeDomainFromVercel("a.com", { token: "tok", fetchFn })).toEqual({ ok: true });
    expect(seenAuth).toBe("Bearer tok");
  });

  it("network error -> ok:false tanpa throw", async () => {
    const fetchFn = (async () => {
      throw new Error("down");
    }) as typeof fetch;
    const r = await verifyDomainOnVercel("a.com", { token: "t", fetchFn });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("down");
  });
});
