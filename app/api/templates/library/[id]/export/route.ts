import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getStorageProvider } from "@/lib/storage";
import { URL_REFRESH_EXPIRES_SECS } from "@/lib/builder/template-urls";
import {
  buildTemplateExportZip,
  createRouteFetchDeps,
  slugifyTemplateName,
} from "@/lib/builder/template-export";

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

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ success: false, error: "Invalid template ID" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: template, error } = await supabase
      .from("templates_library")
      .select("id, name, description, template_data, assets, thumbnail_url")
      .eq("id", id)
      .eq("user_id", sessionUser.id)
      .single();

    if (error || !template) {
      return NextResponse.json({ success: false, error: "Template tidak ditemukan" }, { status: 404 });
    }

    // SELALU ZIP dengan struktur yang sama persis seperti ZIP import
    // (template.json root + thumbnail.* root + assets/*) sehingga hasilnya
    // bisa di-import ulang apa adanya (round-trip).
    const storage = getStorageProvider();
    const deps = createRouteFetchDeps({
      signStoragePath: async (storagePath: string) => {
        try {
          const r = await storage.getSignedUrl({ path: storagePath, expiresIn: URL_REFRESH_EXPIRES_SECS });
          return r.success && r.url ? r.url : null;
        } catch {
          return null;
        }
      },
    });

    let built;
    try {
      built = await buildTemplateExportZip(
        {
          id: template.id,
          name: template.name,
          description: template.description,
          template_data: template.template_data,
          assets: template.assets,
          thumbnail_url: template.thumbnail_url,
        },
        deps,
      );
    } catch (e) {
      console.error("Export build error:", e);
      return NextResponse.json(
        { success: false, error: "Data template tidak valid untuk di-export" },
        { status: 500 },
      );
    }

    if (built.warnings.length > 0) {
      console.warn(`Export ${slugifyTemplateName(template.name)} warnings:`, built.warnings);
    }

    return new NextResponse(built.bytes, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${built.fileName}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
