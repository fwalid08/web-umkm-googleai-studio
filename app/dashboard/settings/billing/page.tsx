"use client";

/**
 * Hotfix pasca-Sprint 02 — Halaman billing placeholder.
 * Konten: komponen bersama (sama dengan Panel Website).
 */

import { BillingPanel } from "@/components/billing/billing-panel";
import Link from "next/link";

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <BillingPanel />
      <Link href="/dashboard/settings" className="text-sm text-primary-600 hover:underline">
        ← Kembali ke Pengaturan
      </Link>
    </div>
  );
}
