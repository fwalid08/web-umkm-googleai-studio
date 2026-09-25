"use client";

/**
 * Sprint 03 US-05 — Switcher website di header dashboard.
 * Ganti website aktif → refresh agar semua angka ikut konteks baru.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";

interface Site {
  id: string;
  name: string;
  subdomain: string | null;
}

export function WebsiteSwitcher() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [activeId, setActiveId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success) {
          setSites(json.data.websites);
          setActiveId(json.data.active_website_id ?? "");
        }
      } catch {
        /* header tetap tampil tanpa switcher */
      }
    })();
  }, []);

  if (sites.length <= 1) return null;

  async function switchTo(id: string) {
    if (!id || id === activeId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/websites/${id}/activate`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setActiveId(id);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const active = sites.find((s) => s.id === activeId);

  return (
    <label className="hidden sm:flex items-center gap-1.5 text-sm border rounded-lg px-2 py-1.5 bg-white">
      <Store className="h-4 w-4 text-primary-600" />
      <select
        value={activeId}
        disabled={busy}
        onChange={(e) => switchTo(e.target.value)}
        className="bg-transparent outline-none max-w-[160px] truncate"
        title={active?.subdomain ?? active?.name ?? "Website"}
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
