import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Package,
  Shield,
  FileText,
} from "lucide-react";

export interface AdminModule {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  permissions: string[];
  order: number;
  children?: AdminModule[];
  badge?: string | number;
  description?: string;
}

export const ADMIN_MODULES: AdminModule[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    route: "/admin",
    permissions: ["*"],
    order: 0,
    description: "Platform overview & key metrics",
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    route: "/admin/users",
    permissions: ["users:read"],
    order: 2,
    description: "User management & tier control",
    children: [
      {
        id: "users-list",
        label: "All Users",
        icon: Users,
        route: "/admin/users",
        permissions: ["users:read"],
        order: 1,
      },
      {
        id: "users-invite",
        label: "Invite User",
        icon: Users,
        route: "/admin/users/invite",
        permissions: ["users:write"],
        order: 2,
      },
      {
        id: "users-roles",
        label: "Admin Roles",
        icon: Shield,
        route: "/admin/users/roles",
        permissions: ["users:write", "roles:write"],
        order: 3,
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    route: "/admin/billing",
    permissions: ["billing:read"],
    order: 3,
    description: "Revenue, subscriptions & invoices",
    children: [
      {
        id: "billing-overview",
        label: "Overview",
        icon: LayoutDashboard,
        route: "/admin/billing",
        permissions: ["billing:read"],
        order: 1,
      },
      {
        id: "billing-subscriptions",
        label: "Subscriptions",
        icon: CreditCard,
        route: "/admin/billing/subscriptions",
        permissions: ["billing:read"],
        order: 2,
      },
      {
        id: "billing-invoices",
        label: "Invoices",
        icon: FileText,
        route: "/admin/billing/invoices",
        permissions: ["billing:read"],
        order: 3,
      },
      {
        id: "billing-plans",
        label: "Plan Management",
        icon: Settings,
        route: "/admin/billing/plans",
        permissions: ["billing:write"],
        order: 4,
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    route: "/admin/analytics",
    permissions: ["analytics:read"],
    order: 4,
    description: "Platform metrics & insights",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    route: "/admin/settings",
    permissions: ["settings:write"],
    order: 5,
    description: "Platform configuration",
    children: [
      {
        id: "settings-general",
        label: "General",
        icon: Settings,
        route: "/admin/settings",
        permissions: ["settings:write"],
        order: 1,
      },
      {
        id: "settings-domains",
        label: "Domain Config",
        icon: FileText,
        route: "/admin/settings/domains",
        permissions: ["settings:write"],
        order: 2,
      },
      {
        id: "settings-email",
        label: "Email Templates",
        icon: FileText,
        route: "/admin/settings/email",
        permissions: ["settings:write"],
        order: 3,
      },
      {
        id: "settings-webhooks",
        label: "Webhooks",
        icon: Shield,
        route: "/admin/settings/webhooks",
        permissions: ["settings:write"],
        order: 4,
      },
    ],
  },
];

export function getAccessibleModules(permissions: string[]): AdminModule[] {
  const hasPermission = (required: string[]) =>
    permissions.includes("*") || required.some((p) => permissions.includes(p));

  return ADMIN_MODULES.filter((m) => hasPermission(m.permissions)).map((m) => ({
    ...m,
    children: m.children?.filter((c) => hasPermission(c.permissions)),
  })).filter((m) => !m.children || m.children.length > 0 || !m.children);
}

export function getModuleByRoute(route: string): AdminModule | undefined {
  for (const module of ADMIN_MODULES) {
    if (module.route === route) return module;
    if (module.children) {
      const found = module.children.find((c) => c.route === route);
      if (found) return found;
    }
  }
  return undefined;
}

export function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [{ label: "Admin", href: "/admin" }];

  let currentPath = "";
  for (const segment of segments.slice(1)) {
    currentPath += `/${segment}`;
    const module = getModuleByRoute(currentPath);
    if (module) {
      breadcrumbs.push({ label: module.label, href: currentPath });
    }
  }
  return breadcrumbs;
}