"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  Check,
  Eye,
  Store,
  ExternalLink,
  Sparkles,
  Palette,
  ArrowRight,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import { tenantUrl, tenantDisplay } from "@/lib/urls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BannerConfig {
  enabled: boolean;
  message: string;
  buttonText: string;
  buttonUrl: string;
  bgColor: string;
  textColor: string;
  isSticky: boolean;
}

const DEFAULT_BANNER: BannerConfig = {
  enabled: true,
  message: "🎉 Promo Khusus: Gratis Ongkir ke Seluruh Indonesia untuk Order Hari Ini!",
  buttonText: "Lihat Produk",
  buttonUrl: "#products",
  bgColor: "#059669",
  textColor: "#ffffff",
  isSticky: true,
};

const PRESET_COLORS = [
  { name: "Hijau Emerald (Segar)", bg: "#059669", text: "#ffffff" },
  { name: "Kuning Emas (Promo)", bg: "#d97706", text: "#ffffff" },
  { name: "Merah Diskon (Urgent)", bg: "#dc2626", text: "#ffffff" },
  { name: "Biru Indigo (Elegan)", bg: "#4f46e5", text: "#ffffff" },
  { name: "Hitam Slate (Modern)", bg: "#0f172a", text: "#ffffff" },
];

export default function AnnouncementPage() {
  const { t } = useLang();
  const [config, setConfig] = useState<BannerConfig>(DEFAULT_BANNER);
  const [activeSite, setActiveSite] = useState<{ id: string; name: string; subdomain: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success && json.data.websites?.length > 0) {
          const list = json.data.websites;
          const site = list.find((s: any) => s.id === json.data.active_website_id) ?? list[0];
          setActiveSite(site);

          const saved = localStorage.getItem(`umkm_banner_${site.id}`);
          if (saved) {
            try {
              setConfig(JSON.parse(saved));
            } catch {
              setConfig(DEFAULT_BANNER);
            }
          }
        }
      } catch {
        setConfig(DEFAULT_BANNER);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (activeSite) {
      localStorage.setItem(`umkm_banner_${activeSite.id}`, JSON.stringify(config));
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  }

  const liveStoreUrl = activeSite?.subdomain ? tenantUrl(activeSite.subdomain) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Banner & Bar Pengumuman
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Tampilkan bar informasi promosi atau pengumuman penting di bagian paling atas toko online
            Anda untuk memancing konversi pembelian cepat.
          </p>
        </div>

        {activeSite && (
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3.5 py-2 rounded-2xl shrink-0">
            <Store className="w-4 h-4 text-emerald-700" />
            <div className="text-sm">
              <span className="text-gray-500 font-medium">Toko: </span>
              <span className="font-bold text-gray-900 dark:text-white">{activeSite.name}</span>
            </div>
            {liveStoreUrl && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="h-7 w-7 text-emerald-700 hover:text-emerald-900"
                title="Buka toko"
              >
                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Buka toko"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>

      {savedSuccess && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pengaturan banner pengumuman berhasil disimpan dan aktif di toko!</span>
          </div>
          {liveStoreUrl && (
            <a
              href={liveStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold underline underline-offset-2 hover:text-emerald-950"
            >
              Lihat di Website →
            </a>
          )}
        </div>
      )}

      {/* Live Interactive Preview Box */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5 font-bold">
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau Langsung di Header Toko</span>
          </CardTitle>
          <Badge variant={config.enabled ? "success" : "secondary"} className="text-xs">
            {config.enabled ? "● Status: Tayang" : "○ Status: Nonaktif"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">

        {/* Mock Store Screen */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner bg-gray-50">
          {config.enabled ? (
            <div
              className="px-4 py-2.5 text-sm font-medium flex flex-wrap items-center justify-center gap-2 text-center transition-colors"
              style={{ backgroundColor: config.bgColor, color: config.textColor }}
            >
              <span>{config.message || "Tuliskan pesan promo Anda di sini..."}</span>
              {config.buttonText && (
                <span className="text-xs font-bold underline underline-offset-2 ml-1 cursor-pointer opacity-90 hover:opacity-100">
                  {config.buttonText} →
                </span>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-100 text-center text-sm text-gray-400 italic">
              Banner sedang dinonaktifkan (tidak akan tampil di website toko).
            </div>
          )}

          {/* Mock Header Navigation below */}
          <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                U
              </div>
              <span className="text-sm font-bold text-gray-800">
                {activeSite?.name || "Nama Toko Anda"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Produk</span>
              <span>Tentang</span>
              <span>Kontak</span>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <form onSubmit={handleSave}>
        <CardContent className="p-6 space-y-5">
        {/* Toggle Enabled */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 gap-4">
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Aktifkan Banner Pengumuman</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Tampilkan bar teks promo di bagian atas setiap halaman website toko Anda.
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => setConfig({ ...config, enabled: v })}
            aria-label="Aktifkan banner pengumuman"
          />
        </div>

        {/* Message Input */}
        <div className="space-y-1.5">
          <Label htmlFor="banner-message">
            Teks Pesan Pengumuman:
          </Label>
          <Input
            id="banner-message"
            value={config.message}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            placeholder="Contoh: 🔥 Diskon 15% Spesial Ramadhan & Gratis Ongkir se-Jawa!"
            required
          />
        </div>

        {/* Action Link Details */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="banner-btn-text">
              Teks Tombol / Tautan (Opsional):
            </Label>
            <Input
              id="banner-btn-text"
              value={config.buttonText}
              onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
              placeholder="Contoh: Belanja Sekarang"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="banner-btn-url">
              URL Tujuan Tautan:
            </Label>
            <Input
              id="banner-btn-url"
              value={config.buttonUrl}
              onChange={(e) => setConfig({ ...config, buttonUrl: e.target.value })}
              placeholder="#products atau link WA"
              className="font-mono"
            />
          </div>
        </div>

        {/* Color Palette Choices */}
        <div className="space-y-2">
          <Label>Warna Tema Banner:</Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5" role="radiogroup" aria-label="Warna tema banner">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                role="radio"
                aria-checked={config.bgColor === preset.bg}
                onClick={() =>
                  setConfig({ ...config, bgColor: preset.bg, textColor: preset.text })
                }
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                  config.bgColor === preset.bg
                    ? "border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/20"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full shrink-0 shadow-2xs border border-white"
                  style={{ backgroundColor: preset.bg }}
                />
                <span className="text-xs font-medium text-gray-800 truncate">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Save CTA */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <Button type="submit">
            Simpan & Tayangkan Banner
          </Button>
        </div>
        </CardContent>
        </form>
      </Card>
    </div>
  );
}
