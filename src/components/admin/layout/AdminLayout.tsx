"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { getBreadcrumbs } from "@/lib/admin/modules";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
  permissions?: string[];
}

export function AdminLayout({ children, permissions = ["*"] }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("umkm_dark_mode");
    if (stored === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-slate-950", darkMode && "dark")}>
      <AdminSidebar
        permissions={permissions}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={cn("transition-all duration-200", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
        <AdminHeader sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="pt-16 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            {breadcrumbs.length > 1 && (
              <nav className="mb-6 flex items-center gap-1 text-sm" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-gray-900 dark:text-white">{crumb.label}</span>
                    ) : (
                      <Link
                        href={crumb.href}
                        className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
            )}

            <div className="animate-fade-in">{children}</div>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}