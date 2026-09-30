"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Fallback /dashboard/websites/page-builder (tanpa pageId).
 * Langsung arahkan ke homepage builder agar tidak 404 kosong.
 */
export default function PageBuilderIndex() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sitesRes = await fetch("/api/websites");
        const sitesJson = await sitesRes.json();
        const activeId = sitesJson?.data?.active_website_id;
        if (!activeId) {
          if (!cancelled) setError("Belum ada website aktif.");
          return;
        }
        const pagesRes = await fetch(`/api/websites/${activeId}/pages`);
        const pagesJson = await pagesRes.json();
        const pages = (pagesJson?.data ?? []) as Array<{ id: string; is_homepage: boolean }>;
        const homepage = pages.find((p) => p.is_homepage) ?? pages[0];
        if (homepage && !cancelled) {
          router.replace(`/dashboard/websites/page-builder/${homepage.id}`);
        } else if (!cancelled) {
          setError("Belum ada halaman. Buat halaman dulu.");
        }
      } catch {
        if (!cancelled) setError("Gagal memuat halaman.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-dvh bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-4">
        <div className="text-center max-w-md w-full rounded-3xl border bg-white p-8 shadow-xl">
          <div className="text-5xl mb-3">🏪</div>
          <h1 className="font-extrabold text-lg flex items-center justify-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            Pilih halaman dulu
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
          <Button asChild className="mt-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold">
            <Link href="/dashboard/websites/customize?tab=halaman">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ke Daftar Halaman
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/40 to-amber-50/40 p-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
        <p className="font-extrabold">🎨 Membuka Page Builder…</p>
        <p className="text-sm text-muted-foreground mt-1">Mencari halaman utama tokomu</p>
      </div>
    </div>
  );
}
