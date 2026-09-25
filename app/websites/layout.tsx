"use client";

/**
 * Sprint 03 revisi — Shell Panel Website (dashboard beneran, identitas hijau):
 * sidebar (Website Saya, Billing, submenu website aktif) + topbar + konten.
 * Bisnis operasional tinggal di /dashboard; billing bisa diakses dari dua panel.
 */

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Globe,
  CreditCard,
  LogOut,
  Menu,
  X,
  ChevronUp,
  Briefcase,
} from "lucide-react";
import { WebsitePanelMenu } from "@/components/websites/panel-menu";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLang } from "@/lib/i18n";

export default function WebsitesLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { t } = useLang();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const user = session?.user;

  const navigation = [
    { name: t("nav.myWebsites"), href: "/websites", icon: Globe },
    { name: t("nav.billing"), href: "/websites/billing", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link href="/websites" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">{t("nav.websitePanel")}</span>
            </Link>
            <button className="lg:hidden p-2 text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            <WebsitePanelMenu />

            <div className="pt-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <Briefcase className="h-5 w-5" />
                {t("nav.business")}
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t relative">
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute bottom-full left-4 right-4 mb-2 z-20 bg-white border rounded-xl shadow-lg overflow-hidden">
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Briefcase className="h-4 w-4" />
                    {t("nav.business")}
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
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-medium">
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button className="lg:hidden p-2 text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <span className="text-sm text-gray-500">{t("nav.websitePanel")}</span>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                href="/dashboard"
                className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
              >
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.business")}</span>
              </Link>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
