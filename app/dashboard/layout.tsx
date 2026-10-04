import { headers } from "next/headers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isAdminHostHeader } from "@/lib/nav";

/**
 * Layout dashboard (Server Component).
 *
 * Satu-satunya tugasnya: menentukan apakah request ini datang dari admin
 * host, lalu meneruskannya ke `DashboardShell` sebagai prop.
 *
 * Kenapa harus di server? Href nav dashboard berbeda antar host (alias
 * kanonik `/products` di admin host vs `/dashboard/products` di host lain).
 * Kalau host sniffing dilakukan di client lewat `window.location.host`,
 * SSR tidak punya nilai itu sehingga React hydrating sidebar menemukan
 * `href` berbeda dari HTML server → hydration mismatch. Dengan `headers()`,
 * SSR dan render client pertama memakai nilai yang sama dari RSC payload.
 *
 * Catatan: JANGAN pindahkan `headers()` ke `app/layout.tsx` — itu akan
 * membuat seluruh route (landing, storefront tenant) ikut dynamic.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const isAdminHost = isAdminHostHeader(h.get("host"));

  return <DashboardShell isAdminHost={isAdminHost}>{children}</DashboardShell>;
}
