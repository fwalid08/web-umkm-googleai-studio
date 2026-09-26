"use client";

import { useEffect, useState } from "react";
import { Store, ChevronDown } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

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

  return (
    <div className="flex items-center gap-2">
      {/* Toko Selector / Display */}
      <div className="relative flex items-center bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-1.5 transition-colors">
        <Store className="h-4 w-4 text-emerald-600 shrink-0 mr-1.5" />
        {sites.length > 1 ? (
          <Select value={activeId} onValueChange={switchTo} disabled={busy}>
            <SelectTrigger className="w-[140px] sm:w-[200px] h-8 text-xs">
              <SelectValue placeholder="Pilih Website Toko" />
            </SelectTrigger>
            <SelectContent>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs font-semibold text-gray-800 truncate max-w-[140px] sm:max-w-[200px]">
            {active.name}
          </span>
        )}
      </div>
    </div>
  );
}
