/**
 * URL tenant & root — SELALU env-driven, jangan hardcode domain.
 * Lokal:  NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000  → tenant-x.localhost:3000 (http)
 * Prod:    NEXT_PUBLIC_ROOT_DOMAIN=saas-saya.com   → tenant-x.saas-saya.com (https)
 * Cert lokal: .cert/localhost.pem (mkcert, SAN *.localhost) via `pnpm dev:https`.
 */

function stripSlash(s: string): string {
  return (s || "").trim().replace(/\/+$/, "");
}

/** "localhost:3000" | "saas-saya.com" (bisa bawa port). */
export function rootDomain(): string {
  return stripSlash(process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com");
}

/** Host tanpa port: "localhost" | "saas-saya.com". */
export function rootHost(): string {
  return rootDomain().split("/")[0].split(":")[0].toLowerCase();
}

function isLocalHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

/** http untuk lokal, https untuk prod — kecuali APP_URL eksplisit. */
export function appProtocol(): "http" | "https" {
  const app = stripSlash(process.env.NEXT_PUBLIC_APP_URL || "");
  if (app.startsWith("https://")) return "https";
  if (app.startsWith("http://")) return "http";
  return isLocalHost(rootHost()) ? "http" : "https";
}

/** Base app URL, mis. http://localhost:3000. */
export function appBase(): string {
  const app = stripSlash(process.env.NEXT_PUBLIC_APP_URL || "");
  if (app) return app;
  return `${appProtocol()}://${rootDomain()}`;
}

/** URL penuh tenant: http://toko-x.localhost:3000. Null jika subdomain kosong. */
export function tenantUrl(subdomain: string | null | undefined): string | null {
  if (!subdomain) return null;
  return `${appProtocol()}://${subdomain}.${rootDomain()}`;
}

/** Tampilan: toko-x.localhost:3000 (tanpa protokol). */
export function tenantDisplay(subdomain: string | null | undefined): string {
  if (!subdomain) return "-";
  return `${subdomain}.${rootDomain()}`;
}

/** Untuk CNAME / DNS: host root TANPA port (port tak valid di DNS). */
export function dnsTarget(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN?.split(":")[0] || "saas-saya.com";
}
