"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Store, Palette, Layers } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { dashboardNavHref } from "@/lib/nav";

/**
 * Navigasi bawah untuk mobile.
 *
 * `isAdminHost` datang dari Server Component (lihat `app/dashboard/layout.tsx`)
 * sehingga href SSR dan render client pertama selalu sama. Jangan ganti dengan
 * `window.location` + flag `mounted`: itu memunculkan hydration mismatch.
 */
export function MobileBottomNav({ isAdminHost }: { isAdminHost: boolean }) {
  const pathname = usePathname();
  const { t } = useLang();

  const tabs = [
    { name: t("nav.dashboard"), fullHref: "/dashboard", href: dashboardNavHref("/", isAdminHost), icon: LayoutDashboard, exact: true },
    { name: t("nav.products"), fullHref: "/dashboard/products", href: dashboardNavHref("/products", isAdminHost), icon: Store },
    { name: t("nav.orders"), fullHref: "/dashboard/orders", href: dashboardNavHref("/orders", isAdminHost), icon: ShoppingBag },
    // Tab Builder mengarah ke Kelola Website (page-builder = editor tunggal).
    // Beranda dashboard tidak punya alias kanonik di admin host ("/" = /dashboard),
    // jadi pemetaan default tab builder mencakupnya — samakan dengan sidebar desktop.
    { name: t("nav.builder"), fullHref: "/dashboard/websites", href: dashboardNavHref("/websites", isAdminHost), icon: Palette },
    { name: t("nav.stores"), fullHref: "/dashboard/customize", href: dashboardNavHref("/customize", isAdminHost), icon: Layers },
  ];

  const isTabActive = (tab: { fullHref: string; exact?: boolean }) => {
    if (tab.exact) {
      return pathname === tab.fullHref || (pathname === "/" && tab.fullHref === "/dashboard");
    }
    // Tab builder mencakup /websites, editor page-builder, dan /customize di semua host.
    if (tab.fullHref === "/dashboard/websites") {
      return (
        pathname === "/dashboard/websites" ||
        pathname === "/websites" ||
        pathname.startsWith("/dashboard/websites/") ||
        pathname.startsWith("/dashboard/customize") ||
        pathname === "/customize" ||
        pathname.startsWith("/customize/")
      );
    }
    if (tab.fullHref === "/dashboard/customize") {
      return (
        pathname === "/dashboard/customize" ||
        pathname === "/customize" ||
        pathname.startsWith("/customize/")
      );
    }
    return (
      pathname === tab.fullHref ||
      pathname.startsWith(tab.fullHref + "/") ||
      pathname === tab.fullHref.slice("/dashboard".length) ||
      pathname.startsWith(`${tab.fullHref.slice("/dashboard".length)}/`)
    );
  };

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab);

          const Icon = tab.icon;

          return (
            <Link
              key={tab.fullHref}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 min-w-[56px] min-h-[48px] px-1 py-1 rounded-xl transition-all select-none touch-manipulation ${
                isActive
                  ? "text-emerald-700 font-semibold"
                  : "text-gray-500 hover:text-gray-900 active:scale-95"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                )}
              </div>
              <span className="text-xs mt-1 tracking-tight leading-none truncate max-w-[72px]">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
