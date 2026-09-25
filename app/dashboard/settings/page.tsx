"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Globe, Bell, Layers, Store } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ActiveWebsiteChip } from "@/components/dashboard/active-website-chip";

export default function BusinessSettingsPage() {
  const { t } = useLang();
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {t("settingsHub.title")}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Pengaturan operasional toko, alamat domain, dan langganan paket.
        </p>
        <div className="mt-2.5">
          <ActiveWebsiteChip />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {/* Billing */}
        <Link href="/dashboard/settings/billing">
          <Card className="hover:shadow-md hover:border-emerald-300 transition-all h-full group">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                <span className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <CreditCard className="h-4 w-4" />
                </span>
                <span>{t("settingsHub.billing")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 leading-relaxed">
                Kelola paket aktif, sisa trial gratis, dan opsi upgrade kapasitas toko.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Domain */}
        <Link href="/dashboard/domain">
          <Card className="hover:shadow-md hover:border-emerald-300 transition-all h-full group">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                <span className="p-2 bg-blue-50 rounded-lg text-blue-700">
                  <Globe className="h-4 w-4" />
                </span>
                <span>Domain & Alamat Toko</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 leading-relaxed">
                Atur subdomain toko gratis (.umkm.id) atau pasang custom domain pribadi (.com / .id).
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Multi-store */}
        <Link href="/dashboard/stores">
          <Card className="hover:shadow-md hover:border-emerald-300 transition-all h-full group">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 group-hover:text-emerald-700">
                <span className="p-2 bg-purple-50 rounded-lg text-purple-700">
                  <Layers className="h-4 w-4" />
                </span>
                <span>Kelola Toko & Cabang</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-gray-500 leading-relaxed">
                Lihat daftar semua toko, ganti toko aktif, dan tambah toko cabang baru.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="opacity-70 bg-gray-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span className="p-2 bg-gray-100 rounded-lg text-gray-500">
              <Bell className="h-4 w-4" />
            </span>
            <span>{t("settingsHub.profile")}</span>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {t("common.soonFull")}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500">
            Jam operasional toko dan notifikasi pesanan WhatsApp sedang disiapkan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
