"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  ChevronUp,
} from "lucide-react";
import { WebsiteSwitcher } from "@/components/dashboard/website-switcher";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLang, type Lang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function tierName(tier: string | undefined, lang: Lang): string {
  if (tier === "free") return lang === "id" ? "Gratis" : "Free";
  if (!tier) return "";
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { t, lang } = useLang();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const user = session?.user;
  const tier = (user as any)?.tier;
  const isFree = tier === "free";
  const tierLabel = tierName((user as unknown as { tier?: string } | null)?.tier, lang);
  const subdomain = (user as any)?.subdomain;
  const websiteUrl = tenantUrl(subdomain);

  // Logical UMKM user journey: Builder → Products → Orders → My Websites → Settings
  // Tier-aware: free users see core flow; paid tiers unlock advanced items
  const navigation: NavigationItem[] = [
    { name: t("nav.builder"), href: "/dashboard/builder", icon: LayoutDashboard },
    { name: t("nav.products"), href: "/dashboard/products", icon: Store },
    { name: t("nav.orders"), href: "/dashboard/orders", icon: ShoppingBag },
    { name: t("nav.myWebsites"), href: "/websites", icon: Globe },
    ...(isFree ? [] : [{ name: t("nav.analytics"), href: "/dashboard/analytics", icon: BarChart3 }]),
    { name: t("nav.settings"), href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo — panel bisnis = biru (beda dari panel website hijau) */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">💼</span>
              </div>
              <span className="font-bold text-lg text-gray-900">{t("nav.business")}</span>
            </Link>
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Website URL */}
          {websiteUrl && (
            <div className="px-4 py-3 border-b bg-blue-50">
              <p className="text-xs text-gray-500 mb-1">{t("dashboard.siteSub")}</p>
              <a
                href={websiteUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline truncate block"
              >
                {tenantDisplay((user as any)?.subdomain)}
              </a>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
{navigation.map((item) => {
              if (!item) return null;
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/") ||
                (item.href === "/dashboard/builder" && pathname.includes("/builder"));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info & drop-up menu (Sprint 03: Website Saya tinggal di sini) */}
          <div className="p-4 border-t relative">
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute bottom-full left-4 right-4 mb-2 z-20 bg-white border rounded-xl shadow-lg overflow-hidden">
                  <Link
                    href="/websites"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Globe className="h-4 w-4" />
                    {t("nav.myWebsites")}
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        localStorage.removeItem("umkm_demo_id");
                        localStorage.removeItem("umkm_demo_user");
                        await fetch("/api/auth/demo-logout", { method: "POST" }).catch(() => {});
                      } catch {}
                      signOut({ callbackUrl: "/signin" });
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("nav.logout")}
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {(user as any)?.name?.charAt(0).toUpperCase() || (user as any)?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{(user as any)?.name}</p>
                <p className="text-xs text-gray-500 truncate">{(user as any)?.email}</p>
              </div>
              <ChevronUp className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? "" : "rotate-180"}`} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              {/* Sprint 03: konteks website aktif */}
              <WebsiteSwitcher />
              <LanguageSwitcher />
              {/* Tier badge */}
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  (user as any)?.tier === "free"
                    ? "bg-gray-100 text-gray-700"
                    : (user as any)?.tier === "starter"
                    ? "bg-blue-100 text-blue-700"
                    : (user as any)?.tier === "growth"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {tierLabel}
              </span>

              {/* Website link */}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary-600 hover:underline hidden sm:flex"
                >
                  <Globe className="h-4 w-4" />
                  <span className="truncate max-w-[150px]">
                    {tenantDisplay((user as any)?.subdomain)}
                  </span>
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}