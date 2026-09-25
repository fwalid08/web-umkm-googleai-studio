"use client";

/**
 * Konten billing bersama — dipakai Panel Website (/websites/billing)
 * dan Panel Bisnis (/dashboard/settings/billing). Satu sumber, dua pintu.
 * Billing itu level AKUN (plan), bukan per website.
 */

import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

const TIER_ORDER = ["free", "starter", "growth", "enterprise"] as const;
const TIER_PRICE: Record<string, string> = { free: "Rp0", starter: "Rp99rb", growth: "Rp299rb", enterprise: "Custom" };
const TIER_LABEL: Record<string, string> = { free: "Free", starter: "Starter", growth: "Growth", enterprise: "Enterprise" };

export function BillingPanel() {
  const { data: session } = useSession();
  const { t, tr } = useLang();
  const user = session?.user as unknown as {
    tier?: string;
    trial_ends_at?: string | null;
  } | undefined;

  const trialEndsAtStr = user?.trial_ends_at ?? null;
  const daysLeft = useMemo(() => {
    if (!trialEndsAtStr) return null;
    return Math.ceil((new Date(trialEndsAtStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }, [trialEndsAtStr]);

  const tier = user?.tier ?? "free";

  // Slot website terpakai — pendorong upgrade alami (Sprint 03 revisi pricing)
  const [slot, setSlot] = useState<{ count: number; max: number } | null>(null);
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success) setSlot({ count: json.data.count, max: json.data.max });
      } catch {
        /* meter disembunyikan jika gagal */
      }
    })();
  }, [session]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("billing.title")}</h1>
        <p className="text-gray-500">
          {t("billing.activePlan", { tier })}
          {daysLeft != null && tier === "free" && daysLeft >= 0
            ? ` • ${t("billing.trialLeft", { days: daysLeft })}`
            : tier === "free" && daysLeft != null && daysLeft < 0
              ? ` • ${t("billing.trialOver")}`
              : ""}
        </p>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4 text-sm text-blue-800 space-y-2">
          <p>{t("billing.payNote")}</p>
          {slot ? (
            <div>
              <p className="font-medium">
                {t("billing.slotUsed", { count: slot.count, max: slot.max })}
                {slot.count >= slot.max ? (
                  <>
                    {" "}{t("billing.slotFull")}{" "}
                    <Link href="/websites" className="underline">
                      {t("billing.manageSites")}
                    </Link>
                  </>
                ) : null}
              </p>
              <div className="h-2 w-48 bg-blue-100 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${Math.min(100, (slot.count / Math.max(slot.max, 1)) * 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        {TIER_ORDER.map((slug) => (
          <Card key={slug} className={slug === "starter" ? "border-green-600 border-2" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {TIER_LABEL[slug]}
                {slug === "starter" ? (
                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">{t("billing.popular")}</span>
                ) : null}
                {tier.toLowerCase() === slug ? (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t("common.you")}</span>
                ) : null}
              </CardTitle>
              <p className="text-2xl font-bold">
                {TIER_PRICE[slug]}
                <span className="text-sm font-normal text-gray-500">{t("billing.perMonth")}</span>
              </p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {(tr(`billing.tiers.${slug}`) as string[]).map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                title="Sprint 04"
                className="mt-4 w-full py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                {tier.toLowerCase() === slug ? t("common.you") : t("common.soonFull")}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
