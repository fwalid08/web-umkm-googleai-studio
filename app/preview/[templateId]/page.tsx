"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicWebsiteV3 } from "@/components/website/renderer-v3";
import { getTemplate } from "@/lib/builder/template-store";
import { resolveTemplateId } from "@/lib/builder/apply-template";
import { buildPreviewSiteData } from "@/lib/builder/preview-data";
import type { PublicSiteDataV3 } from "@/components/website/renderer-v3";

export default function PreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteData, setSiteData] = useState<PublicSiteDataV3 | null>(null);

  useEffect(() => {
    const loadTemplate = async () => {
      const { templateId } = await params;

      try {
        const template =
          getTemplate(templateId) ?? getTemplate(resolveTemplateId(templateId));

        if (!template) {
          // Katalog statis adalah satu-satunya sumber — ID lama (UUID
          // templates_library) sudah tidak ada yang memilikinya.
          setError("Template tidak ditemukan");
          return;
        }

        setSiteData(buildPreviewSiteData(template));
      } catch (err) {
        setError("Gagal memuat template");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4 text-center">
        <div className="max-w-md">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Pratinjau Tidak Tersedia</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button className="mt-6" onClick={() => window.close()}>
            Tutup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="tpl-canvas">
      <PublicWebsiteV3 site={siteData} />
    </div>
  );
}
