"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Globe, Bell, Layers, Store, Settings, Users, Shield } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ActiveWebsiteChip } from "@/components/dashboard/active-website-chip";

interface SettingsItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  href: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

export default function BusinessSettingsPage() {
  const { t } = useLang();

  const settingsItems: SettingsItem[] = [
    {
      title: t("settingsHub.billing") || "Langganan & Paket",
      description: "Kelola paket aktif, sisa trial gratis, dan opsi upgrade kapasitas toko.",
      icon: <CreditCard className="h-4 w-4" />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-700",
      href: "/dashboard/settings/billing",
      badge: "Paling Penting",
      badgeVariant: "success",
    },
    {
      title: "Website saya",
      description: "Lihat daftar semua toko, ganti toko aktif, dan tambah toko cabang baru.",
      icon: <Layers className="h-4 w-4" />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-700",
      href: "/dashboard/stores",
    },
    {
      title: "Domain & Alamat Toko",
      description: "Atur subdomain toko gratis (.umkm.id) atau pasang custom domain pribadi (.com / .id).",
      icon: <Globe className="h-4 w-4" />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-700",
      href: "/dashboard/domain",
    },
    {
      title: "Desain Toko",
      description: "Ganti banner, warna tema, teks, dan atur tampilan website tokomu.",
      icon: <Store className="h-4 w-4" />,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-700",
      href: "/dashboard/builder",
    },
    {
      title: "Menu Navigasi",
      description: "Atur tautan menu header dan footer yang tampil di website toko.",
      icon: <Users className="h-4 w-4" />,
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-700",
      href: "/dashboard/navigation",
    },
    {
      title: "Banner Promo",
      description: "Tampilkan bar informasi promosi di bagian atas website toko.",
      icon: <Bell className="h-4 w-4" />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
      href: "/dashboard/announcement",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {t("settingsHub.title") || "Pengaturan"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Pengaturan operasional toko, alamat domain, dan langganan paket.
        </p>
        <div className="mt-2.5">
          <ActiveWebsiteChip />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:shadow-md hover:border-emerald-300 transition-all h-full group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                    <span className={`p-2 rounded-lg ${item.iconBg} ${item.iconColor} shrink-0 group-hover:scale-105 transition-transform`}>
                      {item.icon}
                    </span>
                    <span className="flex-1 min-w-0">{item.title}</span>
                  </CardTitle>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || "default"} className="text-[10px] shrink-0">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Coming Soon Section */}
      <Card className="border-gray-200/50 bg-gray-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="p-2 bg-gray-100 rounded-lg text-gray-500">
              <Settings className="h-4 w-4" />
            </span>
            <span>Akun & Profil</span>
            <Badge variant="secondary" className="text-[10px]">
              {t("common.soonFull") || "Coming Soon"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">
            Jam operasional toko dan notifikasi pesanan WhatsApp sedang disiapkan.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>Aksi Cepat</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid sm:grid-cols-2 gap-3">
            <Button variant="outline" asChild className="w-full gap-2 justify-start">
              <Link href="/dashboard/settings/billing">
                <CreditCard className="h-4 w-4" />
                <span>Kelola Paket & Billing</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full gap-2 justify-start">
              <Link href="/dashboard/stores">
                <Layers className="h-4 w-4" />
                <span>Kelola Website</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full gap-2 justify-start">
              <Link href="/dashboard/domain">
                <Globe className="h-4 w-4" />
                <span>Atur Domain</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full gap-2 justify-start">
              <Link href="/dashboard/builder">
                <Store className="h-4 w-4" />
                <span>Desain Toko</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}