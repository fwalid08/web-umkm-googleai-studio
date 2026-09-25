"use client";

/**
 * Sprint 01 US-02 — Editor Template Fixed per website (tanpa drag & drop).
 * Mental model: Aktif/Matikan Section → Ganti Theme & Background → Isi Konten → Simpan.
 * Preview = iframe website live tenant (render asli, tanpa duplikasi) + toggle mobile/desktop.
 * Urutan section selalu ikut template; client tidak bisa menggeser posisi.
 * Website-scoped: /dashboard/[websiteId]/builder/[id]
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, ExternalLink, Monitor, Save, Smartphone } from "lucide-react";
import { ColorInput, ObjectArrayEditor, ObjectEditor, StringArrayEditor, TextInput, Toggle } from "../_components/fields";
import { ActiveWebsiteChip } from "@/components/dashboard/active-website-chip";

interface EdSection {
  id: string;
  type: string;
  label: string;
  required: boolean;
  order: number;
  enabled: boolean;
  style: Record<string, unknown>;
  content: Record<string, unknown>;
}

/** Bentuk item baru per tipe section untuk tombol "+ Tambah". */
const BLANK_BY_TYPE: Record<string, Record<string, unknown>> = {
  product_grid: { name: "", price: 0, description: "", image: "" },
  testimonials: { name: "", text: "", rating: 5 },
  faq: { question: "", answer: "" },
  promo_banner: { title: "", price: "", original_price: "", discount: "" },
};

const ARRAY_KEYS = ["items", "images", "features"];

