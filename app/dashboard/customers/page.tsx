"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useLang } from "@/lib/i18n";

/** Placeholder Sprint 03 — matikan 404 sidebar. Customer Management = Epic 6. */
export default function CustomersPage() {
  const { t } = useLang();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("soonPages.customersTitle")}</h1>
        <p className="text-gray-500">{t("soonPages.customersSub")}</p>
      </div>
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t("soonPages.soonTitle")}</h3>
          <p className="text-gray-500 mt-1 text-sm">{t("soonPages.customersDesc")}</p>
          <Link
            href="/dashboard/orders"
            className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            {t("soonPages.customersCta")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
