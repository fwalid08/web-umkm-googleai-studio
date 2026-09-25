"use client";

/**
 * Sprint 03 revisi — Pengaturan Bisnis (operasional).
 * Domain & template pindah ke Panel Website (/websites).
 * Di sini hanya: langganan/billing + tautan ke panel website.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Globe, Bell } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ActiveWebsiteChip } from "@/components/dashboard/active-website-chip";

export default function BusinessSettingsPage() {
  const { t } = useLang();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("settingsHub.title")}</h1>
        <p className="text-gray-500">{t("settingsHub.subtitle")}</p>
        <div className="mt-2">
          <ActiveWebsiteChip />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/dashboard/settings/billing">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <CreditCard className="h-5 w-5" />
                </span>
                {t("settingsHub.billing")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{t("settingsHub.billingDesc")}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/websites">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <Globe className="h-5 w-5" />
                </span>
                {t("settingsHub.domain")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">{t("settingsHub.domainDesc")}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="p-2 bg-gray-100 rounded-lg text-gray-500">
              <Bell className="h-5 w-5" />
            </span>
            {t("settingsHub.profile")}
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t("common.soonFull")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t("settingsHub.profileDesc")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
