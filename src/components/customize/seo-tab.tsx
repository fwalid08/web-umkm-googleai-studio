"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

interface SeoTabProps {
  websiteId: string;
}

export function SeoTab({ websiteId }: SeoTabProps) {
  const [seo, setSeo] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/websites/${websiteId}/website`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSeo({
            title: json.data.custom_config?.seo?.title ?? "",
            description: json.data.custom_config?.seo?.description ?? "",
          });
        }
      });
  }, [websiteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/website`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_config: { seo: { title: seo.title, description: seo.description } },
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast("success", "SEO tersimpan");
      } else {
        toast("error", json.error ?? "Gagal menyimpan SEO");
      }
    } catch {
      toast("error", "Gagal simpan SEO. Periksa koneksi Anda.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">🔍</span>
            SEO Global (Meta Title & Description)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta Title</Label>
            <Input
              value={seo.title}
              onChange={(e) => setSeo((s) => ({ ...s, title: e.target.value }))}
              placeholder="Toko Saya - Produk Berkualitas"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground">{seo.title.length}/60 karakter</p>
          </div>
          <div className="space-y-2">
            <Label>Meta Description</Label>
            <Textarea
              className="min-h-[80px]"
              value={seo.description}
              onChange={(e) => setSeo((s) => ({ ...s, description: e.target.value }))}
              placeholder="Deskripsi toko Anda untuk mesin pencari"
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">{seo.description.length}/160 karakter</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan…
                </>
              ) : (
                "Simpan SEO"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">📄</span>
            SEO Per Halaman
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pengaturan SEO per halaman (meta title, description, OG image) bisa diatur di
            tab <strong>Halaman</strong> → klik ikon URL pada setiap baris halaman.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}