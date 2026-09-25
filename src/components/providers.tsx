"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { LanguageProvider } from "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Intercept fetch requests to attach x-demo-user-id if present in localStorage
    // This guarantees auth works even if third-party cookies are blocked in iframes (Google AI Studio preview)
    if (typeof window !== "undefined") {
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

      // Also ensure cookie is synced from localStorage if missing
      try {
        const demoId = localStorage.getItem("umkm_demo_id");
        if (demoId && !document.cookie.includes("umkm_demo_user=")) {
          document.cookie = `umkm_demo_user=${demoId}; path=/; max-age=2592000; SameSite=None; Secure`;
          document.cookie = `umkm_demo_id=${demoId}; path=/; max-age=2592000; SameSite=None; Secure`;
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
