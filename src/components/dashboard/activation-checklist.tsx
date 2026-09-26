"use client";

/**
 * Checklist aktivasi (dampak metrik 40%): publish → produk → domain →
 * order pertama → bagikan. Sembunyi otomatis saat semua selesai.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Sparkles, X, ArrowRight, Share2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantUrl } from "@/lib/urls";
import { countProductItems, type MergedSection } from "@/lib/builder/validation";

interface Item {
  key: string;
  done: boolean;
  href: string;
}

export function ActivationChecklist() {
  const { t } = useLang();
  const [items, setItems] = useState<Item[] | null>(null);
  const [shared, setShared] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("umkm-shared") === "1") setShared(true);
    if (localStorage.getItem("umkm-checklist-done") === "1") setDismissed(true);
    (async () => {
      try {
        const [wRes, dRes, oRes] = await Promise.all([
          fetch("/api/user/website").catch(() => null),
          fetch("/api/user/domain-status").catch(() => null),
          fetch("/api/user/dashboard").catch(() => null),
        ]);
        const w = wRes && wRes.ok ? await wRes.json() : null;
        const d = dRes && dRes.ok ? await dRes.json() : null;
        const o = oRes && oRes.ok ? await oRes.json() : null;
        const sections = (w?.data?.custom_config?.sections ?? []) as {
          id?: string;
          type?: string;
          enabled?: boolean;
          content?: { items?: unknown[] };
        }[];
        const normalized: MergedSection[] = sections.map((s, i) => ({
          id: s.id ?? `section-${i}`,
          type: s.type ?? s.id ?? "",
          label: s.id ?? `section-${i}`,
          enabled: s.enabled !== false,
          required: false,
          order: i,
          style: {},
          content: ((s.content ?? {}) as Record<string, unknown>) ?? {},
        }));
        const hasProduct = countProductItems(normalized) > 0;
        const sub: string | null = d?.data?.subdomain ?? null;
        setSubdomain(sub);
        const domainDone =
          d?.data?.status === "custom_verified" || d?.data?.custom_domain_verified === true;
        setItems([
          { key: "iPublish", done: w?.success === true && w?.data?.is_default === false, href: "/dashboard/builder" },
          { key: "iProducts", done: hasProduct, href: "/dashboard/builder" },
          {
            key: "iDomain",
            done: domainDone,
            href: "/dashboard/domain",
          },
          { key: "iOrder", done: (o?.data?.total_orders ?? 0) > 0, href: "/dashboard/orders" },
          { key: "iShare", done: localStorage.getItem("umkm-shared") === "1", href: "#" },
        ]);
      } catch {
        setItems(null);
      }
    })();
  }, []);

  if (!items || dismissed) return null;
  const withShare = items.map((i) => (i.key === "iShare" ? { ...i, done: shared } : i));
  const done = withShare.filter((i) => i.done).length;

  if (done === withShare.length) {
    return (
      <Card className="border-emerald-300 bg-emerald-50/90 rounded-2xl shadow-sm">
        <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">{t("checklist.doneTitle")}</p>
              <p className="text-xs text-emerald-800 mt-0.5">{t("checklist.doneDesc")}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("umkm-checklist-done", "1");
              setDismissed(true);
            }}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 p-2 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            {t("common.close")}
          </button>
        </CardContent>
      </Card>
    );
  }

  function share() {
    const url = tenantUrl(subdomain) ?? window.location.origin;
    navigator.clipboard?.writeText(url).catch(() => {});
    localStorage.setItem("umkm-shared", "1");
    setShared(true);
  }

  const percent = Math.round((done / withShare.length) * 100);

  return (
    <Card className="border-gray-200/90 shadow-sm rounded-3xl bg-white overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
              {done}/{withShare.length}
            </div>
            <CardTitle className="text-base font-bold text-gray-900">
              {t("checklist.title", { done, total: withShare.length })}
            </CardTitle>
          </div>
          <span className="text-xs font-bold text-emerald-700 font-mono">
            {percent}% Selesai
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 divide-y divide-gray-100">
        {withShare.map((i) => (
          <div key={i.key} className="flex items-center gap-3.5 py-2.5 px-2 hover:bg-gray-50/60 rounded-xl transition-colors">
            {i.done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm font-bold ${i.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                {t(`checklist.${i.key}`)}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">{t(`checklist.${i.key}Desc`)}</p>
            </div>
            {!i.done &&
              (i.key === "iShare" ? (
                <button
                  onClick={share}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t("common.copyLink")}</span>
                </button>
              ) : (
                <Link
                  href={i.href}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline whitespace-nowrap"
                >
                  <span>{t("checklist.open")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
