"use client";

import { useEffect, useState } from "react";
import { Store, ChevronDown, ExternalLink } from "lucide-react";
import { tenantUrl, tenantDisplay } from "@/lib/urls";

interface Site {
  id: string;
  name: string;
  subdomain: string | null;
  business_type?: string;
}

export function WebsiteSwitcher() {
  const [sites, setSites] = useState<Site[]>([]);
  const [activeId, setActiveId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success && json.data.websites) {
          setSites(json.data.websites);
          setActiveId(json.data.active_website_id ?? json.data.websites[0]?.id ?? "");
        }
      } catch {
        // fail silently
      }
    })();
  }, []);

  async function switchTo(id: string) {
    if (!id || id === activeId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/websites/${id}/activate`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActiveId(id);
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  }

  const active = sites.find((s) => s.id === activeId) || sites[0];
  if (!active) return null;

  const publicUrl = tenantUrl(active.subdomain);

  return (
    <div className="flex items-center gap-2">
      {/* Toko Selector / Display */}
      <div className="relative flex items-center bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 transition-colors">
        <Store className="h-4 w-4 text-emerald-600 shrink-0 mr-1.5" />
        {sites.length > 1 ? (
          <div className="flex items-center">
            <select
              aria-label="Pilih Website Toko"
              value={activeId}
              disabled={busy}
              onChange={(e) => switchTo(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gray-800 pr-5 outline-none cursor-pointer appearance-none truncate max-w-[140px] sm:max-w-[200px]"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 absolute right-2 pointer-events-none" />
          </div>
        ) : (
          <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px] sm:max-w-[200px]">
            {active.name}
          </span>
        )}
      </div>

      {/* Quick Live Preview Link */}
      {publicUrl && (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Buka ${tenantDisplay(active.subdomain)}`}
          className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <span className="hidden sm:inline">Lihat Web</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
