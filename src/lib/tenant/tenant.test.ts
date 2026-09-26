import { describe, expect, it } from "vitest";
import { isValidSubdomain, subdomainFromHost, isRootHost, stripPort } from "./index";

describe("tenant helpers", () => {
  it("menolak reserved subdomain", () => {
    expect(isValidSubdomain("admin")).toBe(false);
    expect(isValidSubdomain("api")).toBe(false);
    expect(isValidSubdomain("tokoku")).toBe(true);
    expect(isValidSubdomain("AB")).toBe(false);
  });

  it("strip port aman IPv6", () => {
    expect(stripPort("localhost:3000")).toBe("localhost");
    expect(stripPort("[::1]:3000")).toBe("::1");
    expect(stripPort("toko.saas-saya.com")).toBe("toko.saas-saya.com");
  });

  it("parse subdomain dari host", () => {
    expect(subdomainFromHost("tokoku.localhost", "localhost:3000")).toBe("tokoku");
    expect(subdomainFromHost("tokoku.saas-saya.com", "saas-saya.com")).toBe("tokoku");
    expect(subdomainFromHost("admin.saas-saya.com", "saas-saya.com")).toBe(null);
    expect(subdomainFromHost("saas-saya.com", "saas-saya.com")).toBe(null);
  });

  it("root host mencakup admin + vercel", () => {
    expect(isRootHost("admin.saas-saya.com", "saas-saya.com")).toBe(true);
    expect(isRootHost("x.vercel.app", "saas-saya.com")).toBe(true);
    expect(isRootHost("tokoku.saas-saya.com", "saas-saya.com")).toBe(false);
  });
});
