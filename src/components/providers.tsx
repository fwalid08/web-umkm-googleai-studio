"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { isDemoAuthEnabledClient } from "@/lib/auth/utils";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Demo header/cookie sync HANYA jika demo auth diizinkan (dev/preview).
    // Prod default mati → tidak ada spoof x-demo-user-id via localStorage.
    if (typeof window !== "undefined" && isDemoAuthEnabledClient()) {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const [resource, rawConfig] = args;
        let config = rawConfig;
        try {
          const demoId = localStorage.getItem("umkm_demo_id");
          if (demoId && typeof resource === "string" && resource.startsWith("/api/")) {
            config = config || {};
            const headers = new Headers(config.headers || {});
            if (!headers.has("x-demo-user-id")) {
              headers.set("x-demo-user-id", demoId);
            }
            config.headers = headers;
          }
        } catch {}
        return originalFetch(resource, config);
      };

      try {
        const demoId = localStorage.getItem("umkm_demo_id");
        if (demoId && !document.cookie.includes("umkm_demo_user=")) {
          document.cookie = `umkm_demo_user=${demoId}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = `umkm_demo_id=${demoId}; path=/; max-age=2592000; SameSite=Lax`;
        }
      } catch {}
    }
  }, []);

  return (
    <SessionProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </SessionProvider>
  );
}
