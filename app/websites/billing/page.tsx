"use client";

/** Billing di Panel Website: breadcrumb kembali + konten bersama. */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BillingPanel } from "@/components/billing/billing-panel";
import { useLang } from "@/lib/i18n";

export default function WebsitesBillingPage() {
  const { t } = useLang();
  return (
    <div className="space-y-4">
      <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm">
        <Link href="/websites" className="text-primary-600 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {t("workspace.back")}
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{t("nav.billing")}</span>
      </nav>
      <BillingPanel />
    </div>
  );
}
