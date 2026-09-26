"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  ChevronUp,
  Palette,
  CreditCard,
  Layers,
  Users,
  FileText,
  Megaphone,
  Compass,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { useLang, type Lang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

interface MenuGroup {
  header: string;
  items: NavigationItem[];
}

function tierBadgeStyle(tier: string | undefined): string {
  switch (tier) {
    case "starter":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "growth":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "enterprise":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function tierName(tier: string | undefined, lang: Lang): string {
  if (tier === "free") return lang === "id" ? "Gratis" : "Free";
  if (!tier) return "Gratis";
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
  const [sites, setSites] = useState<Array<{ id: string; name: string; subdomain: string | null }>>([]);
  const [activeSiteId, setActiveSiteId] = useState("");

  // Load websites for selector
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success && json.data.websites) {
          setSites(json.data.websites);
          setActiveSiteId(json.data.active_website_id ?? json.data.websites[0]?.id ?? "");
        }
      } catch {
        // fail silently
      }
    })();
  }, [session]);

  async function switchWebsite(id: string) {
    if (!id || id === activeSiteId) return;
    try {
      const res = await fetch(`/api/websites/${id}/activate`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActiveSiteId(id);
        window.location.reload();
      }
    } catch {
      // ignore
    }
  }

  const user = session?.user;
  const tier = (user as any)?.tier || "free";
  const isFree = tier === "free";
  const tierLabel = tierName(tier, lang);
  const subdomain = (user as any)?.subdomain;
  const websiteUrl = tenantUrl(subdomain);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Grouped Menu Navigation with Headers (Focused on Daily Store Operations & Appearance)
  const menuGroups: MenuGroup[] = [
    {
      header: t("nav.groupStore"),
      items: [
        { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard, exact: true },
        { name: t("nav.products"), href: "/dashboard/products", icon: Store },
        { name: t("nav.orders"), href: "/dashboard/orders", icon: ShoppingBag },
        { name: t("nav.customers"), href: "/dashboard/customers", icon: Users },
        ...(isFree ? [] : [{ name: t("nav.analytics"), href: "/dashboard/analytics", icon: BarChart3 }]),
      ],
    },
    {
      header: t("nav.groupWebsite"),
      items: [
        { name: t("nav.builder"), href: "/dashboard/builder", icon: Palette },
        { name: t("nav.pages"), href: "/dashboard/pages", icon: FileText },
        { name: t("nav.announcement"), href: "/dashboard/announcement", icon: Megaphone },
        { name: t("nav.navigation"), href: "/dashboard/navigation", icon: Compass },
        { name: t("nav.domain"), href: "/dashboard/domain", icon: Globe },
      ],
    },
  ];

  const initials = (user as any)?.name?.charAt(0).toUpperCase() ||
    (user as any)?.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200/90 shadow-xl lg:shadow-none transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-xs">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base text-gray-900 tracking-tight block">
                  UMKM SaaS
                </span>
                <span className="text-[11px] font-medium text-emerald-700 block -mt-0.5">
                  Panel Toko Digital
                </span>
              </div>
            </Link>
            <button
              aria-label="Tutup menu"
              className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Website Selector */}
          {sites.length > 1 && (
            <div className="px-3 mt-3">
              <Select value={activeSiteId} onValueChange={switchWebsite}>
                <SelectTrigger className="w-full h-9 text-xs bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Pilih Website Toko" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Store Fast-Access Card */}
          {websiteUrl && (
            <div className="p-3.5 mx-3 mt-3 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/70 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Toko Aktif</span>
                </span>
                <Link
                  href="/dashboard/stores"
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline"
                >
                  Website saya
                </Link>
              </div>

              <p className="text-xs text-gray-600 font-mono truncate bg-white/80 px-2 py-1 rounded border border-emerald-100">
                {tenantDisplay(subdomain)}
              </p>
            </div>
          )}

          {/* Grouped Navigation Links with Section Headers */}
          <nav className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto">
            {menuGroups.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className={groupIdx > 0 ? "pt-3.5 border-t border-gray-100/90" : ""}
              >
                {/* Menu Group Section Header */}
                <div className="px-3 pb-1.5 flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                    {group.header}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href ||
                        (pathname.startsWith(item.href + "/") && item.href !== "/dashboard/settings") ||
                        (item.href === "/dashboard/builder" && pathname.includes("/builder"));

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? "bg-emerald-50 text-emerald-950 font-bold shadow-2xs border border-emerald-200/80"
                            : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? "text-emerald-700" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Account / Footer */}
          <div className="p-3 border-t border-gray-100 relative bg-gray-50/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all text-left"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={(user as any)?.image || ""} alt={user?.name || ""} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {(user as any)?.name || "Pengguna"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className={`text-[10px] ${tierBadgeStyle(tier)}`}>
                        {tierLabel}
                      </Badge>
                    </div>
                  </div>
                  <ChevronUp
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {(user as any)?.name || "Pengguna Toko"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {(user as any)?.email}
                  </p>
                </div>

                <div className="py-1">
                  <div className="px-3 pt-1.5 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                    Akun & Pengaturan
                  </div>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/stores"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-900 transition-colors"
                    >
                      <Layers className="h-4 w-4 text-gray-500" />
                      <span>{t("nav.stores")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings/billing"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-900 transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>{t("nav.billing")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-900 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span>{t("nav.settings")}</span>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <button
                    onClick={async () => {
                      try {
                        localStorage.removeItem("umkm_demo_id");
                        localStorage.removeItem("umkm_demo_user");
                        await fetch("/api/auth/demo-logout", { method: "POST" }).catch(() => {});
                      } catch {}
                      signOut({ callbackUrl: "/signin" });
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>{t("nav.logout")}</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200/80">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 gap-3">
            {/* Left: Mobile Menu toggle */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <button
                aria-label="Buka menu navigasi"
                className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            {/* Right: Quick actions, language, tier */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageSwitcher />

              {/* Tier pill */}
              <Link
                href="/dashboard/settings/billing"
                className={`hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${tierBadgeStyle(
                  tier
                )}`}
              >
                Paket {tierLabel}
              </Link>

              {/* View live store button */}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all shadow-2xs"
                >
                  <span className="hidden sm:inline">Lihat Toko</span>
                  <Globe className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-12 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Floating mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  );
}