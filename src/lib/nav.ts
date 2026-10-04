import { normalizeHost, rootHost } from "./tenant";

/**
 * Host navigasi dashboard lintas host.
 *
 * Di admin host, halaman dashboard punya alias kanonik di root
 * (`/products`, `/customize`, … — lihat `DASHBOARD_PATHS` di `proxy.ts`),
 * jadi href memakai path pendek agar address bar konsisten tanpa
 * redirect `/dashboard/*` → `/*`.
 *
 * Di host lain (root/tenant/custom-domain) href tetap `/dashboard/*`
 * karena path pendek di sana milik storefront. Alias root hanya
 * di-serve di admin host (rewrite `next.config.ts` + `proxy.ts`).
 */

/**
 * Apakah request ini datang dari admin host?
 *
 * Dibaca dari header `host`, BUKAN `x-is-tenant`: pada jalur rewrite
 * dashboard, `proxy.ts` mengembalikan `NextResponse.rewrite()` polos
 * tanpa menyetel header apa pun, jadi `x-is-tenant` justru undefined
 * tepat di halaman-halaman yang paling butuh nilai ini.
 *
 * Server-only (bergantung pada request headers). Memakainya di Client
 * Component atau di dalam render akan memicu hydration mismatch.
 */
export function isAdminHostHeader(host: string | null | undefined): boolean {
  return normalizeHost(host || "") === `admin.${rootHost()}`;
}

/**
 * Href navigasi dashboard: path pendek di admin host, `/dashboard/*` di host lain.
 *
 * PENTING (anti hydration-mismatch): fungsi ini MURNI — tidak menyentuh
 * `window`, tidak menyimpan state, tidak memanggil `Date.now()`. Nilai
 * `isAdminHost` harus datang dari Server Component (`await headers()` di
 * `app/dashboard/layout.tsx`) sehingga SSR dan render client pertama
 * menerima nilai yang PERSIS sama lewat RSC payload.
 *
 * Dulu versi lama membaca `window.location.host` + cache `Date.now()`
 * di balik flag `mounted`. Itu menghasilkan hydration mismatch: SSR
 * selalu render `/dashboard/*`, sementara browser di admin host merender
 * `/products`. Jangan dikembalikan pola `typeof window` di sini.
 */
export function dashboardNavHref(path: string, isAdminHost: boolean): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const full = `/dashboard${p === "/" ? "" : p}`;
  if (!isAdminHost) return full;
  // Halaman tanpa alias kanonik di admin host (lihat DASHBOARD_PATHS di proxy.ts).
  if (full === "/dashboard" || full.startsWith("/dashboard/websites/page-builder")) {
    return full;
  }
  return p;
}