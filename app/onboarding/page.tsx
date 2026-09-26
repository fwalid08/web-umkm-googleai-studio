"use client";

/**
 * Sprint 04/UX — Onboarding 3 langkah (hasil dulu, struktur belakangan):
 * 1. Nama toko → 2. Jenis bisnis → 3. Template → website live.
 * Dipakai website fresh (current_template_id null). Tanpa migrasi baru.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/lib/i18n";
import { tenantDisplay, tenantUrl } from "@/lib/urls";

const BIZ = ["food", "fashion", "handicraft", "retail", "services"] as const;
const EMOJI: Record<string, string> = { food: "🍽️", fashion: "👗", handicraft: "🏺", retail: "🏪", services: "💼" };

interface Template {
  id: string;
  name: string;
  description: string;
  color_palette: { primary?: string; background?: string };
  sections_config: { id: string }[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useLang();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [biz, setBiz] = useState<string>("food");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [websiteId, setWebsiteId] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [wRes, tRes] = await Promise.all([fetch("/api/websites"), fetch("/api/templates")]);
        const wJson = await wRes.json();
        const tJson = await tRes.json();
        if (wJson.success && wJson.data.websites.length > 0) {
          setWebsiteId(wJson.data.active_website_id ?? wJson.data.websites[0].id);
          const w = wJson.data.websites[0];
          if (w.name && !w.name.startsWith("tenant-")) setName(w.name);
          setSubdomain(wJson.data.websites.find((x: { id: string }) => x.id === (wJson.data.active_website_id ?? wJson.data.websites[0].id))?.subdomain ?? w.subdomain ?? "");
        }
        if (tJson.success) setTemplates(tJson.data.templates);
      } catch {
        setError(t("common.networkError"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveNameBiz() {
    if (!name.trim() || !websiteId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/websites/${websiteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), business_type: biz }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      setStep(3);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  async function pickTemplate(tpl: Template) {
    if (!websiteId) {
      setError(t("common.networkError"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Pastikan website target jadi aktif dulu agar konteks konsisten,
      // lalu simpan template via route eksplisit per-website.
      await fetch(`/api/websites/${websiteId}/activate`, { method: "POST" }).catch(() => null);
      const res = await fetch(`/api/websites/${websiteId}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: tpl.id,
          custom_config: { sections: tpl.sections_config.map((s) => ({ id: s.id })) },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("common.networkError"));
        return;
      }
      setStep(4);
    } catch {
      setError(t("common.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <p className="text-center text-sm text-gray-500">{step <= 3 ? t("onboarding.step", { n: step }) : "🎉"}</p>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 transition-all" style={{ width: `${Math.min(100, (step / 4) * 100)}%` }} />
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        ) : null}

        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h1 className="text-2xl font-bold text-center">{t("onboarding.s1Title")}</h1>
              <p className="text-center text-gray-500 text-sm">{t("onboarding.s1Desc")}</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("onboarding.s1Ph")}
                className="w-full border rounded-xl px-4 py-3 text-lg text-center"
              />
              <button
                onClick={() => name.trim() && setStep(2)}
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl text-white font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {t("common.next")}
              </button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h1 className="text-2xl font-bold text-center">{t("onboarding.s2Title")}</h1>
              <p className="text-center text-gray-500 text-sm">{t("onboarding.s2Desc")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BIZ.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBiz(b)}
                    className={`border rounded-xl p-4 text-center ${biz === b ? "border-green-600 bg-green-50" : "hover:bg-gray-50"}`}
                  >
                    <span className="text-3xl">{EMOJI[b]}</span>
                    <p className="mt-2 text-sm font-medium">{t(`onboarding.biz.${b}`)}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={saveNameBiz}
                disabled={busy}
                className="w-full py-3 rounded-xl text-white font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {busy ? t("common.saving") : t("common.next")}
              </button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-center">{t("onboarding.s3Title")}</h1>
            <p className="text-center text-gray-500 text-sm">{t("onboarding.s3Desc")}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <Card key={tpl.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div
                      className="h-20 rounded-lg flex items-center justify-center text-4xl"
                      style={{ background: tpl.color_palette?.background || "#f5f5f5" }}
                    >
                      {EMOJI[tpl.name] ?? "🏪"}
                    </div>
                    <p className="font-semibold capitalize">{tpl.name}</p>
                    <button
                      onClick={() => pickTemplate(tpl)}
                      disabled={busy}
                      className="w-full py-2 rounded-lg text-sm text-white font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {busy ? t("onboarding.using") : t("onboarding.use")}
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <Card>
            <CardContent className="pt-6 space-y-4 text-center">
              <h1 className="text-2xl font-bold">{t("onboarding.doneTitle")}</h1>
              <p className="text-gray-500 text-sm">{t("onboarding.doneDesc")}</p>
              <code className="inline-block bg-gray-100 px-3 py-1 rounded">{tenantDisplay(subdomain)}</code>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href={tenantUrl(subdomain) ?? "/dashboard"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl text-white font-medium bg-green-600 hover:bg-green-700 text-center"
                >
                  {t("onboarding.viewSite")}
                </a>
                <button
                  onClick={() => router.push(websiteId ? `/dashboard/${websiteId}/builder` : "/dashboard")}
                  className="flex-1 py-3 rounded-xl border font-medium hover:bg-gray-50"
                >
                  {t("onboarding.toWorkspace")}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
