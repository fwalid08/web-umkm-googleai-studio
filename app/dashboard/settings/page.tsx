"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CreditCard, Bell, Shield, Wallet, Currency, User, Languages, Layers, Save, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { ActiveWebsiteChip } from "@/components/dashboard/active-website-chip";
import { toast } from "sonner";

interface WebsiteSettings {
  currency: string;
  language: string;
  timezone: string;
  payment_methods: string[];
  notify_whatsapp_new_order: boolean;
  notify_email_daily_summary: boolean;
  notify_email_low_stock: boolean;
  store_name: string | null;
  store_description: string | null;
  store_phone: string | null;
  store_email: string | null;
  store_address: string | null;
  operational_hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
}

const CURRENCY_OPTIONS = [
  { value: "IDR", label: "IDR (Rupiah)" },
  { value: "USD", label: "USD (Dolar)" },
];

const LANGUAGE_OPTIONS = [
  { value: "id", label: "Indonesia (id)" },
  { value: "en", label: "English (en)" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp Order" },
  { value: "midtrans", label: "Midtrans" },
  { value: "xendit", label: "Xendit" },
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const DAY_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function BusinessSettingsPage() {
  const { t } = useLang();
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/websites/active/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/websites/active/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Pengaturan berhasil disimpan");
      } else {
        toast.error(json.error || "Gagal menyimpan pengaturan");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  function handleChange<K extends keyof WebsiteSettings>(key: K, value: WebsiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : null));
  }

  function handlePaymentMethodChange(method: string, checked: boolean) {
    setSettings((prev) => {
      if (!prev) return null;
      const current = prev.payment_methods || [];
      const updated = checked
        ? [...current, method]
        : current.filter((m) => m !== method);
      return { ...prev, payment_methods: updated };
    });
  }

  function handleOperationalHoursChange(day: string, field: "open" | "close" | "closed", value: string | boolean) {
    setSettings((prev) => {
      if (!prev) return null;
      const current = prev.operational_hours || {};
      const dayData = current[day] || { open: "08:00", close: "22:00", closed: false };
      return {
        ...prev,
        operational_hours: {
          ...current,
          [day]: { ...dayData, [field]: value },
        },
      };
    });
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto" aria-label="Memuat pengaturan">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Gagal memuat pengaturan</p>
          <Button onClick={fetchSettings} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t("settingsHub.title") || "Pengaturan"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Pengaturan operasional toko, mata uang, pembayaran, notifikasi, dan profil.
        </p>
        <div className="mt-2.5">
          <ActiveWebsiteChip />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Currency & Localization Card */}
        <Card className="hover:shadow-md transition-all h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
                <Currency className="h-4 w-4" />
              </span>
              <span>{t("settingsHub.currency") || "Mata Uang & Lokalisasi"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mata Uang
              </Label>
              <Select value={settings.currency} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih mata uang" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bahasa
              </Label>
              <Select value={settings.language} onValueChange={(v) => handleChange("language", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih bahasa" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zona Waktu
              </Label>
              <Select value={settings.timezone} onValueChange={(v) => handleChange("timezone", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Pilih zona waktu" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Card */}
        <Card className="hover:shadow-md transition-all h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <span className="p-2 rounded-lg bg-purple-50 text-purple-700 shrink-0">
                <Wallet className="h-4 w-4" />
              </span>
              <span>{t("settingsHub.paymentMethods") || "Metode Pembayaran"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-gray-600 dark:text-gray-200">
              {t("settingsHub.paymentMethodsDesc") || "Pilih metode pembayaran untuk menerima pesanan toko Anda."}
            </p>
            <div className="space-y-2">
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center justify-between">
                  <Label className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                    {opt.label}
                  </Label>
                  <Switch
                    checked={settings.payment_methods?.includes(opt.value) || false}
                    onCheckedChange={(checked) => handlePaymentMethodChange(opt.value, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="hover:shadow-md transition-all h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <span className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                <Bell className="h-4 w-4" />
              </span>
              <span>{t("settingsHub.notifications") || "Notifikasi"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-gray-600 dark:text-gray-200">
              {t("settingsHub.notificationsDesc") || "Setelan notifikasi WhatsApp dan email untuk pesanan toko."}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Notifikasi WhatsApp pesanan baru
                </Label>
                <Switch
                  checked={settings.notify_whatsapp_new_order}
                  onCheckedChange={(checked) => handleChange("notify_whatsapp_new_order", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Ringkasan email harian
                </Label>
                <Switch
                  checked={settings.notify_email_daily_summary}
                  onCheckedChange={(checked) => handleChange("notify_email_daily_summary", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-700 dark:text-gray-300">
                  Notifikasi stok menipis (email)
                </Label>
                <Switch
                  checked={settings.notify_email_low_stock}
                  onCheckedChange={(checked) => handleChange("notify_email_low_stock", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Store Profile Card */}
        <Card className="hover:shadow-md transition-all h-full lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
                <User className="h-4 w-4" />
              </span>
              <span>{t("settingsHub.profile") || "Profil Toko"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Toko
                </Label>
                <Input
                  value={settings.store_name || ""}
                  onChange={(e) => handleChange("store_name", e.target.value)}
                  placeholder="Nama toko Anda"
                />
              </div>
              <div>
                <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Toko
                </Label>
                <Input
                  type="email"
                  value={settings.store_email || ""}
                  onChange={(e) => handleChange("store_email", e.target.value)}
                  placeholder="email@toko.com"
                />
              </div>
              <div>
                <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telepon
                </Label>
                <Input
                  value={settings.store_phone || ""}
                  onChange={(e) => handleChange("store_phone", e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>
              <div>
                <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alamat
                </Label>
                <Input
                  value={settings.store_address || ""}
                  onChange={(e) => handleChange("store_address", e.target.value)}
                  placeholder="Jl. Contoh No. 123, Kota"
                />
              </div>
            </div>
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deskripsi Toko
              </Label>
              <Textarea
                value={settings.store_description || ""}
                onChange={(e) => handleChange("store_description", e.target.value)}
                placeholder="Deskripsi singkat tentang toko Anda..."
                rows={3}
              />
            </div>
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Jam Operasional
              </Label>
              <div className="space-y-2">
                {DAYS.map((day, idx) => (
                  <div key={day} className="flex items-center gap-2 text-xs">
                    <Label className="w-24 text-gray-700 dark:text-gray-300">
                      {DAY_LABELS[idx]}
                    </Label>
                    <Switch
                      checked={settings.operational_hours?.[day]?.closed || false}
                      onCheckedChange={(checked) => handleOperationalHoursChange(day, "closed", checked)}
                    />
                    <span className="text-gray-500 dark:text-gray-400">Tutup</span>
                    <Input
                      type="time"
                      value={settings.operational_hours?.[day]?.open || "08:00"}
                      onChange={(e) => handleOperationalHoursChange(day, "open", e.target.value)}
                      className="w-24 h-8 text-xs"
                      disabled={settings.operational_hours?.[day]?.closed}
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="time"
                      value={settings.operational_hours?.[day]?.close || "22:00"}
                      onChange={(e) => handleOperationalHoursChange(day, "close", e.target.value)}
                      className="w-24 h-8 text-xs"
                      disabled={settings.operational_hours?.[day]?.closed}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO / Social Card */}
        <Card className="hover:shadow-md transition-all h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
              <span className="p-2 rounded-lg bg-rose-50 text-rose-700 shrink-0">
                <Languages className="h-4 w-4" />
              </span>
              <span>SEO & Sosial Media</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta Title
              </Label>
              <Input
                value={settings.meta_title || ""}
                onChange={(e) => handleChange("meta_title", e.target.value)}
                placeholder="Judul untuk hasil pencarian (maks 100 karakter)"
                maxLength={100}
              />
            </div>
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta Description
              </Label>
              <Textarea
                value={settings.meta_description || ""}
                onChange={(e) => handleChange("meta_description", e.target.value)}
                placeholder="Deskripsi untuk hasil pencarian (maks 300 karakter)"
                rows={2}
                maxLength={300}
              />
            </div>
            <div>
              <Label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                OG Image URL
              </Label>
              <Input
                value={settings.og_image_url || ""}
                onChange={(e) => handleChange("og_image_url", e.target.value)}
                placeholder="https://example.com/og-image.jpg"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </Button>
      </div>
    </div>
  );
}