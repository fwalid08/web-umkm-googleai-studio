import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/storage";
import { refreshTemplateUrls, URL_REFRESH_EXPIRES_SECS } from "@/lib/builder/template-urls";
import { isPublicTemplateVisible, sessionTier } from "@/lib/builder/template-access";

interface SessionUser {
  id: string;
}

function getSessionUser(session: unknown): SessionUser | null {
  const user = (session as { user?: SessionUser } | null)?.user;
  if (!user?.id) return null;
  return user;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const sessionUser = getSessionUser(session);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !template) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    // Otorisasi baca: milik sendiri, ATAU template public yang tier-nya
    // memenuhi syarat (dipakai tenant untuk preview/apply template sistem).
    // Sebelumnya hanya milik sendiri yang lolos (404 untuk template public).
    const row = template as Record<string, unknown>;
    const isOwner = (row.user_id as string | null) === sessionUser.id;
    if (!isOwner && !isPublicTemplateVisible(row, sessionTier(session))) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    // Self-healing signed URL: aset/thumbnail adalah signed URL 7 hari.
    // Tanpa refresh, gambar mati sendiri seminggu setelah import. Refresh
    // yang hampir kedaluwarsa (<24 jam) lalu simpan kembali agar galeri,
    // preview, dan apply selalu membaca URL hidup. Fail-soft: bila gagal,
    // baris lama tetap dikembalikan.
    try {
      const storage = getStorageProvider();
      const refreshed = await refreshTemplateUrls(template, async (storagePath) => {
        const r = await storage.getSignedUrl({ path: storagePath, expiresIn: URL_REFRESH_EXPIRES_SECS });
        return r.success && r.url ? r.url : null;
      });
      if (refreshed.changed) {
        // Write-back self-healing HANYA untuk baris milik sendiri.
        // Baris public milik orang lain/sistem dikembalikan apa adanya
        // (URL hasil refresh tetap dipakai in-memory untuk response ini).
        if (isOwner) {
          const { error: updateError } = await supabase
            .from("templates_library")
            .update({
              thumbnail_url: (refreshed.row as Record<string, unknown>).thumbnail_url,
              assets: (refreshed.row as Record<string, unknown>).assets,
              template_data: (refreshed.row as Record<string, unknown>).template_data,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("user_id", sessionUser.id);
          if (!updateError) {
            return NextResponse.json({ success: true, data: refreshed.row });
          }
        } else {
          return NextResponse.json({ success: true, data: refreshed.row });
        }
      }
    } catch {
      // Abaikan — fallback ke baris apa adanya di bawah.
    }

    return NextResponse.json({ success: true, data: template });
  } catch {
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
