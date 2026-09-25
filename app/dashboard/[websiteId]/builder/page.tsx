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
        const tJson = await tRes.json();
        if (tJson.success) {
          setTemplates(tJson.data.templates);
          setTier(tJson.data.tier ?? "free");
        } else {
          setError(tJson.error ?? t("common.networkError"));
        }
        if (wRes && wRes.ok) {
          const wJson = await wRes.json();
          if (wJson.success && !wJson.data.is_default) setCurrentId(wJson.data.template_id);
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

  if (loading) return <p className="text-gray-500">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("builder.title")}</h1>
        <p className="text-gray-500">{t("builder.subtitle")}</p>
        <div className="mt-2">
          <ActiveWebsiteChip />
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      ) : null}

      {currentId ? (
        <Link
          href={`/dashboard/${websiteId}/builder/${currentId}`}
          className="block bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 hover:bg-green-100"
        >
          {t("builder.continue")}
        </Link>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const primary = template.color_palette?.primary || "#15803D";
          const isCurrent = template.id === currentId;
          return (
            <div key={template.id} className="border rounded-xl overflow-hidden bg-white flex flex-col">
              <div className="h-28 flex items-center justify-center text-5xl" style={{ background: template.color_palette?.background || "#f5f5f5" }}>
                {template.name === "food" ? "🍽️" : template.name === "fashion" ? "👗" : template.name === "handicraft" ? "🏺" : template.name === "retail" ? "🏪" : "💼"}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border" style={{ background: primary }} />
                  <h3 className="font-semibold capitalize">{template.name}</h3>
                  {isCurrent ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> {t("builder.current")}
                    </span>
                  ) : null}
                  {template.locked ? (
                    <span className="ml-auto inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      <Lock className="h-3 w-3" /> {t("builder.locked")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-gray-500 flex-1">{template.description}</p>
                <p className="mt-2 text-xs text-gray-400">{template.sections_config.length} section</p>
                {template.locked ? (
                  <Link
                    href="/dashboard/settings/billing"
                    className="mt-3 block text-center text-sm border border-amber-300 text-amber-700 rounded-lg py-2 hover:bg-amber-50"
                  >
                    {t("dashboard.upgradeNow")}
                  </Link>
                ) : (
                  <button
                    onClick={() => pilihTemplate(template)}
                    disabled={savingId === template.id}
                    className="mt-3 text-sm text-white rounded-lg py-2 hover:opacity-90 disabled:opacity-50"
                    style={{ background: primary }}
                  >
                    {savingId === template.id ? t("builder.using") : t("onboarding.use")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tier === "free" ? (
        <p className="text-xs text-gray-400">
          {t("builder.lockedMsg")}{" "}
          <Link href="/dashboard/settings/billing" className="underline">
            {t("dashboard.upgradeNow")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}