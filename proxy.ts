import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Ekstrak subdomain tenant dari hostname → header x-tenant-subdomain.
 * Env-driven: ROOT=localhost:3000 (dev, sub.localhost) atau saas-saya.com (prod).
 * Host lain (custom domain) diteruskan; getTenantSite() resolve via DB.
 */

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saas-saya.com")
  .split(":")[0]
  .toLowerCase();
const SUB_RE = /^[a-z0-9-]{3,50}$/;

function tenantHeaders(sub: string) {
  const res = NextResponse.next();
  res.headers.set("x-tenant-subdomain", sub);
  res.headers.set("x-is-tenant", "true");
  return res;
}

export default function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_static") ||
    pathname.includes(".")
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
    if (SUB_RE.test(sub)) {
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
    if (SUB_RE.test(sub)) {
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
