import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Ekstrak subdomain tenant dari hostname → header x-tenant-subdomain.
 * Env-driven: ROOT=localhost:3000 (dev, sub.localhost) atau saas-saya.com (prod).
 * Host lain (custom domain) diteruskan; getTenantSite() resolve via DB.
 * Validasi terpusat di src/lib/tenant (isValidSubdomain, stripPort).
 */

function stripPortLocal(host: string): string {
  const h = (host || "").trim().toLowerCase();
  if (h.startsWith("[")) {
    const end = h.indexOf("]");
    if (end !== -1) return h.slice(1, end);
    return h;
  }
  const parts = h.split(":");
  if (parts.length === 2) return parts[0];
  return h;
}

const ROOT = stripPortLocal(process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com");
const RESERVED = new Set([
  "admin", "api", "www", "root", "app", "dashboard", "auth",
  "login", "signin", "signup", "support", "help",
]);
const SUB_RE = /^[a-z0-9-]{3,50}$/;
function isValidSub(sub: string): boolean {
  return SUB_RE.test(sub) && !RESERVED.has(sub);
}

function tenantHeaders(sub: string) {
  const res = NextResponse.next();
  res.headers.set("x-tenant-subdomain", sub);
  res.headers.set("x-is-tenant", "true");
  return res;
}

export default function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;
  // Static/API dilewati (matcher sudah kecualikan); JANGAN pakai includes(".")
  // karena route valid bisa mengandung titik.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_static") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Support /admin alias -> /dashboard
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const newPath = pathname.replace(/^\/admin/, "/dashboard");
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    return NextResponse.redirect(url);
  }

  const host = hostname.toLowerCase();
  if (host.startsWith("admin.")) {
    const res = NextResponse.next();
    res.headers.set("x-tenant-subdomain", "");
    res.headers.set("x-is-tenant", "admin");
    return res;
  }

  // Root & www → landing / central dashboard
  if (host === ROOT || host === `www.${ROOT}` || host === "localhost" || host === "127.0.0.1") {
    const res = NextResponse.next();
    res.headers.set("x-tenant-subdomain", "");
    res.headers.set("x-is-tenant", "false");
    return res;
  }

  // Dev: sub.localhost → tenant
  if (host.endsWith(".localhost")) {
    const sub = host.replace(/\.localhost$/, "");
    if (isValidSub(sub)) {
      const res = tenantHeaders(sub);
      if (pathname.startsWith("/dashboard")) {
        res.headers.set("x-scoped-tenant", sub);
      }
      return res;
    }
  }

  // sub.ROOT → tenant (prod: toko.saas-saya.com)
  if (host.endsWith(`.${ROOT}`)) {
    const sub = host.slice(0, -(ROOT.length + 1));
    if (isValidSub(sub)) {
      const res = tenantHeaders(sub);
      if (pathname.startsWith("/dashboard")) {
        res.headers.set("x-scoped-tenant", sub);
      }
      return res;
    }
  }

  // Bukan root & bukan sub → custom domain (resolve di getTenantSite)
  const res = NextResponse.next();
  res.headers.set("x-tenant-subdomain", "");
  res.headers.set("x-custom-domain", host);
  res.headers.set("x-is-tenant", "true");
  if (pathname.startsWith("/dashboard")) {
    res.headers.set("x-scoped-custom-domain", host);
  }
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
