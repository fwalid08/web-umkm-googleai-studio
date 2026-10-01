"use client";

import { useEffect, useState } from "react";
import { Loader2, Globe, Mail, MapPin, Phone, MessageCircle, Image as ImageIcon, Save, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBuilderStore, type BuilderState } from "@/lib/builder/store";
import { validateGeneralTab, type GeneralTabData, type ValidationResult } from "./validation";
import { useToast } from "@/components/ui/toast";

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: "📷", placeholder: "@username" },
  { key: "facebook", label: "Facebook", icon: "📘", placeholder: "facebook.com/username" },
  { key: "tiktok", label: "TikTok", icon: "🎵", placeholder: "@username" },
  { key: "twitter", label: "X (Twitter)", icon: "🐦", placeholder: "@username" },
  { key: "youtube", label: "YouTube", icon: "▶️", placeholder: "youtube.com/channel" },
  { key: "linkedin", label: "LinkedIn", icon: "💼", placeholder: "linkedin.com/in/username" },
] as const;

export function GeneralTab({ websiteId }: { websiteId: string }) {
  const header = useBuilderStore((s) => s.header);
  const footer = useBuilderStore((s) => s.footer);
  const updateHeader = useBuilderStore((s) => s.updateHeader);
  const updateFooterStore = useBuilderStore((s) => s.updateFooter);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    footer.socialLinks ?? {}
  );
  const [address, setAddress] = useState(footer.address ?? "");
  const [phone, setPhone] = useState(footer.phone ?? "");
  const [email, setEmail] = useState(footer.email ?? "");
  const [whatsapp, setWhatsApp] = useState(footer.whatsapp ?? "");
  const [showWhatsApp, setShowWhatsApp] = useState(footer.showWhatsApp ?? true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Sync local state with store (e.g. after reload via loadConfig)
  useEffect(() => {
    setSocialLinks(footer.socialLinks ?? {});
    setAddress(footer.address ?? "");
    setPhone(footer.phone ?? "");
    setEmail(footer.email ?? "");
    setWhatsApp(footer.whatsapp ?? "");
    setShowWhatsApp(footer.showWhatsApp ?? true);
  }, [footer]);

  const markTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const validateField = (field: string, value: unknown) => {
    const data: GeneralTabData = {
      logoUrl: field === 'logoUrl' ? value as string : header.logoUrl,
      faviconUrl: field === 'faviconUrl' ? value as string : header.faviconUrl,
      siteTitle: field === 'siteTitle' ? value as string : header.siteTitle,
      tagline: field === 'tagline' ? value as string : header.tagline,
      address,
      phone,
      email,
      whatsapp,
      showWhatsApp,
      socialLinks,
    };
    const result = validateGeneralTab(data);
    // Only set error for the specific field being validated
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (result.errors[field]) {
        newErrors[field] = result.errors[field];
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const validateAll = (): ValidationResult => {
    const data: GeneralTabData = {
      logoUrl: header.logoUrl,
      faviconUrl: header.faviconUrl,
      siteTitle: header.siteTitle,
      tagline: header.tagline,
      address,
      phone,
      email,
      whatsapp,
      showWhatsApp,
      socialLinks,
    };
    const result = validateGeneralTab(data);
    setFieldErrors(result.errors);
    // Mark all fields as touched to show errors
    setTouchedFields({
      logoUrl: true,
      faviconUrl: true,
      siteTitle: true,
      tagline: true,
      address: true,
      phone: true,
      email: true,
      whatsapp: true,
      'social.instagram': true,
      'social.facebook': true,
      'social.tiktok': true,
      'social.twitter': true,
      'social.youtube': true,
      'social.linkedin': true,
    });
    return result;
  };

  const handleSave = async () => {
    const validation = validateAll();
    if (!validation.valid) {
      toast("error", "Terdapat error validasi. Periksa field yang berwarna merah.");
      return;
    }

    setSaving(true);
    try {
      const patch = {
        socialLinks,
        address,
        phone,
        email,
        whatsapp,
        showWhatsApp,
      };
      updateFooterStore(patch);
      // Tab ini hanya mengubah chrome (footer), bukan sections — jadi cukup
      // patch custom_config tanpa payload kanvas. Builder Global yang dulu
      // menyediakan store.save() sudah dipensiunkan.
      const res = await fetch(`/api/websites/${websiteId}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_config: {
            header: useBuilderStore.getState().header,
            footer: { ...useBuilderStore.getState().footer, ...patch },
            core: useBuilderStore.getState().core,
            design_style_id: useBuilderStore.getState().designStyleId,
            palette_override: useBuilderStore.getState().paletteOverride,
            theme: { typography: useBuilderStore.getState().typographyOverride },
          },
          //-sections tidak dikirim: mode page-builder, homepage dipegang baris
          // store_pages-nya sendiri (lihat 033_page_builder_only.sql).
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Gagal menyimpan");
      toast("success", "Perubahan tersimpan");
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      toast("error", err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Brand Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">🏷️</span>
            Identitas Brand
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input
                value={header.logoUrl}
                onChange={(e) => updateHeader({ logoUrl: e.target.value })}
                onBlur={() => { markTouched('logoUrl'); validateField('logoUrl', header.logoUrl); }}
                placeholder="https://example.com/logo.png"
                className={fieldErrors.logoUrl && touchedFields.logoUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.logoUrl && touchedFields.logoUrl && (
                <p className="text-xs text-red-600">{fieldErrors.logoUrl}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Favicon URL</Label>
              <Input
                value={header.faviconUrl}
                onChange={(e) => updateHeader({ faviconUrl: e.target.value })}
                onBlur={() => { markTouched('faviconUrl'); validateField('faviconUrl', header.faviconUrl); }}
                placeholder="https://example.com/favicon.ico"
                className={fieldErrors.faviconUrl && touchedFields.faviconUrl ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.faviconUrl && touchedFields.faviconUrl && (
                <p className="text-xs text-red-600">{fieldErrors.faviconUrl}</p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nama Brand / Toko</Label>
              <Input
                value={header.siteTitle}
                onChange={(e) => updateHeader({ siteTitle: e.target.value })}
                onBlur={() => { markTouched('siteTitle'); validateField('siteTitle', header.siteTitle); }}
                placeholder="Nama Toko"
                className={fieldErrors.siteTitle && touchedFields.siteTitle ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.siteTitle && touchedFields.siteTitle && (
                <p className="text-xs text-red-600">{fieldErrors.siteTitle}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={header.tagline}
                onChange={(e) => updateHeader({ tagline: e.target.value })}
                onBlur={() => { markTouched('tagline'); validateField('tagline', header.tagline); }}
                placeholder="Tagline toko Anda"
                className={fieldErrors.tagline && touchedFields.tagline ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.tagline && touchedFields.tagline && (
                <p className="text-xs text-red-600">{fieldErrors.tagline}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">📞</span>
            Informasi Kontak
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onBlur={() => { markTouched('address'); validateField('address', address); }}
                placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                rows={3}
                className={fieldErrors.address && touchedFields.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.address && touchedFields.address && (
                <p className="text-xs text-red-600">{fieldErrors.address}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nomor Telepon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => { markTouched('phone'); validateField('phone', phone); }}
                placeholder="021-1234567 / 0812-3456-7890"
                className={fieldErrors.phone && touchedFields.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.phone && touchedFields.phone && (
                <p className="text-xs text-red-600">{fieldErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => { markTouched('email'); validateField('email', email); }}
                placeholder="toko@example.com"
                className={fieldErrors.email && touchedFields.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.email && touchedFields.email && (
                <p className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>WhatsApp (untuk order)</Label>
              <Input
                value={whatsapp}
                onChange={(e) => setWhatsApp(e.target.value)}
                onBlur={() => { markTouched('whatsapp'); validateField('whatsapp', whatsapp); }}
                placeholder="6281234567890 (format internasional tanpa +)"
                className={fieldErrors.whatsapp && touchedFields.whatsapp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {fieldErrors.whatsapp && touchedFields.whatsapp && (
                <p className="text-xs text-red-600">{fieldErrors.whatsapp}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tampilkan Tombol WhatsApp Float</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={showWhatsApp}
                onCheckedChange={setShowWhatsApp}
              />
              <span className="text-sm">Tampilkan tombol WhatsApp melayang di pojok kanan bawah</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">📱</span>
            Media Sosial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Masukkan username atau URL profil. Kosongkan untuk menyembunyikan ikon.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.key} className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="text-2xl">{platform.icon}</span>
                  <span>{platform.label}</span>
                </Label>
                <Input
                  value={socialLinks[platform.key] ?? ""}
                  onChange={(e) => updateSocial(platform.key, e.target.value)}
                  onBlur={() => { markTouched(`social.${platform.key}`); validateField(`social.${platform.key}`, socialLinks[platform.key]); }}
                  placeholder={platform.placeholder}
                  className={fieldErrors[`social.${platform.key}`] && touchedFields[`social.${platform.key}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                />
                {fieldErrors[`social.${platform.key}`] && touchedFields[`social.${platform.key}`] && (
                  <p className="text-xs text-red-600">{fieldErrors[`social.${platform.key}`]}</p>
                )}
              </div>
            ))}
</div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}