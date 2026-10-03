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
  CalendarCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  ChevronDown,
  Palette,
  CreditCard,
  Layers,
  Users,
  ExternalLink,
  Check,
  Bell,
  Moon,
  Sun,
  AlertTriangle,
  MessageCircle,
  PanelLeft,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

/**
 * Warna badge paket. WAJIB ada varian dark: di tiap tier — badge dipakai di atas
 * `Badge variant="outline"` yang membawa `dark:text-slate-300` / `dark:border-slate-700`.
 * Tanpa varian dark: eksplisit, specificity `.dark .dark\:...` (0,2,0) mengalahkan
 * `text-...` biasa (0,1,0) sehingga teks terang tampil di atas background terang.
 */
function tierBadgeStyle(tier: string | undefined): string {
  switch (tier) {
    case "starter":
      return "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700";
    case "growth":
      return "bg-purple-50 text-purple-800 border-purple-300 font-bold dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700";
    case "enterprise":
      return "bg-blue-50 text-blue-800 border-blue-300 font-bold dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 font-medium dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  // Dark mode toggle
  useEffect(() => {
    const stored = localStorage.getItem("umkm_dark_mode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("umkm_dark_mode", String(newMode));
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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

  function navigateToBuilder() {
    // Builder Global (/dashboard/builder) dipensiunkan; page-builder yang
    // jadi satu-satunya editor. Arahkan ke panel Kelola Website.
    window.location.href = "/dashboard/websites";
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

  // Grouped Menu Navigation with Headers.
  // Semua halaman dashboard wajib muncul di sini (sumber tunggal navigasi):
  // grup Toko, Website (billing/settings lewat dropdown user & settings hub).
  const menuGroups: MenuGroup[] = [
    {
      header: t("nav.groupStore"),
      items: [
        { name: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard, exact: true },
        { name: t("nav.products"), href: "/dashboard/products", icon: Store },
        { name: t("nav.orders"), href: "/dashboard/orders", icon: ShoppingBag },
        { name: t("nav.bookings"), href: "/dashboard/bookings", icon: CalendarCheck },
        { name: t("nav.customers"), href: "/dashboard/customers", icon: Users },
        ...(isFree ? [] : [{ name: t("nav.analytics"), href: "/dashboard/analytics", icon: BarChart3 }]),
      ],
    },
    {
      header: t("nav.groupWebsite"),
      items: [
        { name: t("nav.builder"), href: "/dashboard/websites/customize", icon: Palette },
        { name: t("nav.domain"), href: "/dashboard/domain", icon: Globe },
      ],
    },
  ];

  /** Active-state per item: exact untuk root/settings, prefix untuk anak halaman,
         *  khusus builder mencakup route /dashboard/websites/customize. */
  const isMenuActive = (item: NavigationItem) => {
    if (item.exact) return pathname === item.href;
    if (item.href === "/dashboard/websites/customize") {
      return pathname.startsWith("/dashboard/websites/customize");
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const initials =
    (user as any)?.name?.charAt(0).toUpperCase() ||
    (user as any)?.email?.charAt(0).toUpperCase() ||
    "U";

  const sidebarWidth = sidebarCollapsed ? "w-20" : "w-72";
  const mainMargin = sidebarCollapsed ? "lg:pl-20" : "lg:pl-72";

  // Builder memakai mode full-page: tanpa sidebar/topbar dashboard agar
  // seluruh viewport dipakai untuk kanvas editing (seperti Canva/Webflow).
  const isBuilderFullPage = pathname.startsWith("/dashboard/websites/page-builder");
  if (isBuilderFullPage) {
    return (
      <div className="h-dvh w-full bg-slate-100 text-gray-900 dark:bg-slate-950 dark:text-slate-100 overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 selection:bg-slate-200 selection:text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-sm lg:shadow-none transform transition-all duration-200 ease-in-out lg:translate-x-0 dark:bg-slate-900 dark:border-slate-800 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarWidth}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="flex items-center justify-between h-16 sm:h-20 px-5 border-b border-gray-100 dark:border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Store className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <span className="font-extrabold text-base text-gray-900 tracking-tight block dark:text-white">
                    UMKM SaaS
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 block -mt-0.5">
                    Panel Toko Digital
                  </span>
                </div>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tutup menu"
              className="lg:hidden -mr-2 text-gray-400 hover:text-gray-700 rounded-xl"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Active Store Fast-Access Card */}
          {websiteUrl && !sidebarCollapsed && (
            <div className="p-3.5 mx-4 mt-3 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white border border-emerald-200/80 rounded-2xl space-y-2.5 shadow-2xs dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-slate-900 dark:border-emerald-800/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5 dark:text-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Toko Online Aktif</span>
                </span>
                <Link
                  href="/dashboard/websites"
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold hover:underline dark:text-emerald-400"
                >
                  Kelola Toko
                </Link>
              </div>

              <div className="bg-white px-2.5 py-1.5 rounded-xl border border-emerald-100 shadow-2xs dark:bg-slate-800 dark:border-emerald-900/30">
                <p className="text-xs text-gray-700 font-mono font-medium truncate dark:text-slate-300">
                  {tenantDisplay(subdomain)}
                </p>
              </div>
            </div>
          )}

          {/* Grouped Navigation Links with Section Headers */}
          <nav className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto" aria-label="Navigasi dashboard">
            <TooltipProvider delayDuration={200}>
            {menuGroups.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className={groupIdx > 0 ? "pt-3.5 border-t border-gray-100 dark:border-slate-800" : ""}
              >
                {/* Menu Group Section Header */}
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1.5 flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400 select-none">
                      {group.header}
                    </span>
                  </div>
                )}

                {/* Menu Items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isMenuActive(item);

                    const link = (
                      <Link
                        key={item.name}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                          aria-hidden="true"
                        />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 truncate">{item.name}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" aria-hidden="true" />
                            )}
                          </>
                        )}
                      </Link>
                    );

                    // Mode collapsed: tampilkan nama menu via tooltip (ikon saja tidak cukup jelas)
                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.name}>
                          <TooltipTrigger asChild>{link}</TooltipTrigger>
                          <TooltipContent side="right">{item.name}</TooltipContent>
                        </Tooltip>
                      );
                    }
                    return link;
                  })}
                </div>
              </div>
            ))}
            </TooltipProvider>

            {/* Settings - Inside nav, below Domain (per-website setting) */}
            <div className="pt-3.5 border-t border-gray-100 dark:border-slate-800">
              <Link
                href="/dashboard/settings"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === "/dashboard/settings" || pathname.startsWith("/dashboard/settings/")
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                title={sidebarCollapsed ? t("nav.settings") : undefined}
              >
                <Settings className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{t("nav.settings")}</span>}
              </Link>
            </div>
          </nav>

          {/* User Account / Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/70 dark:border-slate-800 dark:bg-slate-900/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full h-auto flex items-center gap-3 p-2 rounded-2xl hover:bg-white border border-transparent hover:border-gray-200 transition-all text-left shadow-2xs dark:hover:bg-slate-800 dark:hover:border-slate-700">
                  <Avatar className="w-9 h-9 border border-gray-200 dark:border-slate-700">
                    <AvatarImage src={(user as any)?.image || ""} alt={user?.name || ""} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate dark:text-white">
                          {(user as any)?.name || "Pengguna"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className={`text-xs py-0 px-1.5 ${tierBadgeStyle(tier)}`}>
                            {tierLabel}
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>

              {/* Elevasi ditinggikan (border + ring + shadow-2xl): dropdown user
                  terbuka menimpa menu sidebar yang sama-sama terang, jadi butuh
                  batas tegas agar tidak terlihat tumpang-tindih/melebur. */}
              <DropdownMenuContent className="w-64 rounded-2xl border-gray-300 p-1.5 shadow-2xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-800 dark:ring-white/10" align="end" sideOffset={8}>
                {/* User Info Header */}
                <div className="px-3 py-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border border-gray-200 dark:border-slate-700">
                      <AvatarImage src={(user as any)?.image || ""} alt={user?.name || ""} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate dark:text-white">
                        {(user as any)?.name || "Pengguna Toko"}
                      </p>
                      <p className="text-xs text-gray-500 truncate dark:text-slate-400">
                        {(user as any)?.email}
                      </p>
                      <Badge variant="outline" className={`text-xs py-0 px-1.5 mt-1 ${tierBadgeStyle(tier)}`}>
                        Paket {tierLabel}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/websites"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <Layers className="h-4 w-4 text-gray-500" />
                      <span>{t("nav.stores")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/billing"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>{t("nav.billing")}</span>
                    </Link>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                {/* Logout */}
                <DropdownMenuItem
                  onSelect={async () => {
                    try {
                      localStorage.removeItem("umkm_demo_id");
                      localStorage.removeItem("umkm_demo_user");
                      await fetch("/api/auth/demo-logout", { method: "POST" }).catch(() => {});
                    } catch {}
                    signOut({ callbackUrl: "/signin" });
                    // Force hard redirect to ensure JWT cookie is cleared
                    window.location.href = "/signin";
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>{t("nav.logout")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className={`${mainMargin} flex flex-col min-h-screen transition-all duration-200`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 lg:px-8 gap-4">
            {/* Left: Sidebar toggle (desktop) + Mobile Menu toggle + Website Selector */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="hidden lg:flex h-9 w-9 text-gray-500 hover:text-gray-900 rounded-xl shrink-0 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Buka menu navigasi"
                className="lg:hidden -ml-2 text-gray-600 hover:text-gray-900 rounded-xl shrink-0 dark:text-slate-400 dark:hover:bg-slate-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {sites.length > 1 ? (
                <Select value={activeSiteId} onValueChange={switchWebsite}>
                  <SelectTrigger
                    className="w-full max-w-64 h-10 text-sm bg-gray-50 border-gray-200/90 rounded-xl font-semibold dark:bg-slate-800 dark:border-slate-700"
                    aria-label="Pilih website toko aktif"
                  >
                    <SelectValue placeholder="Pilih Website Toko" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-sm">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : sites.length === 1 ? (
                <span className="text-sm font-bold text-gray-900 truncate dark:text-white">
                  {sites[0].name}
                </span>
              ) : null}

              {/* Tier pill — di samping select website */}
              <Link
                href="/dashboard/billing"
                className={`hidden sm:inline-flex shrink-0 items-center px-3 py-1.5 text-xs rounded-xl border transition-all shadow-2xs ${tierBadgeStyle(
                  tier
                )}`}
              >
                Paket {tierLabel}
              </Link>
            </div>

            {/* Right: Quick actions, language, tier, and live store */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="h-9 w-9 text-gray-500 hover:text-gray-700 rounded-xl dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-500 hover:text-gray-700 rounded-xl relative dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
                    aria-label="Notifikasi"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 rounded-2xl shadow-xl p-1.5" align="end" sideOffset={8}>
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Notifikasi</p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                      Tandai dibaca
                    </Button>
                  </div>
                  <div className="py-1 max-h-80 overflow-y-auto">
                    {/* Notification Item 1 */}
                    <div className="px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer dark:hover:bg-slate-800">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-blue-50 rounded-lg shrink-0 dark:bg-blue-900/30">
                          <ShoppingBag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Pesanan baru masuk</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Budi memesan Kopi Arabika x2
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">2 menit lalu</p>
                        </div>
                      </div>
                    </div>

                    {/* Notification Item 2 */}
                    <div className="px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer dark:hover:bg-slate-800">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-amber-50 rounded-lg shrink-0 dark:bg-amber-900/30">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Stok menipis</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Kopi Robusta sisa 3 pcs
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">15 menit lalu</p>
                        </div>
                      </div>
                    </div>

                    {/* Notification Item 3 */}
                    <div className="px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer dark:hover:bg-slate-800">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-emerald-50 rounded-lg shrink-0 dark:bg-emerald-900/30">
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Pembayaran diterima</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Rp 150.000 dari Sari
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">1 jam lalu</p>
                        </div>
                      </div>
                    </div>

                    {/* Notification Item 4 */}
                    <div className="px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer dark:hover:bg-slate-800">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-purple-50 rounded-lg shrink-0 dark:bg-purple-900/30">
                          <MessageCircle className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Ulasan baru</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            Andi memberi bintang 5
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">3 jam lalu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-slate-800 pt-1">
                    <Button variant="ghost" size="sm" className="w-full text-sm font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                      Lihat semua notifikasi
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <LanguageSwitcher />
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
