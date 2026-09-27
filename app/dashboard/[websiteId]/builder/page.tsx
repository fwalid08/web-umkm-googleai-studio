"use client";

/**
 * Sprint 01 US-01 — Galeri template per website (tanpa drag & drop).
 * Alur Bu Toni: lihat 5 template → pilih yang cocok → otomatis masuk editor.
 * Gating tier dari GET /api/templates (locked + pesan upgrade).
 * Website-scoped: /dashboard/[websiteId]/builder
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Check, Lock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ActiveWebsiteChip } from "@/components/dashboard/active-website-chip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface GalleryTemplate {
  id: string;
  name: string;
  description: string;
  color_palette: { primary?: string; background?: string };
  sections_config: { id: string }[];
  locked: boolean;
}

export default function BuilderGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.websiteId as string;
  const { t } = useLang();
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [tRes, wRes] = await Promise.all([
          fetch("/api/templates"),
          fetch(`/api/websites/${websiteId}/website`).catch(() => null),
        ]);
        const tType = tRes.headers.get("content-type") || "";
        if (!tRes.ok || !tType.includes("application/json")) {
          setError(t("common.networkError"));
        } else {
          const tJson = await tRes.json();
          if (tJson.success) {
            setTemplates(tJson.data.templates);
            setTier(tJson.data.tier ?? "free");
          } else {
            setError(tJson.error ?? t("common.networkError"));
          }
        }
        if (wRes && wRes.ok) {
          const wType = wRes.headers.get("content-type") || "";
          if (wType.includes("application/json")) {
            const wJson = await wRes.json();
            if (wJson.success && !wJson.data.is_default) setCurrentId(wJson.data.template_id);
          }
        }
      } catch {
        setError(t("common.networkError"));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteId]);

  async function pilihTemplate(template: GalleryTemplate) {
    if (template.locked) return;
    setSavingId(template.id);
    setError("");
    try {
      const res = await fetch(`/api/websites/${websiteId}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: template.id,
          custom_config: { sections: template.sections_config.map((s) => ({ id: s.id })) },
        }),
      });
      const cType = res.headers.get("content-type") || "";
      if (!res.ok || !cType.includes("application/json")) {
        setError(t("common.networkError"));
        return;
      }
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      router.push(`/dashboard/${websiteId}/builder/${template.id}`);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" aria-label={t("common.loading")}>
        <Skeleton className="h-10 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t("builder.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("builder.subtitle")}</p>
        <div className="mt-2">
          <ActiveWebsiteChip />
        </div>
      </div>

      {error ? (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : null}

      {currentId ? (
        <Button asChild variant="outline" className="w-full justify-start bg-green-50 border-green-200 text-green-800 hover:bg-green-100 hover:text-green-900">
          <Link href={`/dashboard/${websiteId}/builder/${currentId}`}>
            {t("builder.continue")}
          </Link>
        </Button>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const primary = template.color_palette?.primary || "#15803D";
          const isCurrent = template.id === currentId;
          return (
            <Card key={template.id} className="overflow-hidden flex flex-col p-0">
              <div className="h-28 flex items-center justify-center text-5xl" style={{ background: template.color_palette?.background || "#f5f5f5" }}>
                {template.name === "food" ? "🍽️" : template.name === "fashion" ? "👗" : template.name === "handicraft" ? "🏺" : template.name === "retail" ? "🏪" : "💼"}
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border" style={{ background: primary }} />
                  <h3 className="text-sm font-semibold capitalize">{template.name}</h3>
                  {isCurrent ? (
                    <Badge variant="success" className="ml-auto gap-1 text-xs">
                      <Check className="h-3 w-3" /> {t("builder.current")}
                    </Badge>
                  ) : null}
                  {template.locked ? (
                    <Badge variant="warning" className="ml-auto gap-1 text-xs">
                      <Lock className="h-3 w-3" /> {t("builder.locked")}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-gray-500 flex-1">{template.description}</p>
                <p className="mt-2 text-xs text-gray-400">{template.sections_config.length} section</p>
                {template.locked ? (
                  <Button asChild variant="outline" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-50">
                    <Link href="/dashboard/billing">
                      {t("dashboard.upgradeNow")}
                    </Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => pilihTemplate(template)}
                    disabled={savingId === template.id}
                    className="mt-3"
                    style={{ background: primary }}
                  >
                    {savingId === template.id ? t("builder.using") : t("onboarding.use")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tier === "free" ? (
        <p className="text-sm text-gray-400">
          {t("builder.lockedMsg")}{" "}
          <Link href="/dashboard/billing" className="underline">
            {t("dashboard.upgradeNow")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}