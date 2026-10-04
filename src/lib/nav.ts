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
  // Hanya `/dashboard` yang tidak punya alias ("/" sudah dipakai dashboard home).
  // Editor single-page (/web-design/customize) tetap dipendekkan — `/web-design`
  // ada di DASHBOARD_PATHS dan next.config rewrite-nya.
  if (full === "/dashboard") {
    return full;
  }
  return p;
}
/** Path editor website single-page, dalam bentuk kanonik (tanpa `/dashboard`). */
export const BUILDER_PATH = "/web-design/customize";

/**
 * Buang prefix `/dashboard` kalau ada, sehingga kedua bentuk path
 * dashboard Collapse ke satu bentuk kanonik.
 *
 * Dipakai karena path yang terlihat di address bar BERBEDA antar host:
 * di admin host `proxy.ts` me-redirect `/dashboard/*` → alias root, jadi
 * `usePathname()` mengembalikan `/web-design/customize`; di host lain
 * path-nya tetap `/dashboard/web-design/customize`. Kode UI yang
 * membandingkan `pathname` HARUS menutup keduanya, kalau tidak akan
 * diam-diam salah cabut di salah satu host.
 *
 * MURNI: tanpa `window`/`Date.now()`, aman dipanggil di SSR & client.
 */
export function stripDashboardPrefix(pathname: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (p === "/dashboard") return "/";
  return p.startsWith("/dashboard/") ? p.slice("/dashboard".length) : p;
}

/**
 * Apakah pathname ini halaman editor website (page builder single-page)?
 *
 * Menerima KEDUA bentuk: `/web-design/customize[/...]` (admin host) dan
 * `/dashboard/web-design/customize[/...]` (host lain).
 *
 * Cocok per-segmen (bukan `startsWith` buta) supaya `/web-design/customize-abc`
 * tidak ikut dianggap builder.
 */
export function isBuilderPath(pathname: string): boolean {
  const p = stripDashboardPrefix(pathname);
  return p === BUILDER_PATH || p.startsWith(`${BUILDER_PATH}/`);
}