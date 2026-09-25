"use client";

/**
 * Submenu website aktif di sidebar Panel Website.
 * Flow logis: Overview → Domain → Konfigurasi (Builder) → Pesanan → Kelola Bisnis.
 * Setiap item menjawab "apa yang bisa saya lakukan" di website ini.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, LayoutGrid, Palette, ShoppingBag, Users } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantDisplay } from "@/lib/urls";

interface Site {
  id: string;
  name: string;
  subdomain?: string | null;
}

export function WebsitePanelMenu() {
  const pathname = usePathname();
  const { t } = useLang();
  const [site, setSite] = useState<Site | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success) {
          const list = json.data.websites as Site[];
          const active = list.find((s) => s.id === json.data.active_website_id) ?? list[0] ?? null;
          setSite(active);
        }
      } catch {
        /* sidebar tetap tampil tanpa submenu */
      }
    })();
  }, [pathname]);

  if (!site) return null;

  const items = [
    {
      name: t("workspace.overview"),
      href: `/dashboard/stores`,
      icon: LayoutGrid,
      desc: t("workspace.contextNote", { url: tenantDisplay(site.subdomain) }),
    },
    {
      name: t("domain.subTitle"),
      href: `/dashboard/domain`,
      icon: Globe,
      desc: t("workspace.mDomainDesc"),
    },
    {
      name: t("workspace.mConfig"),
      href: `/dashboard/${site.id}/builder`,
      icon: Palette,
      desc: t("workspace.mConfigDesc"),
    },
    {
      name: t("workspace.mBusiness"),
      href: `/dashboard/${site.id}/orders`,
      icon: ShoppingBag,
      desc: t("workspace.mBusinessDesc"),
    },
    {
      name: t("workspace.mBilling"),
      href: "/dashboard/settings/billing",
      icon: Users,
      desc: t("workspace.mBillingDesc"),
    },
  ];

  return (
    <div>
      <p className="px-3 pt-4 pb-1 text-[11px] font-semibold text-gray-400 uppercase truncate">
        {site.name}
      </p>
      {items.map((item) => {
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
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
