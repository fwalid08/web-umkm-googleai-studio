"use client";

/**
 * Chip konteks lintas panel: di /dashboard/builder & /dashboard/settings
 * tampil "Website: {nama} (ganti)" yang link balik ke workspace website aktif.
 * Bu Toni tidak pernah tersesat saat panel melemparnya keluar workspace.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface Site {
  id: string;
  name: string;
}

export function ActiveWebsiteChip() {
  const { t } = useLang();
  const [site, setSite] = useState<Site | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (!json.success) return;
        const list = json.data.websites as Site[];
        const active =
          list.find((s) => s.id === json.data.active_website_id) ?? list[0] ?? null;
        setSite(active);
      } catch {
        /* chip disembunyikan jika gagal */
      }
    })();
  }, []);

  if (!site) return null;

  return (
    <Link
      href={`/websites/${site.id}`}
      className="inline-flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-full hover:bg-blue-100"
    >
      <Store className="h-3.5 w-3.5" />
      <span className="font-medium">{t("ctx.current", { name: site.name })}</span>
      <span className="underline">({t("ctx.change")})</span>
    </Link>
  );
}
