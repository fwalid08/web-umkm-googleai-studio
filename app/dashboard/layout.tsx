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
  ChevronDown,
  Palette,
  CreditCard,
  Layers,
  Users,
  FileText,
  Megaphone,
  Compass,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
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
      return "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold";
    case "growth":
      return "bg-purple-50 text-purple-800 border-purple-300 font-bold";
    case "enterprise":
      return "bg-blue-50 text-blue-800 border-blue-300 font-bold";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 font-medium";
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
  const [sites, setSites] = useState<Array<{ id: string; name: string; subdomain: string | null }>>([]);
  const [activeSiteId, setActiveSiteId] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleCopySubdomain = () => {
    if (!websiteUrl) return;
    navigator.clipboard?.writeText(websiteUrl).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Grouped Menu Navigation with Headers
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

  const initials =
    (user as any)?.name?.charAt(0).toUpperCase() ||
    (user as any)?.email?.charAt(0).toUpperCase() ||
    "U";

  // Derive current page title for breadcrumb/topbar
  const getCurrentPageTitle = () => {
    if (pathname === "/dashboard") return t("nav.dashboard");
    if (pathname.includes("/products")) return t("nav.products");
    if (pathname.includes("/orders")) return t("nav.orders");
    if (pathname.includes("/customers")) return t("nav.customers");
    if (pathname.includes("/analytics")) return t("nav.analytics");
    if (pathname.includes("/builder")) return t("nav.builder");
    if (pathname.includes("/pages")) return t("nav.pages");
    if (pathname.includes("/announcement")) return t("nav.announcement");
    if (pathname.includes("/navigation")) return t("nav.navigation");
    if (pathname.includes("/domain")) return t("nav.domain");
    if (pathname.includes("/stores")) return t("nav.stores");
    if (pathname.includes("/billing")) return t("nav.billing");
    if (pathname.includes("/settings")) return t("nav.settings");
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
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
          <div className="flex items-center justify-between h-16 sm:h-20 px-5 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base text-gray-900 tracking-tight block">
                  UMKM SaaS
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 block -mt-0.5">
                  Panel Toko Digital
                </span>
              </div>
            </Link>
            <button
              aria-label="Tutup menu"
              className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Website Selector (if multi-site) */}
          {sites.length > 1 && (
            <div className="px-4 mt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1 mb-1">
                Pilih Toko Aktif
              </div>
              <Select value={activeSiteId} onValueChange={switchWebsite}>
                <SelectTrigger className="w-full h-10 text-xs bg-gray-50 border-gray-200/90 rounded-xl font-medium">
                  <SelectValue placeholder="Pilih Website Toko" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {sites.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active Store Fast-Access Card */}
          {websiteUrl && (
            <div className="p-3.5 mx-4 mt-3 bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white border border-emerald-200/80 rounded-2xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Toko Online Aktif</span>
                </span>
                <Link
                  href="/dashboard/stores"
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                >
                  Kelola Toko
                </Link>
              </div>

              <div className="flex items-center justify-between gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-emerald-100 shadow-2xs">
                <p className="text-xs text-gray-700 font-mono font-medium truncate flex-1">
                  {tenantDisplay(subdomain)}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopySubdomain}
                    className="p-1 text-gray-400 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                    title="Salin alamat link toko"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                    title="Buka website toko di tab baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Grouped Navigation Links with Section Headers */}
          <nav className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto">
            {menuGroups.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className={groupIdx > 0 ? "pt-3.5 border-t border-gray-100" : ""}
              >
                {/* Menu Group Section Header */}
                <div className="px-3 pb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 select-none">
                    {group.header}
                  </span>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
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
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                          }`}
                        />
                        <span className="flex-1 truncate">{item.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Account / Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/70">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white border border-transparent hover:border-gray-200 transition-all text-left shadow-2xs">
                  <Avatar className="w-9 h-9 border border-gray-200">
                    <AvatarImage src={(user as any)?.image || ""} alt={user?.name || ""} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {(user as any)?.name || "Pengguna"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${tierBadgeStyle(tier)}`}>
                        {tierLabel}
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64 rounded-2xl shadow-xl p-1.5" align="end" sideOffset={8}>
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {(user as any)?.name || "Pengguna Toko"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5">
                    {(user as any)?.email}
                  </p>
                </div>

                <div className="py-1">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/stores"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Layers className="h-4 w-4 text-gray-500" />
                      <span>{t("nav.stores")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings/billing"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span>{t("nav.billing")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg text-left transition-colors cursor-pointer"
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
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
          <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 lg:px-8 gap-4">
            {/* Left: Mobile Menu toggle + Breadcrumb Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                aria-label="Buka menu navigasi"
                className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 shrink-0 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                  {getCurrentPageTitle()}
                </h1>
              </div>
            </div>

            {/* Right: Quick actions, language, tier, and live store */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <LanguageSwitcher />

              {/* Tier pill */}
              <Link
                href="/dashboard/settings/billing"
                className={`hidden sm:inline-flex items-center px-3 py-1.5 text-xs rounded-xl border transition-all shadow-2xs ${tierBadgeStyle(
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
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
                >
                  <span className="hidden sm:inline">Lihat Toko Online</span>
                  <Globe className="h-3.5 w-3.5 text-emerald-600" />
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
