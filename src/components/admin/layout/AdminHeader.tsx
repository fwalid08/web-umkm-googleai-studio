"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings, LogOut, User, Moon, Sun, ChevronDown, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useLang } from "@/lib/i18n";

interface AdminHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function AdminHeader({ sidebarCollapsed, onToggleSidebar }: AdminHeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t, lang, setLang } = useLang();
  const user = session?.user;

  // Sumber kebenaran dark mode = state (disinkron sekali setelah mount).
  // JANGAN baca `document` langsung di body render — crash saat SSR
  // ("document is not defined") karena halaman /admin di-render server.
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("umkm_dark_mode");
    const isDark =
      stored !== null
        ? stored === "true"
        : document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("umkm_dark_mode", String(next));
  };

  const initials = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "A";

  return (
    <TooltipProvider delayDuration={200}>
      <header
        className={cn(
          "fixed top-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-slate-900/80 dark:border-slate-800 transition-all duration-200",
          sidebarCollapsed ? "left-16" : "left-64"
        )}
      >
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={onToggleSidebar}
                  aria-label="Toggle sidebar"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard" target="_blank" className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 hidden sm:block">
                  ← Back to Dashboard
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">Open tenant dashboard</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLang(lang === "id" ? "en" : "id")}
                  aria-label="Switch language"
                >
                  <span className="text-sm font-medium">{lang === "id" ? "EN" : "ID"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch language</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle dark mode</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Notifications</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="end">User menu</TooltipContent>
                </Tooltip>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium truncate">{user?.name || "Admin"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" target="_blank" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Tenant Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    signOut({ callbackUrl: "/signin" });
                    window.location.href = "/signin";
                  }}
                  className="text-red-600 focus:text-red-600 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}