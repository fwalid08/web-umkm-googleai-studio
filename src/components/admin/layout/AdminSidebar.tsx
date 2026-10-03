"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, ChevronLeft, LayoutDashboard } from "lucide-react";
import { ADMIN_MODULES, AdminModule, getAccessibleModules } from "@/lib/admin/modules";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminSidebarProps {
  permissions?: string[];
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function AdminSidebar({ permissions = ["*"], className, collapsed, onToggleCollapse, onToggleSidebar, sidebarOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const modules = getAccessibleModules(permissions);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const isGroupOpen = (id: string) => openGroups.includes(id);
  const isActive = (route: string) => pathname === route || pathname.startsWith(route + "/");

  const effectiveCollapsed = collapsed ?? internalCollapsed;
  const effectiveSidebarOpen = sidebarOpen ?? internalSidebarOpen;
  const handleToggleCollapse = onToggleCollapse ?? setInternalCollapsed;
  const handleToggleSidebar = onToggleSidebar ?? setInternalSidebarOpen;

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-200 ease-in-out dark:bg-slate-900 dark:border-slate-800",
          effectiveCollapsed ? "w-16" : "w-64",
          className
        )}
        aria-label="Admin navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-slate-800">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              {!effectiveCollapsed && (
                <span className="font-extrabold text-base text-gray-900 tracking-tight dark:text-white">
                  Admin
                </span>
              )}
            </Link>
            <button
              onClick={() => handleToggleCollapse(!effectiveCollapsed)}
              className={cn(
                "p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors",
                effectiveCollapsed && "ml-auto"
              )}
              aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!effectiveCollapsed}
            >
              {effectiveCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto" aria-label="Admin modules">
            {modules.map((module, idx) => (
              <div
                key={module.id}
                className={idx > 0 ? "pt-3 border-t border-gray-100 dark:border-slate-800" : ""}
              >
                {module.children && module.children.length > 0 ? (
                  <div>
                    <button
                      onClick={() => toggleGroup(module.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                        isGroupOpen(module.id)
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800"
                      )}
                      aria-expanded={isGroupOpen(module.id)}
                    >
                      <div className="flex items-center gap-3">
                        <module.icon className={cn("h-4 w-4 shrink-0", effectiveCollapsed && "mx-auto")} aria-hidden="true" />
                        {!effectiveCollapsed && <span className="flex-1 truncate">{module.label}</span>}
                      </div>
                      {!effectiveCollapsed && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                            isGroupOpen(module.id) && "rotate-90"
                          )}
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {!effectiveCollapsed && isGroupOpen(module.id) && (
                      <div className="mt-1.5 space-y-1 pl-9 animate-slide-down">
                        {module.children.map((child) => {
                          const active = isActive(child.route);
                          return (
                            <Link
                              key={child.id}
                              href={child.route}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                active
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800"
                              )}
                              aria-current={active ? "page" : undefined}
                            >
                              <child.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span className="flex-1 truncate">{child.label}</span>
                              {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {effectiveCollapsed ? (
                      <Link
                        href={module.route}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all justify-center",
                          isActive(module.route)
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800"
                        )}
                        aria-current={isActive(module.route) ? "page" : undefined}
                        title={module.label}
                      >
                        <module.icon className={cn("h-4 w-4 shrink-0", isActive(module.route) ? "text-white" : "text-gray-400")} aria-hidden="true" />
                      </Link>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={module.route}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                              isActive(module.route)
                                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800"
                            )}
                            aria-current={isActive(module.route) ? "page" : undefined}
                          >
                            <module.icon className={cn("h-4 w-4 shrink-0", isActive(module.route) ? "text-white" : "text-gray-400")} aria-hidden="true" />
                            <span className="flex-1 truncate">{module.label}</span>
                            {module.badge && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                {module.badge}
                              </span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{module.label}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-gray-100 dark:border-slate-800">
            {!effectiveCollapsed && (
              <div className="text-xs text-gray-400 text-center">
                UMKM SaaS Admin Panel
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}