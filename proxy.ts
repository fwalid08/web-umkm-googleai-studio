import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { adminUrl as buildAdminUrl } from "@/lib/urls";

/**
 * Ekstrak subdomain tenant dari hostname → header x-tenant-subdomain.
 * Env-driven: ROOT=localhost:3000 (dev, sub.localhost) atau saas-saya.com (prod).
 * Host lain (custom domain) diteruskan; getTenantSite() resolve via DB.
 * Validasi terpusat di src/lib/tenant (isValidSubdomain, stripPort).
 * 
 * Routing untuk admin.localhost:3000:
 * - /, /admin* → Admin panel (platform admin only)
 * - /signin, /signup → Auth pages (public access)
 * - /dashboard*, /settings*, /billing*, dll → Tenant dashboard (protected, redirect to /signin if not authenticated)
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
const ADMIN_HOST = `admin.${ROOT}`;
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

function adminHeaders() {
  const res = NextResponse.next();
  res.headers.set("x-tenant-subdomain", "");
  res.headers.set("x-is-tenant", "admin");
  return res;
}

const PROTECTED_PATHS = ["/dashboard", "/admin"];
const ADMIN_PATHS = ["/admin"];

const DASHBOARD_PATHS = [
  "/dashboard", "/settings", "/billing", "/products", "/orders",
  "/customers", "/analytics", "/websites", "/domain", "/themes", "/announcement",
  // Halaman Desain Website (/dashboard/web-design → kanonik /web-design di
  // admin host; editor single-page ada di /web-design/customize).
  "/web-design",
  // SEO punya halaman dashboard sendiri (dipindahkan dari panel builder).
  "/seo",
];

const AUTH_PATHS = ["/signin", "/signup", "/forgot", "/reset-password"];
const AUTH_ONLY_PATHS = ["/signin", "/signup"];
const ADMIN_PUBLIC_PATHS = [...AUTH_PATHS, "/privacy", "/terms"];

/**
 * Aset publik dari `public/` (mis. `/thumbnails/<id>.jpg` untuk kartu
 * template di /web-design + modal galeri builder). Tanpa bypass ini,
 * request gambar di admin host jatuh ke branch "unknown path → redirect
 * /signin", sehingga `<img>` menerima HTML 307 bukan JPEG → `onError`
 * menyembunyikan gambar dan kartu hanya menampilkan gradien.
 * Daftar prefix eksplisit (bukan cek `.`) supaya route valid bertitik
 * tetap lewat proxy.
 */
const PUBLIC_ASSET_PREFIXES = [
  "/thumbnails",
  "/icons",
  "/images",
  "/assets",
  "/fonts",
  "/logos",
  "/media",
];

function isPublicAsset(pathname: string): boolean {
  return PUBLIC_ASSET_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

async function validateSession(
  request: NextRequest,
  options: { forceProtected?: boolean; callbackPath?: string } = {}
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  const isProtected = options.forceProtected || PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAdmin = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isProtected) {
    return null;
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", options.callbackPath || pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdmin) {
    const isAdminUser = token.email === "admin@saas.com" && token.tier === "enterprise";
    if (!isAdminUser) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return null;
}

export default async function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

  // Static/API dilewati (matcher sudah kecualikan); JANGAN pakai includes(".")
  // karena route valid bisa mengandung titik. `isPublicAsset` memakai daftar
  // prefix eksplisit supaya aman dari masalah itu.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_static") ||
    pathname === "/favicon.ico" ||
    isPublicAsset(pathname)
  ) {
    return NextResponse.next();
  }

  const host = stripPortLocal(request.headers.get("host") || hostname);

  // Admin subdomain → tenant dashboard at root + platform admin under /admin
  if (host === ADMIN_HOST) {
    if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
      const canonicalPath = pathname.slice("/dashboard".length) || "/";
      const canonicalUrl = new URL(canonicalPath, request.url);
      canonicalUrl.search = request.nextUrl.search;
      return NextResponse.redirect(canonicalUrl);
    }

    if (pathname === "/") {
      const sessionRedirect = await validateSession(request, {
        forceProtected: true,
        callbackPath: "/",
      });
      if (sessionRedirect) return sessionRedirect;
      return NextResponse.rewrite(new URL("/dashboard", request.url));
    }

    // The platform-admin layout keeps its own authorization check.
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return adminHeaders();
    }

    // Auth and legal pages - allow public access
    if (ADMIN_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      if (AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET,
          secureCookie: process.env.NODE_ENV === "production",
        });
        if (token) return NextResponse.redirect(new URL("/", request.url));
      }

      const res = NextResponse.next();
      res.headers.set("x-tenant-subdomain", "");
      res.headers.set("x-is-tenant", "auth");
      return res;
    }

    if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
      const sessionRedirect = await validateSession(request, {
        forceProtected: true,
        callbackPath: `${pathname}${request.nextUrl.search}`,
      });
      if (sessionRedirect) return sessionRedirect;
      return adminHeaders();
    }

    // Tenant dashboard routes - require authentication
    if (DASHBOARD_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      const routePath = `/dashboard${pathname}`;
      const sessionRedirect = await validateSession(request, {
        forceProtected: true,
        callbackPath: pathname,
      });
      if (sessionRedirect) {
        return sessionRedirect;
      }
      return NextResponse.rewrite(new URL(routePath, request.url));
    }

    // Default: redirect to signin for unknown paths on admin subdomain
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // Root domain (localhost:3000, saas-saya.com) → Public SaaS website
  // Redirect auth pages to the admin subdomain
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    const targetUrl = new URL(buildAdminUrl(pathname));
    targetUrl.search = request.nextUrl.search;
    return NextResponse.redirect(targetUrl);
  }

  // Session validation untuk protected routes (non-admin subdomain)
  const sessionRedirect = await validateSession(request);
  if (sessionRedirect) {
    return sessionRedirect;
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
  // Aset publik tidak perlu lewat middleware (hemat 1x getToken per gambar
  // + anti-redirect /signin untuk <img> di admin host). `isPublicAsset` di
  // atas tetap jadi jaring pengaman bila matcher berubah.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|thumbnails|icons|images|assets|fonts|logos|media).*)"],
};