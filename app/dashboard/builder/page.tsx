"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardBuilderRedirect() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/websites");
        const json = await res.json();
        if (json.success && json.data.websites && json.data.websites.length > 0) {
          const activeId = json.data.active_website_id || json.data.websites[0].id;
          router.replace(`/dashboard/${activeId}/builder`);
        } else {
          router.replace("/websites");
        }
      } catch {
        router.replace("/websites");
      }
    })();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Membuka builder toko...</p>
      </div>
    </div>
  );
}