export default function BuilderEditorPage() {
  const params = useParams();
  const websiteId = params.websiteId as string;
  const id = (params?.id as string) ?? "";

  const [templateName, setTemplateName] = useState("");
  const [sections, setSections] = useState<EdSection[]>([]);
  const [theme, setTheme] = useState({ primary: "#15803D", background: "#ffffff", text: "#1C1917", heading_font: "Inter", body_font: "Inter" });
  const [seo, setSeo] = useState({ title: "", description: "" });
  const [tierInfo, setTierInfo] = useState({ tier: "free", trial_active: false });
  const [previewUrl, setPreviewUrl] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [tRes, wRes] = await Promise.all([
          fetch(`/api/templates/${id}`),
          fetch(`/api/websites/${websiteId}/website`),
        ]);
        const tJson = await tRes.json();
        if (!tJson.success) {
          setMsg({ ok: false, text: tJson.error ?? "Template tidak ditemukan" });
          setLoading(false);
          return;
        }
        const tpl = tJson.data.template;
        setTemplateName(tpl.name);

        let site: EdSection[] | null = null;
        let siteTheme = null;
        let siteSeo = { title: "", description: "" };
        if (wRes.ok) {
          const wJson = await wRes.json();
          if (wJson.success) {
            setTierInfo({ tier: wJson.data.tier ?? "free", trial_active: !!wJson.data.trial_active });
            setPreviewUrl(wJson.data.subdomain_url ?? "");
            if (wJson.data.template_id === id && !wJson.data.is_default) {
              site = wJson.data.custom_config.sections;
              siteTheme = wJson.data.custom_config.theme;
              siteSeo = { ...siteSeo, ...(wJson.data.custom_config.seo ?? {}) };
            }
          }
        }

        if (site) {
          setSections(site);
          const pal = (siteTheme?.palette ?? {}) as Record<string, string>;
          const typo = (siteTheme?.typography ?? {}) as Record<string, string>;
          setTheme({
            primary: pal.primary ?? tpl.color_palette.primary,
            background: pal.background ?? tpl.color_palette.background,
            text: pal.text ?? tpl.color_palette.text,
            heading_font: typo.heading_font ?? tpl.typography_config.heading_font,
            body_font: typo.body_font ?? tpl.typography_config.body_font,
          });
          setSeo(siteSeo);
          const first = [...site].sort((a, b) => a.order - b.order)[0];
          setOpenId(first?.id ?? null);
        } else {
          const defaults: EdSection[] = [...(tpl.sections_config as EdSection[])]
            .sort((a, b) => a.order - b.order)
            .map((s) => ({
              id: s.id, type: s.type, label: s.label, required: s.required, order: s.order,
              enabled: true, style: {}, content: { ...((s as unknown as { default_props: object }).default_props ?? {}) },
            }));
          setSections(defaults);
          setTheme({
            primary: tpl.color_palette.primary, background: tpl.color_palette.background, text: tpl.color_palette.text,
            heading_font: tpl.typography_config.heading_font, body_font: tpl.typography_config.body_font,
          });
          setOpenId(defaults[0]?.id ?? null);
        }
      } catch {
        setMsg({ ok: false, text: "Terjadi kesalahan jaringan" });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, websiteId]);

  const productCount = useMemo(() => {
    let n = 0;
    for (const s of sections) {
      if (!s.enabled || s.type !== "product_grid") continue;
      const items = s.content.items;
      if (Array.isArray(items)) n += items.length;
    }
    return n;
  }, [sections]);

  function patchSection(sid: string, patch: Partial<EdSection>) {
    setSections((prev) => prev.map((s) => (s.id === sid ? { ...s, ...patch } : s)));
  }

  async function simpan() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/websites/${websiteId}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: id,
          custom_config: {
            theme: {
              palette: { primary: theme.primary, background: theme.background, text: theme.text },
              typography: { heading_font: theme.heading_font, body_font: theme.body_font },
            },
            sections: sections.map((s) => ({ id: s.id, enabled: s.enabled, style: s.style, content: s.content })),
            seo: { title: seo.title || undefined, description: seo.description || undefined },
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setMsg({ ok: false, text: json.upgrade_url ? `${json.error} ` : json.error ?? "Gagal menyimpan" });
        return;
      }
      const wRes = await fetch(`/api/websites/${websiteId}/website`);
      const wJson = await wRes.json();
      if (wJson.success) setPreviewUrl(wJson.data.subdomain_url ?? "");
      setMsg({ ok: true, text: "Tersimpan! Preview diperbarui." });
    } catch {
      setMsg({ ok: false, text: "Terjadi kesalahan jaringan" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Memuat editor...</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <Link href={`/dashboard/${websiteId}/builder`} className="text-sm text-gray-500 hover:underline">← Galeri</Link>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">Edit: {templateName}</h1>
          <div className="mt-1.5">
            <ActiveWebsiteChip />
          </div>
          <p className="text-sm text-gray-500">
            Paket {tierInfo.tier} {tierInfo.trial_active ? "(trial aktif)" : ""} • {productCount} produk
            {tierInfo.tier === "free" && !tierInfo.trial_active ? " (maks 5 di Free)" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {previewUrl ? (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            <ExternalLink className="h-4 w-4" /> Lihat Website
          </a>
          ) : null}
          <button onClick={simpan} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan & Publish"}
          </button>
        </div>
      </div>

      {msg ? (
        <div className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {msg.text}
          {!msg.ok && msg.text.includes("Starter") ? (
            <Link href="/dashboard/settings/billing" className="ml-2 underline font-medium">Upgrade →</Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Kolom konfigurasi */}
        <div className="space-y-4">
          {/* Theme */}
          <details className="border rounded-xl bg-white" open>
            <summary className="px-4 py-3 font-semibold cursor-pointer">🎨 Theme Global</summary>
            <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3">
              <ColorInput label="Warna utama" value={theme.primary} onChange={(v) => setTheme({ ...theme, primary: v })} />
              <ColorInput label="Background" value={theme.background} onChange={(v) => setTheme({ ...theme, background: v })} />
              <ColorInput label="Warna teks" value={theme.text} onChange={(v) => setTheme({ ...theme, text: v })} />
              <TextInput label="Font judul" value={theme.heading_font} onChange={(v) => setTheme({ ...theme, heading_font: v })} />
              <TextInput label="Font isi" value={theme.body_font} onChange={(v) => setTheme({ ...theme, body_font: v })} />
            </div>
          </details>

          {/* Sections */}
          {[...sections].sort((a, b) => a.order - b.order).map((s) => {
            const open = openId === s.id;
            return (
              <div key={s.id} className={`border rounded-xl bg-white ${s.enabled ? "" : "opacity-70"}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <Toggle checked={s.enabled} disabled={s.required}
                    onChange={(v) => patchSection(s.id, { enabled: v })} label={s.label} />
                  <button onClick={() => setOpenId(open ? null : s.id)} className="flex-1 text-left">
                    <span className="font-semibold">{s.label}</span>{" "}
                    <span className="text-xs text-gray-400">
                      {s.required ? "• wajib" : "• opsional"} {!s.enabled ? "• nonaktif" : ""}
                    </span>
                  </button>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
                {open ? (
                  <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Background section</p>
                      <TextInput label="background" placeholder="#ffffff atau URL gambar"
                        value={typeof s.style.background === "string" ? s.style.background : ""}
                        onChange={(v) => patchSection(s.id, { style: { ...s.style, background: v } })} />
                    </div>
                    <ObjectEditor data={s.content} exclude={ARRAY_KEYS}
                      onChange={(next) => patchSection(s.id, { content: { ...s.content, ...next } })} />
                    {ARRAY_KEYS.filter((k) => s.content[k] !== undefined).map((k) => {
                      const val = s.content[k];
                      const setVal = (v: unknown) => patchSection(s.id, { content: { ...s.content, [k]: v } });
                      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
                        return (
                          <ObjectArrayEditor key={k} label={k}
                            items={val as Record<string, unknown>[]}
                            blank={BLANK_BY_TYPE[s.type] ?? {}}
                            onChange={(next) => setVal(next)} />
                        );
                      }
                      if (Array.isArray(val) && (val.length === 0 || typeof val[0] === "string")) {
                        // Array kosong: tebak object vs string dari tipe section
                        if (["items"].includes(k) && BLANK_BY_TYPE[s.type]) {
                          return (
                            <ObjectArrayEditor key={k} label={k}
                              items={val as Record<string, unknown>[]}
                              blank={BLANK_BY_TYPE[s.type]}
                              onChange={(next) => setVal(next)} />
                          );
                        }
                        return (
                          <StringArrayEditor key={k} label={k}
                            items={val as string[]} onChange={(next) => setVal(next)} />
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* SEO */}
          <details className="border rounded-xl bg-white">
            <summary className="px-4 py-3 font-semibold cursor-pointer">🔍 SEO Dasar</summary>
            <div className="px-4 pb-4 space-y-3">
              <TextInput label="Judul (maks 60 karakter)" value={seo.title} onChange={(v) => setSeo({ ...seo, title: v })} />
              <TextInput label="Deskripsi (maks 160 karakter)" value={seo.description} onChange={(v) => setSeo({ ...seo, description: v })} textarea />
            </div>
          </details>
        </div>

        {/* Kolom preview live */}
        <div className="lg:sticky lg:top-20 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Preview Live</p>
            <div className="flex gap-1 border rounded-lg p-1">
              <button onClick={() => setDevice("mobile")}
                className={`p-1.5 rounded ${device === "mobile" ? "bg-gray-900 text-white" : "text-gray-500"}`} aria-label="Mobile">
                <Smartphone className="h-4 w-4" />
              </button>
              <button onClick={() => setDevice("desktop")}
                className={`p-1.5 rounded ${device === "desktop" ? "bg-gray-900 text-white" : "text-gray-500"}`} aria-label="Desktop">
                <Monitor className="h-4 w-4" />
              </button>
            </div>
          </div>
          {previewUrl ? (
            <div className={`mx-auto border rounded-xl overflow-hidden bg-white ${device === "mobile" ? "max-w-[375px]" : "w-full"}`}>
              <div className="h-8 bg-gray-900 flex items-center px-3 gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                <span className="ml-2 text-[11px] text-gray-400 truncate">{previewUrl.replace("https://", "")}</span>
              </div>
              <iframe key={previewUrl} src={previewUrl} title="Preview website"
                className={`w-full border-0 ${device === "mobile" ? "h-[600px]" : "h-[700px]"}`} />
            </div>
          ) : (
            <p className="text-sm text-gray-500 border rounded-xl p-6 text-center">
              Simpan dulu untuk melihat preview live website Anda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}