"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, LayoutDashboard, ShoppingBag, Store, Palette } from "lucide-react";

interface NavTab {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const TABS: NavTab[] = [
  { name: "Toko Saya", href: "/websites", icon: Globe },
  { name: "Ringkasan", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Pesanan", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Produk", href: "/dashboard/products", icon: Store },
  { name: "Desain Web", href: "/dashboard/builder", icon: Palette },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");

          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
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
              <span className="text-[11px] mt-1 tracking-tight leading-none truncate max-w-[64px]">
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
