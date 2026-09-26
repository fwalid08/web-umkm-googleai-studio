"use client";

/**
 * Checklist aktivasi (dampak metrik 40%): publish → produk → domain →
 * order pertama → bagikan. Sembunyi otomatis saat semua selesai.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
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
        // Satu sumber kebenaran via countProductItems (builder/validation).
        // Normalisasi bentuk mentah {id} → MergedSection minimal:
        // type fallback ke id (agar {id:"product_grid"} terhitung),
        // enabled default true (agar {id} tanpa flag tidak ke-skip).
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
        // Domain custom = status custom_verified / flag verified (bukan prefix subdomain,
        // agar prefix lama toko-* tidak salah dihitung sebagai belum/custom).
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
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-green-800">{t("checklist.doneTitle")}</p>
            <p className="text-sm text-green-700">{t("checklist.doneDesc")}</p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("umkm-checklist-done", "1");
              setDismissed(true);
            }}
            className="text-sm text-green-700 hover:underline whitespace-nowrap"
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("checklist.title", { done, total: withShare.length })}</CardTitle>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-green-600 transition-all"
            style={{ width: `${(done / withShare.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {withShare.map((i) => (
          <div key={i.key} className="flex items-center gap-3 py-1.5">
            {i.done ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${i.done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                {t(`checklist.${i.key}`)}
              </p>
              <p className="text-xs text-gray-500">{t(`checklist.${i.key}Desc`)}</p>
            </div>
            {!i.done &&
              (i.key === "iShare" ? (
                <button onClick={share} className="text-sm text-green-700 hover:underline whitespace-nowrap">
                  {t("common.copyLink")}
                </button>
              ) : (
                <Link href={i.href} className="text-sm text-green-700 hover:underline whitespace-nowrap">
                  {t("checklist.open")}
                </Link>
              ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
