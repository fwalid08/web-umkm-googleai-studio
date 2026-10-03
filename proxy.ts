import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Ekstrak subdomain tenant dari hostname → header x-tenant-subdomain.
 * Env-driven: ROOT=localhost:3000 (dev, sub.localhost) atau saas-saya.com (prod).
 * Host lain (custom domain) diteruskan; getTenantSite() resolve via DB.
 * Validasi terpusat di src/lib/tenant (isValidSubdomain, stripPort).
 * 
 * Ditambah: session validation untuk /dashboard dan /admin routes
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

const PROTECTED_PATHS = ["/dashboard", "/admin"];
const ADMIN_PATHS = ["/admin"];

async function validateSession(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return null;
  }

  // DEBUG: Check cookie header
  const cookieHeader = request.headers.get("cookie");
  const hasSessionCookie = !!cookieHeader?.includes("authjs.session-token");
  console.log("[PROXY] Cookie check:", { pathname, hasSessionCookie });

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  console.log("[PROXY] validateSession:", {
    pathname,
    hasToken: !!token,
    tokenEmail: token?.email,
    tokenTier: token?.tier,
    isAdmin,
  });

  if (!token) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdmin) {
    const isAdminUser = token.email === "admin@saas.com" && token.tier === "enterprise";
    console.log("[PROXY] Admin check:", { isAdminUser, email: token.email, tier: token.tier });
    if (!isAdminUser) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return null;
}

export default async function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // Session validation untuk protected routes
  const sessionRedirect = await validateSession(request);
  if (sessionRedirect) {
    return sessionRedirect;
  }

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

  // NOTE: /admin adalah route admin sungguhan (app/(admin)/), bukan alias.
  // Jangan redirect ke /dashboard — proteksi sudah ditangani validateSession di atas.

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